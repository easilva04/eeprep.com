class SearchEngine {
    constructor() {
        this.index = new Map();
    }

    addToIndex(key, value) {
        this.index.set(key.toLowerCase(), value);
    }

    async initializeSearchIndex() {
        try {
            const response = await fetch('/Topics/pages.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const pages = await response.json();

            for (const section in pages) {
                if (Array.isArray(pages[section])) {
                    pages[section].forEach(page => {
                        this.addToIndex(page.title, {
                            title: page.title,
                            url: page.url,
                            excerpts: [page.snippet]
                        });
                    });
                } else {
                    this.addToIndex(pages[section].title, {
                        title: pages[section].title,
                        url: pages[section].url,
                        excerpts: [pages[section].snippet]
                    });
                }
            }
        } catch (error) {
            console.error('Failed to initialize search index:', error);
        }
        return true;
    }

    search(query) {
        return Array.from(this.index.entries())
            .filter(([key]) => key.includes(query.toLowerCase()))
            .map(([_, value]) => value);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load navbar
        const navbarContainer = document.createElement('div');
        const response = await fetch('/components/navbar.html');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        navbarContainer.innerHTML = await response.text();
        document.body.prepend(navbarContainer.firstChild);

        // Setup hamburger menu functionality
        const hamburgerMenu = document.querySelector('.hamburger-menu');
        const sidebar = document.querySelector('.sidebar');

        hamburgerMenu.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            hamburgerMenu.classList.toggle('active');
        });

        // Setup basic search icon functionality
        const searchIcon = document.querySelector('.search-icon');
        const searchContainer = document.querySelector('.search-container');
        const searchInput = document.querySelector('.search-input');

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

        // Setup enhanced search functionality
        const dropdown = document.createElement('div');
        dropdown.className = 'search-dropdown';
        searchContainer.appendChild(dropdown);

        // Remove or wrap SearchEngine usage if it's not defined
        if (typeof SearchEngine === 'undefined') {
            throw new Error('SearchEngine is not defined');
        }

        // Initialize SearchEngine
        window.searchEngine = new SearchEngine();  // Make it global
        await searchEngine.initializeSearchIndex();

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
                const results = searchEngine.search(query);
                displayQuickResults(results, dropdown);
            }, 300);
        });

        function displayQuickResults(results, dropdown) {
            if (results.length === 0) {
                dropdown.innerHTML = '<div class="search-dropdown-item">No results found</div>';
                dropdown.classList.add('active');
                return;
            }

            dropdown.innerHTML = results.map(result => `
                <div class="search-dropdown-item" onclick="window.location.href='${result.url}'">
                    <h4>${result.title}</h4>
                    <p>${truncateSnippet(result.excerpts[0], 100)}</p>
                </div>
            `).join('');
            
            dropdown.classList.add('active');
        }

        function truncateSnippet(snippet, maxLength) {
            if (snippet.length > maxLength) {
                return snippet.substring(0, maxLength) + '...';
            }
            return snippet;
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });

    } catch (error) {
        console.error('Error loading navbar:', error);
    }
});
