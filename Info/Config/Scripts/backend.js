const CACHE_NAME = 'site-cache-v3'; // Incremented version number
const STATIC_CACHE_NAME = 'static-cache-v3';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v3';

// Core static assets that should always be cached
const CORE_FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/styles.css',
    '/js/search.js',
    '/js/service-worker.js',
    '/components/loadSidebar.html',
    '/components/navbar.html',
    '/components/footer.html',
    '/images/eeprep.png', // Assuming there's a logo
    '/images/favicon.ico'
];

// External resources to cache
const EXTERNAL_FILES_TO_CACHE = [
    'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
    'https://polyfill.io/v3/polyfill.min.js?features=es6',
    'https://tikzjax.com/v1/tikzjax.js',
    'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js'
];

// Routes that should bypass the cache
const NEVER_CACHE_ROUTES = [
    '/api/',
    '/login',
    '/admin'
];

// Define site-wide structured data for SEO
const WEBSITE_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "EE Preparation - Home",
    "url": "https://www.eeprep.com/",
    "description": "Electrical Engineering Preparation Handbook for students and professionals.",
    "author": {
        "@type": "Organization",
        "name": "EEPrep Team"
    },
    "publisher": {
        "@type": "Organization",
        "name": "EEPrep Team"
    },
    "potentialAction": {
        "@type": "SearchAction",
        "target": "https://www.eeprep.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
    }
};

// Function to inject schema.org data into pages
function injectSchemaData() {
    if (typeof document !== 'undefined' && !document.querySelector('script[type="application/ld+json"]#website-schema')) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'website-schema';
        script.textContent = JSON.stringify(WEBSITE_SCHEMA);
        document.head.appendChild(script);
    }
}

// Call this function when appropriate (if in browser context)
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', injectSchemaData);
}

// Export schema for use in other scripts
if (typeof module !== 'undefined') {
    module.exports = {
        WEBSITE_SCHEMA
    };
}

// Install the Service Worker with improved logging
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        Promise.all([
            // Cache core files
            caches.open(STATIC_CACHE_NAME)
                .then((cache) => {
                    console.log('[Service Worker] Caching core static files');
                    return cache.addAll(CORE_FILES_TO_CACHE);
                }),
            
            // Cache external files
            caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                    console.log('[Service Worker] Caching external dependencies');
                    return cache.addAll(EXTERNAL_FILES_TO_CACHE);
                })
        ])
        .then(() => self.skipWaiting()) // Force new service worker to activate immediately
        .catch((error) => {
            console.error('[Service Worker] Installation failed:', error);
        })
    );
});

// Activate the Service Worker with better cache management
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        (async () => {
            // Enable navigation preload
            if (self.registration.navigationPreload) {
                await self.registration.navigationPreload.enable();
                console.log('[Service Worker] Navigation preload enabled');
            }
            
            // Clean up old caches
            const cacheNames = await caches.keys();
            const validCacheNames = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
            
            await Promise.all(
                cacheNames.map((cacheName) => {
                    if (!validCacheNames.includes(cacheName)) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
            
            // Claim clients immediately
            await self.clients.claim();
            console.log('[Service Worker] Activated and claimed clients');
        })()
        .catch((error) => console.error('[Service Worker] Activation error:', error))
    );
});

