"""
DAG orchestrator — правильная оркестрация на основе ресёрча 2026.

Ключевые принципы (Berkeley arxiv 2503.13657, arxiv 2602.09341, RouteLLM):
  1. DAG вместо group-chat: каждый узел = один агент с чётким deliverable.
  2. Scoped context: агент видит только свой input, не всю историю.
  3. Hard caps: токены/время/итерации per node и per task.
  4. Judge > synthesis: для агрегации N ответов одна сильная модель выбирает лучший
     (синтез доказанно деградирует качество).
  5. Cycle detection: не даём петлям сжигать бюджет.
  6. Structured messages: {type, payload, intent}, не free-form.
  7. User override: пользователь может прервать/перенаправить на лету.

Реализует 5 режимов: manager | team | swarm | auction | xerocode_ai.
"""
from __future__ import annotations

import asyncio
import logging
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Optional

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


# ── Constants from research ──────────────────────────────────────────

MAX_TOKENS_PER_NODE = 4000      # Jim Fan 2026: точка насыщения
MAX_TOKENS_PER_TASK = 50000
NODE_TIMEOUT_SEC = 90
TASK_TIMEOUT_SEC = 240
MAX_REVIEW_ITERATIONS = 2       # критик-автор: arxiv 2509.09677 показал что 3 — предел
MAX_PARALLEL_NODES = 5          # больше — шум и стоимость


class NodeStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    TIMED_OUT = "timed_out"


class MessageType(str, Enum):
    """Structured protocol — не free-form."""
    TASK = "task"              # задача узлу
    RESULT = "result"          # ответ узла
    CRITIQUE = "critique"      # замечания ревьюера
    REVISION = "revision"      # переделка после критики
    BID = "bid"                # score-ставка в аукционе
    VERDICT = "verdict"        # решение судьи
    USER_OVERRIDE = "user_override"  # вмешательство юзера


@dataclass
class StructuredMessage:
    """Единый протокол коммуникации между узлами."""
    type: MessageType
    payload: dict
    intent: str
    from_node: Optional[str] = None
    to_node: Optional[str] = None


@dataclass
class NodeResult:
    node_id: str
    status: NodeStatus
    output: Optional[str] = None
    error: Optional[str] = None
    tokens_used: int = 0
    cost_usd: float = 0.0
    duration_sec: float = 0.0
    model_used: Optional[str] = None


@dataclass
class DAGNode:
    """Узел DAG — один агент с чётким deliverable."""
    id: str
    role: str                    # "architect", "coder", "reviewer", "judge"
    deliverable: str             # что должно получиться
    acceptance_criteria: str     # когда считаем готовым
    depends_on: list[str] = field(default_factory=list)
    model: Optional[str] = None  # конкретная модель (None = auto-route)
    system_prompt: Optional[str] = None
    max_tokens: int = MAX_TOKENS_PER_NODE
    timeout_sec: int = NODE_TIMEOUT_SEC


@dataclass
class DAGContext:
    """Контекст выполнения одного DAG-запуска."""
    task_id: str
    user_id: str
    mode: str                    # manager | team | swarm | auction | xerocode_ai
    user_query: str
    results: dict[str, NodeResult] = field(default_factory=dict)
    messages: list[StructuredMessage] = field(default_factory=list)
    total_tokens: int = 0
    total_cost: float = 0.0
    started_at: float = field(default_factory=time.time)
    cancelled: bool = False
    user_override: Optional[str] = None

    def elapsed_sec(self) -> float:
        return time.time() - self.started_at

    def budget_exceeded(self) -> tuple[bool, str]:
        if self.total_tokens > MAX_TOKENS_PER_TASK:
            return True, f"token budget exceeded ({self.total_tokens}/{MAX_TOKENS_PER_TASK})"
        if self.elapsed_sec() > TASK_TIMEOUT_SEC:
            return True, f"task timeout ({self.elapsed_sec():.0f}s)"
        if self.cancelled:
            return True, "cancelled by user"
        return False, ""

    def scoped_context_for(self, node: DAGNode) -> dict:
        """Scoped context: узел видит ТОЛЬКО результаты своих зависимостей + задачу."""
        ctx = {"user_query": self.user_query, "inputs": {}}
        for dep_id in node.depends_on:
            if dep_id in self.results and self.results[dep_id].status == NodeStatus.COMPLETED:
                ctx["inputs"][dep_id] = self.results[dep_id].output
        if self.user_override:
            ctx["user_override"] = self.user_override
        return ctx


