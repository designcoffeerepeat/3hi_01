import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/* ------------------------------------------------------------------
   Theme: the whole page shifts between paper and ink as sections pass
   the middle of the viewport.
------------------------------------------------------------------- */
export function initTheme() {
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  root.classList.add('has-theme');
  const set = (mode) => {
    if ((root.dataset.mode || 'light') === mode) return;
    if (mode === 'dark') root.dataset.mode = 'dark';
    else delete root.dataset.mode;
    meta?.setAttribute('content', mode === 'dark' ? '#0c0c0e' : '#f2f0eb');
  };
  document.querySelectorAll('[data-theme]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && set(section.dataset.theme),
    });
  });
}

/* ------------------------------------------------------------------
   Hero entrance, played as the loader lifts.
------------------------------------------------------------------- */
export function heroIntro(hero, { reduced }) {
  const lines = gsap.utils.toArray('[data-hero-line]');
  if (reduced) {
    hero?.intro();
    return;
  }
  const chars = lines.flatMap(
    (line) => SplitText.create(line, { type: 'words,chars', mask: 'words', aria: 'none' }).chars
  );
  const tl = gsap.timeline();
  tl.from(chars, { yPercent: 115, rotate: 6, duration: 1.3, ease: 'expo.out', stagger: 0.022 }, 0)
    .from(
      '.hero__kicker, .hero__clocks',
      { y: 16, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08 },
      0.3
    )
    .from(
      '[data-hero-fade]',
      { y: 20, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08 },
      0.55
    )
    .from('.nav', { yPercent: -100, duration: 1, ease: 'expo.out' }, 0.2);
  hero?.intro(0.15);
}

/* ------------------------------------------------------------------
   Scroll-driven motion
------------------------------------------------------------------- */
export function initScrollMotion({ hero, reel, lenis }) {
  const mm = gsap.matchMedia();

  heroScroll(hero);
  reelScroll(reel, mm);
  wordsReveal();
  spreadHeadings();
  lineHeadings();
  reveals();
  workRows();
  tickers(lenis);
  servicesRows();
  method(mm);
  studio();
  audit();
  footer();
  parallax();
}

function heroScroll(hero) {
  const st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  ScrollTrigger.create({ ...st, onUpdate: (self) => hero?.setScroll(self.progress) });
  gsap.utils.toArray('[data-hero-line]').forEach((line, i) => {
    gsap.to(line, { xPercent: [0, -8, 10][i] ?? 0, ease: 'none', scrollTrigger: st });
  });
  gsap.to('.hero__title', { yPercent: -18, ease: 'none', scrollTrigger: st });
  gsap.to('.hero__top, .hero__foot', {
    opacity: 0,
    ease: 'none',
    scrollTrigger: { ...st, end: '45% top' },
  });
}

function reelScroll(reel, mm) {
  mm.add({ portrait: '(max-aspect-ratio: 1/1)', landscape: '(min-aspect-ratio: 1/1)' }, (ctx) => {
    const inset = ctx.conditions.portrait ? '24% 7% 24% 7%' : '28% 30% 28% 30%';
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.reel',
        start: 'top 80%',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => reel?.setRise(self.progress),
      },
    });
    tl.fromTo(
      '[data-reel-frame]',
      { clipPath: `inset(${inset} round 28px)` },
      { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 0.6 }
    )
      .fromTo(
        '[data-reel-title] span',
        { yPercent: 80, opacity: 0 },
        { yPercent: 0, opacity: 1, stagger: 0.12, ease: 'power2.out', duration: 0.3 },
        0.45
      )
      .to({}, { duration: 0.25 });
  });
}

function wordsReveal() {
  document.querySelectorAll('[data-words]').forEach((el) => {
    const split = SplitText.create(el, { type: 'words', wordsClass: 'word', aria: 'none' });
    gsap.to(split.words, {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 52%', scrub: true },
    });
    gsap.fromTo(
      el.querySelectorAll('.orb'),
      { scale: 0.2, rotate: -120 },
      {
        scale: 1,
        rotate: 0,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'center 55%', scrub: true },
      }
    );
  });
}

/** Characters start spread apart and close ranks as the heading scrolls in. */
function spreadHeadings() {
  document.querySelectorAll('[data-spread]').forEach((el) => {
    const { chars } = SplitText.create(el, { type: 'words,chars' });
    const mid = (chars.length - 1) / 2;
    const size = () => parseFloat(getComputedStyle(el).fontSize);
    gsap.fromTo(
      chars,
      {
        x: (i) => (i - mid) * size() * 0.32,
        yPercent: (i) => (i % 2 ? 22 : -22),
        rotate: (i) => (i - mid) * 3,
      },
      {
        x: 0,
        yPercent: 0,
        rotate: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'top 38%',
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    );
  });
}

function lineHeadings() {
  document.querySelectorAll('[data-lines]').forEach((el) => {
    const { lines } = SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line-inner',
    });
    gsap.from(lines, {
      yPercent: 105,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });
}

function reveals() {
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) =>
      gsap.from(els, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }),
  });
}

function workRows() {
  ScrollTrigger.batch('.work-row', {
    start: 'top 92%',
    once: true,
    onEnter: (rows) =>
      gsap.from(rows, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.07,
      }),
  });
}

function servicesRows() {
  ScrollTrigger.batch('.service', {
    start: 'top 90%',
    once: true,
    onEnter: (rows) =>
      gsap.from(rows, { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 }),
  });
}

