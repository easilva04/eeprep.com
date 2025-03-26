/**
 * Theme Toggle System for EEPrep
 * 
 * This script handles theme switching functionality between light and dark modes.
 * Features:
 * - Respects system preferences by default
 * - Persists user selection in localStorage
 * - Supports multiple toggle buttons across the site
 * - Animated transitions between themes
 * - Dispatches theme change events for other components
 */

/**
 * Initialize theme system when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved theme or use system preference
    const savedTheme = localStorage.getItem('theme') ||
       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    applyTheme(savedTheme);
    
    // Add event listeners to all theme toggle buttons
    // Use multiple selectors to catch all possible theme toggle buttons
    const toggleButtons = document.querySelectorAll('.theme-toggle, [id^="theme-toggle"], [id^="mobile-theme-toggle"], button[aria-label*="theme"], [data-action="toggle-theme"]');
    
    if (toggleButtons.length === 0) {
        console.warn('No theme toggle buttons found on the page');
    }
    
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', toggleTheme);
        updateToggleIcons(btn, savedTheme);
        
        // Make sure the button is accessible and has a role
        if (!btn.getAttribute('aria-label')) {
            btn.setAttribute('aria-label', savedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
        if (!btn.getAttribute('role')) {
            btn.setAttribute('role', 'button');
        }
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
    
    // Add global event delegation to catch any theme toggle clicks
    document.addEventListener('click', (e) => {
        // Check if the clicked element or any of its parents has the theme-toggle class
        let target = e.target;
        while (target != null) {
            if (target.classList && target.classList.contains('theme-toggle') || 
                (target.id && (target.id.startsWith('theme-toggle') || target.id.startsWith('mobile-theme-toggle')))) {
                toggleTheme();
                return;
            }
            target = target.parentElement;
        }
    });
    
    // Make toggleTheme available globally for debugging
    window.toggleTheme = toggleTheme;
});

/**
 * Apply the specified theme to the document
 * 
 * @param {string} theme - The theme to apply ('light' or 'dark')
 */
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
    
    // Dispatch a custom event that other scripts might listen for
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

/**
 * Update the icon of a specific toggle button based on current theme
 * 
 * @param {HTMLElement} button - The button element to update
 * @param {string} theme - The current theme
 */
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

/**
 * Update all theme toggle icons on the page
 * 
 * @param {string} theme - The current theme
 */
function updateAllToggleIcons(theme) {
    document.querySelectorAll('.theme-toggle, [id^="theme-toggle"], [id^="mobile-theme-toggle"], button[aria-label*="theme"], [data-action="toggle-theme"]')
      .forEach(btn => updateToggleIcons(btn, theme));
}

/**
 * Apply theme immediately on page load to prevent flash of wrong theme
 * This is executed immediately as an IIFE (Immediately Invoked Function Expression)
 */
(function() {
    const savedTheme = localStorage.getItem('theme') ||
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
})();
