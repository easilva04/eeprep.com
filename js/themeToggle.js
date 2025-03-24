function applyTheme(theme) {
    document.body.classList.toggle('dark-mode', theme === 'dark');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();

    // Handle dropdown toggles
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const menu = toggle.nextElementSibling;
            if (menu) {
                menu.classList.toggle('active');
                toggle.classList.toggle('active');
            }
        });
    });

    // Handle theme toggle functionality
    function updateButtonText(button) {
        if (button) {
            button.textContent = document.body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
        }
    }

    // Support multiple possible theme toggle button IDs
    const toggleButtons = ['dark-mode-toggle', 'theme-toggle'].map(id => document.getElementById(id)).filter(Boolean);
    
    toggleButtons.forEach(button => {
        updateButtonText(button);
        button.addEventListener('click', () => {
            toggleTheme();
            updateButtonText(button);
        });
    });
});