# ── Cycle detection ──────────────────────────────────────────────────

def detect_cycles(nodes: list[DAGNode]) -> list[str]:
    """Kahn's topological sort — возвращает цикл если есть."""
    graph: dict[str, list[str]] = {n.id: list(n.depends_on) for n in nodes}
    in_degree = {n.id: len(n.depends_on) for n in nodes}
    # build reverse map
    reverse: dict[str, list[str]] = {n.id: [] for n in nodes}
    for n in nodes:
        for dep in n.depends_on:
            if dep in reverse:
                reverse[dep].append(n.id)

    queue = [nid for nid, deg in in_degree.items() if deg == 0]
    processed = 0
    while queue:
        nid = queue.pop(0)
        processed += 1
        for child in reverse.get(nid, []):
            in_degree[child] -= 1
            if in_degree[child] == 0:
                queue.append(child)

    if processed != len(nodes):
        # Cycle found — return node IDs still with in_degree > 0
        return [nid for nid, d in in_degree.items() if d > 0]
    return []


def topological_order(nodes: list[DAGNode]) -> list[list[DAGNode]]:
    """Возвращает уровни — каждый уровень может выполняться параллельно."""
    cycle = detect_cycles(nodes)
    if cycle:
        raise ValueError(f"Cycle detected in DAG: {cycle}")

    by_id = {n.id: n for n in nodes}
    completed: set[str] = set()
    levels: list[list[DAGNode]] = []
    remaining = set(by_id.keys())

    while remaining:
        level = [
            by_id[nid] for nid in remaining
            if all(dep in completed for dep in by_id[nid].depends_on)
        ]
        if not level:
            raise ValueError("DAG stuck — unresolvable dependencies")
        levels.append(level)
        for n in level:
            remaining.remove(n.id)
            completed.add(n.id)
    return levels


# ── Node executor ────────────────────────────────────────────────────

async def execute_node(
    node: DAGNode,
    context: DAGContext,
    ai_call: Callable,
) -> NodeResult:
    """Выполнить один узел с scoped context, caps, timeout."""
    started = time.time()
    scoped = context.scoped_context_for(node)

    # Build prompt from scoped context (не вся история!)
    prompt_parts = [f"Задача пользователя: {scoped['user_query']}"]
    if scoped.get("inputs"):
        prompt_parts.append("Результаты предыдущих шагов:")
        for dep_id, dep_output in scoped["inputs"].items():
            prompt_parts.append(f"[{dep_id}]: {dep_output[:2000]}")  # cap input
    if scoped.get("user_override"):
        prompt_parts.append(f"ВАЖНО: пользователь уточнил: {scoped['user_override']}")
    prompt_parts.append(f"\nТвоя роль: {node.role}")
    prompt_parts.append(f"Что нужно сделать: {node.deliverable}")
    prompt_parts.append(f"Критерий готовности: {node.acceptance_criteria}")
    prompt_parts.append("Дай только результат, без рассуждений и преамбулы.")
    user_prompt = "\n\n".join(prompt_parts)

    system = node.system_prompt or (
        f"Ты — {node.role}. Работаешь в команде. "
        "Твоя задача — дать КОНКРЕТНЫЙ результат по критерию готовности. "
        "Никакой демагогии, никаких рассуждений 'можно было бы' — только deliverable."
    )

    try:
        result_coro = ai_call(
            system_prompt=system,
            user_prompt=user_prompt,
            model=node.model,
            max_tokens=node.max_tokens,
        )
        content, tokens, cost = await asyncio.wait_for(result_coro, timeout=node.timeout_sec)

        if not content:
            return NodeResult(
                node_id=node.id, status=NodeStatus.FAILED,
                error="AI returned empty response", duration_sec=time.time() - started,
            )
        return NodeResult(
            node_id=node.id, status=NodeStatus.COMPLETED,
            output=content, tokens_used=tokens, cost_usd=cost,
            duration_sec=time.time() - started, model_used=node.model,
        )
    except asyncio.TimeoutError:
        return NodeResult(
            node_id=node.id, status=NodeStatus.TIMED_OUT,
            error=f"Timed out after {node.timeout_sec}s",
            duration_sec=time.time() - started,
        )
    except Exception as e:
        logger.error(f"[DAG] Node {node.id} failed: {e}", exc_info=True)
        return NodeResult(
            node_id=node.id, status=NodeStatus.FAILED,
            error=str(e)[:200], duration_sec=time.time() - started,
        )


