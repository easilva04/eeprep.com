if (localStorage.getItem('dark-mode') === 'enabled' || 
    (!localStorage.getItem('dark-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark-mode');
}

document.addEventListener('DOMContentLoaded', async () => {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        console.error('Error loading sidebar: Sidebar container element not found');
        return;
    }

    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar-container';
    sidebar.className = 'sidebar collapsed';
    sidebarContainer.appendChild(sidebar);

    try {
        const sidebarResponse = await fetch('/components/sidebar.html');
        if (!sidebarResponse.ok) throw new Error(`HTTP error! status: ${sidebarResponse.status}`);
        const sidebarContent = await sidebarResponse.text();
        sidebar.innerHTML = sidebarContent;

        // Initialize dropdown toggles (if any exist in sidebar.html)
        document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const menu = toggle.nextElementSibling;
                menu.classList.toggle('active');
                toggle.classList.toggle('active');
            });
        });

        // Dark mode toggle initialization if element exists
        const darkModeToggle = sidebar.querySelector('#dark-mode-toggle');
        if (darkModeToggle) {
            const updateButtonText = () => {
                darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? 'Light' : 'Dark';
            };
            darkModeToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
                updateButtonText();
            });
            updateButtonText();
        }

    } catch (error) {
        console.error('Error loading sidebar:', error);
        sidebar.innerHTML = '<p>Error loading sidebar content. Please try refreshing the page.</p>';
    }
});
