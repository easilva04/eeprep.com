/**
 * Component Loader Script
 * Dynamically loads HTML components like navigation, footer, etc.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Load navigation (includes footer content)
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        // Use relative path with base URL detection
        const basePath = getBasePath();
        fetch(`${basePath}/Info/Config/Components/navigation.html`)
            .then(response => response.text())
            .then(html => {
                sidebarContainer.innerHTML = html;
                // Initialize navigation functionality after loading
                initializeSidebar();
            })
            .catch(error => {
                console.error('Error loading navigation:', error);
                sidebarContainer.innerHTML = '<p>Navigation could not be loaded</p>';
            });
    }

    // Load search component
    const searchContainer = document.getElementById('search-container');
    if (searchContainer) {
        const basePath = getBasePath();
        fetch(`${basePath}/Info/Config/Components/search.html`)
            .then(response => response.text())
            .then(html => {
                searchContainer.innerHTML = html;
                // Initialize search functionality after loading
                if (typeof initializeSearch === 'function') {
                    initializeSearch();
                }
            })
            .catch(error => {
                console.error('Error loading search:', error);
                searchContainer.innerHTML = '<p>Search could not be loaded</p>';
            });
    }
});

// Helper function to determine base path
function getBasePath() {
    // Get the current path and calculate the relative path to root
    const pathSegments = window.location.pathname.split('/').filter(segment => segment !== '');
    let basePath = '';
    
    // Skip for domain root
    if (pathSegments.length === 0) {
        return '';
    }
    
    // For each level deep, add a "../" to navigate back to root
    for (let i = 0; i < pathSegments.length - 1; i++) {
        basePath += '../';
    }
    
    // If no path segments (at root), return empty string
    return basePath === '' ? '' : basePath.slice(0, -1); // Remove trailing slash
}

// Function to initialize sidebar behavior
function initializeSidebar() {
    const toggleButton = document.getElementById('toggle-sidebar');
    if (toggleButton) {
        toggleButton.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar-container');
            sidebar.classList.toggle('collapsed');
        });
    }

    // Initialize dropdown functionality
    const dropdowns = document.querySelectorAll('.dropdown-toggle');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', function(e) {
            e.preventDefault();
            this.parentElement.classList.toggle('active');
            const dropdownContent = this.nextElementSibling;
            if (dropdownContent.style.maxHeight) {
                dropdownContent.style.maxHeight = null;
                setTimeout(() => {
                    dropdownContent.style.display = 'none';
                }, 300); // Match transition duration
            } else {
                dropdownContent.style.display = 'block';
                dropdownContent.style.maxHeight = dropdownContent.scrollHeight + "px";
            }
        });
    });
}


