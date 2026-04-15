/**
 * Push notification helpers.
 * - requestPermission(): asks user, returns "granted" | "denied" | "default"
 * - subscribe(): registers SW + creates push subscription + sends to backend
 * - unsubscribe(): removes subscription locally + on backend
 * - isSubscribed(): check current state
 */
import { api } from "./api";

const API_URL = (import.meta as any).env?.VITE_API_URL || "/api";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  return await Notification.requestPermission();
}

export async function isSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return sub !== null;
}

export async function subscribe(): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: "Push not supported" };

  const perm = await requestPermission();
  if (perm !== "granted") return { ok: false, reason: `Permission ${perm}` };

  // Get VAPID public key from backend
  const token = localStorage.getItem("ai_office_token") || "";
  const keyRes = await fetch(`${API_URL}/push/vapid-public-key`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!keyRes.ok) return { ok: false, reason: "Backend VAPID not configured" };
  const { key } = await keyRes.json();

  // Get/create SW registration
  const reg = await navigator.serviceWorker.ready;

  // Subscribe via PushManager
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
  }

  // Send to backend
  const subJson = sub.toJSON();
  await fetch(`${API_URL}/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: subJson.keys,
      user_agent: navigator.userAgent,
    }),
  });
  return { ok: true };
}

export async function unsubscribe(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const token = localStorage.getItem("ai_office_token") || "";
  await fetch(`${API_URL}/push/unsubscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

export async function sendTestNotification(): Promise<{ delivered: number }> {
  return api.notifications?.test?.() ?? { delivered: 0 };
}
