// Add this function at the top level, outside the class
async function fetchPageContent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`HTTP error fetching ${url}: ${response.status}`);
            return '';
        }
        const text = await response.text();
        return text;
    } catch (error) {
        console.warn(`Error fetching ${url}:`, error);
        return '';
    }
}

class SearchEngine {
    constructor() {
        this.searchIndex = new Map();
        this.contentMap = new Map();
        this.indexStatus = 'uninitialized';
        this.searchWorker = null;
        this.indexedDBSupport = this.checkIndexedDBSupport();
        this.setupWorker();
        
        // Add initialization error recovery
        window.addEventListener('error', (event) => {
            if (event.target === this) {
                console.error('SearchEngine error:', event.error);
                this.indexStatus = 'failed';
                this.notifyIndexStatus('Search failed to initialize');
            }
        });
    }
    
    setupWorker() {
        // Create search worker if supported
        if (window.Worker) {
            try {
                // Lazy-create worker only when needed
                this.createWorker = () => {
                    if (!this.searchWorker) {
                        const workerBlob = new Blob([`
                            self.onmessage = function(e) {
                                const { action, data } = e.data;
                                
                                if (action === 'search') {
                                    const { query, searchIndex, contentMap } = data;
                                    const results = performSearch(query, searchIndex, contentMap);
                                    self.postMessage({ action: 'searchResults', results });
                                }
                                
                                function performSearch(query, searchIndex, contentMap) {
                                    // Search implementation here
                                    const searchTerms = generateSearchTerms(query);
                                    const results = new Map();
                                    
                                    searchTerms.forEach(term => {
                                        const matches = searchTerm(term, searchIndex, contentMap);
                                        matches.forEach(match => {
                                            if (!results.has(match.path)) {
                                                results.set(match.path, {
                                                    path: match.path,
                                                    title: match.title,
                                                    content: match.content,
                                                    score: 0,
                                                    excerpts: new Set(),
                                                    matchedTerms: new Set()
                                                });
                                            }
                                            const result = results.get(match.path);
                                            result.score += match.score;
                                            match.excerpts.forEach(e => result.excerpts.add(e));
                                            result.matchedTerms.add(term);
                                        });
                                    });
                                    
                                    return Array.from(results.values())
                                        .sort((a, b) => b.score - a.score)
                                        .map(result => ({
                                            title: result.title,
                                            url: result.path,
                                            excerpts: Array.from(result.excerpts).slice(0, 3),
                                            score: result.score,
                                            matchedTerms: Array.from(result.matchedTerms)
                                        }));
                                }
                                
                                function generateSearchTerms(query) {
                                    const terms = new Set();
                                    const words = query.toLowerCase().trim().split(/\\s+/);
                                    
                                    if (words.length > 1) {
                                        terms.add(words.join(' '));
                                    }
                                    
                                    words.forEach(word => {
                                        if (word.length >= 2) {
                                            terms.add(word);
                                        }
                                    });
                                    
                                    for (let i = 0; i < words.length - 1; i++) {
                                        terms.add(\`\${words[i]} \${words[i + 1]}\`);
                                    }
                                    
                                    return Array.from(terms);
                                }
                                
                                function searchTerm(term, searchIndex, contentMap) {
                                    const results = new Map();
                                    
                                    contentMap.forEach((data, path) => {
                                        const content = data.content.toLowerCase();
                                        const title = data.title.toLowerCase();
                                        
                                        let score = 0;
                                        if (title.includes(term)) {
                                            score += 10;
                                        }
                                        
                                        const contentMatches = content.split(term).length - 1;
                                        score += contentMatches;
                                        
                                        if (score > 0) {
                                            results.set(path, {
                                                path: path,
                                                title: data.title,
                                                content: data.content,
                                                score: score,
                                                excerpts: [generateExcerpt(data.content, [term])]
                                            });
                                        }
                                    });
                                    
                                    return Array.from(results.values());
                                }
                                
                                function generateExcerpt(content, searchWords) {
                                    const excerptLength = 100;
                                    const contentLower = content.toLowerCase();
                                    let bestIndex = -1;
                                    let bestScore = 0;
                                    
                                    searchWords.forEach(word => {
                                        const index = contentLower.indexOf(word);
                                        if (index !== -1) {
                                            const score = searchWords.reduce((acc, w) =>
                                                acc + (contentLower.substring(index, index + excerptLength).includes(w) ? 1 : 0), 0);
                                            if (score > bestScore) {
                                                bestScore = score;
                                                bestIndex = index;
                                            }
                                        }
                                    });
                                    
                                    if (bestIndex === -1) {
                                        return content.substring(0, excerptLength) + '...';
                                    }
                                    
                                    const start = Math.max(0, bestIndex - 20);
                                    const excerpt = content.substring(start, start + excerptLength);
                                    
                                    return (start > 0 ? '...' : '') + excerpt + (start + excerptLength < content.length ? '...' : '');
                                }
                            };
                        `], { type: 'application/javascript' });
                        
                        this.searchWorker = new Worker(URL.createObjectURL(workerBlob));
                        this.searchWorker.onmessage = (e) => {
                            const { action, results } = e.data;
                            if (action === 'searchResults') {
                                if (this.searchCallback) {
                                    this.searchCallback(results);
                                    this.searchCallback = null;
                                }
                            }
                        };
                    }
                    return this.searchWorker;
                };
                console.log('Web worker support available for search');
            } catch (error) {
                console.warn('Failed to create search worker:', error);
            }
        }
    }
    
