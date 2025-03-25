document.addEventListener('DOMContentLoaded', initializeSearch);

function initializeSearch() {
    // Look for any search input on the page
    const searchInputs = document.querySelectorAll('.search-input, .search-input-large');
    
    if (searchInputs.length === 0) return;
    
    const searchEngine = new SearchEngine();
    
    // Initialize search index
    searchEngine.initializeSearchIndex('Topics/pages.json')
        .then(() => {
            console.log('Search index loaded');
            searchInputs.forEach(input => {
                input.disabled = false;
                input.placeholder = "Search topics...";
                
                // Get the related dropdown for this input
                const resultsDropdown = input.closest('.search-wrapper').nextElementSibling || 
                                       document.querySelector('.search-results-dropdown');
                
                if (resultsDropdown) {
                    setupSearchHandlers(input, resultsDropdown, searchEngine);
                }
            });
        })
        .catch(err => {
            console.error('Failed to load search index:', err);
            searchInputs.forEach(input => {
                input.placeholder = "Search unavailable";
            });
        });
}

function setupSearchHandlers(searchInput, resultsDropdown, searchEngine) {
    // Debounce function to limit search frequency
    const debounce = (func, delay) => {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    };
    
    // Debounced search handler
    const handleSearch = debounce(() => {
        const query = searchInput.value.trim();
        
        if(query.length < 2) { 
            resultsDropdown.classList.remove('show'); 
            return; 
        }
        
        const results = searchEngine.search(query);
        
        if (results.length) {
            resultsDropdown.innerHTML = results
                .map(r => `
                    <a href="${r.url}" class="search-result-item">
                        <div class="search-result-title">${r.title}</div>
                        <div class="search-result-snippet">${r.snippet || 'View this topic'}</div>
                    </a>
                `).join('');
        } else {
            resultsDropdown.innerHTML = `
                <div class="search-no-results">
                    <p>No results found for "${query}"</p>
                    <p>Try different keywords or browse topics</p>
                </div>
            `;
        }
        
        resultsDropdown.classList.add('show');
    }, 300);
    
    // Add input event listener
    searchInput.addEventListener('input', handleSearch);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsDropdown.contains(e.target)) {
            resultsDropdown.classList.remove('show');
        }
    });
    
    // Add keyboard navigation for search results
    searchInput.addEventListener('keydown', (e) => {
        if (!resultsDropdown.classList.contains('show')) return;
        
        const items = resultsDropdown.querySelectorAll('.search-result-item');
        if (!items.length) return;
        
        let activeItem = resultsDropdown.querySelector('.search-result-item.active');
        const activeIndex = Array.from(items).indexOf(activeItem);
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (activeItem) {
                    activeItem.classList.remove('active');
                    const nextIndex = (activeIndex + 1) % items.length;
                    items[nextIndex].classList.add('active');
                } else {
                    items[0].classList.add('active');
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (activeItem) {
                    activeItem.classList.remove('active');
                    const prevIndex = (activeIndex - 1 + items.length) % items.length;
                    items[prevIndex].classList.add('active');
                } else {
                    items[items.length - 1].classList.add('active');
                }
                break;
            case 'Enter':
                if (activeItem) {
                    e.preventDefault();
                    window.location.href = activeItem.href;
                }
                break;
            case 'Escape':
                resultsDropdown.classList.remove('show');
                searchInput.blur();
                break;
        }
    });
}

// SearchEngine class remains the same
class SearchEngine {
    constructor() { 
        this.searchIndex = []; 
        this.isIndexLoaded = false; 
    }
    
    initializeSearchIndex(url) {
        return fetch(url)
          .then(res => {
              if (!res.ok) throw new Error('Failed to load search index');
              return res.json();
          })
          .then(data => { 
              this.searchIndex = data; 
              this.isIndexLoaded = true; 
              return data;
          });
    }
    
    search(query) {
        if (!this.isIndexLoaded) return [];
        
        const words = query.toLowerCase().split(/\s+/);
        
        return this.searchIndex
            .filter(page => {
                const title = (page.title || "").toLowerCase();
                const content = (page.content || "").toLowerCase();
                
                // Each word must match somewhere in title or content
                return words.every(word => 
                    title.includes(word) || content.includes(word)
                );
            })
            .map(page => {
                // Generate snippet with highlighted terms
                let snippet = page.content || "";
                if (snippet.length > 150) {
                    // Find the first occurrence of any search term
                    const firstMatchIndex = Math.min(...words
                        .map(word => snippet.toLowerCase().indexOf(word))
                        .filter(index => index !== -1));
                    
                    // Create snippet centered around the first match
                    const start = Math.max(0, firstMatchIndex - 60);
                    snippet = (start > 0 ? '...' : '') + 
                              snippet.substr(start, 150) + 
                              (snippet.length > start + 150 ? '...' : '');
                }
                
                return {
                    ...page,
                    snippet
                };
            })
            .sort((a, b) => {
                // Prioritize title matches
                const aInTitle = words.every(word => 
                    (a.title || "").toLowerCase().includes(word)
                );
                const bInTitle = words.every(word => 
                    (b.title || "").toLowerCase().includes(word)
                );
                
                if (aInTitle && !bInTitle) return -1;
                if (!aInTitle && bInTitle) return 1;
                return 0;
            })
            .slice(0, 10); // Limit to 10 results
    }
}
