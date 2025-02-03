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
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching files...');
            return cache.addAll(FILES_TO_CACHE);
        }).catch((error) => {
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

// Fetch files from cache or network with navigation preload and offline fallback
self.addEventListener('fetch', event => {
  // Use respondWith to wait for the preloadResponse (if available) or fallback to a network fetch.
  event.respondWith((async () => {
    try {
      const preloadResponse = await event.preloadResponse;
      if (preloadResponse) return preloadResponse;
    } catch (e) {
      console.error('Preload failed:', e);
    }
    return fetch(event.request);
  })());
  // Use waitUntil to let the preload promise settle
  event.waitUntil((async () => {
    try { await event.preloadResponse; } catch (e) { /* swallow errors */ }
  })());
});