    checkIndexedDBSupport() {
        let support = false;
        if ('indexedDB' in window) {
            try {
                // Use a more reliable test
                support = !!window.indexedDB;
            } catch (e) {
                support = false;
                console.warn('IndexedDB not supported:', e);
            }
        }
        return support;
    }

    async initializeSearchIndex(pages) {
        try {
            this.indexStatus = 'initializing';
            this.notifyIndexStatus('Loading search index...');
            
            // Try to load from IndexedDB first
            if (this.indexedDBSupport) {
                const loadedIndex = await this.loadFromIndexedDB();
                if (loadedIndex && loadedIndex.searchIndex && loadedIndex.contentMap) {
                    this.searchIndex = loadedIndex.searchIndex;
                    this.contentMap = loadedIndex.contentMap;
                    this.indexStatus = 'ready';
                    this.notifyIndexStatus('Search index loaded from cache');
                    console.log('Search index loaded from IndexedDB');
                    return true;
                }
            }
            
            // If not found in IndexedDB, build from scratch
            if (!pages || !Array.isArray(pages) || pages.length === 0) {
                pages = await this.fetchPages();
                
                if (!pages || pages.length === 0) {
                    throw new Error('No pages available to index');
                }
            }
            
            this.notifyIndexStatus('Building search index...');
            this.contentMap = await this.fetchAllContent(pages);
            
            if (this.contentMap.size === 0) {
                throw new Error('Failed to fetch page content');
            }
            
            this.searchIndex = this.buildSearchIndex(this.contentMap);
            
            // Save to IndexedDB for next time
            if (this.indexedDBSupport) {
                this.saveToIndexedDB();
            }
            
            this.indexStatus = 'ready';
            this.notifyIndexStatus('Search index ready');
            console.log('Search index built:', this.searchIndex.size, 'terms indexed');
            return true;
        } catch (error) {
            this.indexStatus = 'failed';
            this.notifyIndexStatus('Search index failed to load');
            console.error('Failed to initialize search index:', error);
            return false;
        }
    }
    
    notifyIndexStatus(message) {
        // Notify any UI elements that may be showing index status
        const event = new CustomEvent('searchIndexStatus', { 
            detail: { message, status: this.indexStatus } 
        });
        document.dispatchEvent(event);
    }
    
