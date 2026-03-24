from __future__ import annotations

import json

import httpx

from app.adapters.base import AIResponse, BaseAdapter, ToolCall


class OllamaAdapter(BaseAdapter):
    """
    Адаптер для Ollama (локальные модели: Llama, Mistral, etc.).
    Бесплатно, приватно, работает на компьютере пользователя.
    """

    def __init__(self, base_url: str = "http://localhost:11434", **kwargs):
        super().__init__(api_key=None, base_url=base_url)

    async def call(
        self,
        messages: list[dict],
        model: str = "llama3",
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
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        # Ollama supports tools for compatible models (llama3.1+)
        if tools:
            payload["tools"] = tools

        async with self._get_client(300.0) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        message = data.get("message", {})
        content = message.get("content", "")
        tokens_in = data.get("prompt_eval_count", 0)
        tokens_out = data.get("eval_count", 0)

        # Parse tool calls if present
        parsed_tools = None
        stop_reason = "end_turn"

        if message.get("tool_calls"):
            parsed_tools = []
            for tc in message["tool_calls"]:
                func = tc.get("function", {})
                parsed_tools.append(
                    ToolCall(
                        id=f"ollama_{id(tc)}",
                        name=func.get("name", ""),
                        arguments=func.get("arguments", {}),
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

    async def test_connection(self, model: str = "llama3") -> bool:
        try:
            async with self._get_client(10.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception:
            return False
