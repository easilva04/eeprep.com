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
    }

    async initializeSearchIndex(pages) {
        try {
            if (!pages) {
                pages = await this.fetchPages();
            }
            this.contentMap = await this.fetchAllContent(pages);
            this.searchIndex = this.buildSearchIndex(this.contentMap);
            console.log('Search index built:', this.searchIndex.size, 'terms indexed');
        } catch (error) {
            console.error('Failed to initialize search index:', error);
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

        // Fetch all pages concurrently
        const results = await Promise.all(
            pages.map(async page => {
                try {
                    console.log('Fetching:', page.url);
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

        // Process only successful results
        results.forEach(result => {
            if (result) {
                contentMap.set(result.page.url, {
                    title: result.page.title,
                    content: result.content,
                    path: result.page.url
                });
                console.log('Indexed:', result.page.title);
            }
        });

        console.log('Total pages indexed:', contentMap.size);
        return contentMap;
    }

    buildSearchIndex(contentMap) {
        const index = new Map();

        for (const [path, data] of contentMap.entries()) {
            if (!data.content) continue; // Skip empty content

            console.log(`Indexing content for: ${data.title}`);
            // Split content into words and clean them
            const words = data.content.toLowerCase()
                .split(/[\s.,!?;:()\[\]{}"']+/)
                .filter(word => word.length >= 2);

            // Index each word
            words.forEach(word => {
                if (!index.has(word)) {
                    index.set(word, []);
                }
                if (!index.get(word).some(entry => entry.path === path)) {
                    index.get(word).push({
                        path: path,
                        title: data.title,
                        content: data.content
                    });
                }
            });
        }

        console.log('Search index built with', index.size, 'terms');
        return index;
    }

    search(query) {
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

        console.log(`Found ${results.size} pages matching the query`);

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
