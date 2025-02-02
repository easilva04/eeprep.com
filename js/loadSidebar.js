document.addEventListener("DOMContentLoaded", function () {
  // Load pages.json and build the menu
  fetch('Topics/pages.json')
    .then(response => response.json())
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


  function attachDropdownListeners() {
    //log message
    console.log("Attaching dropdown listeners...");
    //get all the containers and close them
    document.querySelectorAll(".dropdown-container").forEach(container => {
      container.classList.remove("show");
    });
    //get all the main buttons and allow them to be open and closed on cliick
    const dropdownButtons = document.querySelectorAll(".dropdown-btn");
  
    dropdownButtons.forEach(button => {
      button.addEventListener("click", function () {
        const dropdownContainer = this.nextElementSibling;
  
        if (dropdownContainer) {
          dropdownContainer.classList.toggle("show");
        }
      });
    });
  }
});