# ── DAG executor ─────────────────────────────────────────────────────

async def run_dag(
    context: DAGContext,
    nodes: list[DAGNode],
    ai_call: Callable,
    on_progress: Optional[Callable] = None,
    on_hook: Optional[Callable] = None,
) -> DAGContext:
    """Выполнить DAG уровнями (параллельно в пределах уровня).

    Args:
        context: shared state
        nodes: узлы DAG
        ai_call: async func(system_prompt, user_prompt, model, max_tokens) -> (content, tokens, cost)
        on_progress: optional callback(node_id, status)
        on_hook: optional callback(context, completed_node, nodes) -> nodes (can mutate/append)
                 — позволяет mode-специфичную динамику (winner в аукционе, NEED_HELP в менеджере)
    """
    levels = topological_order(nodes)
    logger.info(f"[DAG {context.task_id}] {len(levels)} levels, {len(nodes)} nodes")

    level_idx = 0
    while level_idx < len(levels):
        level = levels[level_idx]
        exceeded, reason = context.budget_exceeded()
        if exceeded:
            logger.warning(f"[DAG {context.task_id}] Aborting at level {level_idx}: {reason}")
            break

        batch = level[:MAX_PARALLEL_NODES]
        if on_progress:
            for n in batch:
                await on_progress(n.id, NodeStatus.RUNNING)

        tasks = [execute_node(n, context, ai_call) for n in batch]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for node, res in zip(batch, results):
            if isinstance(res, Exception):
                res = NodeResult(node_id=node.id, status=NodeStatus.FAILED, error=str(res))
            context.results[node.id] = res
            context.total_tokens += res.tokens_used
            context.total_cost += res.cost_usd
            if on_progress:
                await on_progress(node.id, res.status)

            # Mode-specific hooks — могут мутировать DAG (добавить узлы, проставить модель)
            if on_hook:
                nodes = await on_hook(context, node, nodes) or nodes
                # Перестроить levels если появились новые узлы
                try:
                    new_levels = topological_order(nodes)
                    if len(new_levels) != len(levels):
                        levels = new_levels
                except ValueError:
                    pass

        level_idx += 1

    return context


# ── Mode hooks (динамика после узлов) ────────────────────────────────

async def manager_hook(context: DAGContext, completed: NodeResult, nodes: list[DAGNode]) -> list[DAGNode]:
    """Менеджер: если вернул NEED_HELP: <описание> — добавляем worker-узел."""
    if completed.node_id != "manager" or not completed.output:
        return nodes
    if "NEED_HELP:" not in completed.output:
        return nodes
    # Извлекаем описание помощи
    help_desc = completed.output.split("NEED_HELP:", 1)[1].strip().split("\n")[0]
    helper_id = f"manager_helper_{len([n for n in nodes if n.id.startswith('manager_helper')])}"
    nodes.append(DAGNode(
        id=helper_id,
        role="helper",
        deliverable=help_desc[:200],
        acceptance_criteria="конкретная помощь менеджеру",
        model=None,  # auto-route
        depends_on=[],  # независимо, не от manager (чтобы не блокировать)
    ))
    return nodes


