import { gsap } from 'gsap';

/** Floating preview card that trails the cursor across the work list. */
export function initWorkPreview() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const preview = document.querySelector('.preview');
  const inner = preview?.querySelector('.preview__inner');
  const card = preview?.querySelector('[data-preview-card]');
  const list = document.querySelector('.work__list');
  if (!preview || !list) return;
  const nameEl = card.querySelector('[data-preview-name]');
  const tagEl = card.querySelector('[data-preview-tag]');

  const xTo = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3' });
  const yTo = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3' });
  const rTo = gsap.quickTo(inner, 'rotation', { duration: 0.6, ease: 'power3' });
  let lastX = 0;

  window.addEventListener(
    'pointermove',
    (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
      rTo(gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.6));
      lastX = e.clientX;
    },
    { passive: true }
  );

  list.querySelectorAll('[data-preview]').forEach((row) => {
    row.addEventListener('pointerenter', () => {
      const [name, tag, hue] = row.dataset.preview.split('|');
      nameEl.textContent = name;
      tagEl.textContent = `(${tag})`;
      card.style.setProperty('--h', hue);
      gsap.to(inner, { scale: 1, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
    });
  });
  list.addEventListener('pointerleave', () =>
    gsap.to(inner, { scale: 0, duration: 0.45, ease: 'power3.in', overwrite: 'auto' })
  );
}
