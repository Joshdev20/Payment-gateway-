import { $, countUp, money } from './app.js?v=4';

/* ---- Sticky header shadow ---------------------------------------------- */
const header = $('#header');
if (header) {
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---- Mobile nav --------------------------------------------------------- */
const navToggle = $('#navToggle');
const navMobile = $('#navMobile');
if (navToggle && navMobile) {
  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    navMobile.hidden = open;
  });
  navMobile.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      navToggle.setAttribute('aria-expanded', 'false');
      navMobile.hidden = true;
    }
  });
}

/* ---- Animated metrics --------------------------------------------------- */
const counters = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const node = entry.target;
    counters.unobserve(node);

    if (node.dataset.format === 'money') {
      const target = Number(node.dataset.countTo) / 100;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / 1600);
        const eased = 1 - Math.pow(1 - t, 3);
        node.textContent = money(target * eased, 'USD');
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      continue;
    }

    countUp(node, {
      to: Number(node.dataset.countTo),
      decimals: Number(node.dataset.decimals || 0),
      prefix: node.dataset.prefix || '',
      suffix: node.dataset.suffix || '',
    });
  }
}, { threshold: 0.4 });

document.querySelectorAll('[data-count-to]').forEach((node) => counters.observe(node));

/* ---- Footer year -------------------------------------------------------- */
const year = $('#year');
if (year) year.textContent = new Date().getFullYear();