async def auction_hook(context: DAGContext, completed: NodeResult, nodes: list[DAGNode]) -> list[DAGNode]:
    """Аукцион: после всех bid-узлов определяем winner и проставляем модель."""
    bids_done = [
        (n, context.results.get(n.id))
        for n in nodes if n.id.startswith("auction_bid_")
    ]
    if not all(r and r.status == NodeStatus.COMPLETED for _, r in bids_done):
        return nodes  # не все bid готовы

    # Winner = max score
    best_score = -1
    best_node = None
    for bid_node, bid_res in bids_done:
        if not bid_res or not bid_res.output:
            continue
        # Парсим "SCORE: N"
        for line in bid_res.output.splitlines():
            if line.upper().startswith("SCORE:"):
                try:
                    s = int(line.split(":", 1)[1].strip().split()[0])
                    if s > best_score:
                        best_score = s
                        best_node = bid_node
                except Exception:
                    continue

    # Подставить модель winner'а в auction_winner узел
    for n in nodes:
        if n.id == "auction_winner" and best_node and n.model is None:
            n.model = best_node.model
            logger.info(f"[Auction] Winner: {best_node.model} with score {best_score}")
    return nodes


async def team_hook(context: DAGContext, completed: NodeResult, nodes: list[DAGNode]) -> list[DAGNode]:
    """Команда: ревьюер может вернуть исполнителю max 1 раз через REVISE: <замечания>.

    Выглядит так: architect → executor → reviewer.
    Если reviewer.output начинается с APPROVE — ничего не делаем.
    Если REVISE: <текст> — добавляем executor_revision + reviewer_final узлы (один раз).
    """
    if not completed.node_id.startswith("team_reviewer_") or not completed.output:
        return nodes
    # Проверяем что revision цикл ещё не запущен
    if any(n.id.startswith("team_executor_revision_") for n in nodes):
        return nodes  # уже одна ревизия была — больше не пускаем
    out = completed.output.strip()
    if not out.upper().startswith("REVISE:"):
        return nodes  # APPROVE или просто финальный ответ
    critique = out.split(":", 1)[1].strip()[:1000]
    # Найдём предыдущего executor'а
    executor_node = next((n for n in nodes if n.id.startswith("team_executor_")), None)
    if not executor_node:
        return nodes
    # Добавляем revision + final review
    rev_id = f"team_executor_revision_{len(context.results)}"
    final_id = f"team_reviewer_final_{len(context.results)}"
    nodes.append(DAGNode(
        id=rev_id,
        role="executor (revision)",
        deliverable="переработанный результат с учётом замечаний ревьюера",
        acceptance_criteria=f"учтены замечания: {critique[:200]}",
        model=executor_node.model,
        depends_on=[completed.node_id],
        system_prompt=(
            "Ты — исполнитель. Ревьюер вернул работу с замечаниями. "
            "Перепиши свой результат полностью с учётом критики. "
            "НЕ повторяй замечания, дай только новый полный результат."
        ),
    ))
    nodes.append(DAGNode(
        id=final_id,
        role="reviewer (final)",
        deliverable="финальный одобренный результат",
        acceptance_criteria="результат пригоден для пользователя",
        model=completed.model_used,
        depends_on=[rev_id],
        system_prompt=(
            "Ты — ревьюер. Это финальная итерация (вторых возвратов нет). "
            "Прими работу: верни ТОЛЬКО финальный текст для пользователя, "
            "без рассуждений и оценок."
        ),
    ))
    return nodes


async def xerocode_hook(context: DAGContext, completed: NodeResult, nodes: list[DAGNode]) -> list[DAGNode]:
    """XeroCode AI: после router — проставляем модель для worker по DOMAIN+TIER."""
    if completed.node_id != "xc_router" or not completed.output:
        return nodes
    output = completed.output.upper()
    domain = "general"
    tier = "simple"
    for line in output.splitlines():
        if line.startswith("DOMAIN:"):
            domain = line.split(":", 1)[1].strip().lower()
        elif line.startswith("TIER:"):
            tier = line.split(":", 1)[1].strip().lower()

    # Mapping: domain × tier → model
    MODEL_MAP = {
        ("code", "simple"): "deepseek/deepseek-chat",
        ("code", "complex"): "anthropic/claude-sonnet-4",
        ("research", "simple"): "perplexity/sonar",
        ("research", "complex"): "perplexity/sonar-pro",
        ("creative", "simple"): "anthropic/claude-sonnet-4",
        ("creative", "complex"): "anthropic/claude-opus-4",
        ("reasoning", "simple"): "openai/gpt-4o",
        ("reasoning", "complex"): "openai/o1-preview",
        ("vision", "simple"): "openai/gpt-4o",
        ("vision", "complex"): "google/gemini-2.5-pro",
        ("general", "simple"): "llama-3.3-70b-versatile",
        ("general", "complex"): "anthropic/claude-sonnet-4",
    }
    chosen = MODEL_MAP.get((domain, tier), MODEL_MAP[("general", "simple")])
    for n in nodes:
        if n.id == "xc_worker" and n.model is None:
            n.model = chosen
            logger.info(f"[XeroCode] Router → domain={domain}, tier={tier}, model={chosen}")
    return nodes


