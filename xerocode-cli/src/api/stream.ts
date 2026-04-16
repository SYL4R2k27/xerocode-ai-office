/**
 * Server-Sent Events (SSE) streaming client for /api/stream/chat and /api/modes/run.
 *
 * Uses undici.request which exposes a Node ReadableStream — more reliable for SSE
 * than fetch().body across Node versions.
 */
import { request } from "undici";
import { apiUrl } from "./client.js";
import { authHeader } from "./auth.js";
import { ApiError } from "../util/errors.js";

export interface StreamChatParams {
  prompt: string;
  model?: string;
  provider?: string;
  system?: string;
  apiBase?: string;
}

export interface SseEvent {
  type: string;
  [key: string]: any;
}

export type StreamHandler = (event: SseEvent) => void | Promise<void>;

/**
 * Parse SSE byte stream into events, invoking onEvent for each `data: {...}` line.
 * Ignores comments, empty lines, and non-JSON data.
 */
async function parseSse(body: AsyncIterable<Buffer>, onEvent: StreamHandler): Promise<void> {
  let buffer = "";
  for await (const chunk of body) {
    buffer += chunk.toString("utf-8");
    const parts = buffer.split("\n");
    buffer = parts.pop() || "";
    for (const raw of parts) {
      const line = raw.trim();
      if (!line || !line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        const evt = JSON.parse(payload);
        await onEvent(evt);
      } catch {
        /* malformed JSON → skip */
      }
    }
  }
}

/** Single-model streaming via POST /api/stream/chat. */
export async function streamChat(params: StreamChatParams, onEvent: StreamHandler): Promise<void> {
  const url = apiUrl("/stream/chat", params.apiBase);
  const body: Record<string, unknown> = {
    prompt: params.prompt,
  };
  if (params.model) body.model = params.model;
  if (params.provider) body.provider = params.provider;
  if (params.system) body.system = params.system;

  const { statusCode, body: respBody } = await request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...authHeader(),
    },
    body: JSON.stringify(body),
  });

  if (statusCode < 200 || statusCode >= 300) {
    let errBody: any = null;
    try {
      errBody = await respBody.json();
    } catch {
      try {
        errBody = await respBody.text();
      } catch {
        /* ignore */
      }
    }
    throw new ApiError(statusCode, errBody);
  }

  await parseSse(respBody as any, onEvent);
}

export interface ModesRunParams {
  prompt: string;
  mode: string;
  system?: string;
  apiBase?: string;
}

/** Orchestration streaming via POST /api/modes/run. */
export async function runMode(params: ModesRunParams, onEvent: StreamHandler): Promise<void> {
  const url = apiUrl("/modes/run", params.apiBase);
  // Backend expects `query` (not `prompt`) for modes/run
  const body: Record<string, unknown> = {
    query: params.prompt,
    mode: params.mode,
  };
  if (params.system) body.system = params.system;

  const { statusCode, body: respBody } = await request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...authHeader(),
    },
    body: JSON.stringify(body),
  });

  if (statusCode < 200 || statusCode >= 300) {
    let errBody: any = null;
    try {
      errBody = await respBody.json();
    } catch {
      try {
        errBody = await respBody.text();
      } catch {
        /* ignore */
      }
    }
    throw new ApiError(statusCode, errBody);
  }

  await parseSse(respBody as any, onEvent);
}
