"""
CodeExecutor — исполнение инструментов (write_file, run_command, etc.).
Фаза 1: работает в /tmp/ai-office/{goal_id}/ на сервере.
Фаза 2: Docker-контейнер.
Фаза 3: через WebSocket к локальному агенту.
"""
from __future__ import annotations

import asyncio
import os
import re
import subprocess
from pathlib import Path


class CodeExecutor:
    """Исполняет tool calls от ИИ-моделей."""

    def __init__(self, goal_id: str, base_dir: str = "/tmp/ai-office"):
        self.goal_id = goal_id
        self.workspace = Path(base_dir) / goal_id
        self.workspace.mkdir(parents=True, exist_ok=True)

    async def execute(self, tool_name: str, arguments: dict) -> dict:
        """
        Выполнить инструмент и вернуть результат.
        Returns: {"success": bool, "output": str, "error": str | None}
        """
        handlers = {
            "write_file": self._write_file,
            "read_file": self._read_file,
            "run_command": self._run_command,
            "list_files": self._list_files,
            "search_code": self._search_code,
            "generate_image": self._generate_image,
            "transform_image": self._transform_image,
        }

        handler = handlers.get(tool_name)
        if not handler:
            return {
                "success": False,
                "output": "",
                "error": f"Unknown tool: {tool_name}",
            }

        try:
            return await handler(**arguments)
        except Exception as e:
            return {"success": False, "output": "", "error": str(e)}

    def _safe_path(self, path: str) -> Path:
        """Безопасный путь: только внутри workspace, без '..'."""
        # Убираем попытки выхода из workspace
        clean = path.replace("..", "").lstrip("/")
        resolved = (self.workspace / clean).resolve()
        # Проверяем что не вышли за пределы workspace
        if not str(resolved).startswith(str(self.workspace.resolve())):
            raise ValueError(f"Path traversal detected: {path}")
        return resolved

    async def _write_file(self, path: str, content: str) -> dict:
        target = self._safe_path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        return {
            "success": True,
            "output": f"File written: {path} ({len(content)} bytes)",
            "error": None,
        }

    async def _read_file(self, path: str) -> dict:
        target = self._safe_path(path)
        if not target.exists():
            return {"success": False, "output": "", "error": f"File not found: {path}"}
        content = target.read_text(encoding="utf-8")
        # Ограничение на размер вывода
        if len(content) > 50000:
            content = content[:50000] + "\n... [truncated]"
        return {"success": True, "output": content, "error": None}

    # Maximum command length (chars)
    MAX_COMMAND_LENGTH = 1000
    # Maximum output size (bytes)
    MAX_OUTPUT_SIZE = 100_000  # 100 KB

    async def _run_command(self, command: str) -> dict:
        # Command length limit
        if len(command) > self.MAX_COMMAND_LENGTH:
            return {
                "success": False,
                "output": "",
                "error": f"Command too long ({len(command)} chars, max {self.MAX_COMMAND_LENGTH})",
            }

        # Запрещаем опасные команды
        dangerous = [
            "rm -rf /", "mkfs", "dd if=", ":(){", "fork bomb",
            "cat /etc", "curl ", "wget ", "nc ", "ncat ",
            "python -c", "python3 -c",
            "eval ", "exec(",
            "chmod 777", "chown ", "sudo ",
            ">/dev/sd", "mount ",
        ]
        for d in dangerous:
            if d in command:
                return {
                    "success": False,
                    "output": "",
                    "error": f"Dangerous command blocked: {command}",
                }

        # Block backtick execution and $() subshells with dangerous content
        if re.search(r'`[^`]+`', command) or re.search(r'\$\([^)]+\)', command):
            return {
                "success": False,
                "output": "",
                "error": "Backtick and $() subshell execution is not allowed",
            }

        # Block pipe to shell interpreters
        if re.search(r'\|\s*(ba)?sh', command):
            return {
                "success": False,
                "output": "",
                "error": "Piping to shell interpreters is not allowed",
            }

        try:
            # Split command into args list to avoid shell injection where possible.
            # Falls back to shell mode only when shell features (pipes, redirects) are needed.
            use_shell = any(c in command for c in "|><;&")
            if use_shell:
                proc = await asyncio.create_subprocess_shell(
                    command,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=str(self.workspace),
                    env={**os.environ, "HOME": str(self.workspace)},
                )
            else:
                import shlex

                proc = await asyncio.create_subprocess_exec(
                    *shlex.split(command),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=str(self.workspace),
                    env={**os.environ, "HOME": str(self.workspace)},
                )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30)

            output = stdout.decode("utf-8", errors="replace")
            err_output = stderr.decode("utf-8", errors="replace")

            # Output size limit (100 KB)
            if len(output) > self.MAX_OUTPUT_SIZE:
                output = output[: self.MAX_OUTPUT_SIZE] + "\n... [truncated at 100KB]"
            if len(err_output) > self.MAX_OUTPUT_SIZE:
                err_output = err_output[: self.MAX_OUTPUT_SIZE] + "\n... [truncated at 100KB]"

            return {
                "success": proc.returncode == 0,
                "output": output + (f"\nSTDERR:\n{err_output}" if err_output else ""),
                "error": None if proc.returncode == 0 else f"Exit code: {proc.returncode}",
            }
        except asyncio.TimeoutError:
            return {
                "success": False,
                "output": "",
                "error": "Command timed out (30s limit)",
            }

    async def _list_files(self, directory: str = ".") -> dict:
        target = self._safe_path(directory)
        if not target.exists():
            return {
                "success": False,
                "output": "",
                "error": f"Directory not found: {directory}",
            }
        if not target.is_dir():
            return {
                "success": False,
                "output": "",
                "error": f"Not a directory: {directory}",
            }

        entries = []
        for item in sorted(target.iterdir()):
            rel = item.relative_to(self.workspace)
            prefix = "📁 " if item.is_dir() else "📄 "
            size = f" ({item.stat().st_size} bytes)" if item.is_file() else ""
            entries.append(f"{prefix}{rel}{size}")

        return {
            "success": True,
            "output": "\n".join(entries) if entries else "(empty directory)",
            "error": None,
        }

    async def _search_code(self, query: str, path: str = ".") -> dict:
        target = self._safe_path(path)
        if not target.exists():
            return {
                "success": False,
                "output": "",
                "error": f"Path not found: {path}",
            }

        try:
            proc = await asyncio.create_subprocess_exec(
                "grep",
                "-rn",
                "--include=*.py",
                "--include=*.js",
                "--include=*.ts",
                "--include=*.tsx",
                "--include=*.jsx",
                "--include=*.html",
                "--include=*.css",
                "--include=*.json",
                "--include=*.md",
                "--include=*.yaml",
                "--include=*.yml",
                query,
                str(target),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.workspace),
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=10)
            output = stdout.decode("utf-8", errors="replace")

            if len(output) > 10000:
                output = output[:10000] + "\n... [truncated]"

            return {
                "success": True,
                "output": output if output else "No matches found",
                "error": None,
            }
        except asyncio.TimeoutError:
            return {
                "success": False,
                "output": "",
                "error": "Search timed out",
            }

    async def _generate_image(self, prompt: str, style: str = "photorealistic") -> dict:
        """Генерация изображения. Приоритет: Pollinations → OpenRouter."""
        import httpx
        import base64

        from app.core.config import settings

        full_prompt = f"{style} style, {prompt}, high quality, detailed, 4k"

        # Метод 1: Pollinations.ai — бесплатно, без ключа
        try:
            from urllib.parse import quote
            encoded = quote(full_prompt)
            url = f"https://gen.pollinations.ai/image/{encoded}?model=flux&width=1024&height=768&nologo=true"

            proxy = getattr(settings, 'api_proxy', None) or None
            client_kwargs = {"timeout": 90.0, "follow_redirects": True}
            if proxy:
                client_kwargs["proxy"] = proxy

            async with httpx.AsyncClient(**client_kwargs) as client:
                resp = await client.get(url)
                if resp.status_code == 200 and resp.headers.get("content-type", "").startswith("image"):
                    img_bytes = resp.content
                    if len(img_bytes) > 1000:  # Реальное изображение > 1KB
                        b64data = base64.b64encode(img_bytes).decode("utf-8")
                        ext = "png" if "png" in resp.headers.get("content-type", "") else "jpg"
                        img_path = self.workspace / f"generated_{style}.{ext}"
                        img_path.write_bytes(img_bytes)
                        data_url = f"data:image/{ext};base64,{b64data}"
                        return {
                            "success": True,
                            "output": f"Изображение сгенерировано (Pollinations/FLUX): generated_{style}.{ext}\n\n{data_url}",
                            "error": None,
                        }
        except Exception:
            pass  # Fallback к OpenRouter

        # Метод 2: OpenRouter с modalities
        openrouter_key = getattr(settings, 'openrouter_api_key', None)
        if openrouter_key:
            try:
                client_kwargs = {"timeout": 120.0}
                proxy = getattr(settings, 'api_proxy', None) or None
                if proxy:
                    client_kwargs["proxy"] = proxy

                async with httpx.AsyncClient(**client_kwargs) as client:
                    resp = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {openrouter_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": "google/gemini-2.5-flash-image",
                            "modalities": ["text", "image"],
                            "messages": [{"role": "user", "content": f"Generate image: {full_prompt}"}],
                            "max_tokens": 8192,
                        },
                    )
                    resp.raise_for_status()
                    data = resp.json()

                msg = data.get("choices", [{}])[0].get("message", {})
                content = msg.get("content", "")

                # OpenRouter возвращает изображения в message.images[]
                images = msg.get("images", [])
                if images:
                    img_data = images[0]
                    if isinstance(img_data, dict):
                        img_url = img_data.get("image_url", {}).get("url", "")
                    elif isinstance(img_data, str):
                        img_url = img_data
                    else:
                        img_url = ""
                    if img_url.startswith("data:image"):
                        import re as _re
                        m = _re.match(r'data:image/(png|jpeg|jpg|gif|webp);base64,(.+)', img_url)
                        if m:
                            ext = m.group(1)
                            b64data = m.group(2)
                            img_bytes = base64.b64decode(b64data)
                            img_path = self.workspace / f"generated_{style}.{ext}"
                            img_path.write_bytes(img_bytes)
                            return {
                                "success": True,
                                "output": f"Изображение сгенерировано (Nano Banana): generated_{style}.{ext} ({len(img_bytes)//1024}KB)\n\n{img_url[:200]}...{img_url[-20:]}",
                                "error": None,
                            }

                # Fallback: ищем base64 в content
                import re as _re
                match = _re.search(r'data:image/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)', content or "")
                if match:
                    ext = match.group(1)
                    b64data = match.group(2)
                    img_bytes = base64.b64decode(b64data)
                    img_path = self.workspace / f"generated_{style}.{ext}"
                    img_path.write_bytes(img_bytes)
                    return {
                        "success": True,
                        "output": f"Изображение сгенерировано (Nano Banana): generated_{style}.{ext}\n\ndata:image/{ext};base64,{b64data}",
                        "error": None,
                    }

                # Текстовый fallback
                img_path = self.workspace / f"design_{style}.md"
                img_path.write_text(content, encoding="utf-8")
                return {
                    "success": True,
                    "output": f"Дизайн-описание: design_{style}.md\n\n{content[:500]}",
                    "error": None,
                }
            except Exception as e:
                return {"success": False, "output": "", "error": f"OpenRouter error: {str(e)}"}

        return {"success": False, "output": "", "error": "Нет ключей для генерации изображений"}

    async def _transform_image(self, image_path: str, prompt: str, strength: float = 0.7, style: str = "photorealistic") -> dict:
        """Img2Img трансформация через Stability AI."""
        import httpx
        import base64

        from app.core.config import settings

        stability_key = getattr(settings, 'stability_api_key', None)
        if not stability_key:
            return {"success": False, "output": "", "error": "Stability API key не настроен"}

        # Читаем исходное изображение
        source_path = self._safe_path(image_path)
        if not source_path.exists():
            return {"success": False, "output": "", "error": f"Файл не найден: {image_path}"}

        image_bytes = source_path.read_bytes()
        if len(image_bytes) < 100:
            return {"success": False, "output": "", "error": "Файл слишком мал для изображения"}

        full_prompt = f"{style} style, {prompt}, high quality, detailed"

        proxy = getattr(settings, 'api_proxy', None) or None
        client_kwargs: dict = {"timeout": 120.0}
        if proxy:
            client_kwargs["proxy"] = proxy

        try:
            async with httpx.AsyncClient(**client_kwargs) as client:
                # Stability AI Image-to-Image через SD3
                files = {
                    "image": ("source.png", image_bytes, "image/png"),
                    "prompt": (None, full_prompt),
                    "mode": (None, "image-to-image"),
                    "strength": (None, str(strength)),
                    "output_format": (None, "png"),
                    "model": (None, "sd3.5-large"),
                }

                resp = await client.post(
                    "https://api.stability.ai/v2beta/stable-image/generate/sd3",
                    headers={
                        "Authorization": f"Bearer {stability_key}",
                        "Accept": "application/json",
                    },
                    files=files,
                )
                resp.raise_for_status()
                data = resp.json()

            if "image" in data:
                img_bytes = base64.b64decode(data["image"])
                result_filename = f"transformed_{style}.png"
                result_path = self.workspace / result_filename
                result_path.write_bytes(img_bytes)

                b64data = base64.b64encode(img_bytes).decode("utf-8")
                data_url = f"data:image/png;base64,{b64data}"

                return {
                    "success": True,
                    "output": f"Img2Img трансформация выполнена: {result_filename} ({len(img_bytes)//1024}KB), сила: {strength}\n\n{data_url}",
                    "error": None,
                }

            return {"success": False, "output": "", "error": "Stability AI не вернул изображение"}

        except Exception as e:
            return {"success": False, "output": "", "error": f"Img2Img ошибка: {str(e)}"}

    def get_workspace_path(self) -> str:
        """Вернуть путь к workspace."""
        return str(self.workspace)
