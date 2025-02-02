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

    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const menu = toggle.nextElementSibling;
            if (menu) {
                menu.classList.toggle('active');
                toggle.classList.toggle('active');
            }
        });
    });

    const themeToggleButton = document.querySelector('.theme-toggle');

    function updateButtonText() {
        if (document.body.classList.contains('dark-mode')) {
            themeToggleButton.textContent = 'Light Mode';
        } else {
            themeToggleButton.textContent = 'Dark Mode';
        }
    }

    const toggleButton = document.getElementById('dark-mode-toggle');
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            toggleTheme();
            updateButtonText();
        });
    }

    updateButtonText();
});

document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('theme-toggle');
  if (toggleButton) {
    toggleButton.textContent = 'Toggle Theme';
    // ...rest of theme toggle logic...
  }
});
