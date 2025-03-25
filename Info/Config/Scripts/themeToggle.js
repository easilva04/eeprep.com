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
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        applyDarkTheme();
    } else if (savedTheme === 'light') {
        applyLightTheme();
    } else {
        // No saved preference, check system preference
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        if (prefersDarkScheme.matches) {
            applyDarkTheme();
        } else {
            applyLightTheme();
        }
    }
    
    // Add transition class after initial theme is set to prevent flash
    setTimeout(() => {
        document.body.classList.add('theme-transition');
    }, 100);
    
    // Set up theme toggle buttons
    setupThemeToggleListeners();
}

// Apply dark theme
function applyDarkTheme() {
    document.body.classList.add('dark-mode');
    document.documentElement.setAttribute('data-theme', 'dark');
    
    // Force main content background update
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.backgroundColor = 'var(--background-color)';
    }
    
    // Force card backgrounds update
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.style.backgroundColor = 'var(--card-bg)';
    });
}

// Apply light theme
function applyLightTheme() {
    document.body.classList.remove('dark-mode');
    document.documentElement.setAttribute('data-theme', 'light');
    
    // Force main content background update
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.backgroundColor = 'var(--background-color)';
    }
    
    // Force card backgrounds update
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.style.backgroundColor = 'var(--card-bg)';
    });
}

// Toggle between light and dark theme
function toggleTheme() {
    // Check current theme
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        applyLightTheme();
        localStorage.setItem('theme', 'light');
    } else {
        applyDarkTheme();
        localStorage.setItem('theme', 'dark');
    }
    
    // Update theme toggle button icons
    updateThemeToggleIcons(!isDarkMode);
    
    return !isDarkMode; // Return new dark mode state
}

// Set up theme toggle button listeners
function setupThemeToggleListeners() {
    // Find all theme toggle buttons
    const themeToggles = document.querySelectorAll('[id^="theme-toggle"]');
    
    if (themeToggles.length === 0) {
        // Try again after a short delay (in case elements are added dynamically)
        setTimeout(setupThemeToggleListeners, 1000);
        return;
    }
    
    themeToggles.forEach(button => {
        // Remove any existing click listeners by cloning
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add fresh click listener
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            toggleTheme();
        });
    });
    
    // Set initial icon states
    updateThemeToggleIcons(document.body.classList.contains('dark-mode'));
}

// Update theme toggle button icons
function updateThemeToggleIcons(isDarkMode) {
    // Find all theme toggle buttons
    const themeToggles = document.querySelectorAll('[id^="theme-toggle"]');
    
    themeToggles.forEach(button => {
        const lightIcon = button.querySelector('.theme-light-icon');
        const darkIcon = button.querySelector('.theme-dark-icon');
        
        if (lightIcon && darkIcon) {
            // If button has both icons, show/hide the appropriate one
            lightIcon.style.display = isDarkMode ? 'none' : 'inline-block';
            darkIcon.style.display = isDarkMode ? 'inline-block' : 'none';
            
            // Update toggle text if present
            const toggleText = button.querySelector('.toggle-text');
            if (toggleText) {
                toggleText.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
            }
        } else {
            // For buttons with a single SVG icon
            button.innerHTML = isDarkMode ? 
                '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg><span class="toggle-text">Light Mode</span>' : 
                '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg><span class="toggle-text">Dark Mode</span>';
        }
    });
}

// Helper function to apply a specific theme for direct calls
function applyTheme(themeName) {
    if (themeName === 'dark') {
        applyDarkTheme();
        localStorage.setItem('theme', 'dark');
        updateThemeToggleIcons(true);
    } else {
        applyLightTheme();
        localStorage.setItem('theme', 'light');
        updateThemeToggleIcons(false);
    }
}

// Explicitly make functions available globally
window.toggleTheme = toggleTheme;
window.initializeTheme = initializeTheme;
window.updateThemeToggleIcons = updateThemeToggleIcons;
window.applyTheme = applyTheme;
