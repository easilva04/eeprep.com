document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // Create ChatGPT-like loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="loading-content">
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
            <p class="loading-text">Loading EEPrep</p>
        </div>
    `;
    document.body.appendChild(loadingIndicator);
    
    // Create overlay for sidebar (mobile)
    const sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);
    
    // Check if sidebar was previously collapsed and add class before components load
    if (localStorage.getItem('sidebar-collapsed') === 'true') {
        document.body.classList.add('sidebar-collapsed');
    }
    
    // Load all components - skip header
    Promise.all([
        loadComponent('sidebar-container', 'Info/Config/Components/sidebar.html'),
        loadComponent('footer-container', 'Info/Config/Components/footer.html')
    ])
    .then(() => {
        // Initialize features after components are loaded
        setupMobileNavigation();
        setupDropdowns();
        
        // Remove loading indicator with fade effect
        loadingIndicator.classList.add('fade-out');
        setTimeout(() => {
            loadingIndicator.remove();
        }, 500);
        
        // Mark app as initialized
        document.body.classList.add('app-initialized');
    })
    .catch(error => {
        console.error('Failed to initialize app:', error);
        loadingIndicator.innerHTML = `
            <div class="loading-error">
                <p>Failed to load page components</p>
                <button onclick="window.location.reload()">Retry</button>
            </div>
        `;
    });
}

function loadComponent(containerId, url) {
    const container = document.getElementById(containerId);
    if (!container) {
        // If container doesn't exist, resolve without loading
        return Promise.resolve();
    }
    
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${url}: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            container.innerHTML = html;
            // Execute any scripts in the loaded HTML
            container.querySelectorAll('script').forEach(script => {
                const newScript = document.createElement('script');
                Array.from(script.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = script.textContent;
                script.parentNode.replaceChild(newScript, script);
            });
            
            // Add fade-in animation to loaded content
            container.style.opacity = '0';
            container.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                container.style.opacity = '1';
            }, 50);
            
            return container;
        });
}

// Helper function for relative navigation
function navigateRelative(url) {
    window.location.href = url;
}

function setupMobileNavigation() {
    // Create mobile navigation toggle if it doesn't exist
    if (!document.querySelector('.mobile-nav-toggle')) {
        const toggle = document.createElement('button');
        toggle.className = 'mobile-nav-toggle';
        toggle.setAttribute('aria-label', 'Toggle navigation');
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.appendChild(toggle);
        
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (!sidebar || !overlay) return;
        
        // Improved mobile toggle functionality
        toggle.addEventListener('click', () => {
            const isActive = sidebar.classList.contains('active');
            
            if (isActive) {
                // Close sidebar
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.classList.remove('sidebar-open');
                toggle.querySelector('i').className = 'fas fa-bars';
            } else {
                // Open sidebar
                sidebar.classList.add('active');
                overlay.classList.add('active');
                document.body.classList.add('sidebar-open');
                toggle.querySelector('i').className = 'fas fa-times';
            }
        });
        
        // Close sidebar when clicking overlay
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            document.body.classList.remove('sidebar-open');
            overlay.classList.remove('active');
            toggle.querySelector('i').className = 'fas fa-bars';
        });

        // Close sidebar when pressing Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                document.body.classList.remove('sidebar-open');
                overlay.classList.remove('active');
                toggle.querySelector('i').className = 'fas fa-bars';
            }
        });
    }
}

function setupDropdowns() {
    // Find all dropdown toggles
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const dropdown = toggle.parentElement;
            const menu = dropdown.querySelector('.dropdown-menu');
            
            // Close all other dropdowns first
            document.querySelectorAll('.dropdown-menu.active').forEach(activeMenu => {
                if (activeMenu !== menu) {
                    activeMenu.classList.remove('active');
                }
            });
            
            // Toggle this dropdown
            menu.classList.toggle('active');
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu.active').forEach(menu => {
            menu.classList.remove('active');
        });
    });
}