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
  '/index.html',
  '/favicon.svg',
  '/manifest.webmanifest',
]

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

  // App Shell navigation (HTML documents)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches
        .match('/index.html')
        .then((cached) => cached || caches.match('/'))
        .then((cached) => {
          if (cached) return cached
          return fetch(event.request).catch(() => caches.match('/index.html'))
        })
    )
    return
  }

  // Static assets (JS, CSS, Workers, Fonts, Icons)
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
          }
          return response
        })
      })
      .catch(() => caches.match(url.pathname, { ignoreSearch: true }))
  )
})
