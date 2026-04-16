/**
 * JWT management — thin wrapper around config.ts credential store.
 */
import { loadToken, saveToken, clearToken } from "../config.js";

export function getAuthToken(): string | null {
  return loadToken();
}

export function setAuthToken(token: string): void {
  saveToken(token);
}

export function removeAuthToken(): void {
  clearToken();
}

export function authHeader(): Record<string, string> {
  const t = getAuthToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
