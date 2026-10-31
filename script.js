const menuToggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-links');
if (menuToggle && menu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false');
  }));
}
const toggle = document.getElementById('schedule-toggle');
const details = document.getElementById('schedule-details');
if (toggle && details) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    details.hidden = !open;
    toggle.innerHTML = open ? 'HIDE SCHEDULE <span>↑</span>' : 'SHOW ALL 10 STAGES <span>↓</span>';
  });
}
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
