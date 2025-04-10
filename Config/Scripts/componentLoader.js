/**
 * Component Loader System for EEPrep
 * 
 * Handles dynamic loading of site components like navigation, sidebar, and footer.
 * Features:
 * - Asynchronous component loading
 * - Loading indicators
 * - Mobile navigation setup
 * - Dropdown menu initialization
 * - Error handling for failed component loads
 * - Touch swipe support for mobile sidebar
 */

/**
 * Initialize the application when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', initApp);

/**
 * Initialize the application by loading components and setting up features
 */
function initApp() {
    // Create ChatGPT-like loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="loading-content">
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
            <p class="loading-text">Loading EEPrep</p>
        </div>
    `;
    document.body.appendChild(loadingIndicator);
    
    // Create overlay for sidebar (mobile)
    const sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);
    
    // Check if sidebar was previously collapsed and add class before components load
    if (localStorage.getItem('sidebar-collapsed') === 'true') {
        document.body.classList.add('sidebar-collapsed');
    }
    
    // Load all components - skip header
    Promise.all([
        loadComponent('sidebar-container', resolveComponentPath('Config/Components/sidebar.html')),
        loadComponent('footer-container', resolveComponentPath('Config/Components/footer.html'))
    ])
    .then(() => {
        // Initialize features after components are loaded
        setupMobileNavigation();
        setupDropdowns();
        
        // IMPROVED: Handle touch events for better mobile experience
        setupTouchControls();
        
        // IMPROVED: Apply viewport meta tag adjustments for better mobile display
        adjustViewport();
        
        // Remove loading indicator with fade effect
        loadingIndicator.classList.add('fade-out');
        setTimeout(() => {
            loadingIndicator.remove();
        }, 500);
        
        // Mark app as initialized
        document.body.classList.add('app-initialized');
    })
    .catch(error => {
        console.error('Failed to initialize app:', error);
        loadingIndicator.innerHTML = `
            <div class="loading-error">
                <p>Failed to load page components</p>
                <button onclick="window.location.reload()">Retry</button>
            </div>
        `;
    });
}

/**
 * Resolve component path relative to the site root
 * This helps load components regardless of current page depth
 * 
 * @param {string} path - Path to the component relative to site root
 * @returns {string} - The resolved path
 */
function resolveComponentPath(path) {
    // Get the depth of the current page relative to site root
    const pathDepth = window.location.pathname.split('/').filter(Boolean).length;
    
    // Build the appropriate relative path prefix based on current depth
    // For root pages: path as is
    // For deeper pages: add "../" for each level
    let relativePath = '';
    if (pathDepth > 0) {
        relativePath = '../'.repeat(pathDepth);
    }
    
    return relativePath + path;
}

/**
 * Resolve data file path relative to the site root
 * Similar to resolveComponentPath but specifically for data files like JSON
 * 
 * @param {string} path - Path to the data file relative to site root
 * @returns {string} - The resolved path
 */
function resolveDataPath(path) {
    return resolveComponentPath(path);
}

/**
 * Load a component HTML file into a container
 * 
 * @param {string} containerId - ID of the container element
 * @param {string} url - URL of the component HTML file
 * @returns {Promise} - Promise that resolves when the component is loaded
 */
function loadComponent(containerId, url) {
    const container = document.getElementById(containerId);
    if (!container) {
        // If container doesn't exist, resolve without loading
        return Promise.resolve();
    }
    
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${url}: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            container.innerHTML = html;
            // Execute any scripts in the loaded HTML
            container.querySelectorAll('script').forEach(script => {
                const newScript = document.createElement('script');
                Array.from(script.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = script.textContent;
                script.parentNode.replaceChild(newScript, script);
            });
            
            // Add fade-in animation to loaded content
            container.style.opacity = '0';
            container.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                container.style.opacity = '1';
            }, 50);
            
            return container;
        });
}

/**
 * Helper function for relative navigation
 * 
 * @param {string} url - URL to navigate to
 */
function navigateRelative(url) {
    window.location.href = url;
}

/**
 * Set up mobile navigation functionality
 */
function setupMobileNavigation() {
    // Create mobile navigation toggle if it doesn't exist
    if (!document.querySelector('.mobile-nav-toggle')) {
        const toggle = document.createElement('button');
        toggle.className = 'mobile-nav-toggle';
        toggle.setAttribute('aria-label', 'Toggle navigation');
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.appendChild(toggle);
        
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (!sidebar || !overlay) return;
        
        // Improved mobile toggle functionality
        toggle.addEventListener('click', () => {
            toggleSidebar(sidebar, overlay, toggle);
        });
        
        // Close sidebar when clicking overlay
        overlay.addEventListener('click', () => {
            closeSidebar(sidebar, overlay, toggle);
        });

        // Close sidebar when pressing Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && sidebar.classList.contains('active')) {
                closeSidebar(sidebar, overlay, toggle);
            }
        });
        
        // Add touch swipe detection for mobile
        setupTouchSwipe(sidebar, overlay, toggle);
    }
}

/**
 * Toggle sidebar open/closed state
 * @param {Element} sidebar - The sidebar element
 * @param {Element} overlay - The overlay element
 * @param {Element} toggle - The toggle button element
 */
function toggleSidebar(sidebar, overlay, toggle) {
    const isActive = sidebar.classList.contains('active');
    
    if (isActive) {
        closeSidebar(sidebar, overlay, toggle);
    } else {
        openSidebar(sidebar, overlay, toggle);
    }
}

/**
 * Open the sidebar
 * @param {Element} sidebar - The sidebar element
 * @param {Element} overlay - The overlay element
 * @param {Element} toggle - The toggle button element
 */
function openSidebar(sidebar, overlay, toggle) {
    // Add animating class for smoother transitions
    sidebar.classList.add('sidebar-animating');
    
    // Show sidebar
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('sidebar-open');
    toggle.querySelector('i').className = 'fas fa-times';
    
    // IMPROVED: Prevent body scrolling when sidebar is open
    document.body.style.overflow = 'hidden';
    
    // Remove animating class after transition completes
    setTimeout(() => {
        sidebar.classList.remove('sidebar-animating');
    }, 300);
}

/**
 * Close the sidebar
 * @param {Element} sidebar - The sidebar element
 * @param {Element} overlay - The overlay element
 * @param {Element} toggle - The toggle button element
 */
function closeSidebar(sidebar, overlay, toggle) {
    // Add animating class for smoother transitions
    sidebar.classList.add('sidebar-animating');
    
    // Hide sidebar
    sidebar.classList.remove('active');
    document.body.classList.remove('sidebar-open');
    overlay.classList.remove('active');
    toggle.querySelector('i').className = 'fas fa-bars';
    
    // IMPROVED: Restore body scrolling when sidebar is closed
    document.body.style.overflow = '';
    
    // Remove animating class after transition completes
    setTimeout(() => {
        sidebar.classList.remove('sidebar-animating');
    }, 300);
}

/**
 * Setup touch swipe detection for mobile sidebar
 * @param {Element} sidebar - The sidebar element
 * @param {Element} overlay - The overlay element
 * @param {Element} toggle - The toggle button element
 */
function setupTouchSwipe(sidebar, overlay, toggle) {
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50; // Minimum swipe distance to trigger action
    
    // Add swipe detection to document body
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe(sidebar, overlay, toggle);
    }, { passive: true });
    
    // Handle swipe left/right
    function handleSwipe(sidebar, overlay, toggle) {
        const swipeDistance = touchEndX - touchStartX;
        const isActive = sidebar.classList.contains('active');
        
        // Right to left swipe (close sidebar)
        if (swipeDistance < -minSwipeDistance && isActive) {
            closeSidebar(sidebar, overlay, toggle);
        }
        
        // Left to right swipe (open sidebar)
        if (swipeDistance > minSwipeDistance && !isActive && touchStartX < 50) {
            openSidebar(sidebar, overlay, toggle);
        }
    }
    
    // Enhanced edge swipe detection
    let touchMoveHandler = null;
    
    document.addEventListener('touchstart', (e) => {
        const touchX = e.touches[0].clientX;
        
        // Only activate edge detection when touch starts near the left edge
        if (touchX <= 20 && !sidebar.classList.contains('active')) {
            // Create touchmove handler for this specific gesture
            touchMoveHandler = function(moveEvent) {
                const currentX = moveEvent.touches[0].clientX;
                const deltaX = currentX - touchX;
                
                // If swiped enough from edge, show sidebar
                if (deltaX > 70) {
                    openSidebar(sidebar, overlay, toggle);
                    
                    // Clean up by removing this handler
                    document.removeEventListener('touchmove', touchMoveHandler);
                    touchMoveHandler = null;
                }
            };
            
            document.addEventListener('touchmove', touchMoveHandler);
        }
    }, { passive: true });
    
    document.addEventListener('touchend', () => {
        // Clean up touchmove handler when touch ends
        if (touchMoveHandler) {
            document.removeEventListener('touchmove', touchMoveHandler);
            touchMoveHandler = null;
        }
    }, { passive: true });
}

/**
 * IMPROVED: Setup additional touch-friendly controls
 */
function setupTouchControls() {
    // Make links in mobile view have a slight delay to prevent accidental clicks
    if (window.innerWidth <= 1024) {
        const links = document.querySelectorAll('a[href]:not([href^="#"])');
        links.forEach(link => {
            // Skip links that open in new tabs
            if (link.getAttribute('target') === '_blank') return;
            
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href && !href.startsWith('javascript:')) {
                    e.preventDefault();
                    this.classList.add('link-clicked');
                    setTimeout(() => {
                        window.location.href = href;
                    }, 150);
                }
            });
        });
    }
    
    // Add active state to buttons when pressed on touch devices
    const buttons = document.querySelectorAll('button, .btn');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.classList.add('button-active');
        }, { passive: true });
        
        button.addEventListener('touchend', function() {
            this.classList.remove('button-active');
        }, { passive: true });
    });
}

/**
 * IMPROVED: Adjust viewport meta tag for better mobile display
 */
function adjustViewport() {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
        // Prevent auto-zooming on form inputs on iOS
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
}

/**
 * Set up dropdown menu functionality
 */
function setupDropdowns() {
    // Find all dropdown toggles
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const dropdown = toggle.parentElement;
            const menu = dropdown.querySelector('.dropdown-menu');
            
            // Close all other dropdowns first
            document.querySelectorAll('.dropdown-menu.active').forEach(activeMenu => {
                if (activeMenu !== menu) {
                    activeMenu.classList.remove('active');
                }
            });
            
            // Toggle this dropdown
            menu.classList.toggle('active');
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu.active').forEach(menu => {
            menu.classList.remove('active');
        });
    });
}