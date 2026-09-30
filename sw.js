/* Service worker: guarda o app inteiro no aparelho para funcionar sem internet */
const VERSION = "russo-pwa-1.0.0";
const FILES = ["./", "index.html", "app.css", "app.js", "data.js", "manifest.webmanifest",
  "fonts/golos.woff2", "fonts/unbounded.woff2", "fonts/mono.woff2",
  "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/favicon-32.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => req.mode === "navigate" ? caches.match("index.html") : undefined))
  );
});
