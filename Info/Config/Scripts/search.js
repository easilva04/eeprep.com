/**
 * Unified Search Module for EEPrep
 * Handles both search UI and functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    initSearchUI();
});

function initSearchUI() {
    const searchContainer = document.querySelector('.search-container');
    const searchButton = document.querySelector('.search-icon');
    const searchInput = document.querySelector('.search-input');
    const searchClose = document.querySelector('.search-close');
    const searchResultsDropdown = document.querySelector('.search-results-dropdown');
    
    if (!searchContainer || !searchButton) {
        return;
    }
    
    // Toggle search input visibility when icon is clicked
    searchButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        searchContainer.classList.add('active');
        if (searchInput) {
            searchInput.focus();
        }
    });
    
    // Close search when close button is clicked
    if (searchClose) {
        searchClose.addEventListener('click', function(e) {
            e.preventDefault();
            searchContainer.classList.remove('active');
            if (searchInput) searchInput.value = '';
            if (searchResultsDropdown) {
                searchResultsDropdown.innerHTML = '';
                searchResultsDropdown.classList.remove('show');
            }
        });
    }
    
    // Handle click outside to close search
    document.addEventListener('click', function(event) {
        if (searchContainer && !searchContainer.contains(event.target)) {
            searchContainer.classList.remove('active');
            if (searchResultsDropdown) {
                searchResultsDropdown.classList.remove('show');
            }
        }
    });
    
    // Handle search input
    if (searchInput && searchResultsDropdown) {
        let searchTimeout;
        
        // Create a SearchEngine instance
        const searchEngine = new SearchEngine();
        
        // Get base path
        const basePath = getBasePath();
        
        // Initialize the search index
        searchEngine.initializeSearchIndex(`${basePath}/Topics/pages.json`)
            .catch(error => console.error('Failed to load search index:', error));
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            
            const query = this.value.trim();
            if (query.length < 2) {
                searchResultsDropdown.innerHTML = '';
                searchResultsDropdown.classList.remove('show');
                return;
            }
            
            // Debounce search to avoid excessive processing
            searchTimeout = setTimeout(() => {
                if (!searchEngine.isIndexLoaded) {
                    searchResultsDropdown.innerHTML = '<div class="search-message">Loading search data...</div>';
                    searchResultsDropdown.classList.add('show');
                    return;
                }
                
                const results = searchEngine.search(query);
                
                if (results.length === 0) {
                    searchResultsDropdown.innerHTML = '<div class="search-message">No results found</div>';
                } else {
                    searchResultsDropdown.innerHTML = results
                        .slice(0, 5) // Limit to 5 results for dropdown
                        .map(result => {
                            return `
                            <div class="search-result-item" data-url="${result.url}">
                                <div class="search-result-title">${result.title}</div>
                                ${result.excerpts.length > 0 ? 
                                    `<div class="search-result-excerpt">${result.excerpts[0]}</div>` : ''}
                            </div>`;
                        })
                        .join('') + 
                        (results.length > 5 ? 
                            `<div class="search-result-more" data-query="${query}">
                                View all ${results.length} results
                            </div>` : '');
                }
                
                searchResultsDropdown.classList.add('show');
                
                // Add click handlers to results
                const resultItems = searchResultsDropdown.querySelectorAll('.search-result-item');
                resultItems.forEach(item => {
                    item.addEventListener('click', function() {
                        const url = this.getAttribute('data-url');
                        if (url) {
                            window.location.href = `${basePath}${url.startsWith('/') ? '' : '/'}${url}`;
                        }
                    });
                });
                
                // Add handler for "view all results"
                const viewAllElem = searchResultsDropdown.querySelector('.search-result-more');
                if (viewAllElem) {
                    viewAllElem.addEventListener('click', function() {
                        const query = this.getAttribute('data-query');
                        window.location.href = `${basePath}/search.html?q=${encodeURIComponent(query)}`;
                    });
                }
            }, 300);
        });
        
        // Handle Enter key in search input
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query.length > 1) {
                    // Navigate to search page with query
                    window.location.href = `${basePath}/search.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }
}

// Helper function to get base path for URLs
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
 * Search engine class that handles indexing and searching
 */
class SearchEngine {
    constructor() {
        this.searchIndex = [];
        this.isIndexLoaded = false;
    }

    // Initialize search index from JSON file
    initializeSearchIndex(indexUrl) {
        return new Promise((resolve, reject) => {
            fetch(indexUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error loading search index! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    // Flatten the data structure if needed
                    if (typeof data === 'object' && !Array.isArray(data)) {
                        Object.values(data).forEach(section => {
                            if (Array.isArray(section)) {
                                this.searchIndex = this.searchIndex.concat(section);
                            }
                        });
                    } else if (Array.isArray(data)) {
                        this.searchIndex = data;
                    }
                    
                    this.isIndexLoaded = true;
                    resolve(this.searchIndex);
                })
                .catch(error => {
                    console.error('Error loading search index:', error);
                    reject(error);
                });
        });
    }

    // Perform search against the index
    search(query) {
        if (!this.isIndexLoaded || !this.searchIndex.length) {
            return [];
        }
        
        if (!query || query.trim().length < 2) {
            return [];
        }
        
        const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
        if (terms.length === 0) return [];
        
        return this.searchIndex
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
                // Create excerpts with context around matches
                const excerpts = this.generateExcerpts(page.content, terms);
                
                return {
                    title: page.title || 'Untitled Page',
                    url: page.url || '#',
                    excerpts: excerpts
                };
            });
    }
    
    // Generate text excerpts with context around matched terms
    generateExcerpts(content, terms) {
        if (!content) return [];
        
        const contentLower = content.toLowerCase();
        const excerpts = [];
        const CONTEXT_LENGTH = 100; // Characters of context around match
        
        terms.forEach(term => {
            let lastIndex = 0;
            let termIndex;
            
            // Find up to 2 occurrences per term
            let count = 0;
            while ((termIndex = contentLower.indexOf(term, lastIndex)) !== -1 && count < 2) {
                const start = Math.max(0, termIndex - CONTEXT_LENGTH);
                const end = Math.min(content.length, termIndex + term.length + CONTEXT_LENGTH);
                
                let excerpt = content.substring(start, end).trim();
                
                // Add ellipsis if needed
                if (start > 0) excerpt = '...' + excerpt;
                if (end < content.length) excerpt = excerpt + '...';
                
                // Highlight term
                excerpt = this.highlightText(excerpt, terms);
                
                excerpts.push(excerpt);
                lastIndex = termIndex + term.length;
                count++;
            }
        });
        
        // Remove duplicates
        return [...new Set(excerpts)];
    }
    
    // Highlight search terms in text
    highlightText(text, terms) {
        if (!text) return '';
        
        // Escape HTML
        let safeText = this.escapeHTML(text);
        
        // Apply highlighting
        terms.forEach(term => {
            const regex = new RegExp('(' + this.escapeRegExp(term) + ')', 'gi');
            safeText = safeText.replace(regex, '<mark>$1</mark>');
        });
        
        return safeText;
    }
    
    // Escape special characters in string for regex
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Escape HTML to prevent XSS
    escapeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
}

// Make SearchEngine class available globally
window.SearchEngine = SearchEngine;
window.initSearchUI = initSearchUI;
window.getBasePath = getBasePath;
