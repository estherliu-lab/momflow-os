const CACHE_NAME = "momflow-cache-v6";
const scopePath = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const withScope = (path) => `${scopePath}${path}`;
const APP_SHELL = [
  withScope("/"),
  withScope("/index.html"),
  withScope("/offline.html"),
  withScope("/manifest.json"),
  withScope("/icons/otto-reference.png"),
  withScope("/icons/otto-icon.svg")
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") return caches.match(withScope("/offline.html"));
          return undefined;
        });
    })
  );
});
