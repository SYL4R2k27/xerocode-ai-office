from __future__ import annotations

import httpx

from app.adapters.base import AIResponse, BaseAdapter, ToolCall


class AnthropicAdapter(BaseAdapter):
    """Адаптер для Anthropic API (Claude)."""

    def __init__(self, api_key: str, base_url: str | None = None):
        super().__init__(api_key, base_url)
        self.endpoint = base_url or "https://api.anthropic.com/v1"

    async def call(
        self,
        messages: list[dict],
        model: str = "claude-sonnet-4-20250514",
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: list[dict] | None = None,
    ) -> AIResponse:
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if system_prompt:
            payload["system"] = system_prompt

        # Convert tools from OpenAI format to Anthropic format
        if tools:
            anthropic_tools = []
            for t in tools:
                func = t.get("function", t)
                anthropic_tools.append({
                    "name": func["name"],
                    "description": func.get("description", ""),
                    "input_schema": func.get("parameters", {"type": "object", "properties": {}}),
                })
            payload["tools"] = anthropic_tools

        async with self._get_client(120.0) as client:
            response = await client.post(
                f"{self.endpoint}/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        usage = data.get("usage", {})
        tokens_in = usage.get("input_tokens", 0)
        tokens_out = usage.get("output_tokens", 0)

        # Parse content blocks — text + tool_use
        content_blocks = data.get("content", [])
        text_parts = []
        parsed_tools = []

        for block in content_blocks:
            if block.get("type") == "text":
                text_parts.append(block["text"])
            elif block.get("type") == "tool_use":
                parsed_tools.append(
                    ToolCall(
                        id=block["id"],
                        name=block["name"],
                        arguments=block.get("input", {}),
                    )
                )

        content = "\n".join(text_parts)
        stop_reason = data.get("stop_reason", "end_turn")

        return AIResponse(
            content=content,
            tokens_input=tokens_in,
            tokens_output=tokens_out,
            cost_usd=self._calculate_cost(model, tokens_in, tokens_out),
            model=model,
            raw=data,
            tool_calls=parsed_tools if parsed_tools else None,
            stop_reason=stop_reason,
        )

    async def test_connection(self, model: str = "claude-sonnet-4-20250514") -> bool:
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
        prices = {
            "claude-sonnet-4-20250514": (0.003, 0.015),
            "claude-sonnet-4-6": (0.003, 0.015),
            "claude-3-5-sonnet-20241022": (0.003, 0.015),
            "claude-haiku-4-5": (0.0008, 0.004),
            "claude-3-haiku-20240307": (0.00025, 0.00125),
            "claude-opus-4-6": (0.015, 0.075),
            "claude-3-opus-20240229": (0.015, 0.075),
        }
        in_price, out_price = prices.get(model, (0.003, 0.015))
        return (tokens_in / 1000 * in_price) + (tokens_out / 1000 * out_price)
