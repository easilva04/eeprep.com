/**
 * Component Loader Script
 * Dynamically loads HTML components and handles sidebar functionality
 */

// Global state to track component loading
window.eeprep = window.eeprep || {
    componentsLoaded: {
        sidebar: false,
        search: false
    }
};

// Load components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Load components in sequence
    loadSidebar()
        .then(() => {
            if (document.getElementById('search-container')) {
                return initSearchUI();
            }
        })
        .catch(error => {
            console.error('Error in component loading:', error);
        });
});

// Load the sidebar component
function loadSidebar() {
    return new Promise((resolve, reject) => {
        const container = document.getElementById('sidebar-container');
        if (!container) {
            resolve();
            return;
        }
        
        const basePath = getBasePath();
        
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
                    }, 0);
                    
                    window.eeprep.componentsLoaded.sidebar = true;
                }
                resolve();
            })
            .catch(error => {
                console.error('Error loading sidebar:', error);
                container.innerHTML = `<div class="error-message">Sidebar could not be loaded</div>`;
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

/**
 * Initialize sidebar functionality
 */
function initializeSidebar() {
    // Get sidebar elements
    const sidebar = document.querySelector('.sidebar');
    let sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (!sidebar) {
        return;
    }
    
    // Create toggle button if it doesn't exist
    if (!sidebarToggle && !sidebarToggleBtn) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'sidebar-toggle';
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.setAttribute('aria-label', 'Toggle sidebar');
        toggleBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span class="toggle-text">Close Sidebar</span>
        `;
        document.body.appendChild(toggleBtn);
        
        // Make sure we assign the new button to sidebarToggle
        sidebarToggle = toggleBtn;
    }
    
    // Load saved sidebar state
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState === 'true') {
            sidebar.classList.add('collapsed');
        } else if (savedState === 'false') {
            sidebar.classList.remove('collapsed');
        }
        updateToggleIcons(sidebar.classList.contains('collapsed'));
    }
    
    // Setup toggle button - use a direct onclick to avoid event listener issues
    if (sidebarToggle) {
        sidebarToggle.onclick = function(e) {
            e.preventDefault();
            toggleSidebar();
        };
    }
    
    if (sidebarToggleBtn) {
        sidebarToggleBtn.onclick = function(e) {
            e.preventDefault();
            toggleSidebar();
        };
    }
    
    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.onclick = function(e) {
            e.preventDefault();
            toggleSidebar(true);
        };
    }
    
    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.onclick = function() {
            closeSidebar();
        };
    }
    
    // Initialize dropdown toggles
    initializeDropdowns();
    
    // Handle window resize
    window.addEventListener('resize', function() {
        const isMobileNow = window.innerWidth < 768;
        
        // Switching from mobile to desktop
        if (!isMobileNow && isMobile) {
            sidebar.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
            
            // Restore saved collapsed state
            const savedState = localStorage.getItem('sidebar-collapsed');
            if (savedState === 'true') {
                sidebar.classList.add('collapsed');
            } else if (savedState === 'false') {
                sidebar.classList.remove('collapsed');
            }
        }
        // Switching from desktop to mobile
        else if (isMobileNow && !isMobile) {
            sidebar.classList.remove('collapsed');
            sidebar.classList.remove('active');
        }
        
        // Update the isMobile state
        isMobile = isMobileNow;
        
        updateToggleIcons(sidebar.classList.contains('collapsed'));
    });
    
    // Add keyboard navigation
    setupKeyboardNavigation();
}

/**
 * Initialize dropdown toggles in the sidebar
 */
function initializeDropdowns() {
    const dropdownToggles = document.querySelectorAll('.sidebar-link.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        // Remove any existing listeners
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        newToggle.addEventListener('click', function(e) {
            e.preventDefault();
            
            const sidebar = document.querySelector('.sidebar');
            const isMobile = window.innerWidth < 768;
            const isCollapsed = sidebar && sidebar.classList.contains('collapsed') && !isMobile;
            
            if (isCollapsed) {
                // For collapsed sidebar on desktop, we rely on CSS hover
                return;
            }
            
            const item = this.closest('.sidebar-item');
            if (item) {
                // Toggle active class
                item.classList.toggle('active');
                
                // If we're opening this one, close other open dropdowns
                if (item.classList.contains('active')) {
                    const siblings = item.parentElement.querySelectorAll('.sidebar-item.active');
                    siblings.forEach(sibling => {
                        if (sibling !== item) {
                            sibling.classList.remove('active');
                        }
                    });
                }
            }
        });
    });
}

/**
 * Toggle sidebar state
 * @param {boolean} forceMobile - Force mobile behavior
 */
function toggleSidebar(forceMobile = false) {
    // Get sidebar element
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (!sidebar) {
        return;
    }
    
    const isMobile = window.innerWidth < 768 || forceMobile;
    
    if (isMobile) {
        // On mobile, toggle active class (slide in/out)
        sidebar.classList.toggle('active');
        
        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle('active');
        }
        
        // Prevent body scrolling when sidebar is open
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    } else {
        // On desktop, toggle collapsed class
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        
        // Save state
        localStorage.setItem('sidebar-collapsed', isCollapsed);
        
        // Ensure toggle button is visible and update icons
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.style.visibility = 'visible';
            sidebarToggle.style.opacity = '1';
        }
        
        updateToggleIcons(isCollapsed);
    }
}

/**
 * Close the sidebar (for mobile)
 */
function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (sidebar) {
        sidebar.classList.remove('active');
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
    }
    
    document.body.style.overflow = '';
}

/**
 * Update toggle button icons based on sidebar state
 */
function updateToggleIcons(isCollapsed) {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    
    // Icon for when sidebar is open (to collapse it)
    const collapseIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span class="toggle-text">Close Sidebar</span>
    `;
    
    // Icon for when sidebar is collapsed (to expand it) - just the arrow
    const expandIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
    `;
    
    if (sidebarToggle) {
        sidebarToggle.innerHTML = isCollapsed ? expandIcon : collapseIcon;
        
        // Move toggle button when sidebar is collapsed
        if (isCollapsed) {
            sidebarToggle.style.left = '45px';
            sidebarToggle.classList.add('collapsed');
        } else {
            sidebarToggle.style.left = '210px';
            sidebarToggle.classList.remove('collapsed');
        }
    }
    
    if (sidebarToggleBtn) {
        sidebarToggleBtn.innerHTML = isCollapsed ? expandIcon : collapseIcon;
    }
}

// Add the navigateRelative function for navigation
function navigateRelative(targetPath) {
    const basePath = getBasePath();
    const fullPath = basePath ? `${basePath}/${targetPath}` : targetPath;
    window.location.href = fullPath;
    return false;
}

// Make functions available globally
window.getBasePath = getBasePath;
window.navigateRelative = navigateRelative;
window.initializeSidebar = initializeSidebar;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.updateToggleIcons = updateToggleIcons;


