class Sidebar {
    constructor() {
        this.init();
    }

    async init() {
        // Initialize container
        const container = document.getElementById('sidebar-container');
        if (!container) return;
        
        container.className = 'sidebar';

        try {
            // Load sidebar HTML
            container.innerHTML = await this.loadSidebarHTML();
            
            // Initialize dark mode
            this.initDarkMode();
            
            // Load and build menu
            const data = await this.loadPagesData();
            this.buildMenu(data);
            
            // Initialize search
            this.initSearch();
        } catch (error) {
            console.error('Sidebar initialization error:', error);
        }
    }

    async loadSidebarHTML() {
        const response = await fetch('/components/sidebar.html');
        if (!response.ok) throw new Error('Failed to load sidebar HTML');
        return response.text();
    }

    async loadPagesData() {
        const response = await fetch('/Topics/pages.json');
        if (!response.ok) throw new Error('Failed to load pages data');
        return response.json();
    }

    initDarkMode() {
        const toggle = document.getElementById('dark-mode-toggle');
        if (!toggle) return;

        const updateTheme = () => {
            const isDark = document.documentElement.classList.contains('dark-mode');
            toggle.textContent = isDark ? 'Light' : 'Dark';
            localStorage.setItem('dark-mode', isDark ? 'enabled' : 'disabled');
        };

        // Set initial state
        if (localStorage.getItem('dark-mode') === 'enabled' || 
            (!localStorage.getItem('dark-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark-mode');
        }

        toggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark-mode');
            updateTheme();
        });

        updateTheme();
    }

    buildMenu(data) {
        const nav = document.getElementById('sidebar-nav');
        if (!nav) return;

        Object.entries(data).forEach(([category, items]) => {
            nav.appendChild(this.createCategory(category, items));
        });
    }

    createCategory(title, items, isSubcategory = false) {
        const section = document.createElement('div');
        section.className = isSubcategory ? 'subcategory collapsed' : 'category collapsed';
        
        const header = document.createElement('div');
        header.className = 'category-header';
        header.textContent = title;
        
        const content = document.createElement('ul');
        content.className = 'menu-items';

        header.addEventListener('click', () => section.classList.toggle('collapsed'));
        
        section.append(header, content);
        
        if (Array.isArray(items)) {
            items.forEach(item => content.appendChild(this.createMenuItem(item)));
        } else {
            Object.entries(items).forEach(([subTitle, subItems]) => {
                content.appendChild(this.createCategory(subTitle, subItems, true));
            });
        }
        
        return section;
    }

    createMenuItem(item) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.url;
        a.textContent = item.title;
        li.appendChild(a);
        return li;
    }

    initSearch() {
        const searchInput = document.getElementById('sidebar-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', () => {
            const filter = searchInput.value.toLowerCase();
            const nav = document.getElementById('sidebar-nav');
            const links = nav.getElementsByTagName('a');
            
            Array.from(links).forEach(link => {
                const li = link.parentElement;
                const matches = link.textContent.toLowerCase().includes(filter);
                
                li.style.display = matches ? '' : 'none';
                
                let parent = li.parentElement;
                while (parent && !parent.matches('nav')) {
                    if (matches) {
                        parent.style.display = '';
                        parent.classList.remove('collapsed');
                    }
                    parent = parent.parentElement;
                }
            });
        });
    }
}

// Initialize sidebar when DOM is ready
document.addEventListener('DOMContentLoaded', () => new Sidebar());
