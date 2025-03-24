/**
 * Component Loader Script
 * Dynamically loads HTML components like navigation, footer, etc.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Load navigation
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        fetch('/Info/Config/Components/navigation.html')
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

    // Load footer
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        fetch('/Info/Config/Components/footer.html')
            .then(response => response.text())
            .then(html => {
                footerPlaceholder.innerHTML = html;
            })
            .catch(error => {
                console.error('Error loading footer:', error);
                footerPlaceholder.innerHTML = '<footer><p>© EEPrep. All rights reserved.</p></footer>';
            });
    }

    // Load search component
    const searchContainer = document.getElementById('search-container');
    if (searchContainer) {
        fetch('/Info/Config/Components/search.html')
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
            if (dropdownContent.style.display === 'block') {
                dropdownContent.style.display = 'none';
            } else {
                dropdownContent.style.display = 'block';
            }
        });
    });
}


