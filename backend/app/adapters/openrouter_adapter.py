from __future__ import annotations

import json

import httpx

from app.adapters.base import AIResponse, BaseAdapter, ToolCall


class OpenRouterAdapter(BaseAdapter):
    """Адаптер для OpenRouter API (OpenAI-совместимый)."""

    def __init__(self, api_key: str, base_url: str | None = None):
        super().__init__(api_key, base_url)
        self.endpoint = base_url or "https://openrouter.ai/api/v1"

    async def call(
        self,
        messages: list[dict],
        model: str = "openai/gpt-4o",
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: list[dict] | None = None,
    ) -> AIResponse:
        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(messages)

        payload: dict = {
            "model": model,
            "messages": all_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        async with self._get_client(120.0) as client:
            response = await client.post(
                f"{self.endpoint}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://ai-office.app",
                    "X-Title": "AI Office",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        usage = data.get("usage", {})
        tokens_in = usage.get("prompt_tokens", 0)
        tokens_out = usage.get("completion_tokens", 0)

        message = data["choices"][0]["message"]
        content = message.get("content") or ""

        # Parse tool calls (same format as OpenAI)
        parsed_tools = None
        stop_reason = "end_turn"

        if message.get("tool_calls"):
            parsed_tools = []
            for tc in message["tool_calls"]:
                try:
                    args = json.loads(tc["function"]["arguments"])
                except (json.JSONDecodeError, KeyError):
                    args = {}
                parsed_tools.append(
                    ToolCall(
                        id=tc["id"],
                        name=tc["function"]["name"],
                        arguments=args,
                    )
                )
            stop_reason = "tool_use"

        return AIResponse(
            content=content,
            tokens_input=tokens_in,
            tokens_output=tokens_out,
            cost_usd=self._calculate_cost(model, tokens_in, tokens_out),
            model=model,
            raw=data,
            tool_calls=parsed_tools,
            stop_reason=stop_reason,
        )

    async def test_connection(self, model: str = "openai/gpt-4o-mini") -> bool:
        try:
            result = await self.call(
                messages=[{"role": "user", "content": "Say OK"}],
                model=model,
                max_tokens=5,
            )
            return bool(result.content)
        except Exception:
            return False

    @staticmethod
    def _calculate_cost(model: str, tokens_in: int, tokens_out: int) -> float:
        """Расчёт стоимости на основе модели. Цены за 1M токенов."""
        from app.core.model_registry import get_model_info

        # Попробуем найти цены в реестре моделей
        for prefix in ("", "openrouter/"):
            info = get_model_info(f"{prefix}{model}")
            if info:
                price_in = info.get("price_input", 0.0)
                price_out = info.get("price_output", 0.0)
                return (tokens_in / 1_000_000 * price_in) + (tokens_out / 1_000_000 * price_out)

        # Фолбэк — средние цены
        return (tokens_in / 1_000_000 * 2.0) + (tokens_out / 1_000_000 * 8.0)
