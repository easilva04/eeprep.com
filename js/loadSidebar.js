document.addEventListener("DOMContentLoaded", function () {
  // Load pages.json and build the menu
  fetch('Topics/pages.json')
    .then(response => response.json())
    .then(data => {
      
      const sidebar = document.getElementById('sidebar-container');
      if (sidebar){
      sidebar.innerHTML = buildMenu(data);
      } else {
        console.error("Sidebar not found")
      }
      // Automatically add "show" class to all dropdown containers
      document.querySelectorAll(".dropdown-container").forEach(container => container.classList.add("show"));
      // Optionally disable click toggling:
      // initDropdowns();
      // After sidebar is built, attach hamburger listener:
      initHamburger();
    })
    .catch(error => console.error('Error loading pages:', error));

  // Build menu HTML recursively
  function buildMenu(data) {
    let html = "<ul class='sidebar-list'>";
    for (const topic in data) {
      const items = data[topic];
      if (Array.isArray(items)) {
        // Topic with direct pages
        html += `<li>
  <button class="dropdown-btn">${topic}</button>
  <ul class="dropdown-container">`;
        items.forEach(page => {
          html += `<li><a href="${page.url}" title="${page.snippet}">${page.title}</a></li>`;
        });
        html += `</ul>
</li>`;
      } else if (typeof items === "object") {
        // Topic with subcategories
        html += `<li>
  <button class="dropdown-btn">${topic}</button>
  <ul class="dropdown-container">`;
        for (const subtopic in items) {
          html += `<li>
    <button class="dropdown-btn">${subtopic}</button>
    <ul class="dropdown-container">`;
          items[subtopic].forEach(page => {
            html += `<li><a href="${page.url}" title="${page.snippet}">${page.title}</a></li>`;
          });
          html += `</ul>
  </li>`;
        }
        html += `</ul>
</li>`;
      }
    }
    html += "</ul>";
    return html;
  }

  // Removed toggle functionality since the sidebar should always be expanded
  // function initDropdowns() { ... }

  function initHamburger() {
    console.log("hamburger element:", document.getElementById('hamburgerMenu'));
    const hamburger = document.getElementById('hamburgerMenu');
    hamburger.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }
});
