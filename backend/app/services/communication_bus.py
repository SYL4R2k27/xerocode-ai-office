"""
Communication Bus — ЯДРО СИСТЕМЫ.

Создает "групповой чат" между AI-моделями.
Платформа передает сообщения между моделями,
каждая видит общий контекст и может отвечать.

Пользователь-дирижер может вмешаться в любой момент.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import httpx

from app.adapters import get_adapter
from app.adapters.base import ToolCall
from app.adapters.openrouter_adapter import OpenRouterAdapter
from app.models.agent import Agent
from app.models.goal import Goal
from app.models.message import Message
from app.models.task import Task
from app.services.code_executor import CodeExecutor
from app.services.cost_tracker import CostTracker
from app.services.loop_guard import LoopGuard

logger = logging.getLogger(__name__)


class CommunicationBus:
    """
    Управляет общением между моделями.
    Модели не общаются напрямую — платформа передает сообщения между ними.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.loop_guard = LoopGuard(db)
        self.cost_tracker = CostTracker(db)
        self._ws_callback = None  # WebSocket broadcast callback

    def set_ws_callback(self, callback):
        """Подключить WebSocket для реалтайм уведомлений."""
        self._ws_callback = callback

    async def _notify(self, goal_id: uuid.UUID, event: str, data: dict):
        """Отправить событие через WebSocket (если подключен)."""
        if self._ws_callback:
            try:
                await self._ws_callback(str(goal_id), event, data)
            except Exception:
                pass  # WS errors should not break the flow

    async def get_chat_history(self, goal_id: uuid.UUID, limit: int = 50) -> list[dict]:
        """Получить историю чата для контекста моделей."""
        result = await self.db.execute(
            select(Message)
            .where(Message.goal_id == goal_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        messages = result.scalars().all()
        messages.reverse()

        return [
            {
                "role": "assistant" if msg.sender_type == "agent" else "user",
                "content": f"[{msg.sender_name}]: {msg.content}",
            }
            for msg in messages
        ]

    async def send_to_agent(
        self,
        goal: Goal,
        agent: Agent,
        prompt: str,
        chat_history: list[dict] | None = None,
        economy_mode: bool = False,
        tools: list[dict] | None = None,
        executor: CodeExecutor | None = None,
    ) -> Message:
        """
        Отправить промпт конкретной модели и сохранить ответ.

        1. Проверяем лимиты (LoopGuard + CostTracker)
        2. Берем адаптер для модели
        3. Формируем контекст (история чата + промпт)
        4. Получаем ответ
        5. Сохраняем как сообщение в чате
        6. Шлем WebSocket уведомление
        """
        # Safety checks
        can_continue, reason = await self.loop_guard.check(
            goal.id, max_exchanges=goal.max_exchanges
        )
        if not can_continue:
            limit_msg = Message(
                goal_id=goal.id,
                sender_type="system",
                sender_name="System",
                content=f"⚠️ Stopped: {reason}",
                message_type="system",
            )
            self.db.add(limit_msg)
            await self.db.commit()
            await self.db.refresh(limit_msg)
            await self._notify(goal.id, "system_warning", {"reason": reason})
            return limit_msg

        cost_ok, cost_reason = await self.cost_tracker.check_can_continue(goal.id)
        if not cost_ok:
            limit_msg = Message(
                goal_id=goal.id,
                sender_type="system",
                sender_name="System",
                content=f"💰 Stopped: {cost_reason}",
                message_type="system",
            )
            self.db.add(limit_msg)
            await self.db.commit()
            await self.db.refresh(limit_msg)
            await self._notify(goal.id, "cost_limit", {"reason": cost_reason})
            return limit_msg

        # Smart routing — try multiple providers
        from app.core.encryption import decrypt_api_key
        from app.core.model_router import resolve_model_route

        api_key = decrypt_api_key(agent.api_key_encrypted) if agent.api_key_encrypted else ""
        model_routes = resolve_model_route(agent.model_name, agent.provider, api_key, agent.base_url)

        # Build context
        messages = list(chat_history or [])
        messages.append({"role": "user", "content": prompt})

        # Attach uploaded images as base64 (for vision-capable models)
        import base64 as b64mod
        from pathlib import Path as PathLib
        upload_dir = PathLib(f"/tmp/ai-office/{goal.id}/uploads")
        if upload_dir.exists():
            image_exts = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
            for img_file in upload_dir.iterdir():
                if img_file.suffix.lower() in image_exts and img_file.stat().st_size < 5_000_000:
                    b64data = b64mod.b64encode(img_file.read_bytes()).decode()
                    ext = img_file.suffix.lower().lstrip(".")
                    mime = "image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}"
                    messages.append({
                        "role": "user",
                        "content": [
                            {"type": "text", "text": f"Прикреплённый файл: {img_file.name}"},
                            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64data}"}}
                        ]
                    })

        # System prompt
        system = self._build_system_prompt(agent, goal)

        # Economy mode params
        temperature = 0.3 if economy_mode else 0.7
        max_tokens = 1024 if economy_mode else 4096

        # Update agent status → thinking
        agent.status = "thinking"
        await self.db.commit()
        await self._notify(goal.id, "agent_status", {
            "agent_id": str(agent.id),
            "agent_name": agent.name,
            "status": "thinking",
        })

        try:
            # Smart routing — try providers in order until one works
            response = None
            last_error = None
            used_route = None

            for route in model_routes:
                try:
                    adapter = get_adapter(route.provider, route.api_key, route.base_url)
                    response = await adapter.call(
                        messages=messages,
                        model=route.model_id,
                        system_prompt=system,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        tools=tools,
                    )
                    used_route = route
                    if route != model_routes[0]:
                        logger.info(f"[{agent.name}] Fallback to {route.provider}/{route.model_id}")
                    break
                except Exception as e:
                    last_error = e
                    logger.warning(f"[{agent.name}] {route.provider}/{route.model_id} failed: {e}")
                    continue

            if response is None:
                raise last_error or Exception(f"All routes failed for {agent.name}")

            # ===== TOOL EXECUTION LOOP =====
            max_tool_rounds = 10
            tool_round = 0
            total_tokens_in = response.tokens_input
            total_tokens_out = response.tokens_output
            total_cost = response.cost_usd

            while response.tool_calls and executor and tool_round < max_tool_rounds:
                tool_round += 1

                # Update agent status
                agent.status = "working"
                await self.db.commit()
                await self._notify(goal.id, "agent_status", {
                    "agent_id": str(agent.id),
                    "agent_name": agent.name,
                    "status": "working",
                })

                # Notify about tool execution
                await self._notify(goal.id, "tool_execution", {
                    "agent_name": agent.name,
                    "tools": [{"name": tc.name, "args": tc.arguments} for tc in response.tool_calls],
                    "round": tool_round,
                })

                # Execute each tool call
                tool_results = []
                for tc in response.tool_calls:
                    result = await executor.execute(tc.name, tc.arguments)
                    tool_results.append({
                        "tool_call_id": tc.id,
                        "name": tc.name,
                        "result": result,
                    })

                    # Notify per-tool result
                    notify_output = result["output"][:500] if "data:image" not in (result.get("output") or "") else result["output"][:200]
                    await self._notify(goal.id, "tool_result", {
                        "agent_name": agent.name,
                        "tool": tc.name,
                        "args": tc.arguments,
                        "success": result["success"],
                        "output": notify_output,
                    })

                    # Если сгенерировано изображение — отправить как отдельное сообщение в чат
                    if tc.name == "generate_image" and result["success"] and "data:image" in (result.get("output") or ""):
                        img_msg = Message(
                            goal_id=goal.id,
                            sender_type="agent",
                            sender_agent_id=str(agent.id),
                            sender_name=agent.name,
                            content=result["output"],
                            message_type="image",
                        )
                        self.db.add(img_msg)
                        await self.db.flush()
                        await self._notify(goal.id, "new_message", {
                            "id": str(img_msg.id),
                            "sender_type": "agent",
                            "sender_name": agent.name,
                            "content": result["output"],
                            "message_type": "image",
                        })

                    logger.info(
                        f"[{agent.name}] tool {tc.name}: "
                        f"{'OK' if result['success'] else 'FAIL'}"
                    )

                # Build messages with tool results for next call
                messages = self._build_tool_result_messages(
                    messages, response, tool_results, agent.provider
                )

                # Call model again with tool results
                response = await adapter.call(
                    messages=messages,
                    model=agent.model_name,
                    system_prompt=system,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    tools=tools,
                )

                total_tokens_in += response.tokens_input
                total_tokens_out += response.tokens_output
                total_cost += response.cost_usd

            # ===== END TOOL LOOP =====

            # Update agent status and costs
            agent.status = "idle"
            agent.total_tokens_used += total_tokens_in + total_tokens_out
            agent.total_cost_usd += total_cost

            # Save response as message
            message = Message(
                goal_id=goal.id,
                sender_type="agent",
                sender_agent_id=agent.id,
                sender_name=agent.name,
                content=response.content,
                message_type="chat",
                tokens_used=total_tokens_in + total_tokens_out,
                cost_usd=total_cost,
            )
            self.db.add(message)
            await self.db.commit()
            await self.db.refresh(message)

            # Notify frontend
            await self._notify(goal.id, "new_message", {
                "id": str(message.id),
                "sender_type": "agent",
                "sender_name": agent.name,
                "content": response.content,
                "tokens_used": total_tokens_in + total_tokens_out,
                "cost_usd": total_cost,
                "tool_rounds": tool_round,
            })
            await self._notify(goal.id, "agent_status", {
                "agent_id": str(agent.id),
                "agent_name": agent.name,
                "status": "idle",
            })

            logger.info(
                f"[{agent.name}] responded: {len(response.content)} chars, "
                f"tokens={total_tokens_in + total_tokens_out}, "
                f"cost=${total_cost:.4f}, tool_rounds={tool_round}"
            )

            return message

        except Exception as e:
            agent.status = "error"
            error_msg = Message(
                goal_id=goal.id,
                sender_type="system",
                sender_name="System",
                content=f"❌ Error from {agent.name}: {str(e)}",
                message_type="system",
            )
            self.db.add(error_msg)
            await self.db.commit()

            await self._notify(goal.id, "agent_error", {
                "agent_id": str(agent.id),
                "agent_name": agent.name,
                "error": str(e),
            })

            logger.error(f"[{agent.name}] error: {e}")
            raise

    async def broadcast_to_team(
        self,
        goal: Goal,
        prompt: str,
        agents: list[Agent],
    ) -> list[Message]:
        """
        Отправить сообщение всей команде и собрать ответы.
        Каждая модель видит что ответили предыдущие.
        """
        chat_history = await self.get_chat_history(goal.id)
        responses = []

        for agent in agents:
            if not agent.is_active:
                continue

            # Safety check before each agent
            can_continue, reason = await self.loop_guard.check(
                goal.id, max_exchanges=goal.max_exchanges
            )
            if not can_continue:
                logger.warning(f"Stopping broadcast: {reason}")
                break

            response = await self.send_to_agent(
                goal=goal,
                agent=agent,
                prompt=prompt,
                chat_history=chat_history,
                economy_mode=goal.economy_mode,
            )
            responses.append(response)

            # Update history so next agent sees this response
            chat_history.append({
                "role": "assistant",
                "content": f"[{agent.name}]: {response.content}",
            })

        return responses

    async def discussion_round(
        self,
        goal: Goal,
        agents: list[Agent],
        topic: str,
        max_rounds: int = 3,
    ) -> list[Message]:
        """
        Раунд обсуждения — модели обсуждают тему несколько кругов.
        Каждый круг: каждая модель видит все предыдущие ответы и может дополнить.
        Останавливается когда:
        - Достигнут max_rounds
        - Модели пришли к консенсусу (содержат "agree" / "согласен")
        - LoopGuard остановил
        """
        all_responses = []
        chat_history = await self.get_chat_history(goal.id)

        for round_num in range(max_rounds):
            round_prompt = topic if round_num == 0 else (
                f"Continue the discussion. Round {round_num + 1}/{max_rounds}.\n"
                f"Review what others said and add your thoughts. "
                f"If you agree with the current plan, say 'I agree' and state your assigned task."
            )

            await self._notify(goal.id, "discussion_round", {
                "round": round_num + 1,
                "max_rounds": max_rounds,
            })

            round_responses = []
            for agent in agents:
                if not agent.is_active:
                    continue

                can_continue, _ = await self.loop_guard.check(
                    goal.id, max_exchanges=goal.max_exchanges
                )
                if not can_continue:
                    return all_responses

                response = await self.send_to_agent(
                    goal=goal,
                    agent=agent,
                    prompt=round_prompt,
                    chat_history=chat_history,
                    economy_mode=goal.economy_mode,
                )
                round_responses.append(response)
                all_responses.append(response)

                chat_history.append({
                    "role": "assistant",
                    "content": f"[{agent.name}]: {response.content}",
                })

            # Check consensus
            if self._check_consensus(round_responses):
                consensus_msg = Message(
                    goal_id=goal.id,
                    sender_type="system",
                    sender_name="System",
                    content=f"✅ Team reached consensus in round {round_num + 1}",
                    message_type="system",
                )
                self.db.add(consensus_msg)
                await self.db.commit()
                await self._notify(goal.id, "consensus_reached", {
                    "round": round_num + 1,
                })
                break

        return all_responses

    def _build_tool_result_messages(
        self,
        messages: list[dict],
        response,
        tool_results: list[dict],
        provider: str,
    ) -> list[dict]:
        """Построить сообщения с результатами инструментов для следующего вызова."""
        new_messages = list(messages)

        if provider == "anthropic":
            # Anthropic format: assistant content blocks + user tool_result blocks
            assistant_content = []
            if response.content:
                assistant_content.append({"type": "text", "text": response.content})
            for tc in response.tool_calls:
                assistant_content.append({
                    "type": "tool_use",
                    "id": tc.id,
                    "name": tc.name,
                    "input": tc.arguments,
                })
            new_messages.append({"role": "assistant", "content": assistant_content})

            user_content = []
            for tr in tool_results:
                output = tr["result"]["output"] if tr["result"]["success"] else (
                    f"Error: {tr['result'].get('error', 'Unknown error')}"
                )
                # Не отправлять base64 модели — слишком большой, модели не нужно
                if "data:image" in output:
                    output = output.split("\n\ndata:image")[0] + "\n\n[Изображение сгенерировано и показано пользователю]"
                user_content.append({
                    "type": "tool_result",
                    "tool_use_id": tr["tool_call_id"],
                    "content": output[:10000],
                })
            new_messages.append({"role": "user", "content": user_content})

        else:
            # OpenAI / Custom / Ollama format
            tool_calls_data = []
            for tc in response.tool_calls:
                import json
                tool_calls_data.append({
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.name,
                        "arguments": json.dumps(tc.arguments),
                    },
                })
            new_messages.append({
                "role": "assistant",
                "content": response.content or None,
                "tool_calls": tool_calls_data,
            })

            for tr in tool_results:
                output = tr["result"]["output"] if tr["result"]["success"] else (
                    f"Error: {tr['result'].get('error', 'Unknown error')}"
                )
                # Не отправлять base64 модели
                if "data:image" in output:
                    output = output.split("\n\ndata:image")[0] + "\n\n[Изображение сгенерировано и показано пользователю]"
                new_messages.append({
                    "role": "tool",
                    "tool_call_id": tr["tool_call_id"],
                    "content": output[:10000],
                })

        return new_messages

    def _check_consensus(self, responses: list[Message]) -> bool:
        """Проверить пришли ли модели к согласию."""
        if not responses:
            return False

        agree_phrases = [
            "i agree", "согласен", "согласна", "принято",
            "sounds good", "let's proceed", "давайте", "поехали",
        ]

        agree_count = 0
        for r in responses:
            content_lower = r.content.lower()
            if any(phrase in content_lower for phrase in agree_phrases):
                agree_count += 1

        # Consensus if majority agrees
        return agree_count >= len(responses) * 0.6

    def _build_system_prompt(self, agent: Agent, goal: Goal) -> str:
        """Построить системный промпт для модели с учетом её роли."""
        skills = agent.skills or ["general"]
        is_image_model = any(s in skills for s in ["image", "design"]) or "image" in (agent.model_name or "").lower()
        is_code_model = any(s in skills for s in ["code", "frontend", "backend"])

        base = (
            f"You are '{agent.name}', role: {agent.role}.\n"
            f"You are part of a team working on: {goal.title}\n"
            f"{'Description: ' + goal.description if goal.description else ''}\n\n"
            f"Your skills: {', '.join(skills)}\n\n"
            "RULES:\n"
            "- Be concise and actionable\n"
            "- Focus on your area of expertise\n"
            "- Respond in the same language as the task\n"
            "- When you agree with the plan, explicitly say 'I agree'\n"
            "- When you finish a subtask, clearly state what you completed\n\n"
            "IMPORTANT — USE YOUR TOOLS:\n"
            "- You have access to tools (functions). USE THEM actively.\n"
            "- Do NOT just describe what you would do — actually DO it using tools.\n"
            "- If the task requires creating files — use write_file.\n"
            "- If the task requires running code — use run_command.\n"
            "- If the task requires reading existing code — use read_file.\n"
        )

        if is_image_model:
            base += (
                "\nIMAGE GENERATION INSTRUCTIONS:\n"
                "- You MUST use the generate_image tool when asked to create any visual content.\n"
                "- When the task involves design, visualization, mockup, illustration — ALWAYS call generate_image.\n"
                "- Write a detailed English prompt for the image generator (describe scene, style, lighting, composition).\n"
                "- Do NOT just describe the image in text — actually GENERATE it using the tool.\n"
                "- You can generate multiple images by calling generate_image multiple times with different prompts.\n"
            )

        if is_code_model:
            base += (
                "\nCODE INSTRUCTIONS:\n"
                "- Write actual code using write_file, not just descriptions.\n"
                "- Test your code with run_command when possible.\n"
                "- Fix errors if run_command shows failures.\n"
            )

        if agent.system_prompt:
            base += f"\nAdditional instructions:\n{agent.system_prompt}\n"

        return base
