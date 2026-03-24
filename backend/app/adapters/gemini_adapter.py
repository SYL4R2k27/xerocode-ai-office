"""
Адаптер для Google Gemini API.
Бесплатный тир: 15 запр/мин (Flash), 5 запр/мин (Pro).
Поддерживает текст + генерацию изображений (Nano Banana).
"""
from __future__ import annotations

import json

import httpx

from app.adapters.base import AIResponse, BaseAdapter, ToolCall


class GeminiAdapter(BaseAdapter):
    """Адаптер для Google Gemini API (Flash, Pro, Nano Banana)."""

    def __init__(self, api_key: str, base_url: str | None = None):
        super().__init__(api_key, base_url)
        self.endpoint = base_url or "https://generativelanguage.googleapis.com/v1beta"

    async def call(
        self,
        messages: list[dict],
        model: str = "gemini-2.0-flash",
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: list[dict] | None = None,
    ) -> AIResponse:
        # Convert messages from OpenAI format to Gemini format
        contents = []
        for msg in messages:
            role = "model" if msg["role"] == "assistant" else "user"
            content = msg.get("content", "")

            # Handle tool result messages
            if msg["role"] == "tool":
                contents.append({
                    "role": "user",
                    "parts": [{"functionResponse": {
                        "name": msg.get("name", "tool"),
                        "response": {"result": content},
                    }}],
                })
                continue

            # Handle assistant messages with tool calls
            if msg["role"] == "assistant" and msg.get("tool_calls"):
                parts = []
                if content:
                    parts.append({"text": content})
                for tc in msg["tool_calls"]:
                    func = tc.get("function", {})
                    try:
                        args = json.loads(func.get("arguments", "{}"))
                    except json.JSONDecodeError:
                        args = {}
                    parts.append({"functionCall": {
                        "name": func.get("name", ""),
                        "args": args,
                    }})
                contents.append({"role": "model", "parts": parts})
                continue

            if isinstance(content, str):
                contents.append({
                    "role": role,
                    "parts": [{"text": content}],
                })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        if system_prompt:
            payload["systemInstruction"] = {
                "parts": [{"text": system_prompt}],
            }

        # Convert tools from OpenAI format to Gemini format
        if tools:
            gemini_tools = []
            for t in tools:
                func = t.get("function", t)
                gemini_tools.append({
                    "name": func["name"],
                    "description": func.get("description", ""),
                    "parameters": func.get("parameters", {}),
                })
            payload["tools"] = [{"functionDeclarations": gemini_tools}]

        url = f"{self.endpoint}/models/{model}:generateContent?key={self.api_key}"

        async with self._get_client(120.0) as client:
            response = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        # Parse response
        usage = data.get("usageMetadata", {})
        tokens_in = usage.get("promptTokenCount", 0)
        tokens_out = usage.get("candidatesTokenCount", 0)

        candidates = data.get("candidates", [])
        if not candidates:
            return AIResponse(
                content="(empty response)",
                tokens_input=tokens_in,
                tokens_output=tokens_out,
                cost_usd=self._calculate_cost(model, tokens_in, tokens_out),
                model=model,
                raw=data,
            )

        parts = candidates[0].get("content", {}).get("parts", [])
        text_parts = []
        parsed_tools = []

        for part in parts:
            if "text" in part:
                text_parts.append(part["text"])
            elif "functionCall" in part:
                fc = part["functionCall"]
                parsed_tools.append(
                    ToolCall(
                        id=f"gemini_{id(part)}",
                        name=fc.get("name", ""),
                        arguments=fc.get("args", {}),
                    )
                )

        content = "\n".join(text_parts)
        finish_reason = candidates[0].get("finishReason", "STOP")
        stop_reason = "tool_use" if parsed_tools else "end_turn"

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

    async def generate_image(
        self,
        prompt: str,
        model: str = "gemini-2.0-flash-exp",
    ) -> dict:
        """Генерация изображения (Nano Banana) через Gemini."""
        payload = {
            "contents": [{
                "parts": [{"text": prompt}],
            }],
            "generationConfig": {
                "responseModalities": ["TEXT", "IMAGE"],
            },
        }

        url = f"{self.endpoint}/models/{model}:generateContent?key={self.api_key}"

        async with self._get_client(120.0) as client:
            response = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        candidates = data.get("candidates", [])
        result = {"text": "", "images": []}

        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            for part in parts:
                if "text" in part:
                    result["text"] += part["text"]
                elif "inlineData" in part:
                    result["images"].append({
                        "mime_type": part["inlineData"].get("mimeType", "image/png"),
                        "data": part["inlineData"].get("data", ""),
                    })

        return result

    async def test_connection(self, model: str = "gemini-2.0-flash") -> bool:
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
            "gemini-2.0-flash": (0.0001, 0.0004),
            "gemini-2.0-flash-lite": (0.00002, 0.0001),
            "gemini-2.5-flash": (0.00015, 0.001),
            "gemini-2.5-pro": (0.00125, 0.01),
        }
        in_price, out_price = prices.get(model, (0.0001, 0.0004))
        return (tokens_in / 1000 * in_price) + (tokens_out / 1000 * out_price)
