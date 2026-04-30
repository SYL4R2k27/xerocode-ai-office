"""
Supervisor Engine — мозг системы.

Отвечает за:
1. Разбивку цели на подзадачи
2. Выбор режима распределения (manager/discussion/auto)
3. Автопарсинг ответов → создание задач в БД
4. Обработку вмешательств пользователя-дирижера
5. Реплан при изменениях
6. Запуск выполнения задач агентами
"""
from __future__ import annotations

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.goal import Goal
from app.models.memory import Memory
from app.models.message import Message
from app.models.task import Task
from app.services.code_executor import CodeExecutor
from app.services.communication_bus import CommunicationBus
from app.services.cost_tracker import CostTracker
from app.services.loop_guard import LoopGuard
from app.services.task_parser import TaskParser
from app.services.tools import get_tools_for_task

logger = logging.getLogger(__name__)


class Supervisor:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.bus = CommunicationBus(db)
        self.parser = TaskParser(db)
        self.cost_tracker = CostTracker(db)
        self.loop_guard = LoopGuard(db)

    def set_ws_callback(self, callback):
        """Подключить WebSocket."""
        self.bus.set_ws_callback(callback)

    @staticmethod
    def _parse_design_params(text: str) -> dict:
        """Парсинг [DESIGN:key=val,key=val,...] из текста задачи."""
        import re as _re
        match = _re.search(r'\[DESIGN:([^\]]+)\]', text)
        if not match:
            return {}
        params = {}
        for part in match.group(1).split(","):
            if "=" in part:
                key, val = part.split("=", 1)
                key = key.strip()
                val = val.strip()
                if key == "resolution":
                    params["resolution"] = val
                elif key == "aspect":
                    params["aspect_ratio"] = val
                elif key == "style":
                    params["style_preset"] = val
                elif key == "negative":
                    params["negative_prompt"] = val
                elif key == "batch":
                    try:
                        params["batch_count"] = int(val)
                    except ValueError:
                        pass
                elif key == "seed":
                    try:
                        params["seed"] = int(val)
                    except ValueError:
                        pass
                elif key == "format":
                    params["output_format"] = val
                elif key == "model":
                    params["model"] = val
                elif key == "strength":
                    try:
                        params["img2img_strength"] = float(val)
                    except ValueError:
                        pass
        return params

    async def _generate_and_save_image(
        self,
        executor: CodeExecutor,
        prompt: str,
        model: str = "auto",
        aspect_ratio: str = "1:1",
        style_preset: str | None = None,
        batch_count: int = 1,
        output_format: str = "png",
        seed: int | None = None,
        negative_prompt: str = "",
    ) -> list[str]:
        """Генерировать изображения. Пробует: Stability AI → Together AI → OpenRouter."""
        import httpx
        import base64 as b64mod
        import re as re_mod
        from pathlib import Path as PathCls
        from app.core.config import settings

        upload_dir = PathCls("/var/www/ai-office/uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)
        proxy = getattr(settings, 'api_proxy', None) or None

        # Формируем промпт с учётом стиля
        style_prefix = f"{style_preset} style, " if style_preset and style_preset != "photorealistic" else "photorealistic "
        full_prompt = f"{style_prefix}high-quality image: {prompt}"

        all_saved: list[str] = []

        for batch_idx in range(batch_count):
            current_seed = seed + batch_idx if seed is not None else None

            # ===== METHOD 1: Stability AI (SD 3.5) =====
            stability_key = getattr(settings, 'stability_api_key', None)
            if stability_key:
                try:
                    logger.info(f"Image gen: trying Stability AI (batch {batch_idx+1}/{batch_count})")
                    client_kwargs = {"timeout": 60.0}
                    if proxy:
                        client_kwargs["proxy"] = proxy
                    async with httpx.AsyncClient(**client_kwargs) as client:
                        import io
                        sd_model = model if model not in ("auto",) and model.startswith("sd") else "sd3.5-large"
                        form_data = {
                            "prompt": (None, full_prompt),
                            "model": (None, sd_model),
                            "output_format": (None, output_format if output_format in ("png", "jpeg", "webp") else "jpeg"),
                            "aspect_ratio": (None, aspect_ratio),
                        }
                        if negative_prompt:
                            form_data["negative_prompt"] = (None, negative_prompt)
                        if current_seed is not None:
                            form_data["seed"] = (None, str(current_seed))
                        if style_preset and style_preset in (
                            "enhance", "anime", "photographic", "digital-art", "comic-book",
                            "fantasy-art", "line-art", "analog-film", "neon-punk", "isometric",
                            "low-poly", "origami", "cinematic", "pixel-art",
                        ):
                            form_data["style_preset"] = (None, style_preset)

                        resp = await client.post(
                            "https://api.stability.ai/v2beta/stable-image/generate/sd3",
                            headers={"Authorization": f"Bearer {stability_key}", "Accept": "application/json"},
                            files=form_data,
                        )
                        resp.raise_for_status()
                        data = resp.json()
                        if "image" in data:
                            img_bytes = b64mod.b64decode(data["image"])
                            ext = "jpg" if output_format == "jpeg" else output_format
                            filename = f"{uuid.uuid4().hex[:12]}_sd35.{ext}"
                            (upload_dir / filename).write_bytes(img_bytes)
                            logger.info(f"SD 3.5 image saved: {filename} ({len(img_bytes)//1024}KB)")
                            all_saved.append(f"/uploads/{filename}")
                            continue
                except Exception as e:
                    logger.warning(f"Stability AI failed: {e}")

            # ===== METHOD 2: Together AI (FLUX) =====
            together_key = getattr(settings, 'together_api_key', None)
            if together_key:
                try:
                    logger.info(f"Image gen: trying Together AI (batch {batch_idx+1}/{batch_count})")
                    client_kwargs = {"timeout": 60.0}
                    if proxy:
                        client_kwargs["proxy"] = proxy
                    # Парсим разрешение для Together AI
                    width, height = 1024, 768
                    if "x" in aspect_ratio.replace(":", "x"):
                        pass  # aspect_ratio формат 16:9 и т.д.
                    async with httpx.AsyncClient(**client_kwargs) as client:
                        together_json: dict = {
                            "model": "black-forest-labs/FLUX.1-schnell-Free",
                            "prompt": full_prompt,
                            "n": 1,
                            "width": width,
                            "height": height,
                        }
                        if current_seed is not None:
                            together_json["seed"] = current_seed
                        resp = await client.post(
                            "https://api.together.xyz/v1/images/generations",
                            headers={"Authorization": f"Bearer {together_key}", "Content-Type": "application/json"},
                            json=together_json,
                        )
                        resp.raise_for_status()
                        data = resp.json()
                        saved = []
                        for i, img in enumerate(data.get("data", [])):
                            if "b64_json" in img:
                                img_bytes = b64mod.b64decode(img["b64_json"])
                                filename = f"{uuid.uuid4().hex[:12]}_flux_{i}.png"
                                (upload_dir / filename).write_bytes(img_bytes)
                                saved.append(f"/uploads/{filename}")
                            elif "url" in img:
                                saved.append(img["url"])
                        if saved:
                            logger.info(f"FLUX images saved: {saved}")
                            all_saved.extend(saved)
                            continue
                except Exception as e:
                    logger.warning(f"Together AI failed: {e}")

            # ===== METHOD 3: OpenRouter (Nano Banana / Gemini Image) =====
            openrouter_key = getattr(settings, 'openrouter_api_key', None)
            if not openrouter_key:
                logger.error("No image generation API keys available")
                continue

            saved_urls: list[str] = []
            try:
                logger.info(f"Image gen: trying OpenRouter (batch {batch_idx+1}/{batch_count})")
                client_kwargs = {"timeout": 120.0}
                if proxy:
                    client_kwargs["proxy"] = proxy

                or_model = model if model != "auto" else "google/gemini-2.5-flash-image"
                async with httpx.AsyncClient(**client_kwargs) as client:
                    resp = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={"Authorization": f"Bearer {openrouter_key}", "Content-Type": "application/json"},
                        json={"model": or_model, "messages": [{"role": "user", "content": full_prompt}], "modalities": ["text", "image"], "max_tokens": 4096},
                    )
                    resp.raise_for_status()
                    data = resp.json()

                msg = data.get("choices", [{}])[0].get("message", {})
                images = msg.get("images", [])
                content_text = msg.get("content", "") or ""

                # Парсим ВСЕ изображения из поля images
                for i, img in enumerate(images):
                    try:
                        img_data_url = img.get("image_url", {}).get("url", "")
                        if not img_data_url:
                            continue

                        if img_data_url.startswith("data:image"):
                            match = re_mod.search(r'data:image/(png|jpeg|jpg|gif|webp|svg\+xml);base64,(.+)', img_data_url)
                            if match:
                                ext = match.group(1).replace("svg+xml", "svg")
                                if ext == "jpeg":
                                    ext = "jpg"
                                b64data = match.group(2)
                                img_bytes = b64mod.b64decode(b64data)
                                filename = f"{uuid.uuid4().hex[:12]}_{i+1}.{ext}"
                                (upload_dir / filename).write_bytes(img_bytes)
                                saved_urls.append(f"/uploads/{filename}")
                                logger.info(f"Image {i+1} saved: /uploads/{filename} ({len(img_bytes)//1024}KB)")

                        elif img_data_url.startswith("http"):
                            # ВСЕ image-вызовы строго через прокси
                            _transport = httpx.AsyncHTTPTransport(proxy=proxy) if proxy else None
                            async with httpx.AsyncClient(transport=_transport, timeout=30.0) as dl_client:
                                dl_resp = await dl_client.get(img_data_url)
                                if dl_resp.status_code == 200:
                                    ct = dl_resp.headers.get("content-type", "image/png")
                                    ext = "png"
                                    if "jpeg" in ct or "jpg" in ct:
                                        ext = "jpg"
                                    elif "gif" in ct:
                                        ext = "gif"
                                    elif "webp" in ct:
                                        ext = "webp"
                                    elif "svg" in ct:
                                        ext = "svg"
                                    filename = f"{uuid.uuid4().hex[:12]}_{i+1}.{ext}"
                                    (upload_dir / filename).write_bytes(dl_resp.content)
                                    saved_urls.append(f"/uploads/{filename}")
                                    logger.info(f"Image {i+1} downloaded: /uploads/{filename}")
                    except Exception as img_err:
                        logger.error(f"Failed to save image {i+1}: {img_err}")

                # Также ищем base64 в content
                if not saved_urls and content_text:
                    b64_matches = re_mod.findall(r'data:image/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]{1000,})', content_text)
                    for i, (ext, b64data) in enumerate(b64_matches):
                        try:
                            if ext == "jpeg":
                                ext = "jpg"
                            img_bytes = b64mod.b64decode(b64data)
                            filename = f"{uuid.uuid4().hex[:12]}_c{i+1}.{ext}"
                            (upload_dir / filename).write_bytes(img_bytes)
                            saved_urls.append(f"/uploads/{filename}")
                            logger.info(f"Image from content {i+1}: /uploads/{filename}")
                        except Exception:
                            pass

                # Последний fallback — ищем base64 в raw JSON
                if not saved_urls:
                    raw = str(data)
                    big_b64 = re_mod.search(r'[A-Za-z0-9+/]{10000,}={0,2}', raw)
                    if big_b64:
                        try:
                            img_bytes = b64mod.b64decode(big_b64.group())
                            if len(img_bytes) > 1000:
                                ext = "png"
                                if img_bytes[:2] == b'\xff\xd8':
                                    ext = "jpg"
                                elif img_bytes[:4] == b'GIF8':
                                    ext = "gif"
                                elif img_bytes[:4] == b'RIFF':
                                    ext = "webp"
                                filename = f"{uuid.uuid4().hex[:12]}_raw.{ext}"
                                (upload_dir / filename).write_bytes(img_bytes)
                                saved_urls.append(f"/uploads/{filename}")
                                logger.info(f"Image from raw: /uploads/{filename}")
                        except Exception:
                            pass

                if not saved_urls:
                    logger.warning(f"No images extracted from {model} response (batch {batch_idx+1})")

                all_saved.extend(saved_urls)

            except Exception as e:
                logger.error(f"Image generation failed (batch {batch_idx+1}): {e}")

        return all_saved

    async def start_goal(self, goal_id: uuid.UUID) -> dict:
        """
        🚀 Запуск цели — главная точка входа.

        1. Загружаем цель и агентов
        2. Фаза 1: Декомпозиция (разбивка на задачи)
        3. Фаза 2: Назначение (кто что делает)
        4. Фаза 3: Выполнение (агенты работают)
        """
        goal = await self._get_goal(goal_id)
        agents = await self._get_active_agents()

        if not agents:
            return {"error": "No active agents. Connect at least one AI model."}

        # System start message
        start_msg = Message(
            goal_id=goal.id,
            sender_type="system",
            sender_name="System",
            content=(
                f"🚀 Starting goal: {goal.title}\n"
                f"Mode: {goal.distribution_mode}\n"
                f"Team: {', '.join(a.name for a in agents)}\n"
                f"Economy mode: {'ON' if goal.economy_mode else 'OFF'}\n"
                f"Exchange limit: {goal.max_exchanges or 'unlimited'}"
            ),
            message_type="system",
        )
        self.db.add(start_msg)
        await self.db.commit()

        # Phase 1: Decomposition based on mode
        if goal.distribution_mode == "manager":
            result = await self._mode_manager(goal, agents)
        elif goal.distribution_mode == "discussion":
            result = await self._mode_discussion(goal, agents)
        else:
            result = await self._mode_auto(goal, agents)

        # Phase 2: Execute assigned tasks
        tasks = await self._get_pending_tasks(goal_id)
        if tasks:
            execution_result = await self._execute_tasks(goal, agents, tasks)
            result["execution"] = execution_result

        # Phase 3: Summary
        report = await self.cost_tracker.get_report(goal_id)
        result["cost_report"] = {
            "total_cost_usd": report.total_cost_usd,
            "total_tokens": report.total_tokens,
            "exchange_count": report.exchange_count,
            "cost_by_agent": report.cost_by_agent,
        }

        # Update memory
        await self._update_memory(goal_id, result)

        return result

    async def _mode_manager(self, goal: Goal, agents: list[Agent]) -> dict:
        """
        Режим A: Модель-менеджер разбивает и назначает.
        """
        manager = self._pick_manager(agents)
        team = [a for a in agents if a.id != manager.id] or agents

        team_desc = "\n".join(
            f"- {a.name} ({a.role}): skills = {', '.join(a.skills or ['general'])}"
            for a in team
        )

        prompt = (
            f"You are the team manager. Break down this goal into specific tasks "
            f"and assign each to the best team member.\n\n"
            f"GOAL: {goal.title}\n"
            f"{'DESCRIPTION: ' + goal.description if goal.description else ''}\n\n"
            f"YOUR TEAM:\n{team_desc}\n\n"
            f"Respond in this EXACT format for each task:\n\n"
            f"TASK: [title]\n"
            f"ASSIGNED TO: [agent name]\n"
            f"TYPE: [research|code|design|analysis|general]\n"
            f"DEPENDS ON: [task title or NONE]\n"
            f"DESCRIPTION: [what to do]\n\n"
            f"List ALL tasks needed. Be specific."
        )

        response = await self.bus.send_to_agent(
            goal=goal, agent=manager, prompt=prompt,
            economy_mode=goal.economy_mode,
        )

        # Parse response → create Task objects
        created_tasks = await self.parser.parse_and_create_tasks(
            text=response.content,
            goal_id=goal.id,
            agents=team,
        )

        # Notify about created tasks
        task_summary = Message(
            goal_id=goal.id,
            sender_type="system",
            sender_name="System",
            content=f"📋 Created {len(created_tasks)} tasks from {manager.name}'s plan",
            message_type="system",
        )
        self.db.add(task_summary)
        await self.db.commit()

        return {
            "status": "planned",
            "mode": "manager",
            "manager": manager.name,
            "tasks_created": len(created_tasks),
            "tasks": [
                {
                    "id": str(t.id),
                    "title": t.title,
                    "type": t.task_type,
                    "status": t.status,
                    "assigned_to": next(
                        (a.name for a in agents if a.id == t.assigned_agent_id), None
                    ),
                }
                for t in created_tasks
            ],
        }

    async def _mode_discussion(self, goal: Goal, agents: list[Agent]) -> dict:
        """
        Режим B: Модели обсуждают и сами решают.
        """
        topic = (
            f"New task for the team:\n\n"
            f"GOAL: {goal.title}\n"
            f"{'DESCRIPTION: ' + goal.description if goal.description else ''}\n\n"
            f"Discuss:\n"
            f"1. What subtasks are needed?\n"
            f"2. Which subtask do YOU want based on your skills?\n"
            f"3. What do you need from others?\n\n"
            f"When you agree with the plan, say 'I agree' and state your task.\n"
            f"Format your chosen task as:\n"
            f"TASK: [title]\n"
            f"TYPE: [research|code|design|analysis|general]\n"
            f"DESCRIPTION: [what you will do]"
        )

        max_rounds = 2 if goal.economy_mode else 3
        responses = await self.bus.discussion_round(
            goal=goal, agents=agents, topic=topic, max_rounds=max_rounds,
        )

        # Parse tasks from all responses
        all_text = "\n\n".join(r.content for r in responses)
        created_tasks = await self.parser.parse_and_create_tasks(
            text=all_text, goal_id=goal.id, agents=agents,
        )

        return {
            "status": "discussed",
            "mode": "discussion",
            "rounds": len(responses) // max(len(agents), 1),
            "tasks_created": len(created_tasks),
        }

    async def _mode_auto(self, goal: Goal, agents: list[Agent]) -> dict:
        """
        Режим C: Платформа автоматически разбивает и назначает.
        """
        planner = agents[0]

        prompt = (
            f"Break this goal into specific subtasks with skill types.\n\n"
            f"GOAL: {goal.title}\n"
            f"{'DESCRIPTION: ' + goal.description if goal.description else ''}\n\n"
            f"Available skills: research, code, design, analysis, general\n\n"
            f"Format:\n"
            f"TASK: [title]\n"
            f"TYPE: [skill type]\n"
            f"DEPENDS ON: [task title or NONE]\n"
            f"DESCRIPTION: [what to do]"
        )

        response = await self.bus.send_to_agent(
            goal=goal, agent=planner, prompt=prompt,
            economy_mode=goal.economy_mode,
        )

        # Parse tasks
        created_tasks = await self.parser.parse_and_create_tasks(
            text=response.content, goal_id=goal.id, agents=agents,
        )

        # Auto-assign by skill matching
        for task in created_tasks:
            if not task.assigned_agent_id:
                best_agent = self._match_agent_by_skill(task.task_type, agents)
                if best_agent:
                    task.assigned_agent_id = best_agent.id
                    task.status = "assigned"

        await self.db.commit()

        return {
            "status": "auto_planned",
            "mode": "auto",
            "tasks_created": len(created_tasks),
        }

    async def _execute_tasks(
        self, goal: Goal, agents: list[Agent], tasks: list[Task]
    ) -> dict:
        """
        Выполнение задач с учётом зависимостей (DAG).
        Многопроходное: повторяет пока есть незавершённые задачи.
        Auto-recovery: при ошибке переназначает другому агенту.
        """
        completed = 0
        failed = 0
        agent_map = {a.id: a for a in agents}

        max_passes = 5
        for pass_num in range(max_passes):
            remaining = [t for t in tasks if t.status in ("pending", "assigned")]
            if not remaining:
                break

            progress_made = False

            for task in remaining:
                # 1. Проверить зависимости
                if task.depends_on:
                    deps_done = await self._check_dependencies(task.depends_on)
                    if not deps_done:
                        continue

                # 2. Проверить LoopGuard
                can_continue, reason = await self.loop_guard.check(
                    goal.id, max_exchanges=goal.max_exchanges
                )
                if not can_continue:
                    logger.warning(f"Stopping execution: {reason}")
                    return {"completed": completed, "failed": failed, "remaining": len(remaining)}

                # 3. Найти агента
                is_design_task = task.task_type in ("design", "image", "image processing")
                agent = agent_map.get(task.assigned_agent_id)
                if not agent:
                    agent = self._find_best_agent_for_task(task, agents)
                elif not is_design_task and self._is_image_model(agent):
                    agent = self._find_best_agent_for_task(task, agents)

                # 4. Сбросить статус агента
                agent.status = "idle"
                task.status = "in_progress"
                await self.db.commit()
                progress_made = True

                # 5. Подготовить tools и промпт
                tools = get_tools_for_task(task.task_type)
                executor = CodeExecutor(str(goal.id))

                tool_instruction = (
                    "\n\nYou have access to tools. USE THEM:\n"
                    "- write_file, read_file, run_command, list_files, search_code\n"
                )
                if is_design_task:
                    tool_instruction += (
                        "- generate_image: GENERATE images. YOU MUST USE THIS.\n"
                        "\nThis is a DESIGN task. Call generate_image with a detailed English prompt.\n"
                    )

                exec_prompt = (
                    f"Execute this task:\n\n"
                    f"TASK: {task.title}\n"
                    f"{'DESCRIPTION: ' + task.description if task.description else ''}\n"
                    f"TYPE: {task.task_type}\n\n"
                    f"Provide the complete result."
                    f"{tool_instruction}"
                )

                # 6. Исполнение
                try:
                    is_image_model = self._is_image_model(agent)

                    # Image-модели: генерация напрямую
                    if is_image_model and is_design_task:
                        img_prompt = f"{goal.title}. {task.title}. {task.description or ''}"
                        img_model = agent.model_name

                        # Парсим параметры дизайна из описания цели/задачи
                        design_source = f"{goal.title} {goal.description or ''} {task.title} {task.description or ''}"
                        dp = self._parse_design_params(design_source)

                        img_urls = await self._generate_and_save_image(
                            executor, img_prompt,
                            model=dp.get("model", img_model),
                            aspect_ratio=dp.get("aspect_ratio", "1:1"),
                            style_preset=dp.get("style_preset"),
                            batch_count=dp.get("batch_count", 1),
                            output_format=dp.get("output_format", "png"),
                            seed=dp.get("seed"),
                            negative_prompt=dp.get("negative_prompt", ""),
                        )

                        for idx, img_url in enumerate(img_urls):
                            label = f"Вариант {idx + 1}" if len(img_urls) > 1 else "Изображение сгенерировано"
                            content_text = f"{label}\n\n![generated]({img_url})"
                            img_msg = Message(
                                goal_id=goal.id, sender_type="agent",
                                sender_agent_id=str(agent.id), sender_name=agent.name,
                                content=content_text, message_type="image",
                            )
                            self.db.add(img_msg)
                            await self.db.flush()
                            await self.bus._notify(goal.id, "new_message", {
                                "id": str(img_msg.id), "sender_type": "agent",
                                "sender_name": agent.name, "content": content_text,
                                "message_type": "image",
                            })

                        # Описание
                        exec_prompt = (
                            f"You generated an image. Describe the result briefly:\n"
                            f"TASK: {task.title}"
                        )

                    # Вызов модели
                    response = await self.bus.send_to_agent(
                        goal=goal, agent=agent, prompt=exec_prompt,
                        economy_mode=goal.economy_mode,
                        tools=tools if not is_image_model else None,
                        executor=executor if not is_image_model else None,
                    )

                    task.status = "done"
                    task.result = response.content
                    completed += 1

                    done_msg = Message(
                        goal_id=goal.id, sender_type="system", sender_name="System",
                        content=f"✅ Задача выполнена: {task.title} ({agent.name})",
                        message_type="status_update",
                    )
                    self.db.add(done_msg)

                except Exception as e:
                    logger.error(f"Task '{task.title}' failed ({agent.name}): {e}")
                    agent.status = "error"

                    # Auto-recovery: переназначить другому агенту
                    other_agents = [a for a in agents if a.id != agent.id and a.status != "error"]
                    recovered = False

                    if other_agents:
                        backup = other_agents[0]
                        logger.info(f"Auto-recovery: {task.title} → {backup.name}")
                        try:
                            task.assigned_agent_id = backup.id
                            recovery_msg = Message(
                                goal_id=goal.id, sender_type="system", sender_name="System",
                                content=f"⚡ {agent.name} ошибка → {backup.name} подхватил: {task.title}",
                                message_type="system",
                            )
                            self.db.add(recovery_msg)
                            await self.db.commit()

                            response = await self.bus.send_to_agent(
                                goal=goal, agent=backup, prompt=exec_prompt,
                                economy_mode=goal.economy_mode, tools=tools, executor=executor,
                            )
                            task.status = "done"
                            task.result = response.content
                            completed += 1
                            recovered = True
                        except Exception as e2:
                            logger.error(f"Recovery failed: {e2}")

                    if not recovered:
                        task.status = "failed"
                        failed += 1
                        err_msg = Message(
                            goal_id=goal.id, sender_type="system", sender_name="System",
                            content=f"❌ Задача провалена: {task.title}",
                            message_type="system",
                        )
                        self.db.add(err_msg)

                await self.db.commit()

            if not progress_made:
                break

        return {
            "completed": completed,
            "failed": failed,
            "remaining": len([t for t in tasks if t.status in ("pending", "assigned")]),
        }

    async def process_user_input(
        self, goal_id: uuid.UUID, content: str, input_type: str
    ) -> dict:
        """
        🎯 Обработка вмешательства пользователя-дирижера.
        """
        goal = await self._get_goal(goal_id)
        agents = await self._get_active_agents()

        if not agents:
            return {"error": "No active agents"}

        # Save user message
        user_msg = Message(
            goal_id=goal.id,
            sender_type="user",
            sender_name="User",
            content=content,
            message_type="user_command",
        )
        self.db.add(user_msg)
        await self.db.commit()

        if input_type == "command":
            prompt = (
                f"[DIRECTIVE FROM PROJECT MANAGER]: {content}\n\n"
                f"Acknowledge and adjust your work. "
                f"If this requires new tasks, list them in format:\n"
                f"TASK: [title]\nTYPE: [type]\nDESCRIPTION: [what to do]"
            )
        elif input_type == "idea":
            prompt = (
                f"[IDEA FROM PROJECT MANAGER]: {content}\n\n"
                f"Discuss: should we incorporate this? How would it affect current work?"
            )
        else:  # edit
            prompt = (
                f"[PLAN CHANGE]: {content}\n\n"
                f"Update your current tasks. What changes are needed?"
            )

        responses = await self.bus.broadcast_to_team(
            goal=goal, prompt=prompt, agents=agents,
        )

        # Parse any new tasks from responses
        new_tasks = []
        for r in responses:
            tasks = await self.parser.parse_and_create_tasks(
                text=r.content, goal_id=goal.id, agents=agents,
            )
            new_tasks.extend(tasks)

        return {
            "status": "processed",
            "input_type": input_type,
            "responses_count": len(responses),
            "new_tasks_created": len(new_tasks),
        }

    # --- Helper methods ---

    def _pick_manager(self, agents: list[Agent]) -> Agent:
        """Выбрать лучшего менеджера из команды."""
        # Prefer agent with management/planning skills
        manager_skills = {"management", "planning", "analysis", "lead", "manager"}
        for agent in agents:
            if agent.skills:
                if manager_skills & set(s.lower() for s in agent.skills):
                    return agent
        return agents[0]

    def _is_image_model(self, agent: Agent) -> bool:
        """Check if agent is an image-only model (не поддерживает обычный chat)."""
        model = (agent.model_name or "").lower()
        return "image" in model or "imagen" in model

    def _find_best_agent_for_task(self, task: Task, agents: list[Agent]) -> Agent:
        """Find best agent for task — image models ONLY get image tasks."""
        is_image_task = task.task_type in ("design", "image", "image processing")

        if is_image_task:
            # Сначала ищем image-модель
            for a in agents:
                if self._is_image_model(a):
                    return a
            # Fallback на модель с навыком design
            for a in agents:
                if a.skills and any(s in a.skills for s in ["image", "design"]):
                    return a

        # Для НЕ-image задач — исключаем image-модели
        non_image = [a for a in agents if not self._is_image_model(a)]
        if not non_image:
            non_image = agents  # если все image — fallback

        # По навыкам
        matched = self._match_agent_by_skill(task.task_type or "general", non_image)
        if matched:
            return matched

        return non_image[0]

    def _match_agent_for_task(self, task: Task, agents: list[Agent]) -> Agent:
        """Назначить агента для задачи по типу."""
        # Для image/design задач — ищем image-модель
        if task.task_type in ("design", "image", "image processing"):
            for a in agents:
                if "image" in (a.model_name or "").lower():
                    return a
                if a.skills and any(s in a.skills for s in ["image", "design"]):
                    return a
        # По навыкам
        matched = self._match_agent_by_skill(task.task_type or "general", agents)
        return matched or agents[0]

    def _match_agent_by_skill(self, task_type: str, agents: list[Agent]) -> Agent | None:
        """Найти агента с подходящим скиллом."""
        skill_map = {
            "research": {"research", "analysis", "search"},
            "code": {"code", "coding", "development", "programming"},
            "design": {"design", "ui", "ux", "frontend"},
            "analysis": {"analysis", "analytics", "data"},
            "general": set(),
        }
        target_skills = skill_map.get(task_type, set())

        if not target_skills:
            return agents[0] if agents else None

        for agent in agents:
            if agent.skills:
                if target_skills & set(s.lower() for s in agent.skills):
                    return agent

        return agents[0] if agents else None

    async def _check_dependencies(self, depends_on: list[str]) -> bool:
        """Проверить что все зависимости выполнены."""
        for task_id in depends_on:
            result = await self.db.execute(
                select(Task.status).where(Task.id == task_id)
            )
            status = result.scalar_one_or_none()
            if status != "done":
                return False
        return True

    async def _get_pending_tasks(self, goal_id: uuid.UUID) -> list[Task]:
        """Получить задачи готовые к выполнению."""
        result = await self.db.execute(
            select(Task)
            .where(Task.goal_id == goal_id)
            .where(Task.status.in_(["pending", "assigned"]))
            .order_by(Task.priority.desc(), Task.created_at)
        )
        return list(result.scalars().all())

    async def _update_memory(self, goal_id: uuid.UUID, result: dict):
        """Обновить память цели."""
        mem_result = await self.db.execute(
            select(Memory).where(Memory.goal_id == goal_id)
        )
        memory = mem_result.scalar_one_or_none()
        if memory:
            memory.summary = (
                f"Tasks created: {result.get('tasks_created', 0)}\n"
                f"Mode: {result.get('mode', 'unknown')}\n"
                f"Status: {result.get('status', 'unknown')}"
            )
            if "cost_report" in result:
                memory.task_results = result["cost_report"]
            await self.db.commit()

    async def _get_goal(self, goal_id: uuid.UUID) -> Goal:
        result = await self.db.execute(select(Goal).where(Goal.id == goal_id))
        goal = result.scalar_one_or_none()
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")
        return goal

    async def _get_active_agents(self) -> list[Agent]:
        result = await self.db.execute(
            select(Agent).where(Agent.is_active == True).order_by(Agent.created_at)
        )
        return list(result.scalars().all())
