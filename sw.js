const CACHE_NAME = 'portfolio-v10';
const ASSETS = [
  './',
  './index.html',
  './privacy.html',
  './css/main.css',
  './css/fonts.css',
  './js/github-fetch.js',
  './js/jquery-3.2.1.min.js'
];

// Install Service Worker - Cache essential assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('Service Worker: Some assets failed to cache during install', err);
      });
    })
  );
});

// Activate Service Worker - Cleanup old caches and take control immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => {
        return Promise.all(
          keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Skip caching for GitHub API calls - Always fetch fresh
  if (url.hostname === 'api.github.com') {
    return;
  }

  const isHtml = event.request.mode === 'navigate' ||
                 (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'));

  if (isHtml) {
    // Network-First strategy for HTML
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-First strategy for static assets
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        });
      }).catch(() => {
        // Fallback for failed fetches
        return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
      })
    );
  }
});
