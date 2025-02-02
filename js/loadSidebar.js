if (localStorage.getItem('dark-mode') === 'enabled' || 
    (!localStorage.getItem('dark-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark-mode');
}

document.addEventListener('DOMContentLoaded', async () => {
    const sidebarContainer = document.createElement('div');
    sidebarContainer.className = 'sidebar-container';
    document.body.appendChild(sidebarContainer);

    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar-container';
    sidebar.className = 'sidebar collapsed';
    sidebarContainer.appendChild(sidebar);

    try {
        // First fetch sidebar structure
        const sidebarResponse = await fetch('/components/sidebar.html');
        if (!sidebarResponse.ok) throw new Error(`HTTP error! status: ${sidebarResponse.status}`);
        const sidebarContent = await sidebarResponse.text();
        sidebar.innerHTML = sidebarContent;

        // Then fetch and populate menu items
        const pagesResponse = await fetch('/Topics/pages.json');
        if (!pagesResponse.ok) throw new Error(`HTTP error! status: ${pagesResponse.status}`);
        const pages = await pagesResponse.json();
        
        const sidebarMenu = sidebar.querySelector('#sidebar-menu');
        if (!sidebarMenu) throw new Error('Sidebar menu element not found');

        // Generate menu items
        for (const section in pages) {
            const sectionItem = document.createElement('li');
            const sectionLink = document.createElement('a');
            sectionLink.href = '#';
            sectionLink.className = 'dropdown-toggle';
            sectionLink.textContent = section;
            sectionItem.appendChild(sectionLink);

            const dropdownMenu = document.createElement('ul');
            dropdownMenu.className = 'dropdown-menu';

            pages[section].forEach(page => {
                const pageItem = document.createElement('li');
                const pageLink = document.createElement('a');
                pageLink.href = page.url;
                pageLink.textContent = page.title;
                pageItem.appendChild(pageLink);
                dropdownMenu.appendChild(pageItem);
            });

            sectionItem.appendChild(dropdownMenu);
            sidebarMenu.appendChild(sectionItem);
        }

        // Setup dropdown toggles
        document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const menu = toggle.nextElementSibling;
                menu.style.height = menu.classList.contains('active') ? '0' : `${menu.scrollHeight}px`;
                menu.classList.toggle('active');
                toggle.classList.toggle('active');
            });
        });

        const darkModeToggle = sidebar.querySelector('#dark-mode-toggle');
        const updateButtonText = () => {
            darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? 'Light' : 'Dark';
        };

        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
            updateButtonText();
        });

        updateButtonText();

    } catch (error) {
        console.error('Error loading sidebar:', error);
        sidebar.innerHTML = '<p>Error loading sidebar content. Please try refreshing the page.</p>';
    }
});