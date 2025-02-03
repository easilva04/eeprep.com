document.addEventListener("DOMContentLoaded", function () {
  // Load pages.json using an absolute URL and checking for a valid response
  fetch(new URL('/Topics/pages.json', window.location.origin))
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      let menuContainer = document.getElementById('sidebar-menu');
      if (!menuContainer) {
        // If sidebar-menu not found, try to get sidebar-container and create a new menu element inside it
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
          menuContainer = document.createElement('ul');
          menuContainer.id = 'sidebar-menu';
          sidebarContainer.appendChild(menuContainer);
        } else {
          console.error("Sidebar menu container not found");
          return;
        }
      }
      menuContainer.innerHTML = buildMenu(data);
      // Commented out forcing dropdowns to show:
      // document.querySelectorAll(".dropdown-container").forEach(container => container.classList.add("show"));
      attachDropdownListeners();
    })
    .catch(error => console.error('Error loading pages:', error));

  // Build menu HTML recursively (modified to use buttons for page links)
  function buildMenu(data) {
    let html = "<ul class='sidebar-list'>";
    for (const topic in data) {
      const items = data[topic];
      if (Array.isArray(items)) {
        html += `
          <li>
            <button class="dropdown-btn">${topic}</button>
            <ul class="dropdown-container">`;
        items.forEach(page => {
          html += `<li><button type="button" class="dropdown-btn" onclick="window.location.href='${page.url}'" title="${page.snippet}">${page.title}</button></li>`;
        });
        html += `</ul>
          </li>`;
      } else if (typeof items === "object") {
        html += `
          <li>
            <button class="dropdown-btn">${topic}</button>
            <ul class="dropdown-container">`;
        for (const subtopic in items) {
          html += `
            <li>
              <button class="dropdown-btn">${subtopic}</button>
              <ul class="dropdown-container">`;
          items[subtopic].forEach(page => {
            html += `<li><button type="button" class="dropdown-btn" onclick="window.location.href='${page.url}'" title="${page.snippet}">${page.title}</button></li>`;
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


  function attachDropdownListeners() {
    console.log("Attaching dropdown listeners...");
    /* Close all dropdown containers initially */
    document.querySelectorAll(".dropdown-container").forEach(container => {
      container.classList.remove("show");
    });
    const dropdownButtons = document.querySelectorAll(".dropdown-btn");

    dropdownButtons.forEach(button => {
      button.addEventListener("click", function (e) {
        const dropdownContainer = this.nextElementSibling;
        if (dropdownContainer && dropdownContainer.classList.contains("dropdown-container")) {
          dropdownContainer.classList.toggle("show");
        } else {
          // Always collapse the sidebar on any view when a page link button is clicked
          const sidebar = document.getElementById('sidebar-container');
          if (sidebar) {
            sidebar.classList.add("collapsed");
          }
        }
      });
    });
  }
});