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

// Function to initialize sidebar behavior
function initializeSidebar() {
    console.log('Initializing sidebar behavior');
    
    // Toggle sidebar visibility
    const toggleButton = document.getElementById('toggle-sidebar');
    if (toggleButton) {
        toggleButton.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar-container');
            if (sidebar) {
                sidebar.classList.toggle('collapsed');
                
                // Don't toggle active class on desktop
                if (window.innerWidth < 768 && !sidebar.classList.contains('active')) {
                    sidebar.classList.add('active');
                }
                
                // Update button icon based on state
                if (sidebar.classList.contains('collapsed')) {
                    // On desktop the button will be hidden by CSS
                    // On mobile we update the icon
                    toggleButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    `;
                } else {
                    toggleButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    `;
                }
                
                // Save collapsed state to localStorage only on desktop
                if (window.innerWidth >= 768) {
                    localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
                    
                    // Ensure proper styling for toggle button on desktop
                    if (sidebar.classList.contains('collapsed')) {
                        toggleButton.style.opacity = '0';
                        toggleButton.style.visibility = 'hidden';
                    } else {
                        toggleButton.style.opacity = '1';
                        toggleButton.style.visibility = 'visible';
                    }
                }
                
                console.log('Sidebar toggled:', sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
            }
        });
    }
    
    // Mobile menu toggle with improved behavior
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar-container');
            if (sidebar) {
                sidebar.classList.toggle('active');
                
                // Toggle body scroll
                if (sidebar.classList.contains('active')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
                
                if (sidebarOverlay) {
                    sidebarOverlay.classList.toggle('active');
                }
                console.log('Mobile sidebar toggled:', sidebar.classList.contains('active') ? 'active' : 'inactive');
            }
        });
    }
    
    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar-container');
            if (sidebar) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Close sidebar when pressing Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const sidebar = document.getElementById('sidebar-container');
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove('active');
                }
                document.body.style.overflow = '';
            }
        }
    });

    // Handle dropdowns in sidebar
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const item = this.closest('.sidebar-item');
            item.classList.toggle('active');
            
            // Close other dropdowns
            if (item.classList.contains('active')) {
                dropdownToggles.forEach(otherToggle => {
                    const otherItem = otherToggle.closest('.sidebar-item');
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
            }
        });
    });
    
    // Search functionality
    const searchInput = document.getElementById('sidebar-search-input');
    const searchButton = document.getElementById('search-button');
    const searchOverlay = document.getElementById('search-overlay');
    const searchClose = document.getElementById('search-close');
    
    if (searchInput && searchButton && searchOverlay) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });
        
        searchButton.addEventListener('click', function() {
            performSearch(searchInput.value);
        });
        
        if (searchClose) {
            searchClose.addEventListener('click', function() {
                searchOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    }
    
    function performSearch(query) {
        if (!query.trim()) return;
        
        const searchOverlay = document.getElementById('search-overlay');
        const searchResultsDropdown = document.getElementById('search-results-dropdown');
        
        if (searchOverlay) {
            searchOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            
            // If we have search results dropdown, clear it
            if (searchResultsDropdown) {
                searchResultsDropdown.innerHTML = '<div class="search-result"><p>Searching...</p></div>';
            }
            
            // Initialize search results
            // This would normally call a search function to populate results
            console.log('Performing search for:', query);
        }
    }
    
    // Set current year in footer
    const yearElements = document.querySelectorAll('#current-year, #footer-year');
    yearElements.forEach(el => {
        if (el) el.textContent = new Date().getFullYear();
    });
    
    // Initialize theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            if (window.toggleTheme) {
                window.toggleTheme();
            } else {
                document.body.classList.toggle('dark-mode');
                localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
            }
            console.log('Theme toggled to:', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    }
    
    // Apply stored theme if available
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

// Handle window resize - Improved to manage responsive behavior properly
window.addEventListener('resize', debounce(function() {
    // Adjust sidebar based on screen size
    const sidebar = document.getElementById('sidebar-container');
    const toggleButton = document.getElementById('toggle-sidebar');
    
    if (sidebar) {
        if (window.innerWidth < 768) {
            // On mobile
            if (sidebar.classList.contains('collapsed') && !sidebar.classList.contains('active')) {
                // When transitioning to mobile, ensure collapsed sidebar is hidden if not active
                sidebar.classList.remove('collapsed');
            }
            
            // Ensure toggle button is visible on mobile
            if (toggleButton) {
                toggleButton.style.opacity = '1';
                toggleButton.style.visibility = 'visible';
            }
        } else {
            // On desktop
            const overlay = document.getElementById('sidebar-overlay');
            if (overlay) {
                overlay.classList.remove('active');
            }
            document.body.style.overflow = '';
            
            // Respect saved collapsed state on desktop
            const sidebarState = localStorage.getItem('sidebar-collapsed');
            if (sidebarState === 'true') {
                sidebar.classList.add('collapsed');
                // Also hide toggle button on desktop when collapsed
                if (toggleButton) {
                    toggleButton.style.opacity = '0';
                    toggleButton.style.visibility = 'hidden';
                }
            } else if (sidebarState === 'false') {
                sidebar.classList.remove('collapsed');
                // Show toggle button when expanded
                if (toggleButton) {
                    toggleButton.style.opacity = '1';
                    toggleButton.style.visibility = 'visible';
                }
            }
        }
    }
}, 250));

// Set logo source based on current path
function setLogoSource() {
    const basePath = getBasePath();
    const logoElement = document.getElementById('sidebar-logo');
    if (logoElement) {
        logoElement.src = `${basePath}/Info/Config/Assets/images/eeprep.png`;
        logoElement.onload = () => console.log('Logo loaded successfully');
        logoElement.onerror = () => console.error('Failed to load logo');
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


