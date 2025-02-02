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
    
    // Initialize dark mode toggle
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
        
        updateButtonText();
    }

    // Load sidebar content from component
    fetch('/components/sidebar.html')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const sidebarContent = doc.querySelector('#sidebar-container').innerHTML;
            sidebarContainer.innerHTML = sidebarContent;
        })
        .catch(error => console.error('Error loading sidebar component:', error));
});