def get_hook_for_mode(mode: str) -> Optional[Callable]:
    return {
        "manager": manager_hook,
        "auction": auction_hook,
        "xerocode_ai": xerocode_hook,
        "team": team_hook,
    }.get(mode)


# ── 5 режимов — factory функции создания DAG ─────────────────────────

def build_manager_dag(query: str, main_model: str, helper_models: list[str] | None = None) -> list[DAGNode]:
    """Режим 1: Менеджер. Одна главная модель решает сама или зовёт хелперов."""
    nodes = [
        DAGNode(
            id="manager",
            role="главный координатор",
            deliverable="полный ответ пользователю",
            acceptance_criteria="ответ решает задачу, без воды и рассуждений",
            model=main_model,
            system_prompt=(
                "Ты — главный координатор. Пользователь выбрал тебя как ведущую модель. "
                "Реши задачу сам. Не запускай лишних подзадач. "
                "Если действительно нужна помощь — укажи в ответе: NEED_HELP: <описание>. "
                "В 90% случаев справляйся сам."
            ),
        ),
    ]
    # TODO: если manager вернёт NEED_HELP, оркестратор может добавить worker-узлы динамически
    return nodes


def build_team_dag(query: str, roles: list[dict]) -> list[DAGNode]:
    """Режим 2: Команда. Pipeline архитектор → исполнитель → ревьюер.
    Ревьюер по протоколу: APPROVE: <финал> или REVISE: <замечания>.
    Если REVISE — hook добавляет revision + final review (max 1 цикл).

    roles: [{role: "architect", model: "claude-sonnet-4.6"}, ...]
    """
    nodes = []
    prev_id: str | None = None
    for idx, r in enumerate(roles):
        node_id = f"team_{r['role']}_{idx}"
        is_reviewer = "review" in r["role"].lower() or "reviewer" in r["role"].lower()
        prompt = None
        if is_reviewer:
            prompt = (
                "Ты — ревьюер. Оцени работу исполнителя по критерию готовности. "
                "Верни СТРОГО в одном из двух форматов:\n"
                "  APPROVE: <финальный текст для пользователя>\n"
                "  REVISE: <конкретные замечания, что переделать (1-3 пункта)>\n"
                "Никаких длинных рассуждений. Если работа годная — APPROVE. "
                "Только серьёзные проблемы — REVISE. У тебя только ОДИН шанс на возврат."
            )
        nodes.append(DAGNode(
            id=node_id,
            role=r["role"],
            deliverable=r.get("deliverable", f"часть результата от роли {r['role']}"),
            acceptance_criteria=r.get("criteria", "конкретный результат без воды"),
            model=r.get("model"),
            depends_on=[prev_id] if prev_id else [],
            system_prompt=prompt,
        ))
        prev_id = node_id
    return nodes


def build_swarm_dag(query: str, pool_models: list[str], judge_model: str) -> list[DAGNode]:
    """Режим 3: Рой. Параллельно N моделей + Judge выбирает лучший (НЕ синтез)."""
    nodes = []
    worker_ids = []
    for idx, model in enumerate(pool_models[:MAX_PARALLEL_NODES]):
        wid = f"swarm_worker_{idx}"
        nodes.append(DAGNode(
            id=wid,
            role=f"worker_{idx}",
            deliverable="полный независимый ответ на задачу",
            acceptance_criteria="решает задачу целиком",
            model=model,
        ))
        worker_ids.append(wid)

    # Judge выбирает ЛУЧШИЙ ответ (не синтезирует — ресёрч 2026 показал деградацию при синтезе)
    nodes.append(DAGNode(
        id="swarm_judge",
        role="judge",
        deliverable="выбор лучшего ответа (указать идентификатор) + краткое обоснование",
        acceptance_criteria="выбран один ответ, не слияние",
        model=judge_model,
        depends_on=worker_ids,
        system_prompt=(
            "Ты — судья. Оцени ответы параллельно работавших моделей и выбери ЛУЧШИЙ. "
            "НЕ сливай их в один — доказано, что синтез ухудшает качество. "
            "Верни: CHOSEN: <worker_id>\n<полный текст выбранного ответа>"
        ),
    ))
    return nodes


