document.addEventListener('DOMContentLoaded', () => {
    // Check for saved theme or use system preference
    const savedTheme = localStorage.getItem('theme') ||
       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    applyTheme(savedTheme);
    
    // Add event listeners to all theme toggle buttons
    document.querySelectorAll('[id^="theme-toggle"], [id^="mobile-theme-toggle"]')
      .forEach(btn => {
          btn.addEventListener('click', toggleTheme);
          updateToggleIcons(btn, savedTheme);
      });
      
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            // Only auto-switch if user hasn't manually set a preference
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
            updateAllToggleIcons(newTheme);
        }
    });
});

function applyTheme(theme) {
    // Apply theme to HTML element
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update all toggle icons
    updateAllToggleIcons(theme);
    
    // Add animation class
    document.body.classList.add('theme-changing');
    
    // Remove animation class after transition completes
    setTimeout(() => {
        document.body.classList.remove('theme-changing');
    }, 300);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

function updateToggleIcons(button, theme) {
    // Update icon based on current theme
    if (button.querySelector('i')) {
        const icon = button.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            button.setAttribute('aria-label', 'Switch to light mode');
            button.setAttribute('title', 'Switch to light mode');
        } else {
            icon.className = 'fas fa-moon';
            button.setAttribute('aria-label', 'Switch to dark mode');
            button.setAttribute('title', 'Switch to dark mode');
        }
    }
}

function updateAllToggleIcons(theme) {
    document.querySelectorAll('[id^="theme-toggle"], [id^="mobile-theme-toggle"]')
      .forEach(btn => updateToggleIcons(btn, theme));
}
