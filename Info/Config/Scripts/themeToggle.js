/**
 * Simplified Theme Toggle Script
 * Handles theme switching between light and dark modes
 */

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
});

// Initialize theme from localStorage or system preference
function initializeTheme() {
    console.log('Initializing theme system');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        console.log('Applied saved dark theme');
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        console.log('Applied saved light theme');
    } else {
        // No saved preference, check system preference
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        if (prefersDarkScheme.matches) {
            document.body.classList.add('dark-mode');
            console.log('Applied system dark theme preference');
        }
    }
    
    // Add transition class after initial theme is set to prevent flash
    setTimeout(() => {
        document.body.classList.add('theme-transition');
    }, 100);
    
    // Set up theme toggle buttons
    setupThemeToggleListeners();
}

// Toggle between light and dark theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    
    // Save preference to localStorage
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    console.log(`Theme switched to ${isDarkMode ? 'dark' : 'light'} mode`);
    
    // Update theme toggle button icons if they exist
    updateThemeToggleIcons(isDarkMode);
    
    return isDarkMode;
}

// Update theme toggle button icons
function updateThemeToggleIcons(isDarkMode) {
    // Find all theme toggle buttons
    const themeToggles = document.querySelectorAll('[id^="theme-toggle"]');
    
    themeToggles.forEach(button => {
        if (button.querySelector('svg')) {
            // If button has SVG icon, update it based on theme
            button.innerHTML = isDarkMode ? 
                '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg><span>Light Mode</span>' : 
                '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg><span>Dark Mode</span>';
        }
    });
}

// Set up theme toggle button listeners
function setupThemeToggleListeners() {
    // Find all theme toggle buttons
    const themeToggles = document.querySelectorAll('[id^="theme-toggle"]');
    
    themeToggles.forEach(button => {
        // Remove any existing click listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add fresh click listener
        newButton.addEventListener('click', function() {
            toggleTheme();
        });
        
        console.log('Added theme toggle listener to', newButton.id || 'unnamed button');
    });
    
    // Set initial icon states
    updateThemeToggleIcons(document.body.classList.contains('dark-mode'));
}

// Make functions available globally
window.toggleTheme = toggleTheme;
window.initializeTheme = initializeTheme;