    async loadFromIndexedDB() {
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open('searchIndexDB', 1);
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('searchIndex')) {
                        db.createObjectStore('searchIndex');
                    }
                };
                
                request.onerror = () => {
                    console.warn('Error opening IndexedDB');
                    resolve(null);
                };
                
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    const transaction = db.transaction(['searchIndex'], 'readonly');
                    const objectStore = transaction.objectStore('searchIndex');
                    
                    const getIndex = objectStore.get('searchIndexData');
                    
                    getIndex.onsuccess = () => {
                        if (getIndex.result) {
                            const timestamp = getIndex.result.timestamp;
                            const now = Date.now();
                            const oneDay = 24 * 60 * 60 * 1000;
                            
                            // Invalidate cache after 1 day
                            if (now - timestamp < oneDay) {
                                resolve(getIndex.result);
                            } else {
                                console.log('Search index cache expired');
                                resolve(null);
                            }
                        } else {
                            resolve(null);
                        }
                    };
                    
                    getIndex.onerror = () => {
                        console.warn('Error reading from IndexedDB');
                        resolve(null);
                    };
                };
            } catch (error) {
                console.warn('IndexedDB access error:', error);
                resolve(null);
            }
        });
    }
    
    saveToIndexedDB() {
        try {
            const request = indexedDB.open('searchIndexDB', 1);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['searchIndex'], 'readwrite');
                const objectStore = transaction.objectStore('searchIndex');
                
                // Store serialized data with timestamp
                const data = {
                    searchIndex: this.searchIndex,
                    contentMap: this.contentMap,
                    timestamp: Date.now()
                };
                
                objectStore.put(data, 'searchIndexData');
                
                transaction.oncomplete = () => {
                    console.log('Search index saved to IndexedDB');
                };
                
                transaction.onerror = () => {
                    console.warn('Error saving to IndexedDB');
                };
            };
        } catch (error) {
            console.warn('Error accessing IndexedDB for save:', error);
        }
    }

    async fetchPages() {
        try {
            const response = await fetch('../Topics/pages.json');
            if (!response.ok) {
                throw new Error(`HTTP error fetching pages.json: ${response.status}`);
            }
            const pagesData = await response.json();
            return Object.values(pagesData).flat();
        } catch (error) {
            console.error('Failed to fetch pages:', error);
            return [];
        }
    }

    async fetchAllContent(pages) {
        const contentMap = new Map();
        const MAX_CONCURRENT = 5; // Limit concurrent requests
        
        // Function to process a batch of pages
        const processBatch = async (batch) => {
            const batchResults = await Promise.all(
                batch.map(async page => {
                    try {
                        console.log('Fetching:', page.url);
                        this.notifyIndexStatus(`Indexing: ${page.title}`);
                        const content = await fetchPageContent(page.url);
                        if (content) {
                            return {
                                page,
                                content: this.stripHtml(content)
                            };
                        }
                    } catch (error) {
                        console.warn(`Failed to fetch ${page.url}:`, error);
                        return null;
                    }
                })
            );
            
            // Process results from this batch
            batchResults.forEach(result => {
                if (result) {
                    contentMap.set(result.page.url, {
                        title: result.page.title,
                        content: result.content,
                        path: result.page.url
                    });
                }
            });
        };
        
        // Process pages in batches to limit concurrent requests
        for (let i = 0; i < pages.length; i += MAX_CONCURRENT) {
            const batch = pages.slice(i, i + MAX_CONCURRENT);
            await processBatch(batch);
            // Update progress
            this.notifyIndexStatus(`Indexed ${Math.min(i + MAX_CONCURRENT, pages.length)} of ${pages.length} pages`);
        }

        console.log('Total pages indexed:', contentMap.size);
        return contentMap;
    }

    buildSearchIndex(contentMap) {
        const index = new Map();
        let count = 0;

        for (const [path, data] of contentMap.entries()) {
            if (!data.content) continue; // Skip empty content

            count++;
            if (count % 5 === 0) {
                this.notifyIndexStatus(`Building index: ${count}/${contentMap.size} pages`);
            }
            
            // Split content into words and clean them
            const words = data.content.toLowerCase()
                .split(/[\s.,!?;:()\[\]{}"']+/)
                .filter(word => word.length >= 2);

            // Create a set of unique words to avoid duplicates
            const uniqueWords = new Set(words);

            // Index each unique word
            uniqueWords.forEach(word => {
                if (!index.has(word)) {
                    index.set(word, []);
                }
                index.get(word).push({
                    path: path,
                    title: data.title,
                    content: data.content
                });
            });
        }

        console.log('Search index built with', index.size, 'terms');
        return index;
    }

    search(query) {
        // Display loading UI
        this.dispatchSearchEvent('searching', { query });
        
        // Use worker if available for better performance
        if (this.createWorker && window.Worker) {
            return new Promise((resolve) => {
                this.searchCallback = resolve;
                const worker = this.createWorker();
                
                // Convert maps to objects for transfer to worker
                const searchIndexObj = {};
                this.searchIndex.forEach((value, key) => {
                    searchIndexObj[key] = value;
                });
                
                const contentMapObj = {};
                this.contentMap.forEach((value, key) => {
                    contentMapObj[key] = value;
                });
                
                worker.postMessage({
                    action: 'search',
                    data: {
                        query,
                        searchIndex: searchIndexObj,
                        contentMap: contentMapObj
                    }
                });
            }).then(results => {
                this.dispatchSearchEvent('searchComplete', { results });
                return results;
            });
        }
        
        // Fallback to synchronous search
        const searchTerms = this.generateSearchTerms(query);
        const results = new Map();

        searchTerms.forEach(term => {
            const matches = this.searchTerm(term);
            matches.forEach(match => {
                if (!results.has(match.path)) {
                    results.set(match.path, {
                        path: match.path,
                        title: match.title,
                        content: match.content,
                        score: 0,
                        excerpts: new Set(),
                        matchedTerms: new Set()
                    });
                }
                const result = results.get(match.path);
                result.score += match.score;
                match.excerpts.forEach(e => result.excerpts.add(e));
                result.matchedTerms.add(term);
            });
        });

        const finalResults = Array.from(results.values())
            .sort((a, b) => b.score - a.score)
            .map(result => ({
                title: result.title,
                url: result.path,
                excerpts: Array.from(result.excerpts).slice(0, 3),
                score: result.score,
                matchedTerms: Array.from(result.matchedTerms)
            }));
            
        this.dispatchSearchEvent('searchComplete', { results: finalResults });
        return finalResults;
    }
    
    dispatchSearchEvent(type, data) {
        const event = new CustomEvent('searchEvent', {
            detail: { type, ...data }
        });
        document.dispatchEvent(event);
    }

    generateSearchTerms(query) {
        const terms = new Set();
        // Clean and split the query
        const words = query.toLowerCase().trim().split(/\s+/);

        // Add the full phrase
        if (words.length > 1) {
            terms.add(words.join(' '));
        }

        // Add individual words
        words.forEach(word => {
            if (word.length >= 2) {
                terms.add(word);
            }
        });

        // Add adjacent word pairs
        for (let i = 0; i < words.length - 1; i++) {
            terms.add(`${words[i]} ${words[i + 1]}`);
        }

        return Array.from(terms);
    }

    searchTerm(term) {
        const results = new Map();

        this.contentMap.forEach((data, path) => {
            const content = data.content.toLowerCase();
            const title = data.title.toLowerCase();

            let score = 0;
            // Check title matches (weighted higher)
            if (title.includes(term)) {
                score += 10;
            }

            // Check content matches
            const contentMatches = content.split(term).length - 1;
            score += contentMatches;

            if (score > 0) {
                results.set(path, {
                    path: path,
                    title: data.title,
                    content: data.content,
                    score: score,
                    excerpts: [this.generateExcerpt(data.content, [term])]
                });
            }
        });

        return Array.from(results.values());
    }

    quickSearch(query, limit = 5) {
        if (this.indexStatus !== 'ready') {
            return [{
                title: 'Search index loading...',
                url: '#',
                excerpt: 'Please try again in a moment'
            }];
        }
        
        if (!query || query.trim().length < 2) {
            return [];
        }
        
        const results = this.search(query);
        return results.slice(0, limit).map(result => ({
            title: result.title,
            url: result.url,
            excerpt: result.excerpts[0] // Use the first excerpt as the snippet
        }));
    }

    generateQuickExcerpt(content, searchWords) {
        const excerptLength = 60;
        const contentLower = content.toLowerCase();
        let bestIndex = -1;
        let bestScore = 0;

        searchWords.forEach(word => {
            const index = contentLower.indexOf(word);
            if (index !== -1) {
                const score = searchWords.reduce((acc, w) =>
                    acc + (contentLower.substring(index, index + excerptLength).includes(w) ? 1 : 0), 0);
                if (score > bestScore) {
                    bestScore = score;
                    bestIndex = index;
                }
            }
        });

        if (bestIndex === -1) {
            return content.substring(0, excerptLength) + '...';
        }

        const start = Math.max(0, bestIndex - 20);
        const excerpt = content.substring(start, start + excerptLength);

        return (start > 0 ? '...' : '') +
            excerpt.replace(new RegExp(`(${searchWords.join('|')})`, 'gi'),
                '<span class="search-highlight">$1</span>') +
            (start + excerptLength < content.length ? '...' : '');
    }

    calculateScore(content, searchWords) {
        return searchWords.reduce((score, word) => {
            const matches = content.split(word).length - 1;
            return score + matches;
        }, 0);
    }

    stripHtml(html) {
        // First create a temporary div to work with the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Remove script tags and their content
        const scripts = tempDiv.getElementsByTagName('script');
        while (scripts[0]) {
            scripts[0].parentNode.removeChild(scripts[0]);
        }

        // Remove TikZ and CircuiTikZ elements
        const tikzElements = tempDiv.querySelectorAll(
            'pre[class*="tikz"], pre[class*="circuitikz"], div[class*="tikz"], div[class*="circuitikz"]'
        );
        tikzElements.forEach(element => element.remove());

        // Remove LaTeX display elements
        const latexElements = tempDiv.querySelectorAll(
            '.MathJax, .MathJax_Preview, .MathJax_SVG, .MathJax_Display, .tikzjax'
        );
        latexElements.forEach(element => element.remove());

        // Get the cleaned text content
        return tempDiv.textContent || '';
    }

    generateExcerpt(content, searchWords) {
        const excerptLength = 100; // Shorter excerpts
        const allExcerpts = [];
        const contentLower = content.toLowerCase();

        searchWords.forEach(word => {
            let index = contentLower.indexOf(word);
            while (index !== -1) {
                const start = Math.max(0, index - 40);
                const end = Math.min(content.length, index + word.length + 60);
                let excerpt = content.substring(start, end).trim();

                if (start > 0) excerpt = '...' + excerpt;
                if (end < content.length) excerpt += '...';

                // Highlight all matching words
                searchWords.forEach(w => {
                    const regex = new RegExp(`(${w})`, 'gi');
                    excerpt = excerpt.replace(regex, '<mark>$1</mark>');
                });

                if (!allExcerpts.includes(excerpt)) {
                    allExcerpts.push(excerpt);
                }

                index = contentLower.indexOf(word, index + 1);
            }
        });

        return allExcerpts.length > 0 ? allExcerpts[0] : '';
    }
}

// Add keyboard navigation for search results
document.addEventListener('DOMContentLoaded', () => {
    const searchResultsContainer = document.querySelector('.search-results');
    if (searchResultsContainer) {
        let selectedIndex = -1;
        const keyHandler = (e) => {
            const results = searchResultsContainer.querySelectorAll('.search-result');
            if (results.length === 0) return;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
                updateSelection(results);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelection(results);
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                const link = results[selectedIndex].querySelector('a');
                if (link) window.location.href = link.href;
            } else if (e.key === 'Escape') {
                selectedIndex = -1;
                updateSelection(results);
            }
        };
        
        const updateSelection = (results) => {
            results.forEach((result, i) => {
                result.classList.toggle('selected', i === selectedIndex);
                if (i === selectedIndex) {
                    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        };
        
        document.addEventListener('keydown', keyHandler);
    }
});

// Make search engine globally available
if (typeof window.searchEngine === 'undefined') {
    try {
        window.searchEngine = new SearchEngine();
        // Initialize in the background
        setTimeout(() => {
            window.searchEngine.initializeSearchIndex().catch(err => 
                console.warn('Background search index initialization failed:', err)
            );
        }, 2000);
    } catch (e) {
        console.error('Failed to initialize search engine:', e);
        // Provide fallback
        window.searchEngine = {
            quickSearch: (query) => {
                return [{
                    title: 'Search Results',
                    url: `/components/search.html?q=${encodeURIComponent(query)}`,
                    excerpt: `View all results for "${query}"`
                }];
            },
            indexStatus: 'failed'
        };
    }
}
