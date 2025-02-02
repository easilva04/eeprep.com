const CACHE_NAME = 'site-cache-v2'; // Increment version number
const FILES_TO_CACHE = [
    '/',                       // Root
    '/index.html',             // Main page
    '/css/styles.css',         // CSS file
    '/js/search.js',           // Search JS file
    '/js/service-worker.js',   // Service Worker JS file
    '/components/sidebar.html',// Sidebar content cache added
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

// Activate the Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating.');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).catch((error) => {
            console.error('Failed to remove old caches during activate:', error);
        })
    );
});

// Fetch files from cache or network
self.addEventListener('fetch', (event) => {
    console.log('Fetching:', event.request.url);
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((networkResponse) => {
                if (networkResponse.status === 404) {
                    return caches.match('/404.md');
                }
                return networkResponse;
            });
        }).catch((error) => {
            console.error('Fetch failed; returning offline page instead.', error);
            return caches.match('/404.md');
        })
    );
});