// Improved fetch event handler with stale-while-revalidate strategy
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Bypass cache for API and auth routes
    if (NEVER_CACHE_ROUTES.some(route => url.pathname.startsWith(route))) {
        return;
    }
    
    // For GET requests using HTML, image or CSS
    if (event.request.method === 'GET') {
        // Special handling for HTML navigation
        if (event.request.mode === 'navigate') {
            event.respondWith(
                (async () => {
                    try {
                        // Try navigation preload response first
                        const preloadResponse = await event.preloadResponse;
                        if (preloadResponse) {
                            console.log('[Service Worker] Using navigation preload for:', url.pathname);
                            return preloadResponse;
                        }
                        
                        // Then try network, with cache fallback
                        return await fetch(event.request)
                            .then(response => {
                                // Cache the latest version
                                const responseClone = response.clone();
                                caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                                    cache.put(event.request, responseClone);
                                });
                                return response;
                            })
                            .catch(async () => {
                                // If network fails, use cache
                                const cachedResponse = await caches.match(event.request);
                                if (cachedResponse) {
                                    return cachedResponse;
                                }
                                // If no cache, use offline page
                                return caches.match('/offline.html');
                            });
                    } catch (error) {
                        console.error('[Service Worker] Navigation fetch error:', error);
                        return caches.match('/offline.html');
                    }
                })()
            );
            return;
        }
        
        // Handle asset requests with stale-while-revalidate
        event.respondWith(
            (async () => {
                try {
                    // Try the cache first
                    const cachedResponse = await caches.match(event.request);
                    if (cachedResponse) {
                        // Start a background fetch to update the cache
                        event.waitUntil(
                            fetch(event.request)
                                .then(networkResponse => {
                                    if (networkResponse.ok) {
                                        const cache = caches.open(DYNAMIC_CACHE_NAME);
                                        cache.then(c => c.put(event.request, networkResponse.clone()));
                                    }
                                })
                                .catch(error => {
                                    console.log('[Service Worker] Stale-while-revalidate background update failed:', error);
                                })
                        );
                        
                        // Return the cached version immediately
                        return cachedResponse;
                    }
                    
                    // If not in cache, fetch from network and cache
                    const networkResponse = await fetch(event.request);
                    
                    // Only cache successful responses
                    if (networkResponse.ok) {
                        const cache = await caches.open(DYNAMIC_CACHE_NAME);
                        cache.put(event.request, networkResponse.clone());
                    }
                    
                    return networkResponse;
                } catch (error) {
                    console.error('[Service Worker] Fetch error:', error);
                    
                    // For images, try to return a placeholder
                    if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
                        return caches.match('/images/placeholder.png')
                            .catch(() => new Response('Image not available', { 
                                status: 404, 
                                headers: { 'Content-Type': 'text/plain' }
                            }));
                    }
                    
                    // For JS/CSS, return an empty response rather than failing
                    if (event.request.url.match(/\.(js|css)$/i)) {
                        return new Response('/* Resource not available */', { 
                            status: 404, 
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    }
                    
                    throw error;
                }
            })()
        );
    }
});

// Handle background sync for offline form submissions
self.addEventListener('sync', event => {
    if (event.tag === 'contact-form-sync') {
        event.waitUntil(syncContactForm());
    }
});

// Function to send stored contact form data
async function syncContactForm() {
    try {
        const dbName = 'offlineForms';
        const storeName = 'contactForms';
        
        // Open the database
        const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                }
            };
        });
        
        // Get stored form submissions
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        
        const forms = await new Promise((resolve, reject) => {
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
        
        // Try to send each form
        const sentIds = [];
        
        await Promise.all(forms.map(async (form) => {
            try {
                const response = await fetch('https://us-central1-eeprepcom.cloudfunctions.net/submitContactForm', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(form.data)
                });
                
                if (response.ok) {
                    sentIds.push(form.id);
                }
            } catch (error) {
                console.error('[Service Worker] Failed to sync form:', error);
            }
        }));
        
        // Remove successfully sent forms
        if (sentIds.length > 0) {
            const deleteTx = db.transaction(storeName, 'readwrite');
            const deleteStore = deleteTx.objectStore(storeName);
            
            await Promise.all(sentIds.map(id => {
                return new Promise((resolve, reject) => {
                    const request = deleteStore.delete(id);
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve();
                });
            }));
            
            console.log(`[Service Worker] Synced ${sentIds.length} contact forms`);
        }
    } catch (error) {
        console.error('[Service Worker] Error in syncContactForm:', error);
    }
}

// Send notification to user when app can be used offline
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Error handling class
class ErrorHandler {
    static logEndpoint = '/log';
    
    static logError(error, context = {}) {
        console.error('Error:', error, context);
        
        // Send error to server if in production environment
        if (self.location.hostname !== 'localhost' && self.location.hostname !== '127.0.0.1') {
            this.sendErrorToServer(error, context);
        }
    }
    
