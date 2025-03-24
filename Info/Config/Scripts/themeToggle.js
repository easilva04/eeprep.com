function applyTheme(theme, animated = true) {
    if (animated) {
        document.body.classList.add('theme-transition');
        // Remove the transition class after the transition completes
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);
    }
    document.body.classList.toggle('dark-mode', theme === 'dark');
    
    // Update theme meta tag for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#111827' : '#ffffff');
    }
    
    // Add a class to html for potential CSS targeting
    document.documentElement.setAttribute('data-theme', theme);
    
    // Dispatch theme change event for other scripts to listen to
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

function loadTheme() {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        // Use saved preference
        applyTheme(savedTheme, false);
    } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = prefersDark ? 'dark' : 'light';
        applyTheme(theme, false);
        localStorage.setItem('theme', theme); // Save the system preference
    }
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Add a visual indication of the theme change with a flash animation
    const flashOverlay = document.createElement('div');
    flashOverlay.style.position = 'fixed';
    flashOverlay.style.top = '0';
    flashOverlay.style.left = '0';
    flashOverlay.style.width = '100%';
    flashOverlay.style.height = '100%';
    flashOverlay.style.backgroundColor = newTheme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';
    flashOverlay.style.opacity = '0';
    flashOverlay.style.pointerEvents = 'none';
    flashOverlay.style.zIndex = '9999';
    flashOverlay.style.transition = 'opacity 300ms ease';
    
    document.body.appendChild(flashOverlay);
    
    // Force reflow
    flashOverlay.offsetHeight;
    
    // Animate the flash
    flashOverlay.style.opacity = '1';
    
    // Apply the theme change
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Remove the flash animation
    setTimeout(() => {
        flashOverlay.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(flashOverlay);
        }, 300);
    }, 100);
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        loadTheme();

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            // Only change if user hasn't set a preference
            if (!localStorage.getItem('theme')) {
                const theme = e.matches ? 'dark' : 'light';
                applyTheme(theme);
            }
        });

        // Create a modernized theme toggle button
        function createThemeToggle() {
            const existingToggle = document.getElementById('theme-toggle');
            if (existingToggle) return existingToggle;
            
            const toggle = document.createElement('button');
            toggle.id = 'theme-toggle';
            toggle.className = 'theme-toggle';
            toggle.setAttribute('aria-label', 'Toggle theme');
            toggle.setAttribute('title', 'Toggle light/dark theme');
            
            const isDarkMode = document.body.classList.contains('dark-mode');
            toggle.innerHTML = isDarkMode ? 
                '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' : 
                '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
            
            return toggle;
        }

        // Add theme toggle to navbar if it doesn't exist
        const navbarRight = document.querySelector('.navbar-right');
        if (navbarRight) {
            // Find existing theme toggle or create new one
            let themeToggleBtn = document.getElementById('theme-toggle') || 
                                 document.getElementById('dark-mode-toggle') || 
                                 document.getElementById('themeToggleBtn');
            
            if (!themeToggleBtn) {
                themeToggleBtn = createThemeToggle();
                navbarRight.appendChild(themeToggleBtn);
            } else {
                // Update existing button to modern style
                themeToggleBtn.className = 'theme-toggle';
                themeToggleBtn.setAttribute('aria-label', 'Toggle theme');
                themeToggleBtn.setAttribute('title', 'Toggle light/dark theme');
                
                const isDarkMode = document.body.classList.contains('dark-mode');
                themeToggleBtn.innerHTML = isDarkMode ? 
                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' : 
                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
            }
            
            // Update button function
            function updateButtonIcon() {
                const isDarkMode = document.body.classList.contains('dark-mode');
                themeToggleBtn.innerHTML = isDarkMode ? 
                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' : 
                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
                themeToggleBtn.setAttribute('aria-label', `Switch to ${isDarkMode ? 'light' : 'dark'} mode`);
                themeToggleBtn.setAttribute('title', `Switch to ${isDarkMode ? 'light' : 'dark'} mode`);
            }
            
            themeToggleBtn.addEventListener('click', () => {
                toggleTheme();
                updateButtonIcon();
                
                // Add subtle animation
                themeToggleBtn.classList.add('clicked');
                setTimeout(() => {
                    themeToggleBtn.classList.remove('clicked');
                }, 300);
            });
            
            // Add keyboard support
            themeToggleBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    themeToggleBtn.click();
                }
            });
        }
        
        // Handle dropdown toggles with improved animation
        document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const menu = toggle.nextElementSibling;
                if (menu) {
                    if (menu.classList.contains('active')) {
                        // Animate closing
                        menu.style.height = menu.scrollHeight + 'px';
                        // Force reflow
                        menu.offsetHeight;
                        menu.style.height = '0px';
                        
                        setTimeout(() => {
                            menu.classList.remove('active');
                            menu.style.height = '';
                        }, 300);
                    } else {
                        // Animate opening
                        menu.classList.add('active');
                        menu.style.height = '0px';
                        // Force reflow
                        menu.offsetHeight;
                        menu.style.height = menu.scrollHeight + 'px';
                        
                        setTimeout(() => {
                            menu.style.height = '';
                        }, 300);
                    }
                    
                    toggle.classList.toggle('active');
                    toggle.setAttribute('aria-expanded', toggle.classList.contains('active'));
                }
            });
        });

    } catch (error) {
        console.error('Error initializing theme toggle:', error);
    }
});

/**
 * Theme Toggle Script
 * Handles switching between light, dark, and high-contrast themes
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check for saved theme preference or use default
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Initialize theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        // Update button text based on current theme
        updateThemeButtonText(themeToggle, savedTheme);
        
        // Add click handler
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            let newTheme;
            
            // Cycle through themes: light -> dark -> high-contrast -> light
            switch (currentTheme) {
                case 'light':
                    newTheme = 'dark';
                    break;
                case 'dark':
                    newTheme = 'high-contrast';
                    break;
                case 'high-contrast':
                    newTheme = 'light';
                    break;
                default:
                    newTheme = 'light';
            }
            
            // Apply new theme
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update button text
            updateThemeButtonText(themeToggle, newTheme);
        });
    }
});

/**
 * Updates the theme toggle button text based on current theme
 * @param {HTMLElement} buttonElement - The theme toggle button
 * @param {string} theme - Current theme name
 */
function updateThemeButtonText(buttonElement, theme) {
    switch (theme) {
        case 'light':
            buttonElement.textContent = 'Switch to Dark Theme';
            break;
        case 'dark':
            buttonElement.textContent = 'Switch to High Contrast';
            break;
        case 'high-contrast':
            buttonElement.textContent = 'Switch to Light Theme';
            break;
        default:
            buttonElement.textContent = 'Toggle Theme';
    }
}