/**
 * Infinite tickers whose speed and direction follow the scroll:
 * scrolling down speeds them up, scrolling up runs them backwards.
 */
function tickers(lenis) {
  const loops = [];

  const ticker = document.querySelector('[data-ticker]');
  if (ticker) {
    const track = ticker.querySelector('.ticker__track');
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    ticker.append(clone);
    loops.push({
      tween: gsap.to([track, clone], { xPercent: -100, ease: 'none', duration: 45, repeat: -1 }),
      dir: 1,
    });
  }

  document.querySelectorAll('[data-marquee]').forEach((row) => {
    const inner = row.querySelector('.marquee__inner');
    const copies = [inner];
    for (let i = 0; i < 2; i++) {
      const c = inner.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      row.append(c);
      copies.push(c);
    }
    const dir = Number(row.dataset.marquee) || 1;
    const tween = gsap.fromTo(
      copies,
      { xPercent: dir > 0 ? 0 : -100 },
      { xPercent: dir > 0 ? -100 : 0, ease: 'none', duration: 28, repeat: -1 }
    );
    loops.push({ tween, dir: 1, row });
  });

  if (!lenis) return;
  const skewTo = gsap.utils
    .toArray('[data-marquee]')
    .map((row) => gsap.quickTo(row, 'skewX', { duration: 0.5, ease: 'power3' }));
  let direction = 1;
  lenis.on('scroll', ({ velocity, direction: d }) => {
    if (d) direction = d;
    const boost = 1 + Math.min(Math.abs(velocity) / 6, 6);
    loops.forEach(({ tween }) => {
      gsap.to(tween, { timeScale: direction * boost, duration: 0.25, overwrite: true });
    });
    skewTo.forEach((to) => to(gsap.utils.clamp(-8, 8, -velocity * 0.4)));
  });
  // ease back to cruising speed when scrolling stops
  gsap.ticker.add(() => {
    if (Math.abs(lenis.velocity) < 0.05) {
      loops.forEach(({ tween }) => {
        const target = direction;
        tween.timeScale(tween.timeScale() + (target - tween.timeScale()) * 0.05);
      });
    }
  });
}

/** Horizontal "three horizons" track, pinned on larger screens. */
function method(mm) {
  mm.add('(min-width: 901px)', () => {
    const track = document.querySelector('.method__track');
    const distance = () => track.scrollWidth - window.innerWidth;
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.method',
        pin: true,
        start: 'top top',
        end: () => `+=${distance()}`,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
    gsap.utils.toArray('.horizon').forEach((panel) => {
      gsap.fromTo(
        panel.querySelector('[data-sun]'),
        { yPercent: 55, scale: 0.85 },
        {
          yPercent: -38,
          scale: 1.05,
          ease: 'none',
          scrollTrigger: {
            trigger: panel,
            containerAnimation: tween,
            start: 'left right',
            end: 'right left',
            scrub: true,
          },
        }
      );
      gsap.fromTo(
        panel,
        { rotationY: -24, transformPerspective: 1400, transformOrigin: '0% 50%' },
        {
          rotationY: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: panel,
            containerAnimation: tween,
            start: 'left right',
            end: 'left 55%',
            scrub: true,
          },
        }
      );
    });
  });

  mm.add('(max-width: 900px)', () => {
    gsap.utils.toArray('.horizon').forEach((panel) => {
      gsap.fromTo(
        panel.querySelector('[data-sun]'),
        { yPercent: 50 },
        {
          yPercent: -30,
          ease: 'none',
          scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      );
    });
  });
}

function studio() {
  gsap.from('.card', {
    y: 140,
    rotationY: (i) => (i - 1) * 28,
    rotationX: 18,
    z: -200,
    opacity: 0,
    transformPerspective: 1400,
    duration: 1.5,
    ease: 'expo.out',
    stagger: 0.12,
    scrollTrigger: { trigger: '.cards', start: 'top 85%' },
  });
  document.querySelectorAll('[data-count-to]').forEach((el) => {
    const counter = { v: 0 };
    gsap.to(counter, {
      v: Number(el.dataset.countTo),
      duration: 2,
      ease: 'power3.out',
      onUpdate: () => (el.textContent = Math.round(counter.v)),
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });
}

function audit() {
  gsap.fromTo(
    '[data-audit]',
    { scale: 0.86, borderRadius: 96 },
    {
      scale: 1,
      borderRadius: 40,
      ease: 'none',
      scrollTrigger: { trigger: '.audit', start: 'top bottom', end: 'top 25%', scrub: true },
    }
  );
  gsap.to('.audit__orbit', {
    rotate: 140,
    ease: 'none',
    scrollTrigger: { trigger: '.audit', start: 'top bottom', end: 'bottom top', scrub: true },
  });
  gsap.from('.audit__checks li', {
    x: -30,
    opacity: 0,
    duration: 0.9,
    ease: 'expo.out',
    stagger: 0.07,
    scrollTrigger: { trigger: '.audit__checks', start: 'top 88%' },
  });
}

function footer() {
  const letters = gsap.utils.toArray('[data-footer-word] span');
  gsap.fromTo(
    letters,
    { yPercent: (i) => 70 + i * 18 },
    {
      yPercent: 0,
      ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
    }
  );
}

function parallax() {
  gsap.utils.toArray('[data-speed]').forEach((el) => {
    const speed = parseFloat(el.dataset.speed);
    gsap.fromTo(
      el,
      { yPercent: 50 * speed },
      {
        yPercent: -50 * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: el.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}
