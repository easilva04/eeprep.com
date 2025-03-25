// Modern service worker with improved caching strategy
const CACHE_NAME = 'eeprep-static-cache-v1';
const RUNTIME_CACHE = 'eeprep-runtime-cache';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/Info/Config/Styles/main.css',
  '/Info/Config/Styles/responsive.css',
  '/Info/Config/Scripts/componentLoader.js',
  '/Info/Config/Components/navigation.html',
  '/Info/Config/Components/header.html',
  '/Info/Config/Components/footer.html',
  '/Info/Config/Components/sidebar.html',
  '/Info/Config/Scripts/themeToggle.js',
  '/Info/Config/Scripts/search.js'
];

// Install event
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

// Activate event - clean up old caches
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

// Fetch event with network-first strategy for API calls and cache-first for static assets
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

// Cache-first strategy
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

// Network-first strategy
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

// Helper function to update cache
async function updateCache(request, response) {
  const cache = await caches.open(RUNTIME_CACHE);
  await cache.put(request, response);
}

// Listen for message events - allows communicating with the service worker
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
