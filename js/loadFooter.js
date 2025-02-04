document.addEventListener('DOMContentLoaded', () => {
  fetch('components/footer.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('footer-placeholder').innerHTML = html;
    })
    .catch(err => console.error('Error loading footer:', err));
});
