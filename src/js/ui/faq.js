import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Native <details> accordions with animated height. Works without JS too. */
export function initFaq() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.faq__item').forEach((item) => {
    const summary = item.querySelector('summary');
    const body = item.querySelector('.faq__body');
    summary.addEventListener('click', (e) => {
      if (reduced) return;
      e.preventDefault();
      if (item.open) {
        gsap.to(body, {
          height: 0,
          duration: 0.5,
          ease: 'power3.inOut',
          onComplete: () => {
            item.open = false;
            gsap.set(body, { clearProps: 'height' });
            ScrollTrigger.refresh();
          },
        });
      } else {
        item.open = true;
        gsap.fromTo(
          body,
          { height: 0 },
          {
            height: 'auto',
            duration: 0.7,
            ease: 'expo.out',
            onComplete: () => ScrollTrigger.refresh(),
          }
        );
      }
    });
  });
}
