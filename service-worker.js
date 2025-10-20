// ⚽ Apuestas PRO - Soporte offline
const CACHE_NAME = "apuestas-pro-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./script.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Instalación: guarda archivos en caché
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activación: elimina cachés viejos
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(k => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
    })
  );
});

// Modo offline
self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request).catch(() => caches.match("./index.html"));
    })
  );
});
