/**
 * WebSocket hook — реалтайм обновления от бэкенда.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "../lib/api";

const WS_BASE = import.meta.env.DEV
  ? "ws://localhost:8000/ws"
  : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;

export interface WSEvent {
  event: string;
  data: any;
}

export function useWebSocket(goalId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WSEvent | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectTimerRef = useRef<NodeJS.Timeout>();
  const lastMessageTimeRef = useRef<string | null>(null);

  // Catch-up missed messages after reconnect
  const catchUpMessages = useCallback(async () => {
    if (!goalId || !lastMessageTimeRef.current) return;
    try {
      const token = getToken();
      const API_BASE = import.meta.env.DEV ? "http://localhost:8000/api" : `${window.location.origin}/api`;
      const resp = await fetch(
        `${API_BASE}/messages/after?goal_id=${goalId}&after=${encodeURIComponent(lastMessageTimeRef.current)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resp.ok) {
        const messages = await resp.json();
        if (messages.length > 0) {
          console.log(`[WS] Catch-up: ${messages.length} missed messages`);
          const handlers = listenersRef.current.get("new_message");
          if (handlers) {
            messages.forEach((msg: any) => {
              handlers.forEach(fn => fn({
                sender_type: msg.sender_type,
                sender_name: msg.sender_name,
                content: msg.content,
                id: msg.id,
                created_at: msg.created_at,
              }));
            });
          }
          // Update last message time
          const lastMsg = messages[messages.length - 1];
          if (lastMsg?.created_at) lastMessageTimeRef.current = lastMsg.created_at;
        }
      }
    } catch (e) {
      console.error("[WS] Catch-up failed:", e);
    }
  }, [goalId]);

  const connect = useCallback(() => {
    if (!goalId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const token = getToken();
    const wsUrl = token
      ? `${WS_BASE}/${goalId}?token=${encodeURIComponent(token)}`
      : `${WS_BASE}/${goalId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      console.log(`[WS] Connected to goal ${goalId}`);
      // Catch up any missed messages during disconnect
      catchUpMessages();
    };

    ws.onmessage = (event) => {
      try {
        const parsed: WSEvent = JSON.parse(event.data);
        setLastEvent(parsed);

        // Track last message time for reconnect catch-up
        if (parsed.event === "new_message" && parsed.data?.created_at) {
          lastMessageTimeRef.current = parsed.data.created_at;
        } else if (!lastMessageTimeRef.current) {
          lastMessageTimeRef.current = new Date().toISOString();
        }

        // Notify listeners
        const handlers = listenersRef.current.get(parsed.event);
        if (handlers) {
          handlers.forEach((fn) => fn(parsed.data));
        }

        // Global listeners (*)
        const globalHandlers = listenersRef.current.get("*");
        if (globalHandlers) {
          globalHandlers.forEach((fn) => fn(parsed));
        }
      } catch (e) {
        console.error("[WS] Parse error:", e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log("[WS] Disconnected, reconnecting in 3s...");
      reconnectTimerRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error("[WS] Error:", error);
    };

    wsRef.current = ws;
  }, [goalId]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // Subscribe to specific event
  const on = useCallback((event: string, handler: (data: any) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      listenersRef.current.get(event)?.delete(handler);
    };
  }, []);

  // Send message via WS
  const send = useCallback((event: string, data: any = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, ...data }));
    }
  }, []);

  return { connected, lastEvent, on, send };
}
