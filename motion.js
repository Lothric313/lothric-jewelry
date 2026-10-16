'use strict';

(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

  const selector = [
    '.hero-copy > *', '.section-heading > *', '.filters > *',
    '.carousel-details', '.brand-story-heading > *', '.brand-story-copy > *',
    '.review-heading > *', '.review-stat', '.location-card', '.customer-review',
    '.contact-heading > *', '.contact-form > *', '.footer-brand',
    '.footer-links > *', '.footer-bottom'
  ].join(',');
  const elements = [...document.querySelectorAll(selector)];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

  elements.forEach(element => {
    const siblings = [...element.parentElement.children].filter(child => child.matches(selector));
    element.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(element), 3) * 60}ms`);
    element.classList.add('motion-reveal');
    observer.observe(element);
  });

  // Keyboard navigation and a changed motion preference always expose content.
  document.addEventListener('focusin', event => {
    const element = event.target.closest('.motion-reveal');
    if (element) {
      element.classList.add('is-revealed');
      observer.unobserve(element);
    }
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      elements.forEach(element => element.classList.add('is-revealed'));
      observer.disconnect();
    }
  });
})();
