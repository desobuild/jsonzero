/**
 * JSONZero — Service Worker
 *
 * Privacy-first, local-first offline caching.
 * Caches application shell, code-split chunks, web worker, fonts, and icons.
 * NEVER intercepts, transmits, or caches user JSON.
 */

// In production, Vite's build plugin substitutes the versioned cache name and full asset list
const CACHE_NAME = 'jsonzero-dev'
const PRECACHE_ASSETS = [
  '/',
  '/favicon.svg',
  '/manifest.webmanifest',
]

/**
 * Safely clone a response ensuring 'redirected' is false.
 * In WHATWG Fetch & Service Worker specifications, navigation requests
 * have redirect mode 'manual'. If respondWith() receives a response
 * with redirected === true, the browser aborts navigation with net::ERR_FAILED.
 */
function toCleanResponse(response) {
  if (!response || !response.redirected) {
    return response
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        try {
          await cache.addAll(PRECACHE_ASSETS)
        } catch (err) {
          console.warn(
            '[SW] cache.addAll batch failed, falling back to individual caching:',
            err
          )
          await Promise.allSettled(PRECACHE_ASSETS.map((url) => cache.add(url)))
        }
        // Mirror '/' into '/index.html' in cache without issuing a separate network request
        // that could follow a 307 redirect on Cloudflare SPA deployment
        try {
          const rootResponse = await cache.match('/')
          if (rootResponse) {
            await cache.put('/index.html', toCleanResponse(rootResponse.clone()))
          }
        } catch {
          // Non-critical fallback
        }
      })
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('jsonzero-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Strictly ignore non-GET or cross-origin requests
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return
  }

  // App Shell navigation (HTML documents): Network-First with offline cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If valid 200 response, update the cached app shell at '/'
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const clone = networkResponse.clone()
            caches
              .open(CACHE_NAME)
              .then((cache) => {
                cache.put('/', clone)
              })
              .catch(() => {})
          }
          return networkResponse
        })
        .catch(async () => {
          // Network failed (offline) — serve cached app shell
          const cached =
            (await caches.match('/')) ||
            (await caches.match('/index.html')) ||
            (await caches.match(url.pathname, { ignoreSearch: true }))
          if (cached) {
            return toCleanResponse(cached)
          }
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          })
        })
    )
    return
  }

  // Static assets (JS, CSS, Workers, Fonts, Icons): Cache-First with network fallback
  event.respondWith(
    caches
      .match(event.request, { ignoreSearch: true })
      .then((cached) => {
        if (cached) return cached
        return caches.match(url.pathname, { ignoreSearch: true })
      })
      .then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          if (
            response &&
            response.status === 200 &&
            response.type === 'basic'
          ) {
            const clone = response.clone()
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone))
              .catch(() => {})
          }
          return response
        })
      })
      .catch(async () => {
        const fallback = await caches.match(url.pathname, { ignoreSearch: true })
        if (fallback) return fallback
        return new Response(null, {
          status: 404,
          statusText: 'Not Found',
        })
      })
  )
})
