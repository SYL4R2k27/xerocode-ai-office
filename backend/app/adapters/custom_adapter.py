from __future__ import annotations

import json

import httpx

from app.adapters.base import AIResponse, BaseAdapter, ToolCall


class CustomAdapter(BaseAdapter):
    """
    Адаптер для любого кастомного API.
    Поддерживает OpenAI-совместимый формат (LM Studio, vLLM, Groq, etc.).
    """

    def __init__(self, base_url: str, api_key: str | None = None):
        super().__init__(api_key, base_url)

    async def call(
        self,
        messages: list[dict],
        model: str = "default",
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: list[dict] | None = None,
    ) -> AIResponse:
        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(messages)

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload = {
            "model": model,
            "messages": all_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        async with self._get_client(300.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
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
                        id=tc.get("id", f"custom_{id(tc)}"),
                        name=tc["function"]["name"],
                        arguments=args,
                    )
                )
            stop_reason = "tool_use"

        return AIResponse(
            content=content,
            tokens_input=tokens_in,
            tokens_output=tokens_out,
            cost_usd=0.0,
            model=model,
            raw=data,
            tool_calls=parsed_tools,
            stop_reason=stop_reason,
        )

    async def test_connection(self, model: str = "default") -> bool:
        try:
            result = await self.call(
                messages=[{"role": "user", "content": "Say OK"}],
                model=model,
                max_tokens=5,
            )
            return bool(result.content)
        except Exception:
            return False
