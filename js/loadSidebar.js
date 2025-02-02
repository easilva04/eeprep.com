if (localStorage.getItem('dark-mode') === 'enabled' || 
    (!localStorage.getItem('dark-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark-mode');
}

document.addEventListener('DOMContentLoaded', async () => {
    // Use the existing container rather than creating a new element with duplicate id
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        console.error('Error loading sidebar: Sidebar container element not found');
        return;
    }
    
    // Set sidebar container's class
    sidebarContainer.className = 'sidebar collapsed';
    
    try {
        const sidebarResponse = await fetch('/components/sidebar.html');
        if (!sidebarResponse.ok) throw new Error(`HTTP error! status: ${sidebarResponse.status}`);
        const sidebarContent = await sidebarResponse.text();
        sidebarContainer.innerHTML = sidebarContent;
        
        // Re-evaluate inline scripts from the loaded sidebar HTML
        const scripts = sidebarContainer.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            // Transfer script content and attributes
            newScript.text = oldScript.innerHTML;
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
        
        // Initialize dropdown toggles (if any exist within sidebar.html)
        sidebarContainer.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const menu = toggle.nextElementSibling;
                menu.classList.toggle('active');
                toggle.classList.toggle('active');
            });
        });

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

    } catch (error) {
        console.error('Error loading sidebar:', error);
        sidebarContainer.innerHTML = '<p>Error loading sidebar content. Please try refreshing the page.</p>';
    }
});
