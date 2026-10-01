const CACHE_NAME = "security-audit-v3";

// Install service worker
self.addEventListener("install", (event) => {
  console.log("Security Audit service worker installed");

  // Activate immediately
  self.skipWaiting();
});

// Activate service worker
self.addEventListener("activate", (event) => {
  console.log("Security Audit service worker activated");

  event.waitUntil(self.clients.claim());
});

// Network passthrough
// No caching yet.
// This prevents old cache failures while testing.

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
