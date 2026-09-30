const CACHE_NAME = "xsecurity-audit-v1";

const FILES = [
  "./",

  "./index.html",

  "./css/style.css",

  "./js/app.js",

  "./js/scanner.js",

  "./js/scoring.js",

  "./js/report.js",

  "./js/modules/device.js",

  "./js/modules/browser.js",

  "./js/modules/permissions.js",

  "./js/modules/storage.js",

  "./js/modules/fingerprint.js",

  "./js/modules/network.js",

  "./js/modules/webrtc.js",

  "./js/modules/dns.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES)));

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)

      .then((cached) => {
        return cached || fetch(event.request);
      })
  );
});
