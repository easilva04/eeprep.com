/**
 * Component Loader Script
 * Dynamically loads HTML components like navigation, footer, etc.
 */

// Global state to track component loading status
window.eeprep = window.eeprep || {
    componentsLoaded: {
        sidebar: false,
        navbar: false,
        search: false
    },
    componentsReady: function() {
        return this.componentsLoaded.sidebar && this.componentsLoaded.navbar;
    }
};

// Load components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Component loader script executing');
    
    // Load components in sequence to avoid race conditions
    loadSidebar()
        .then(() => loadSearch())
        .catch(error => {
            console.error('Error in component loading sequence:', error);
        });
});

// Load the sidebar component - now handles all navigation
function loadSidebar() {
    return new Promise((resolve, reject) => {
        const container = document.getElementById('sidebar-container');
        if (!container) {
            console.warn('Sidebar container not found, skipping sidebar loading');
            resolve();
            return;
        }
        
        const basePath = getBasePath();
        console.log(`Loading sidebar with base path: ${basePath}`);
        
        fetch(`${basePath}/Info/Config/Components/navigation.html`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error loading sidebar! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                // Extract the sidebar content
                const sidebarContent = tempDiv.querySelector('.sidebar-inner');
                if (sidebarContent) {
                    container.innerHTML = '';
                    container.appendChild(sidebarContent);
                    
                    // Add mobile header to the body if it exists in the template
                    const mobileHeader = tempDiv.querySelector('.mobile-header');
                    if (mobileHeader && !document.querySelector('.mobile-header')) {
                        document.body.prepend(mobileHeader);
                    }
                    
                    // Add search overlay to the body if it exists in the template
                    const searchOverlay = tempDiv.querySelector('.search-overlay');
                    if (searchOverlay && !document.querySelector('.search-overlay')) {
                        document.body.appendChild(searchOverlay);
                    }
                    
                    // Add sidebar overlay for mobile
                    if (!document.querySelector('.sidebar-overlay')) {
                        const sidebarOverlay = document.createElement('div');
                        sidebarOverlay.className = 'sidebar-overlay';
                        sidebarOverlay.id = 'sidebar-overlay';
                        document.body.appendChild(sidebarOverlay);
                    }
                    
                    // Initialize sidebar functionality
                    setTimeout(() => {
                        initializeSidebar();
                        setLogoSource();
                    }, 0);
                    
                    console.log('Sidebar loaded successfully');
                    window.eeprep.componentsLoaded.sidebar = true;
                    window.eeprep.componentsLoaded.navbar = true; // Navbar is now part of sidebar
                } else {
                    console.error('Sidebar content not found in navigation.html');
                }
                resolve();
            })
            .catch(error => {
                console.error('Error loading sidebar:', error);
                container.innerHTML = `<div class="error-message">Sidebar could not be loaded. Error: ${error.message}</div>`;
                reject(error);
            });
    });
}

// Load the search component
function loadSearch() {
    return new Promise((resolve, reject) => {
        const container = document.getElementById('search-container');
        if (!container) {
            console.log('Search container not present on this page, skipping search loading');
            resolve();
            return;
        }
        
        const basePath = getBasePath();
        console.log(`Loading search with base path: ${basePath}`);
        
        fetch(`${basePath}/Info/Config/Components/search.html`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error loading search! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                container.innerHTML = html;
                
                // Wait a bit to ensure search.js is loaded
                setTimeout(() => {
                    if (typeof initializeSearch === 'function') {
                        initializeSearch();
                        console.log('Search initialized');
                        window.eeprep.componentsLoaded.search = true;
                    } else {
                        console.warn('Search initialization function not available');
                    }
                }, 100);
                
                resolve();
            })
            .catch(error => {
                console.error('Error loading search:', error);
                container.innerHTML = `<div class="error-message">Search could not be loaded. Error: ${error.message}</div>`;
                reject(error);
            });
    });
}

// Helper function to determine base path for relative URLs
function getBasePath() {
    const pathSegments = window.location.pathname.split('/').filter(segment => segment !== '');
    
    // Handle root path
    if (pathSegments.length === 0 || 
        (pathSegments.length === 1 && (pathSegments[0] === 'index.html' || pathSegments[0] === ''))) {
        return '';
    }
    
    // Calculate relative path to root
    let basePath = '';
    for (let i = 0; i < pathSegments.length; i++) {
        if (i === pathSegments.length - 1 && pathSegments[i].includes('.')) {
            continue; // Skip filename
        }
        basePath += '../';
    }
    
    return basePath === '' ? '' : basePath.slice(0, -1);
}

