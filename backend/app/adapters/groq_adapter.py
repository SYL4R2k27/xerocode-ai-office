"""
Адаптер для Groq API — сверхбыстрый инференс.
Бесплатный тир: 30 запр/мин, Llama 3.3 70B, Mixtral и другие.
OpenAI-совместимый формат.
"""
from __future__ import annotations

import json

import httpx

from app.adapters.base import AIResponse, BaseAdapter, ToolCall


class GroqAdapter(BaseAdapter):
    """Адаптер для Groq API (Llama 3.3, Mixtral, Gemma)."""

    def __init__(self, api_key: str, base_url: str | None = None):
        super().__init__(api_key, base_url)
        self.endpoint = base_url or "https://api.groq.com/openai/v1"

    async def call(
        self,
        messages: list[dict],
        model: str = "llama-3.3-70b-versatile",
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: list[dict] | None = None,
    ) -> AIResponse:
        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(messages)

        payload = {
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

        # Parse tool calls
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
            cost_usd=0.0,  # Groq free tier
            model=model,
            raw=data,
            tool_calls=parsed_tools,
            stop_reason=stop_reason,
        )

    async def test_connection(self, model: str = "llama-3.3-70b-versatile") -> bool:
        try:
            result = await self.call(
                messages=[{"role": "user", "content": "Say OK"}],
                model=model,
                max_tokens=5,
            )
            return bool(result.content)
        except Exception:
            return False
