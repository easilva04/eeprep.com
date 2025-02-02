document.addEventListener("DOMContentLoaded", function () {
  // Load pages.json and build the menu
  fetch('Topics/pages.json')
    .then(response => response.json())
    .then(data => {
      const sidebar = document.getElementById('sidebar');
      sidebar.innerHTML = buildMenu(data);
      initDropdowns();
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

  function initDropdowns() {
    const dropdownButtons = document.querySelectorAll(".dropdown-btn");
    dropdownButtons.forEach(btn => {
      btn.addEventListener("click", function () {
        this.classList.toggle("active");
        const dropdownContainer = this.nextElementSibling;
        dropdownContainer.style.display = dropdownContainer.style.display === "block" ? "none" : "block";
      });
    });
  }
});
