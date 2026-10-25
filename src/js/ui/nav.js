/** Hide the nav while scrolling down, show it on the way up; mobile menu toggle. */
export function initNav(lenis) {
  const nav = document.querySelector('[data-nav]');
  const burger = nav?.querySelector('.nav__burger');
  const menu = document.querySelector('.menu');
  const root = document.documentElement;
  if (!nav) return;

  let last = 0;
  const onScroll = (y) => {
    if (root.classList.contains('menu-open')) return;
    nav.classList.toggle('is-hidden', y > last && y > 160);
    last = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  const setOpen = (open) => {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    menu.toggleAttribute('inert', !open);
    if (open) {
      nav.classList.remove('is-hidden');
      lenis?.stop();
      menu.querySelector('a')?.focus({ preventScroll: true });
    } else {
      lenis?.start();
    }
  };
  menu.toggleAttribute('inert', true);
  burger.addEventListener('click', () => setOpen(!root.classList.contains('menu-open')));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) {
      setOpen(false);
      burger.focus();
    }
  });
}
