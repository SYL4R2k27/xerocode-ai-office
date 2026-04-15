/**
 * XeroCode SW v1 — minimal cache-first for static assets, network-only for /api.
 * No background sync / push — keep PWA-light and avoid stale UI bugs.
 */
const VERSION = "xc-v1";
const STATIC_CACHE = `${VERSION}-static`;

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/logo.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache API or auth — always network
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/ws/")) {
    return;
  }

  // Only handle same-origin GETs
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // HTML — network-first (so updates show up)
  if (event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(event.request, clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Static assets — cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(event.request, clone)).catch(() => {});
        }
        return res;
      });
    })
  );
});

// Push (placeholder for later)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || "XeroCode";
    const options = {
      body: data.body || "",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      data: data.url || "/",
      tag: data.tag || "xc-notif",
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {}
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data || "/";
  event.waitUntil(self.clients.openWindow(url));
});
