from __future__ import annotations

import json

import httpx

from app.adapters.base import AIResponse, BaseAdapter, ToolCall


class OpenAIAdapter(BaseAdapter):
    """Адаптер для OpenAI API (GPT-4, GPT-3.5, etc.)."""

    def __init__(self, api_key: str, base_url: str | None = None):
        super().__init__(api_key, base_url)
        self.endpoint = base_url or "https://api.openai.com/v1"

    async def call(
        self,
        messages: list[dict],
        model: str = "gpt-4",
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: list[dict] | None = None,
    ) -> AIResponse:
        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(messages)

        # GPT-5+ модели используют max_completion_tokens вместо max_tokens
        is_new_model = any(model.startswith(p) for p in ("gpt-5", "o3", "o4", "o1"))
        token_param = "max_completion_tokens" if is_new_model else "max_tokens"

        payload = {
            "model": model,
            "messages": all_messages,
            "temperature": temperature,
            token_param: max_tokens,
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
            cost_usd=self._calculate_cost(model, tokens_in, tokens_out),
            model=model,
            raw=data,
            tool_calls=parsed_tools,
            stop_reason=stop_reason,
        )

    async def test_connection(self, model: str = "gpt-3.5-turbo") -> bool:
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
            "gpt-4": (0.03, 0.06),
            "gpt-4-turbo": (0.01, 0.03),
            "gpt-4o": (0.005, 0.015),
            "gpt-4o-mini": (0.00015, 0.0006),
            "gpt-4.1": (0.002, 0.008),
            "gpt-3.5-turbo": (0.0005, 0.0015),
            "o3-mini": (0.0011, 0.0044),
        }
        in_price, out_price = prices.get(model, (0.01, 0.03))
        return (tokens_in / 1000 * in_price) + (tokens_out / 1000 * out_price)
