/**
 * HTTP client — thin wrapper over undici.fetch with base URL + JWT + friendly errors.
 *
 * Streaming endpoints use request() directly from ./stream.ts — this module covers
 * regular JSON calls (auth/me, agents/models/capabilities, etc.).
 */
import { fetch } from "undici";
import { loadConfig } from "../config.js";
import { authHeader } from "./auth.js";
import { ApiError } from "../util/errors.js";

function baseUrl(override?: string): string {
  if (override) return override.replace(/\/$/, "");
  return loadConfig().api.base.replace(/\/$/, "");
}

export interface RequestOptions {
  apiBase?: string;            // overrides config, from --api flag
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** Include Authorization header even if missing (default: true when token exists). */
  auth?: boolean;
}

export async function apiJson<T = any>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const url = baseUrl(opts.apiBase) + path;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...authHeader(),
    ...(opts.headers || {}),
  };

  let resp: Response | any;
  try {
    resp = await fetch(url, {
      method: opts.method || (opts.body ? "POST" : "GET"),
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (err: any) {
    throw new ApiError(null, null, `Network error: ${err?.message || err}`);
  }

  if (!resp.ok) {
    let body: any = null;
    try {
      body = await resp.json();
    } catch {
      try {
        body = await resp.text();
      } catch {
        /* ignore */
      }
    }
    throw new ApiError(resp.status, body);
  }

  const ct = resp.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await resp.json()) as T;
  }
  return (await resp.text()) as any;
}

/** Return URL for streaming endpoints (used by ./stream.ts). */
export function apiUrl(path: string, apiBase?: string): string {
  return baseUrl(apiBase) + path;
}
