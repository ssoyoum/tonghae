// Offline cache for the Tonghae app shell.
// Bump VERSION whenever index.html or the icons change so installed apps pick up the update.
const VERSION = "tonghae-v7";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-64.png",
];
const FONT_CACHE = "tonghae-fonts";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== FONT_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Translation API: always live, never cached.
  if (url.hostname.endsWith("mymemory.translated.net")) return;

  // Google Fonts: serve from cache, refresh in the background.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONT_CACHE).then(async cache => {
      const hit = await cache.match(req);
      const net = fetch(req).then(res => { if (res.ok || res.type === "opaque") { const copy = res.clone(); cache.put(req, copy); } return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Pages: network first so updates show up, cache when offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Other same-origin files: cache first.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
