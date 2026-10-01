const CACHE_NAME = "security-audit-v5";

// Install service worker
self.addEventListener("install", (event) => {
  console.log("Security Audit service worker installed");
  self.skipWaiting();
});

// Activate service worker
self.addEventListener("activate", (event) => {
  console.log("Security Audit service worker activated");
  event.waitUntil(self.clients.claim());
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Never intercept external requests (e.g. Cloudflare beacons, analytics, cross-origin APIs)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network passthrough with robust error catching
  event.respondWith(
    fetch(request).catch((error) => {
      console.warn("Service Worker fetch intercepted blocked/offline request:", request.url, error);
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
