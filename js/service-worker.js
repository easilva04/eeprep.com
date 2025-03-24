const CACHE_NAME = 'site-cache-v2'; // Increment version number
const FILES_TO_CACHE = [
    '/',                       // Root
    '/index.html',             // Main page
    '/offline.html',           // Added offline fallback page
    '/css/styles.css',         // CSS file
    '/js/search.js',           // Search JS file
    '/js/service-worker.js',   // Service Worker JS file
    '/components/loadSidebar.html',// Sidebar content cache added
    'https://cdn.jsdelivr.net/npm/marked/marked.min.js', // External JS library
    'https://polyfill.io/v3/polyfill.min.js?features=es6', // Polyfill
    'https://tikzjax.com/v1/tikzjax.js',                // TikZJax
    'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js', // MathJax SVG
];

// Install the Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker installing.');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching files...');
                return cache.addAll(FILES_TO_CACHE);
            })
            .catch((error) => {
                console.error('Failed to cache files during install:', error);
            })
    );
});

// Activate the Service Worker and enable navigation preload
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating.');
    event.waitUntil(
        (async () => {
            if (self.registration.navigationPreload) {
                await self.registration.navigationPreload.enable();
            }
            const keyList = await caches.keys();
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        })().catch((error) => console.error('Activation error:', error))
    );
});

// Improved fetch event handler with better caching strategy
self.addEventListener('fetch', event => {
    event.respondWith(
        (async () => {
            try {
                // Try to use preloaded response first
                const preloadResponse = await event.preloadResponse;
                if (preloadResponse) return preloadResponse;
                
                // Then check the cache
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) return cachedResponse;
                
                // If not in cache, fetch from network
                const networkResponse = await fetch(event.request);
                
                // Cache successful GET responses
                if (networkResponse.ok && event.request.method === 'GET') {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(event.request, networkResponse.clone());
                }
                
                return networkResponse;
            } catch (error) {
                console.error('Fetch error:', error);
                // For navigation requests, return the offline page
                if (event.request.mode === 'navigate') {
                    const cache = await caches.open(CACHE_NAME);
                    return await cache.match('/offline.html');
                }
                throw error;
            }
        })()
    );
});
