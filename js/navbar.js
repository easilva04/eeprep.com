class SearchEngine {
    constructor() {
        this.index = new Map();
    }

    addToIndex(key, value) {
        this.index.set(key.toLowerCase(), value);
    }

    async initializeSearchIndex() {
        // Initialize with some basic content
        this.addToIndex('home', {
            title: 'Home',
            url: '/',
            excerpts: ['Main page of EE Prep']
        });
        // Add more index entries as needed
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
        if (hamburgerMenu && sidebar) {  // Added check
            hamburgerMenu.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                hamburgerMenu.classList.toggle('active');
            });
        } else {
            console.error("Hamburger menu or sidebar not found");
        }

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