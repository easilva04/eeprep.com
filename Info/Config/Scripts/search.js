/**
 * Search functionality for EEPrep
 * Handles searching content and displaying results
 */

class SearchEngine {
    constructor() {
        this.searchIndex = [];
        this.isIndexLoaded = false;
    }

    /**
     * Initialize search index from JSON file
     * @param {string} indexUrl - URL to the search index JSON file
     * @returns {Promise} - Promise that resolves when index is loaded
     */
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
                    console.log('Search index loaded with', this.searchIndex.length, 'pages');
                    resolve(this.searchIndex);
                })
                .catch(error => {
                    console.error('Error loading search index:', error);
                    reject(error);
                });
        });
    }

    /**
     * Perform search against the index
     * @param {string} query - The search query
     * @returns {Array} - Array of search results
     */
    search(query) {
        if (!this.isIndexLoaded || !this.searchIndex.length) {
            console.warn('Search index not loaded');
            return [];
        }
        
        if (!query || query.trim().length < 2) {
            return [];
        }
        
        const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
        if (terms.length === 0) return [];
        
        const results = this.searchIndex
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
                // Extract matched terms
                const matchedTerms = terms.filter(term => 
                    (page.title || '').toLowerCase().includes(term) || 
                    (page.content || '').toLowerCase().includes(term)
                );
                
                // Create excerpts with context around matches
                const excerpts = this.generateExcerpts(page.content, terms);
                
                return {
                    title: page.title || 'Untitled Page',
                    url: page.url || '#',
                    matchedTerms: matchedTerms,
                    excerpts: excerpts
                };
            });
            
        return results;
    }
    
    /**
     * Generate text excerpts with context around matched terms
     * @param {string} content - The content to extract excerpts from
     * @param {Array} terms - Search terms to highlight
     * @returns {Array} - Array of excerpt strings
     */
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
    
    /**
     * Highlight search terms in text
     * @param {string} text - Text to highlight terms in
     * @param {Array} terms - Terms to highlight
     * @returns {string} - Text with highlighted terms
     */
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
    
    /**
     * Escape special characters in string for regex
     * @param {string} string - String to escape
     * @returns {string} - Escaped string
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * Escape HTML to prevent XSS
     * @param {string} html - String potentially containing HTML
     * @returns {string} - Escaped string
     */
    escapeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
}

// Create global instance
window.SearchEngine = SearchEngine;

// Initialize search functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // If initializeSearch is called externally, leave it to be handled by the component
    console.log('Search script loaded');
});
