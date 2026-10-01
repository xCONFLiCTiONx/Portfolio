const CACHE_NAME = "security-audit-v4";

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

// Network passthrough with robust error catching for blocked requests (e.g. ad blockers)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch((error) => {
      console.warn("Service Worker fetch intercepted blocked/offline request:", event.request.url, error);
      return new Response(
        "Network request blocked by client extension or unavailable offline.",
        {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain" }
        }
      );
    })
  );
});
