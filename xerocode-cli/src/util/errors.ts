import { theme } from "../ui/theme.js";

/** Translate HTTP status / network errors into actionable messages. */
export function friendlyError(status: number | null, body?: any): string {
  const detail =
    (typeof body === "object" && body?.detail) ||
    (typeof body === "string" ? body : "") ||
    "";

  if (status === 401 || status === 403) {
    return [
      theme.error("✖ Not authenticated."),
      `  Run ${theme.brand("xerocode login")} to sign in.`,
    ].join("\n");
  }
  if (status === 402 || (detail && /plan|upgrade|byok/i.test(detail))) {
    return [
      theme.warn("⚠ Plan limit reached or BYOK required."),
      `  ${detail || "Upgrade or add your own API key at https://xerocode.ru/profile"}`,
    ].join("\n");
  }
  if (status === 429) {
    return theme.warn("⚠ Rate limited — slow down or upgrade your plan.");
  }
  if (status === 503) {
    return theme.error("✖ AI provider temporarily unavailable.");
  }
  if (status === null) {
    return theme.error("✖ Network error — check your connection.");
  }
  return theme.error(`✖ HTTP ${status}: ${detail || "unexpected error"}`);
}

export class ApiError extends Error {
  constructor(
    public status: number | null,
    public body: any,
    message?: string
  ) {
    super(message || `API error ${status}`);
    this.name = "ApiError";
  }
}
