const CACHE_NAME = 'portfolio-v26';

const ASSETS = [
  './',
  './index.html',
  './privacy.html',
  './site.webmanifest',
  './assets/android-chrome-192x192.png',
  './assets/android-chrome-512x512.png',
  './css/main.css',
  './css/fonts.css',
  './js/config.js',
  './js/github-fetch.js',
  './js/jquery-3.2.1.min.js'
];


// ============================================================
// INSTALL
// ============================================================

self.addEventListener('install', event => {

  self.skipWaiting();

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => {

        return cache.addAll(ASSETS);

      })
      .catch(error => {

        console.warn(
          'Service Worker: Some assets failed to cache during install.',
          error
        );

      })

  );
});


// ============================================================
// ACTIVATE
// ============================================================

self.addEventListener('activate', event => {

  event.waitUntil(

    Promise.all([

      caches.keys()
        .then(keys => {

          return Promise.all(

            keys
              .filter(
                key => key !== CACHE_NAME
              )
              .map(
                key => caches.delete(key)
              )

          );

        }),

      self.clients.claim()

    ])

  );
});


// ============================================================
// FETCH
// ============================================================

self.addEventListener('fetch', event => {

  const request = event.request;


  // --------------------------------------------------------
  // Only GET requests can be cached
  // --------------------------------------------------------

  if (request.method !== 'GET') {
    return;
  }


  const url =
    new URL(request.url);


  // --------------------------------------------------------
  // Never intercept external requests
  // --------------------------------------------------------

  if (
    url.origin !== self.location.origin
  ) {
    return;
  }


  // --------------------------------------------------------
  // Never intercept Cloudflare internal endpoints
  // --------------------------------------------------------

  if (
    url.pathname.startsWith('/cdn-cgi/')
  ) {
    return;
  }


  // --------------------------------------------------------
  // Never intercept the WARP diagnostic
  //
  // This is important because the diagnostic needs to
  // measure the real network request.
  // --------------------------------------------------------

  if (
    url.pathname === '/tools/warp-test' ||
    url.pathname === '/tools/warp-test.html'
  ) {
    return;
  }


  // --------------------------------------------------------
  // Never cache speed-test data
  // --------------------------------------------------------

  if (
    url.pathname === '/tools/speedtest.bin'
  ) {
    return;
  }


  // --------------------------------------------------------
  // GitHub API should always go directly to the network
  // --------------------------------------------------------

  if (
    url.hostname === 'api.github.com'
  ) {
    return;
  }


  // --------------------------------------------------------
  // Determine whether this is an HTML request
  // --------------------------------------------------------

  const accept =
    request.headers.get('accept') || '';

  const isHtml =
    request.mode === 'navigate' ||
    accept.includes('text/html');


  // ========================================================
  // HTML
  // Network-first
  // ========================================================

  if (isHtml) {

    event.respondWith(

      fetch(request)

        .then(response => {

          /*
           * Only cache a valid successful response.
           */

          if (
            response &&
            response.ok &&
            response.type === 'basic'
          ) {

            const copy =
              response.clone();


            caches.open(CACHE_NAME)
              .then(cache => {

                return cache.put(
                  request,
                  copy
                );

              })
              .catch(error => {

                /*
                 * Cache failure must never
                 * break the actual request.
                 */

                console.warn(
                  'Service Worker: HTML cache failed:',
                  error
                );

              });

          }

          return response;

        })

        .catch(() => {

          return caches.match(request);

        })

    );

    return;
  }


  // ========================================================
  // STATIC ASSETS
  // Cache-first
  // ========================================================

  event.respondWith(

    caches.match(request)

      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }


        return fetch(request)

          .then(fetchResponse => {

            /*
             * Don't cache invalid responses.
             */

            if (
              !fetchResponse ||
              !fetchResponse.ok ||
              fetchResponse.type !== 'basic'
            ) {

              return fetchResponse;
            }


            const responseToCache =
              fetchResponse.clone();


            caches.open(CACHE_NAME)
              .then(cache => {

                return cache.put(
                  request,
                  responseToCache
                );

              })
              .catch(error => {

                /*
                 * Ignore cache failures.
                 * The network response is still
                 * returned normally.
                 */

                console.warn(
                  'Service Worker: Asset cache failed:',
                  error
                );

              });


            return fetchResponse;

          });

      })

      .catch(() => {

        return new Response(
          'Network error occurred',
          {
            status: 408,
            headers: {
              'Content-Type':
                'text/plain'
            }
          }
        );

      })

  );

});