def build_auction_dag(query: str, pool_models: list[str], judge_model: str) -> list[DAGNode]:
    """Режим 4: Аукцион. Score 0-10 → winner берёт задачу + советники."""
    nodes = []
    bid_ids = []
    # Phase 1: каждая модель даёт score
    for idx, model in enumerate(pool_models[:MAX_PARALLEL_NODES]):
        bid_id = f"auction_bid_{idx}"
        nodes.append(DAGNode(
            id=bid_id,
            role=f"bidder_{idx}",
            deliverable="один число 0-10 + 1 строка обоснования",
            acceptance_criteria="формат: SCORE: <N>\nREASON: <строка>",
            model=model,
            max_tokens=200,
            timeout_sec=10,
            system_prompt="Оцени, насколько ТЫ подходишь для задачи. 0=не твоё, 10=идеально твоё. Ответ в 2 строки. Никаких рассуждений.",
        ))
        bid_ids.append(bid_id)

    # Phase 2: winner выполняет задачу
    # (в реальной реализации это решается динамически после получения score — здесь заглушка,
    # winner-selection делается в mode-специфичном wrapper'е)
    nodes.append(DAGNode(
        id="auction_winner",
        role="winner",
        deliverable="полный ответ на задачу",
        acceptance_criteria="решает задачу, использует уточнения от советников если были",
        model=None,  # будет подставлено динамически
        depends_on=bid_ids,
    ))
    return nodes


def build_xerocode_dag(query: str) -> list[DAGNode]:
    """Режим 5: XeroCode AI. Скрытая архитектура:
       1. Router (Groq/Llama дешёвый) выбирает домен + complexity
       2. Worker (модель по домену + tier)
       3. Voice-wrapper (переводит в голос XeroCode)
    """
    return [
        DAGNode(
            id="xc_router",
            role="router",
            deliverable="DOMAIN:<code|research|creative|reasoning|vision|general>\\nTIER:<simple|complex>",
            acceptance_criteria="две строки в указанном формате",
            model="llama-3.3-70b-versatile",  # Groq, быстро и дёшево
            max_tokens=50,
            timeout_sec=5,
            system_prompt=(
                "Ты — классификатор запросов. Определи домен и сложность. "
                "Домены: code, research, creative, reasoning, vision, general. "
                "Complexity: simple (1 модель хватит) или complex (нужна премиум). "
                "Ответ строго в 2 строки без воды."
            ),
        ),
        DAGNode(
            id="xc_worker",
            role="solver",
            deliverable="полное решение задачи",
            acceptance_criteria="задача решена, ответ по сути",
            model=None,  # подставляется после router по mapping
            depends_on=["xc_router"],
        ),
        DAGNode(
            id="xc_voice",
            role="voice",
            deliverable="финальный ответ в голосе XeroCode",
            acceptance_criteria="сохранён смысл, стиль — неформальный 'ты', Claude-style краткий",
            model="llama-3.3-70b-versatile",
            depends_on=["xc_worker"],
            system_prompt=(
                "Ты — голос XeroCode AI. Перепиши ответ в НАШЕМ стиле:\n"
                "- Неформально, на 'ты' (если пользователь пишет на 'вы' — переключайся)\n"
                "- Кратко, по делу, без воды и 'давайте рассмотрим...'\n"
                "- Структурировано, markdown где уместно\n"
                "- НЕ УПОМИНАЙ какая модель работала. НИКОГДА. Ты — XeroCode.\n"
                "- Эмодзи только если реально к месту (≤1-2 на ответ)\n"
                "Верни только переписанный ответ, без объяснений."
            ),
        ),
    ]