// Function to initialize sidebar behavior - fixed for proper visibility
function initializeSidebar() {
    console.log('Initializing sidebar behavior with improved collapse system');
    
    const sidebar = document.getElementById('sidebar-container');
    const toggleButton = document.getElementById('toggle-sidebar');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (!sidebar) {
        console.warn('Sidebar container not found, skipping sidebar initialization');
        return;
    }
    
    // Initialize sidebar based on screen size and stored preference
    const isMobile = window.innerWidth < 768;
    
    if (!isMobile) {
        // On desktop, check for stored collapsed state
        const sidebarState = localStorage.getItem('sidebar-collapsed');
        
        // IMPORTANT: Remove inline transform that might be preventing proper display
        sidebar.style.transform = '';
        
        if (sidebarState === 'true') {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
        updateToggleIcon(sidebar.classList.contains('collapsed'));
    } else {
        // On mobile, always start with sidebar hidden
        sidebar.classList.remove('collapsed'); // Remove collapsed state on mobile
        sidebar.classList.remove('active');    // Start with sidebar hidden
        
        // Add swipe indicator if it doesn't exist
        if (!document.querySelector('.swipe-indicator')) {
            const swipeIndicator = document.createElement('div');
            swipeIndicator.className = 'swipe-indicator';
            document.body.appendChild(swipeIndicator);
            
            // Make swipe indicator clickable to open sidebar
            swipeIndicator.addEventListener('click', function() {
                sidebar.classList.add('active');
                if (sidebarOverlay) sidebarOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }
    }
    
    // Toggle sidebar visibility with desktop/mobile awareness
    if (toggleButton) {
        console.log('Setting up toggle button listener');
        // Remove any existing listeners by cloning
        const newToggleButton = toggleButton.cloneNode(true);
        toggleButton.parentNode.replaceChild(newToggleButton, toggleButton);
        
        newToggleButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Toggle button clicked');
            
            if (isMobile) {
                // On mobile, toggle active state
                sidebar.classList.toggle('active');
                if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
                document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
            } else {
                // On desktop, toggle collapsed state but keep visible
                sidebar.classList.toggle('collapsed');
                const isCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebar-collapsed', isCollapsed);
                updateToggleIcon(isCollapsed);
                console.log('Sidebar collapsed state:', isCollapsed);
            }
        });
    }
    
    // Mobile menu toggle with improved behavior
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Mobile menu toggle clicked');
            sidebar.classList.toggle('active');
            console.log('Active class toggled:', sidebar.classList.contains('active'));
            
            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle('active');
            }
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        });
    }
    
    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Function to toggle dropdown state
    function toggleDropdown(item) {
        const wasActive = item.classList.contains('active');
        
        // Close other dropdowns first
        dropdownToggles.forEach(otherToggle => {
            const otherItem = otherToggle.closest('.sidebar-item');
            if (otherItem !== item) {
                otherItem.classList.remove('active');
            }
        });
        
        // Toggle this dropdown
        item.classList.toggle('active', !wasActive);
    }
    
    // Make topic links open sidebar on mobile but navigate directly in collapsed mode on desktop
    const topicLinks = document.querySelectorAll('.sidebar-link:not(.dropdown-toggle)');
    topicLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const sidebar = document.getElementById('sidebar-container');
            const isCollapsed = sidebar.classList.contains('collapsed');
            const isMobile = window.innerWidth < 768;
            
            // On mobile with closed sidebar, open sidebar first
            if (isMobile && !sidebar.classList.contains('active')) {
                e.preventDefault();
                sidebar.classList.add('active');
                if (sidebarOverlay) sidebarOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Navigate after a slight delay
                const href = this.getAttribute('href');
                if (href) {
                    setTimeout(() => {
                        window.location.href = href;
                    }, 300);
                }
            }
            // In collapsed mode on desktop, just navigate directly
            else if (!isMobile && isCollapsed) {
                // Let the default navigation happen
                // Don't prevent default - this allows normal navigation
                console.log('Navigating directly in collapsed mode');
            }
        });
    });
    
    // Fix dropdown toggles to not expand in collapsed mode on desktop
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const sidebar = document.getElementById('sidebar-container');
            const isCollapsed = sidebar.classList.contains('collapsed');
            const isMobile = window.innerWidth < 768;
            const item = this.closest('.sidebar-item');
            
            // On mobile with closed sidebar, open sidebar first
            if (isMobile && !sidebar.classList.contains('active')) {
                sidebar.classList.add('active');
                if (sidebarOverlay) sidebarOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Slight delay to allow sidebar animation to complete
                setTimeout(() => {
                    toggleDropdown(item);
                }, 300);
            } 
            // In collapsed mode on desktop, expand sidebar first, then show dropdown
            else if (!isMobile && isCollapsed) {
                sidebar.classList.remove('collapsed');
                localStorage.setItem('sidebar-collapsed', false);
                updateToggleIcon(false);
                
                // Slight delay to allow sidebar animation to complete
                setTimeout(() => {
                    toggleDropdown(item);
                }, 300);
            }
            else {
                toggleDropdown(item);
            }
        });
    });
    
    // Improved touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartTime = 0;
    let touchEndTime = 0;
    
    // Track touch start position and time
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartTime = new Date().getTime();
    }, { passive: true });
    
    // Handle touch move for instant feedback
    document.addEventListener('touchmove', function(e) {
        if (!isMobile) return;
        
        // Only respond to touches starting from edge
        if (touchStartX > 30) return;
        
        const currentX = e.changedTouches[0].screenX;
        const diff = currentX - touchStartX;
        
        // If swiping from left edge and sidebar is not active
        if (diff > 30 && touchStartX < 30 && !sidebar.classList.contains('active')) {
            // Show visual indicator of swipe progress
            const swipeProgress = Math.min(diff / 150, 1); // 150px for full open
            sidebar.style.transform = `translateX(${-100 + (swipeProgress * 100)}%)`;
            if (sidebarOverlay) {
                sidebarOverlay.style.opacity = swipeProgress * 0.5;
                sidebarOverlay.style.display = 'block';
            }
        }
    }, { passive: true });
    
    // Handle touch end with velocity detection
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndTime = new Date().getTime();
        
        // Calculate swipe speed (pixels per millisecond)
        const swipeDistance = touchEndX - touchStartX;
        const swipeTime = touchEndTime - touchStartTime;
        const swipeSpeed = Math.abs(swipeDistance) / swipeTime;
        
        // Reset any temporary transform styles
        sidebar.style.transform = '';
        if (sidebarOverlay) {
            sidebarOverlay.style.opacity = '';
        }
        
        handleSwipe(swipeDistance, swipeSpeed);
    }, { passive: true });
    
    // Process the swipe gesture with enhanced detection
    function handleSwipe(swipeDistance, swipeSpeed) {
        const swipeThreshold = 70; // Minimum distance for swipe
        const edgeThreshold = 30;  // Distance from edge to start swipe
        const speedThreshold = 0.2; // Speed threshold for quick swipes (pixels per ms)
        
        if (!isMobile) return;
        
        // If sidebar is open, right to left swipe (close sidebar)
        // Either a long swipe or a quick flick will work
        if ((swipeDistance < -swipeThreshold || (swipeDistance < 0 && swipeSpeed > speedThreshold)) 
            && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
                sidebarOverlay.style.display = '';
            }
            document.body.style.overflow = '';
        }
        
        // If sidebar is closed, left to right swipe from edge (open sidebar)
        // Either a long swipe or a quick flick will work
        if ((swipeDistance > swipeThreshold || (swipeDistance > 0 && swipeSpeed > speedThreshold)) 
            && touchStartX < edgeThreshold && !sidebar.classList.contains('active')) {
            sidebar.classList.add('active');
            if (sidebarOverlay) {
                sidebarOverlay.classList.add('active');
                sidebarOverlay.style.display = '';
            }
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Close sidebar when pressing Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Update toggle button icon based on sidebar state
    function updateToggleIcon(isCollapsed) {
        const toggleButton = document.getElementById('toggle-sidebar');
        if (!toggleButton) return;
        
        console.log('Updating toggle icon to', isCollapsed ? 'collapsed' : 'expanded');
        
        // Use arrows that indicate the action that will happen when clicked
        toggleButton.innerHTML = isCollapsed ? 
            // Arrow pointing right (will open sidebar)
            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
            </svg>` : 
            // Arrow pointing left (will collapse sidebar)
            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>`;
    }
    
    // Enhanced window resize handler - fixed for better behavior
    window.addEventListener('resize', debounce(function() {
        const currentIsMobile = window.innerWidth < 768;
        
        // On transition to desktop
        if (!currentIsMobile) {
            // Ensure sidebar is visible
            const sidebarState = localStorage.getItem('sidebar-collapsed') === 'true';
            sidebar.classList.toggle('collapsed', sidebarState);
            sidebar.classList.remove('active');
            sidebar.style.transform = ''; // Remove any inline transform
            
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
            document.body.style.overflow = '';
            updateToggleIcon(sidebarState);
        } 
        // On transition to mobile
        else if (currentIsMobile && sidebar.style.transform === '') {
            sidebar.classList.remove('collapsed');
            sidebar.classList.remove('active');
            
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
            document.body.style.overflow = '';
        }
    }, 200));
    
    console.log('Sidebar initialization complete');
}

