"""
WebSocket — реалтайм обновления для фронтенда.

Events:
- new_message — новое сообщение в чате моделей
- agent_status — смена статуса агента (idle → thinking → working)
- task_update — прогресс задачи
- system_warning — предупреждение (лимит, ошибка)
- cost_update — обновление стоимости
- discussion_round — номер раунда обсуждения
- consensus_reached — модели договорились
- agent_error — ошибка агента
- cost_limit — лимит стоимости достигнут
- user_message — сообщение от пользователя через WS
"""
from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

from app.services.auth import decode_token

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Управление WebSocket подключениями."""

    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, goal_id: str):
        await websocket.accept()
        if goal_id not in self.active_connections:
            self.active_connections[goal_id] = []
        self.active_connections[goal_id].append(websocket)
        logger.info(f"WS connected: goal={goal_id}, total={len(self.active_connections[goal_id])}")

    def disconnect(self, websocket: WebSocket, goal_id: str):
        if goal_id in self.active_connections:
            if websocket in self.active_connections[goal_id]:
                self.active_connections[goal_id].remove(websocket)
            if not self.active_connections[goal_id]:
                del self.active_connections[goal_id]
        logger.info(f"WS disconnected: goal={goal_id}")

    async def broadcast(self, goal_id: str, event: str, data: Any):
        """Отправить событие всем подключенным к этой цели."""
        message = json.dumps({"event": event, "data": data}, default=str)
        if goal_id in self.active_connections:
            dead = []
            for connection in self.active_connections[goal_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    dead.append(connection)

            # Clean dead connections
            for conn in dead:
                if conn in self.active_connections.get(goal_id, []):
                    self.active_connections[goal_id].remove(conn)

    @property
    def stats(self) -> dict:
        return {
            goal_id: len(conns)
            for goal_id, conns in self.active_connections.items()
        }


# Global instance
ws_manager = ConnectionManager()

# Agent connections (local desktop agents)
agent_connections: dict[str, WebSocket] = {}  # goal_id → agent WS


async def send_tool_to_agent(goal_id: str, tool: str, arguments: dict, request_id: str) -> dict | None:
    """Отправить tool call локальному агенту и дождаться результата."""
    if goal_id not in agent_connections:
        return None

    agent_ws = agent_connections[goal_id]
    try:
        await agent_ws.send_text(json.dumps({
            "action": "execute_tool",
            "tool": tool,
            "arguments": arguments,
            "request_id": request_id,
        }))
        return {"sent": True}
    except Exception:
        return None


def is_agent_connected(goal_id: str) -> bool:
    """Проверить подключён ли локальный агент."""
    return goal_id in agent_connections


def setup_websocket(app):
    """Подключить WebSocket к FastAPI приложению."""

    @app.websocket("/ws/{goal_id}")
    async def websocket_endpoint(websocket: WebSocket, goal_id: str, token: str | None = None):
        # Validate JWT token from query params
        if not token:
            await websocket.close(code=4001, reason="Missing authentication token")
            return
        payload = decode_token(token)
        if not payload.get("sub"):
            await websocket.close(code=4001, reason="Invalid or expired token")
            return

        await ws_manager.connect(websocket, goal_id)
        try:
            # Send initial connection confirmation
            await websocket.send_text(json.dumps({
                "event": "connected",
                "data": {"goal_id": goal_id},
            }))

            while True:
                raw = await websocket.receive_text()
                try:
                    data = json.loads(raw)
                    event = data.get("event", "")

                    if event == "user_message":
                        # User sends message via WebSocket → process
                        # Broadcast to other listeners
                        await ws_manager.broadcast(goal_id, "new_message", {
                            "sender_type": "user",
                            "sender_name": "User",
                            "content": data.get("content", ""),
                        })

                    elif event == "ping":
                        await websocket.send_text(json.dumps({
                            "event": "pong",
                            "data": {},
                        }))

                except json.JSONDecodeError:
                    pass

        except WebSocketDisconnect:
            ws_manager.disconnect(websocket, goal_id)

    @app.websocket("/ws/agent/{goal_id}")
    async def agent_websocket_endpoint(websocket: WebSocket, goal_id: str, token: str | None = None):
        """WebSocket для локального агента (десктоп-клиент)."""
        if not token:
            await websocket.close(code=4001, reason="Missing token")
            return
        payload = decode_token(token)
        if not payload.get("sub"):
            await websocket.close(code=4001, reason="Invalid token")
            return

        await websocket.accept()
        agent_connections[goal_id] = websocket
        logger.info(f"Agent connected: goal={goal_id}")

        # Notify frontend
        await ws_manager.broadcast(goal_id, "agent_connected", {"goal_id": goal_id})

        try:
            while True:
                raw = await websocket.receive_text()
                try:
                    data = json.loads(raw)
                    action = data.get("action", "")

                    if action == "tool_result":
                        # Forward tool result to broadcast (frontend sees it)
                        await ws_manager.broadcast(goal_id, "tool_result", {
                            "request_id": data.get("request_id"),
                            "success": data.get("success"),
                            "output": data.get("output", ""),
                            "error": data.get("error"),
                        })

                    elif action == "agent_connect":
                        logger.info(f"Agent announced: goal={goal_id}, capabilities={data.get('capabilities')}")

                    elif action == "pong":
                        pass

                except json.JSONDecodeError:
                    pass

        except WebSocketDisconnect:
            if goal_id in agent_connections:
                del agent_connections[goal_id]
            logger.info(f"Agent disconnected: goal={goal_id}")
            await ws_manager.broadcast(goal_id, "agent_disconnected", {"goal_id": goal_id})

    @app.get("/api/ws/stats")
    async def ws_stats():
        """Статистика WebSocket подключений."""
        return {
            "frontend": ws_manager.stats,
            "agents": list(agent_connections.keys()),
        }
