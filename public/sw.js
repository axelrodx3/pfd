const CACHE_VERSION = 'v3'
const CACHE_NAME = `hilo-casino-${CACHE_VERSION}`
const STATIC_CACHE = `hilo-casino-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `hilo-casino-dynamic-${CACHE_VERSION}`
const IMAGE_CACHE = `hilo-casino-images-${CACHE_VERSION}`

// Static assets that should be cached immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.svg'
]

// Assets that should be cached with network-first strategy
const NETWORK_FIRST_ASSETS = [
  '/game',
  '/leaderboard',
  '/provably-fair',
  '/about',
  '/wallet'
]

// Cache limits
const MAX_CACHE_SIZE = 50 // Maximum number of items in dynamic cache
const MAX_IMAGE_CACHE_SIZE = 20 // Maximum number of images to cache

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  // Force activation of new service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  // Take control of all pages immediately
  self.clients.claim()
})

// Fetch event - implement advanced caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and non-HTTP requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return
  }

  // Handle different types of requests with optimized strategies
  if (url.pathname.startsWith('/assets/')) {
    if (url.pathname.match(/\.(js|css|wasm)$/)) {
      // Critical assets - cache first with aggressive caching
      event.respondWith(cacheFirst(request, STATIC_CACHE))
    } else if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) {
      // Images - cache first with size limits
      event.respondWith(cacheFirstWithLimit(request, IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE))
    } else {
      // Other assets - cache first
      event.respondWith(cacheFirst(request, STATIC_CACHE))
    }
  } else if (url.pathname === '/' || NETWORK_FIRST_ASSETS.includes(url.pathname)) {
    // App routes - network first with stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
  } else if (url.hostname === 'api.devnet.solana.com') {
    // API calls - network first with short cache
    event.respondWith(networkFirst(request, DYNAMIC_CACHE, 300000)) // 5 minutes
  } else {
    // Other requests - network first with cache limits
    event.respondWith(networkFirstWithLimit(request, DYNAMIC_CACHE, MAX_CACHE_SIZE))
  }
})

// Cache first strategy - good for static assets
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  const networkResponse = await fetch(request)
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, networkResponse.clone())
  }
  return networkResponse
}

// Network first strategy - good for dynamic content
async function networkFirst(request, cacheName, maxAge = 86400000) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      const responseToCache = networkResponse.clone()
      // Add timestamp for cache expiration
      responseToCache.headers.set('sw-cache-timestamp', Date.now().toString())
      responseToCache.headers.set('sw-cache-max-age', maxAge.toString())
      cache.put(request, responseToCache)
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      const timestamp = cachedResponse.headers.get('sw-cache-timestamp')
      const maxAge = parseInt(cachedResponse.headers.get('sw-cache-max-age') || '86400000')
      if (timestamp && Date.now() - parseInt(timestamp) < maxAge) {
        return cachedResponse
      }
    }
    return cachedResponse || new Response('Offline', { status: 503 })
  }
}

// Stale while revalidate strategy - good for app routes
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request)
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName)
      cache.then(c => c.put(request, networkResponse.clone()))
    }
    return networkResponse
  }).catch(() => cachedResponse)

  return cachedResponse || fetchPromise
}

// Cache first with size limit
async function cacheFirstWithLimit(request, cacheName, maxItems) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  const networkResponse = await fetch(request)
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    
    // Remove oldest items if cache is full
    if (keys.length >= maxItems) {
      const itemsToDelete = keys.slice(0, keys.length - maxItems + 1)
      await Promise.all(itemsToDelete.map(key => cache.delete(key)))
    }
    
    cache.put(request, networkResponse.clone())
  }
  return networkResponse
}

// Network first with size limit
async function networkFirstWithLimit(request, cacheName, maxItems) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      
      // Remove oldest items if cache is full
      if (keys.length >= maxItems) {
        const itemsToDelete = keys.slice(0, keys.length - maxItems + 1)
        await Promise.all(itemsToDelete.map(key => cache.delete(key)))
      }
      
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Offline', { status: 503 })
  }
}