// Set logo source based on current path - with improved sizing
function setLogoSource() {
    const basePath = getBasePath();
    const logoElement = document.getElementById('sidebar-logo');
    
    if (logoElement) {
        // Set fixed dimensions to prevent layout shift
        logoElement.width = 32;
        logoElement.height = 32;
        logoElement.style.minWidth = '32px';
        logoElement.style.minHeight = '32px';
        
        const logoPath = `${basePath}/Info/Config/Assets/images/eeprep.png`;
        console.log('Setting logo path to:', logoPath);
        
        logoElement.src = logoPath;
        logoElement.onload = () => {
            console.log('Logo loaded successfully');
            // Ensure dimensions after load
            logoElement.width = 32;
            logoElement.height = 32;
        };
        logoElement.onerror = (e) => {
            console.error('Failed to load logo from:', logoPath);
            
            // Try alternative paths
            const altPaths = [
                `${basePath}/Assets/images/eeprep.png`,
                `${basePath}/images/eeprep.png`,
                `${basePath}/eeprep.png`
            ];
            
            // Try to locate the image in one of the alternative paths
            let pathIndex = 0;
            const tryNextPath = () => {
                if (pathIndex < altPaths.length) {
                    console.log('Trying alternative path:', altPaths[pathIndex]);
                    logoElement.src = altPaths[pathIndex];
                    pathIndex++;
                } else {
                    // If all paths fail, use a fallback text
                    console.log('All image paths failed, using text fallback');
                    logoElement.style.display = 'none';
                    const logoContainer = logoElement.closest('.logo-container');
                    if (logoContainer && !logoContainer.querySelector('.logo-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'logo-fallback';
                        fallback.textContent = 'EE';
                        logoContainer.prepend(fallback);
                    }
                }
            };
            
            logoElement.onerror = tryNextPath;
            tryNextPath();
        };
    } else {
        console.warn('Sidebar logo element not found');
    }
}

// Initialize search functionality
function initializeNavbarSearch() {
    const searchInput = document.getElementById('navbar-search-input') || document.getElementById('sidebar-search-input');
    const searchResultsDropdown = document.getElementById('search-results-dropdown');
    
    if (!searchInput || !searchResultsDropdown) {
        console.error('Search input or dropdown element not found');
        return;
    }
    
    console.log('Initializing search');
    
    let searchTimeout;
    let searchIndex = [];
    let searchIndexLoaded = false;
    
    // Load search index
    const basePath = getBasePath();
    fetch(`${basePath}/Topics/pages.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Flatten the data structure
            if (typeof data === 'object') {
                Object.values(data).forEach(section => {
                    if (Array.isArray(section)) {
                        searchIndex = searchIndex.concat(section);
                    }
                });
                searchIndexLoaded = true;
                console.log('Search index loaded with', searchIndex.length, 'pages');
            } else {
                console.error('Invalid search index format:', data);
            }
        })
        .catch(error => {
            console.error('Error loading search index:', error);
            searchResultsDropdown.innerHTML = '<div class="search-result error"><p>Failed to load search. Please try again later.</p></div>';
        });
    
    // Handle search input
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        
        const query = this.value.trim();
        if (query.length < 2) {
            searchResultsDropdown.classList.remove('active');
            searchResultsDropdown.innerHTML = '';
            return;
        }
        
        // Debounce search to avoid excessive processing
        searchTimeout = setTimeout(() => {
            if (!searchIndexLoaded) {
                searchResultsDropdown.innerHTML = '<div class="search-result"><p>Loading search data...</p></div>';
                searchResultsDropdown.classList.add('active');
                return;
            }
            
            const results = performSearch(query);
            displaySearchResults(results, query);
        }, 300);
    });
    
    // Perform search against the index
    function performSearch(query) {
        if (!searchIndex.length) return [];
        
        const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
        if (terms.length === 0) return [];
        
        return searchIndex
            .filter(page => {
                const titleLower = (page.title || '').toLowerCase();
                const contentLower = (page.content || '').toLowerCase();
                
                return terms.some(term => 
                    titleLower.includes(term) || contentLower.includes(term)
                );
            })
            .sort((a, b) => {
                // Prioritize title matches
                const aTitleMatches = terms.filter(term => (a.title || '').toLowerCase().includes(term)).length;
                const bTitleMatches = terms.filter(term => (b.title || '').toLowerCase().includes(term)).length;
                
                if (aTitleMatches !== bTitleMatches) {
                    return bTitleMatches - aTitleMatches;
                }
                
                // Then content matches
                const aContentMatches = terms.filter(term => (a.content || '').toLowerCase().includes(term)).length;
                const bContentMatches = terms.filter(term => (b.content || '').toLowerCase().includes(term)).length;
                
                return bContentMatches - aContentMatches;
            })
            .map(page => {
                // Create excerpt if content exists
                let excerpt = '';
                if (page.content) {
                    const contentLower = page.content.toLowerCase();
                    const firstTermIndex = Math.min(...terms
                        .map(term => contentLower.indexOf(term))
                        .filter(index => index !== -1));
                    
                    if (firstTermIndex !== Infinity) {
                        // Create excerpt around the first match
                        const start = Math.max(0, firstTermIndex - 30);
                        const end = Math.min(page.content.length, firstTermIndex + 100);
                        excerpt = page.content.substring(start, end).trim();
                        
                        // Add ellipsis if needed
                        if (start > 0) excerpt = '...' + excerpt;
                        if (end < page.content.length) excerpt = excerpt + '...';
                    }
                }
                
                return {
                    title: page.title || 'Untitled Page',
                    url: page.url || '#',
                    excerpt: excerpt
                };
            });
    }
    
    // Display search results
    function displaySearchResults(results, query) {
        if (results.length === 0) {
            searchResultsDropdown.innerHTML = '<div class="search-result"><p>No results found</p></div>';
        } else {
            searchResultsDropdown.innerHTML = results
                .slice(0, 5) // Limit to 5 results
                .map(result => {
                    const title = highlightText(result.title, query);
                    const excerpt = result.excerpt ? highlightText(result.excerpt, query) : '';
                    
                    return `
                    <div class="search-result" data-url="${result.url}">
                        <h4>${title}</h4>
                        ${excerpt ? `<p>${excerpt}</p>` : ''}
                    </div>`;
                })
                .join('') + 
                (results.length > 5 ? 
                    `<div class="search-result search-view-all" data-query="${query}">
                        <p>View all ${results.length} results</p>
                    </div>` : '');
        }
        
        // Explicitly make dropdown visible
        searchResultsDropdown.style.display = 'block';
        searchResultsDropdown.classList.add('active');
        
        // Add click handlers to results
        const resultElements = searchResultsDropdown.querySelectorAll('.search-result');
        resultElements.forEach(el => {
            el.addEventListener('click', function() {
                if (this.classList.contains('search-view-all')) {
                    const query = this.getAttribute('data-query');
                    window.location.href = `${basePath}/search.html?q=${encodeURIComponent(query)}`;
                } else {
                    const url = this.getAttribute('data-url');
                    if (url) window.location.href = `${basePath}/${url}`;
                }
            });
        });
    }
    
    // Highlight search terms in text
    function highlightText(text, query) {
        if (!text) return '';
        
        const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
        let highlightedText = text;
        
        terms.forEach(term => {
            const regex = new RegExp('(' + escapeRegExp(term) + ')', 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="search-highlight">$1</span>');
        });
        
        return highlightedText;
    }
    
    // Escape special characters in string for regex
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Add the navigateRelative function for navigation
function navigateRelative(targetPath) {
    const basePath = getBasePath();
    const fullPath = basePath ? `${basePath}/${targetPath}` : targetPath;
    console.log(`Navigating to: ${fullPath}`);
    window.location.href = fullPath;
    return false;
}

// Make functions available globally
window.getBasePath = getBasePath;
window.navigateRelative = navigateRelative;
window.setLogoSource = setLogoSource;
window.initializeNavbarSearch = initializeNavbarSearch;
window.initializeSidebar = initializeSidebar;


