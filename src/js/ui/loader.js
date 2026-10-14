import { gsap } from 'gsap';

/**
 * Intro loader: counts 000 to 100 as real work (fonts, WebGL) finishes,
 * then lifts like a curtain. `finish()` resolves as the curtain starts moving.
 */
export function createLoader({ reduced = false } = {}) {
  const el = document.querySelector('.loader');
  const countEl = el?.querySelector('[data-loader-count]');
  const barEl = el?.querySelector('[data-loader-bar]');
  const tasks = [];
  let settled = 0;
  const progress = { v: 0 };
  const minTime = new Promise((r) => setTimeout(r, 1100));

  document.body.classList.add('is-loading');

  const render = () => {
    const v = Math.round(progress.v);
    if (countEl) countEl.textContent = String(v).padStart(3, '0');
    if (barEl) barEl.style.width = `${v}%`;
  };
  const advance = () => {
    const target = 15 + (settled / Math.max(tasks.length, 1)) * 75;
    gsap.to(progress, {
      v: target,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate: render,
      overwrite: true,
    });
  };
  advance();

  return {
    track(promise) {
      tasks.push(promise);
      Promise.resolve(promise)
        .catch(() => {})
        .finally(() => {
          settled += 1;
          advance();
        });
      return promise;
    },
    async finish() {
      if (reduced) {
        // no counting theatre for reduced motion: wait for fonts only, then get out of the way
        await Promise.race([Promise.allSettled(tasks), new Promise((r) => setTimeout(r, 2500))]);
        document.body.classList.remove('is-loading');
        window.__3hiReady = true;
        el?.remove();
        return;
      }
      await Promise.allSettled([...tasks, minTime]);
      await gsap.to(progress, {
        v: 100,
        duration: 0.45,
        ease: 'power2.inOut',
        onUpdate: render,
        overwrite: true,
      });
      document.body.classList.remove('is-loading');
      window.__3hiReady = true;
      if (!el) return;
      gsap.to(el, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 1.1,
        ease: 'expo.inOut',
        onComplete: () => el.remove(),
      });
      await new Promise((r) => setTimeout(r, 350));
    },
  };
}
