if (localStorage.getItem('dark-mode') === 'enabled' || 
    (!localStorage.getItem('dark-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark-mode');
}

document.addEventListener('DOMContentLoaded', () => {
    // Use the existing container rather than creating a new element with duplicate id
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        console.error('Error loading sidebar: Sidebar container element not found');
        return;
    }
    
    // Set sidebar container's class
    sidebarContainer.className = 'sidebar collapsed';
    
    // Remove sidebar fetch and script re-evaluation

    // Dark mode toggle initialization if element exists
    const darkModeToggle = sidebarContainer.querySelector('#dark-mode-toggle');
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
});
