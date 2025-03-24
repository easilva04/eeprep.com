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

// Function to inject schema.org data into pages if needed
function injectSchemaData() {
    // Check if we're in a browser context
    if (typeof document !== 'undefined') {
        // Only inject if it doesn't already exist
        if (!document.querySelector('script[type="application/ld+json"]#website-schema')) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.id = 'website-schema';
            script.textContent = JSON.stringify(WEBSITE_SCHEMA);
            document.head.appendChild(script);
            console.log('[Schema] Injected WebSite schema');
        }
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
    
    static handleWasmError(error, errorInfo) {
        this.logError(error, {
            type: 'wasm',
            ...errorInfo
        });
        
        if (error.message.includes('unreachable')) {
            console.warn('Detected unreachable code execution in WebAssembly module');
        }
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
        
        // For debugging
        console.log('[reCAPTCHA] Token obtained');
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
                    // Prevent default form submission
                    event.preventDefault();
                    
                    // Verify reCAPTCHA
                    const isVerified = await verifyRecaptcha(form);
                    
                    if (isVerified) {
                        // Submit the form if verification passes
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

/**
 * Main site functionality for EEPrep
 * Ensures all components work together properly
 */

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing site functionality');
    
    // Fix sidebar collapse behavior
    fixSidebarCollapse();
    
    // Add topic card hover effects
    enhanceTopicCards();
    
    // Add active class to current page in sidebar
    highlightCurrentPage();
    
    // Initialize scroll effects
    initScrollEffects();
    
    // Load MathJax properly
    initializeMathJax();
});

/**
 * Fix sidebar collapse behavior to ensure it works properly
 */
function fixSidebarCollapse() {
    const sidebar = document.getElementById('sidebar-container');
    if (!sidebar) return;
    
    // Ensure correct initial state - don't manipulate inline transform styles
    if (window.innerWidth < 768) {
        // On mobile, sidebar should be hidden by default but not collapsed
        sidebar.classList.remove('collapsed');
        sidebar.classList.remove('active');
    } else {
        // On desktop, check localStorage for collapse preference
        const sidebarState = localStorage.getItem('sidebar-collapsed');
        if (sidebarState === 'true') {
            sidebar.classList.add('collapsed');
        } else if (sidebarState === 'false') {
            sidebar.classList.remove('collapsed');
        }
        // Otherwise use the default class state from HTML
    }
    
    // Ensure sidebar buttons work
    const toggleButton = document.getElementById('toggle-sidebar');
    if (toggleButton) {
        // Remove existing event listener if present by cloning
        const newToggleButton = toggleButton.cloneNode(true);
        toggleButton.parentNode.replaceChild(newToggleButton, toggleButton);
        
        // Add new event listener
        newToggleButton.addEventListener('click', function() {
            if (window.innerWidth >= 768) {
                sidebar.classList.toggle('collapsed');
                
                // Save preference to localStorage
                localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
                console.log('Sidebar toggled to:', sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
                
                // Update button icon
                updateToggleIcon(sidebar.classList.contains('collapsed'));
            }
        });
    }
    
    // Update mobile menu toggle
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    if (mobileToggle) {
        // Remove existing event listener if present by cloning
        const newMobileToggle = mobileToggle.cloneNode(true);
        mobileToggle.parentNode.replaceChild(newMobileToggle, mobileToggle);
        
        // Add new event listener
        newMobileToggle.addEventListener('click', function() {
            if (window.innerWidth < 768) {
                sidebar.classList.toggle('active');
                const overlay = document.getElementById('sidebar-overlay');
                if (overlay) {
                    overlay.classList.toggle('active');
                }
                document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
                console.log('Mobile sidebar toggled:', sidebar.classList.contains('active') ? 'active' : 'inactive');
            }
        });
    }
    
    // Fix direct navigation in collapsed mode
    const sidebarLinks = document.querySelectorAll('.sidebar-link:not(.dropdown-toggle)');
    sidebarLinks.forEach(link => {
        // Remove existing event listener by cloning
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
        
        // Add new event listener that checks for collapsed state
        newLink.addEventListener('click', function(e) {
            // For links in collapsed mode on desktop, just navigate directly
            if (window.innerWidth >= 768 && sidebar.classList.contains('collapsed')) {
                console.log('Direct navigation in collapsed mode');
                // Let default navigation occur
            }
        });
    });
    
    // Update toggle icon
    function updateToggleIcon(isCollapsed) {
        const toggleButton = document.getElementById('toggle-sidebar');
        if (!toggleButton) return;
        
        toggleButton.innerHTML = isCollapsed ? 
            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
            </svg>` : 
            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>`;
    }
}

/**
 * Enhance topic cards with better hover effects
 */
function enhanceTopicCards() {
    const topicCards = document.querySelectorAll('.topic-card');
    
    topicCards.forEach(card => {
        // Add hover effect
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = 'var(--box-shadow-hover)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'var(--box-shadow)';
        });
        
        // Add click effect for better mobile experience
        card.addEventListener('click', function(e) {
            // Only apply if we're clicking the card itself, not a link inside it
            if (e.target === this) {
                const link = this.querySelector('a');
                if (link) {
                    link.click();
                }
            }
        });
    });
}

/**
 * Highlight the current page in the sidebar navigation
 */
function highlightCurrentPage() {
    // Get current page path
    const currentPath = window.location.pathname;
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (currentPath.endsWith(href) || currentPath.includes(href))) {
            link.classList.add('active');
            
            // If in dropdown, expand it
            const dropdownItem = link.closest('.sidebar-item');
            if (dropdownItem && dropdownItem.querySelector('.dropdown-toggle')) {
                dropdownItem.classList.add('active');
            }
        }
    });
}

