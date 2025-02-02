// Dark mode initialization
if (localStorage.getItem('dark-mode') === 'enabled' || 
    (!localStorage.getItem('dark-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark-mode');
}

document.addEventListener('DOMContentLoaded', () => {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        console.error('Error loading sidebar: Sidebar container element not found');
        return;
    }

    // Set base URL for correct path resolution
    const baseUrl = window.location.pathname.includes('/Topics/') ? '../../' : './';

    // Load sidebar content
    fetch(`${baseUrl}components/sidebar.html`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.text();
        })
        .then(html => {
            // Insert sidebar HTML
            sidebarContainer.innerHTML = html;
            
            // Initialize dark mode
            const darkModeToggle = document.getElementById('dark-mode-toggle');
            if (darkModeToggle) {
                const updateButtonText = () => {
                    darkModeToggle.textContent = document.documentElement.classList.contains('dark-mode') ? 'Light' : 'Dark';
                };
                
                darkModeToggle.addEventListener('click', () => {
                    document.documentElement.classList.toggle('dark-mode');
                    localStorage.setItem('dark-mode', 
                        document.documentElement.classList.contains('dark-mode') ? 'enabled' : 'disabled'
                    );
                    updateButtonText();
                });
                
                // Set initial dark mode state
                if (localStorage.getItem('dark-mode') === 'enabled' || 
                    (!localStorage.getItem('dark-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark-mode');
                }
                updateButtonText();
            }

            // Load pages.json and build menu
            return fetch(`${baseUrl}Topics/pages.json`);
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const nav = document.getElementById('sidebar-nav');
            if (!nav) throw new Error('Sidebar navigation element not found');
            
            // Build menu structure
            Object.entries(data).forEach(([category, items]) => {
                nav.appendChild(createCategory(category, items));
            });

            // Initialize search
            const searchInput = document.getElementById('sidebar-search');
            if (searchInput) implementSearch(searchInput);
        })
        .catch(error => console.error('Error loading sidebar:', error));
});

// Helper functions
function createMenuItem(item) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.url;
    a.textContent = item.title;
    li.appendChild(a);
    return li;
}

function createCategory(title, items, isSubcategory = false) {
    const section = document.createElement('div');
    section.className = isSubcategory ? 'subcategory collapsed' : 'category collapsed';
    
    const header = document.createElement('div');
    header.className = 'category-header';
    header.textContent = title;
    
    const content = document.createElement('ul');
    content.className = 'menu-items';
    
    header.addEventListener('click', () => {
        section.classList.toggle('collapsed');
    });

    section.appendChild(header);
    section.appendChild(content);
    
    if (Array.isArray(items)) {
        items.forEach(item => content.appendChild(createMenuItem(item)));
    } else {
        Object.entries(items).forEach(([subTitle, subItems]) => {
            content.appendChild(createCategory(subTitle, subItems, true));
        });
    }
    
    return section;
}

function implementSearch(searchInput) {
    searchInput.addEventListener('input', function() {
        const filter = this.value.toLowerCase();
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
