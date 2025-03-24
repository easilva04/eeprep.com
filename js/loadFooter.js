document.addEventListener('DOMContentLoaded', () => {
  fetch(new URL('/components/footer.html', window.location.origin))
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      const footerPlaceholder = document.getElementById('footer-placeholder');
      if (footerPlaceholder) {
        footerPlaceholder.innerHTML = html;
      } else {
        console.warn('Footer placeholder not found');
      }
    })
    .catch(err => console.error('Error loading footer:', err));
});