/**
 * Initialize scroll effects like scroll-to-top button
 */
function initScrollEffects() {
    // Create scroll-to-top button if it doesn't exist
    if (!document.querySelector('.scroll-top')) {
        const scrollTopButton = document.createElement('button');
        scrollTopButton.className = 'scroll-top';
        scrollTopButton.setAttribute('aria-label', 'Scroll to top');
        scrollTopButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
        `;
        document.body.appendChild(scrollTopButton);
        
        // Add click event
        scrollTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Show/hide scroll button based on scroll position
    const scrollTopButton = document.querySelector('.scroll-top');
    if (scrollTopButton) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                scrollTopButton.classList.add('visible');
            } else {
                scrollTopButton.classList.remove('visible');
            }
        });
    }
}

/**
 * Initialize MathJax properly
 */
function initializeMathJax() {
    if (typeof MathJax !== 'undefined') {
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
    }
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

// Handle window resize - FIXED to manage responsive behavior properly
window.addEventListener('resize', debounce(function() {
    // Adjust sidebar based on screen size
    const sidebar = document.getElementById('sidebar-container');
    if (sidebar) {
        if (window.innerWidth < 768) {
            // On mobile
            if (!sidebar.classList.contains('active')) {
                // On mobile, don't use collapsed class
                sidebar.classList.remove('collapsed');
            }
        } else {
            // On desktop
            const overlay = document.getElementById('sidebar-overlay');
            if (overlay) {
                overlay.classList.remove('active');
            }
            document.body.style.overflow = '';
            
            // Respect saved collapsed state
            const sidebarState = localStorage.getItem('sidebar-collapsed');
            if (sidebarState === 'true') {
                sidebar.classList.add('collapsed');
            } else if (sidebarState === 'false') {
                sidebar.classList.remove('collapsed');
            }
        }
    }
}, 250));

// Fix common link issues
document.addEventListener('click', function(e) {
    // Ensure all navigation links use navigateRelative when appropriate
    if (e.target.tagName === 'A' && !e.target.getAttribute('href').startsWith('http')) {
        const href = e.target.getAttribute('href');
        // Skip links with # (anchors) or javascript:
        if (href && !href.startsWith('#') && !href.startsWith('javascript:') && typeof navigateRelative === 'function') {
            e.preventDefault();
            navigateRelative(href);
        }
    }
});


/**
 * Asset Debugger - Helps identify and fix asset loading issues
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Asset debugger running...');
    
    // Check for logo element
    const logoElement = document.getElementById('sidebar-logo');
    if (logoElement) {
        console.log('Logo element found with src:', logoElement.src);
        
        // Verify all possible image paths
        const basePath = getBasePath();
        const possiblePaths = [
            `${basePath}/Info/Config/Assets/images/eeprep.png`,
            `${basePath}/Assets/images/eeprep.png`,
            `${basePath}/images/eeprep.png`,
            `${basePath}/eeprep.png`,
            '/Info/Config/Assets/images/eeprep.png',
            '/Assets/images/eeprep.png',
            '/images/eeprep.png',
            '/eeprep.png'
        ];
        
        console.log('Possible image paths:');
        possiblePaths.forEach(path => {
            const img = new Image();
            img.onload = () => console.log(`✓ Image exists at: ${path}`);
            img.onerror = () => console.log(`✗ Image NOT found at: ${path}`);
            img.src = path;
        });
    } else {
        console.error('Logo element not found!');
    }
    
    // Verify toggle button
    const toggleButton = document.getElementById('toggle-sidebar');
    if (toggleButton) {
        console.log('Toggle button found:', toggleButton);
        console.log('Toggle button html:', toggleButton.innerHTML);
        console.log('Toggle button visibility:', getComputedStyle(toggleButton).display);
        
        // Add a test click handler
        toggleButton.addEventListener('click', function() {
            console.log('Debug: Toggle button clicked');
        });
    } else {
        console.error('Toggle button not found!');
    }
    
    // Verify mobile menu toggle
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    if (mobileToggle) {
        console.log('Mobile toggle button found:', mobileToggle);
        console.log('Mobile toggle html:', mobileToggle.innerHTML);
        console.log('Mobile toggle visibility:', getComputedStyle(mobileToggle).display);
        
        // Add a test click handler
        mobileToggle.addEventListener('click', function() {
            console.log('Debug: Mobile toggle clicked');
        });
    } else {
        console.error('Mobile toggle button not found!');
    }
    
    // Check sidebar status
    const sidebar = document.getElementById('sidebar-container');
    if (sidebar) {
        console.log('Sidebar found with classes:', sidebar.className);
        console.log('Sidebar computed style transform:', getComputedStyle(sidebar).transform);
        console.log('Sidebar width:', getComputedStyle(sidebar).width);
    } else {
        console.error('Sidebar not found!');
    }
});

// Helper function that gives more details about path resolution
function getBasePath() {
    const pathSegments = window.location.pathname.split('/').filter(segment => segment !== '');
    
    console.log('Current pathname:', window.location.pathname);
    console.log('Path segments:', pathSegments);
    
    // Handle root path
    if (pathSegments.length === 0 || 
        (pathSegments.length === 1 && (pathSegments[0] === 'index.html' || pathSegments[0] === ''))) {
        console.log('Detected root path, returning empty base path');
        return '';
    }
    
    // Calculate relative path to root
    let basePath = '';
    for (let i = 0; i < pathSegments.length; i++) {
        if (i === pathSegments.length - 1 && pathSegments[i].includes('.')) {
            console.log('Skipping filename:', pathSegments[i]);
            continue; // Skip filename
        }
        basePath += '../';
    }
    
    const result = basePath === '' ? '' : basePath.slice(0, -1);
    console.log('Calculated base path:', result);
    return result;
}
