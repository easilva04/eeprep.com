document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load navbar
        const navbarContainer = document.createElement('div');
        const response = await fetch('/components/navbar.html');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        navbarContainer.innerHTML = await response.text();
        document.body.prepend(navbarContainer.firstChild);
        console.log("Navbar injected");

        // Ensure sidebar exists: if not, fetch and insert it using an absolute URL
        let sidebar = document.getElementById('sidebar-container');
        if (!sidebar) {
            console.log("Sidebar not found, attempting to inject sidebar");
            const sidebarResponse = await fetch(new URL('/components/sidebar.html', window.location.origin));
            if (!sidebarResponse.ok) throw new Error(`HTTP error! status: ${sidebarResponse.status}`);
            const sidebarHTML = await sidebarResponse.text();
            const wrapper = document.createElement('div');
            wrapper.innerHTML = sidebarHTML;
            document.body.insertAdjacentElement('afterbegin', wrapper.firstChild);
            sidebar = document.getElementById('sidebar-container');
            console.log("Sidebar injected");
        } else {
            console.log("Sidebar already present");
        }

        // Ensure sidebar is collapsed on non-index pages
        if (window.location.pathname !== '/' && !window.location.pathname.endsWith('/index.html')) {
            if (sidebar && !sidebar.classList.contains('collapsed')) {
                sidebar.classList.add('collapsed');
                const hamburgerMenu = document.querySelector('.hamburger-menu');
                if (hamburgerMenu) {
                    hamburgerMenu.classList.remove('active');
                }
            }
        }

        // Setup hamburger menu functionality with toggle system
        const hamburgerMenu = document.querySelector('.hamburger-menu');
        if (hamburgerMenu && sidebar) {
            hamburgerMenu.addEventListener('click', function () {
                const isCollapsed = sidebar.classList.toggle('collapsed');
                // When sidebar is not collapsed (open), mark hamburger as active
                hamburgerMenu.classList.toggle('active', !isCollapsed);
            });
        } else {
            console.error("Hamburger menu or sidebar not found");
        }

        // Add Escape key listener to close sidebar if open
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && sidebar && !sidebar.classList.contains('collapsed')) {
                sidebar.classList.add('collapsed');
                if (hamburgerMenu) {
                    hamburgerMenu.classList.remove('active');
                }
            }
        });

        // Setup search functionality
        setupSearch();

    } catch (error) {
        console.error('Error loading navbar:', error);
    }
});

function setupSearch() {
    const searchIcon = document.querySelector('.search-icon');
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.querySelector('.search-input');
    
    if (!searchIcon || !searchContainer || !searchInput) {
        console.warn('Search elements not found');
        return;
    }

    searchIcon.addEventListener('click', () => {
        searchContainer.classList.toggle('active');
        if (searchContainer.classList.contains('active')) {
            searchInput.focus();
        }
    });

    // Handle search input enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `/components/search.html?q=${encodeURIComponent(query)}`;
            }
        }
    });

    // Setup enhanced search dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'search-dropdown';
    searchContainer.appendChild(dropdown);

    // Check if global search engine exists or create minimal version
    if (typeof window.searchEngine === 'undefined') {
        console.warn('Using minimal search engine implementation');
        window.searchEngine = {
            quickSearch: (query) => {
                return [{
                    title: 'Search Results',
                    url: `/components/search.html?q=${encodeURIComponent(query)}`,
                    excerpt: `View all results for "${query}"`
                }];
            }
        };
    }

    // Handle search input changes
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value.trim();
        
        if (query.length < 2) {
            dropdown.classList.remove('active');
            dropdown.innerHTML = '';
            return;
        }

        searchTimeout = setTimeout(() => {
            const results = window.searchEngine.quickSearch(query);
            displayQuickResults(results, dropdown);
        }, 300);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

function displayQuickResults(results, dropdown) {
    if (!results || results.length === 0) {
        dropdown.innerHTML = '<div class="search-dropdown-item">No results found</div>';
        dropdown.classList.add('active');
        return;
    }

    dropdown.innerHTML = results.map(result => `
        <div class="search-dropdown-item" onclick="window.location.href='${result.url}'">
            <h4>${result.title}</h4>
            <p>${truncateSnippet(result.excerpt || '', 100)}</p>
        </div>
    `).join('');
    
    dropdown.classList.add('active');
}

function truncateSnippet(snippet, maxLength) {
    if (!snippet) return '';
    if (snippet.length > maxLength) {
        return snippet.substring(0, maxLength) + '...';
    }
    return snippet;
}