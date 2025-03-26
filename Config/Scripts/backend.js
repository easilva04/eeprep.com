/**
 * EEPrep Service Worker
 * 
 * Provides offline capabilities and performance improvements through caching.
 * Features:
 * - Precaching of essential assets
 * - Network-first strategy for HTML and API requests
 * - Cache-first strategy for static assets
 * - Fallback pages for offline access
 * - Cache management with version control
 */

// Cache name constants for version control
const CACHE_NAME = 'eeprep-static-cache-v1';
const RUNTIME_CACHE = 'eeprep-runtime-cache';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/Config/Styles/main.css',
  '/Config/Styles/responsive.css',
  '/Config/Scripts/componentLoader.js',
  '/Config/Components/navigation.html',
  '/Config/Components/header.html',
  '/Config/Components/footer.html',
  '/Config/Components/sidebar.html',
  '/Config/Scripts/themeToggle.js',
  '/Config/Scripts/search.js'
];

/**
 * Service Worker Install Event
 * Pre-caches essential assets for offline use
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Pre-caching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Service Worker Activate Event
 * Cleans up old caches when a new service worker takes over
 */
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

/**
 * Service Worker Fetch Event
 * Handles all fetch requests with appropriate caching strategies
 */
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // For HTML and API requests, use network first strategy
  if (event.request.headers.get('Accept')?.includes('text/html') || 
      event.request.url.includes('/api/')) {
    event.respondWith(networkFirstStrategy(event.request));
  } else {
    // For all other requests (CSS, JS, images), use cache first strategy
    event.respondWith(cacheFirstStrategy(event.request));
  }
});

/**
 * Cache-first strategy
 * Try to fetch from cache first, falling back to network
 * 
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} - The response
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network and cache
  try {
    const networkResponse = await fetch(request);
    
    // Cache only successful responses
    if (networkResponse.ok) {
      await updateCache(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Fetch failed:', error);
    
    // For image requests, return a fallback image
    if (request.destination === 'image') {
      return caches.match('/images/fallback.png');
    }
    
    throw error;
  }
}

/**
 * Network-first strategy
 * Try to fetch from network first, falling back to cache
 * 
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} - The response
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response if successful
    if (networkResponse.ok) {
      await updateCache(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network request failed, falling back to cache', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For HTML requests, return offline page
    if (request.headers.get('Accept')?.includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

/**
 * Helper function to update cache
 * 
 * @param {Request} request - The request to cache
 * @param {Response} response - The response to cache
 */
async function updateCache(request, response) {
  const cache = await caches.open(RUNTIME_CACHE);
  await cache.put(request, response);
}

/**
 * Listen for message events
 * Allows communicating with the service worker from the main thread
 */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
