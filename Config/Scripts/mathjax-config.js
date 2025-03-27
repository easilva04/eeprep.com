/**
 * MathJax Configuration
 * 
 * This file configures MathJax for proper LaTeX rendering on the site.
 */

window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true
  },
  options: {
    ignoreHtmlClass: 'no-mathjax|ignore-mathjax',
    processHtmlClass: 'mathjax|has-mathjax'
  },
  svg: {
    fontCache: 'global'
  }
};

// Listen for custom events that might require MathJax to reprocess content
document.addEventListener('content-updated', function() {
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise();
  }
});
