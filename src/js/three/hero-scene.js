import * as THREE from 'three';
import { gsap } from 'gsap';
import { createMaterials, createEnvironment } from './materials.js';
import { BUILDERS } from './objects.js';

/*
  Hero: a floating constellation of inflatable, foil and chrome objects.
  - Mouse moves every object by an amount tied to its depth (3D parallax).
  - Scrolling lifts and scatters them at different speeds.
  - Hovering an object "pokes" it: it spins and bounces.
  Positions are given in viewport fractions (nx, ny from -1 to 1) at a world
  depth z, so the composition adapts to any aspect ratio.
*/

// key, nx, ny, z, size, base rotation [x, y, z]
const LANDSCAPE = [
  ['three', -0.36, 0.3, 0.6, 2.5, [0.15, 0.3, -0.12]],
  ['h', 0.04, 0.46, -1.6, 2.2, [0.1, -0.3, 0.1]],
  ['i', 0.34, 0.26, 0.9, 2.0, [0.05, 0.25, -0.25]],
  ['ring', 0.79, 0.34, -2.2, 2.2, [1.05, 0.3, 0.2]],
  ['star', -0.8, 0.28, -1.0, 1.7, [0.2, -0.25, 0.3]],
  ['arrow', 0.84, -0.08, 1.2, 1.45, [0.15, -0.3, -0.35]],
  ['bubble', 0.62, -0.58, 0.4, 1.6, [0.1, -0.3, 0.08]],
  ['sparkle', 0.55, 0.7, 0.3, 1.15, [0.2, 0.3, 0.2]],
  ['cursor', 0.16, 0.04, 2.4, 0.95, [0.25, -0.3, 0.35]],
  ['magnifier', -0.14, 0.74, -0.6, 1.4, [0.25, 0.3, -0.3]],
  ['chart', 0.62, 0.12, -0.8, 1.35, [0.1, -0.4, 0.05]],
  ['blob', 0.3, 0.7, -3.2, 1.2, [0, 0, 0]],
];

// size 0 hides an object on narrow screens to keep the composition airy
const PORTRAIT = [
  ['three', -0.5, 0.22, 0.6, 2.3, [0.15, 0.3, -0.12]],
  ['h', 0.06, 0.33, -1.4, 2.0, [0.1, -0.3, 0.1]],
  ['i', 0.58, 0.26, 0.9, 1.7, [0.05, 0.25, -0.25]],
  ['ring', -0.12, 0.6, -2.8, 1.6, [1.05, 0.3, 0.2]],
  ['star', -0.66, 0.6, -1.0, 0, [0.2, -0.25, 0.3]],
  ['arrow', 0.64, -0.1, 1.3, 1.3, [0.15, -0.3, -0.35]],
  ['bubble', -0.62, -0.06, 0.5, 1.45, [0.1, 0.3, 0.08]],
  ['sparkle', 0.66, 0.56, 0.2, 1.05, [0.2, 0.3, 0.2]],
  ['cursor', 0.1, 0.0, 2.4, 0.9, [0.25, -0.3, 0.35]],
  ['magnifier', -0.12, 0.3, -2.6, 0, [0.25, 0.3, -0.3]],
  ['chart', 0.4, -0.2, -2.6, 0, [0.1, -0.4, 0.05]],
  ['blob', 0.3, 0.62, -3.4, 0.9, [0, 0, 0]],
];