    static sendErrorToServer(error, context) {
        fetch(this.logEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: {
                    message: error.message,
                    stack: error.stack
                },
                context,
                timestamp: new Date().toISOString(),
                url: self.location.href,
                userAgent: self.navigator ? self.navigator.userAgent : 'Unknown'
            })
        }).catch(e => console.warn('Failed to send error report:', e));
    }
    
    static wrapFunction(fn, context) {
        return async function(...args) {
            try {
                return await fn.apply(this, args);
            } catch (error) {
                ErrorHandler.logError(error, {
                    function: context,
                    arguments: args
                });
                throw error; // Re-throw to maintain original behavior
            }
        };
    }
}

// Global error handler for service worker
self.handleError = (error) => ErrorHandler.logError(error);

// Register error handler for service worker
self.addEventListener('error', (event) => {
    ErrorHandler.logError(event.error || new Error(event.message), {
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

// Function to verify reCAPTCHA token for forms
async function verifyRecaptcha(formElement) {
    if (typeof grecaptcha === 'undefined') {
        console.error('[reCAPTCHA] grecaptcha not loaded');
        return false;
    }
    
    try {
        const token = await grecaptcha.execute('6Lfz5aYqAAAAACkJOdjWglWew8_dIBATX-Wc-Rm1', {action: 'submit'});
        
        // Create hidden input for token if it doesn't exist
        let tokenInput = formElement.querySelector('input[name="g-recaptcha-response"]');
        if (!tokenInput) {
            tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = 'g-recaptcha-response';
            formElement.appendChild(tokenInput);
        }
        
        // Update token value
        tokenInput.value = token;
        return true;
    } catch (error) {
        console.error('[reCAPTCHA] Error obtaining token:', error);
        return false;
    }
}

// Helper to attach reCAPTCHA to all forms
function setupRecaptchaOnForms() {
    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', () => {
            const forms = document.querySelectorAll('form');
            
            forms.forEach(form => {
                form.addEventListener('submit', async (event) => {
                    event.preventDefault();
                    
                    // Verify reCAPTCHA
                    const isVerified = await verifyRecaptcha(form);
                    
                    if (isVerified) {
                        form.submit();
                    } else {
                        // Show error message
                        const errorMsg = document.createElement('p');
                        errorMsg.className = 'error-message';
                        errorMsg.textContent = 'reCAPTCHA verification failed. Please try again.';
                        form.appendChild(errorMsg);
                        
                        // Auto-remove after 5 seconds
                        setTimeout(() => errorMsg.remove(), 5000);
                    }
                });
            });
        });
    }
}

// Initialize reCAPTCHA on forms when in browser context
if (typeof window !== 'undefined') {
    setupRecaptchaOnForms();
}

// Debounce function to limit how often a function can run
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Add keyboard navigation support
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Escape key to close sidebar on mobile
        if (e.key === 'Escape') {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            // Close any search dropdown if open
            const searchContainer = document.querySelector('.search-container.active');
            if (searchContainer) {
                searchContainer.classList.remove('active');
            }
        }
        
        // Shift+/ for search
        if (e.key === '?' && e.shiftKey) {
            const searchInput = document.querySelector('.sidebar-search input') || 
                               document.querySelector('.search-container input');
            
            if (searchInput) {
                searchInput.focus();
                e.preventDefault();
            }
        }
        
        // Alt+S to toggle sidebar
        if (e.key === 's' && e.altKey) {
            e.preventDefault();
            if (typeof toggleSidebar === 'function') {
                toggleSidebar();
            }
        }
        
        // Alt+D to toggle dark mode
        if (e.key === 'd' && e.altKey) {
            e.preventDefault();
            if (typeof toggleTheme === 'function') {
                toggleTheme();
            }
        }
    });
}

// Export necessary functions for global use
if (typeof window !== 'undefined') {
    window.setupKeyboardNavigation = setupKeyboardNavigation;
    window.debounce = debounce;
    window.verifyRecaptcha = verifyRecaptcha;
}