export function createHeroScene(canvas, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.environment = createEnvironment(renderer);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 16);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-4, 6, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xb9c4ff, 0.9);
  rim.position.set(6, -2, -4);
  scene.add(rim);

  const mats = createMaterials();
  const items = LANDSCAPE.map(([key], index) => {
    const anchor = new THREE.Group(); // position: layout + parallax + scroll
    const spin = new THREE.Group(); // rotation: idle + pokes
    const model = BUILDERS[key](mats);
    spin.add(model);
    anchor.add(spin);
    scene.add(anchor);
    return {
      key,
      anchor,
      spin,
      model,
      base: new THREE.Vector3(),
      size: 1,
      rot: new THREE.Euler(),
      depth: 0,
      phase: index * 1.37,
      dir: index % 2 ? 1 : -1,
      appear: reduced ? 1 : 0,
      poke: 1,
      spinVel: 0,
      spinAngle: 0,
    };
  });

  const state = {
    mouse: new THREE.Vector2(),
    target: new THREE.Vector2(),
    scroll: 0,
    visible: true,
    running: true,
    hovered: null,
    pointer: new THREE.Vector2(9, 9),
    pointerDirty: false,
  };

  // Hero copy the objects should never cover. Measured only while the hero sits
  // at the top of the page, since the copy drifts with scroll.
  const KEEP_OUT = [
    '.hero__kicker',
    '.hero__clocks',
    '.hero__lede',
    '.hero__foot .btn',
    '.hero__scroll',
    '.nav__logo',
    '.nav__links',
    '.nav__cta',
  ];
  let keepOut = [];
  let keepOutStale = true;

  function measureKeepOut() {
    const c = canvas.getBoundingClientRect();
    const rel = (r) => ({
      left: r.left - c.left,
      top: r.top - c.top,
      right: r.right - c.left,
      bottom: r.bottom - c.top,
    });
    const rects = [];
    const range = document.createRange();
    document.querySelectorAll('[data-hero-line]').forEach((el) => {
      range.selectNodeContents(el); // the text itself, not the full width block
      rects.push(rel(range.getBoundingClientRect()));
    });
    KEEP_OUT.forEach((sel) =>
      document.querySelectorAll(sel).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width && r.height) rects.push(rel(r));
      })
    );
    keepOut = rects;
    keepOutStale = false;
  }

  // distance from a circle to a rect, negative when they overlap (with padding)
  const gap = (x, y, r, b, pad) => {
    const cx = THREE.MathUtils.clamp(x, b.left, b.right);
    const cy = THREE.MathUtils.clamp(y, b.top, b.bottom);
    return Math.hypot(x - cx, y - cy) - r - pad;
  };

  /** Shrink, then nudge, an object until it clears the copy. Returns [px, py, size]. */
  function clearCopy(px, py, size, pxPerUnit, w, h) {
    const pad = Math.max(10, Math.min(w, h) * 0.018);
    const radius = () => (size / 2) * pxPerUnit * 0.85;
    const hit = () => keepOut.find((b) => gap(px, py, radius(), b, pad) < 0);
    for (let k = 0; k < 4 && hit(); k++) size *= 0.9;
    for (let k = 0; k < 8; k++) {
      const b = hit();
      if (!b) return [px, py, size];
      // push away from the closest point of the rect (or its centre when inside it)
      let dx = px - THREE.MathUtils.clamp(px, b.left, b.right);
      let dy = py - THREE.MathUtils.clamp(py, b.top, b.bottom);
      if (!dx && !dy) {
        dx = px - (b.left + b.right) / 2;
        dy = py - (b.top + b.bottom) / 2;
      }
      const len = Math.hypot(dx, dy) || 1;
      const step = radius() * 0.35;
      px = THREE.MathUtils.clamp(px + (dx / len) * step, 0, w);
      py = THREE.MathUtils.clamp(py + (dy / len) * step, 0, h);
    }
    return hit() ? [px, py, 0] : [px, py, size];
  }

  function layout() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (window.scrollY < 5) measureKeepOut();
    else keepOutStale = true;
    const portrait = w / h < 0.9;
    const rows = portrait ? PORTRAIT : LANDSCAPE;
    const scale = portrait
      ? THREE.MathUtils.clamp(w / h / 0.75, 0.5, 0.8)
      : THREE.MathUtils.clamp(w / h / 1.6, 0.72, 1.08);
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    rows.forEach(([key, nx, ny, z, size, rot]) => {
      const it = items.find((i) => i.key === key);
      const dist = camera.position.z - z;
      const halfH = tanHalf * dist;
      const halfW = halfH * camera.aspect;
      let px = (nx * 0.5 + 0.5) * w;
      let py = (0.5 - ny * 0.5) * h;
      let s = size * scale;
      if (s) [px, py, s] = clearCopy(px, py, s, h / 2 / halfH, w, h);
      it.base.set((px / w) * 2 * halfW - halfW, halfH - (py / h) * 2 * halfH, z);
      it.size = s;
      it.rot.set(...rot);
      it.depth = THREE.MathUtils.clamp((z + 3.5) / 6, 0, 1); // 0 = far, 1 = near
    });
  }
  layout();
  new ResizeObserver(layout).observe(canvas);
  document.fonts?.ready.then(layout); // web fonts change the size of the copy

  // pointer: parallax target + hover raycasting (the canvas itself ignores pointer events)
  const raycaster = new THREE.Raycaster();
  window.addEventListener(
    'pointermove',
    (e) => {
      state.target.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      const r = canvas.getBoundingClientRect();
      state.pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1
      );
      state.pointerDirty = true;
    },
    { passive: true }
  );
  window.addEventListener('pointerdown', () => {
    if (state.hovered) poke(state.hovered, 14);
  });

  function poke(it, strength = 7) {
    it.spinVel += strength * (Math.random() > 0.5 ? 1 : -1);
    gsap.fromTo(
      it,
      { poke: 0.86 },
      { poke: 1, duration: 1.1, ease: 'elastic.out(1.2, 0.35)', overwrite: true }
    );
  }

  function pick() {
    if (!state.pointerDirty) return;
    state.pointerDirty = false;
    let hit = null;
    if (Math.abs(state.pointer.x) <= 1 && Math.abs(state.pointer.y) <= 1 && state.scroll < 0.6) {
      raycaster.setFromCamera(state.pointer, camera);
      const hits = raycaster.intersectObjects(
        items.filter((i) => i.appear > 0.5).map((i) => i.model),
        true
      );
      if (hits.length) hit = items.find((i) => i.model === findModel(hits[0].object));
    }
    if (hit !== state.hovered) {
      if (hit) poke(hit);
      state.hovered = hit;
      document.documentElement.classList.toggle('is-poking', Boolean(hit));
    }
  }
  const findModel = (obj) => {
    while (obj && !items.some((i) => i.model === obj)) obj = obj.parent;
    return obj;
  };

  const timer = new THREE.Timer();
  function render() {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = timer.getElapsed();
    state.mouse.lerp(state.target, reduced ? 1 : 0.06);
    pick();

    const s = state.scroll;
    for (const it of items) {
      const near = 0.25 + it.depth * 0.9;
      const bob = reduced ? 0 : Math.sin(t * 0.9 + it.phase) * 0.14;
      it.anchor.position.set(
        it.base.x + state.mouse.x * near * 0.55 + it.base.x * s * 0.35,
        it.base.y + state.mouse.y * near * 0.4 + bob + s * (2.5 + it.depth * 6),
        it.base.z + s * it.depth * 2
      );
      const scale = it.size * it.appear * it.poke;
      it.anchor.scale.setScalar(Math.max(scale, 0.0001));

      if (!reduced) {
        it.spinVel *= Math.pow(0.05, dt); // friction
        it.spinAngle += it.spinVel * dt;
        if (Math.abs(it.spinVel) < 0.6) {
          // ease back to facing the viewer once a poke has worn off
          const rest = Math.round(it.spinAngle / (Math.PI * 2)) * Math.PI * 2;
          it.spinAngle += (rest - it.spinAngle) * (1 - Math.pow(0.15, dt));
        }
      }
      const sway = reduced ? 0 : Math.sin(t * 0.45 + it.phase) * 0.42;
      it.spin.rotation.set(
        it.rot.x + Math.sin(t * 0.6 + it.phase) * 0.12 + state.mouse.y * 0.25 + s * 1.2 * it.dir,
        it.rot.y + it.spinAngle + sway + state.mouse.x * 0.35,
        it.rot.z + Math.cos(t * 0.5 + it.phase) * 0.08
      );
    }
    renderer.render(scene, camera);
  }

  function loop() {
    if (state.visible && state.running) render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  new IntersectionObserver(([entry]) => (state.visible = entry.isIntersecting)).observe(canvas);
  document.addEventListener('visibilitychange', () => (state.running = !document.hidden));

  return {
    /** 0 at the top of the page, 1 once the hero has scrolled away. */
    setScroll(p) {
      state.scroll = p;
      if (p === 0 && keepOutStale) layout(); // resized while away from the top
    },
    /** Objects inflate in, one after another. */
    intro(delay = 0) {
      if (reduced) return;
      const order = [...items].sort((a, b) => b.depth - a.depth);
      order.forEach((it, i) => {
        gsap.to(it, {
          appear: 1,
          duration: 1.6,
          delay: delay + i * 0.07,
          ease: 'elastic.out(1, 0.55)',
        });
        it.spinVel = 6 * it.dir;
      });
    },
  };
}
