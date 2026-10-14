import * as THREE from 'three';
import { gsap } from 'gsap';
import { createMaterials, createEnvironment } from './materials.js';
import { BUILDERS } from './objects.js';

/*
  Services follower: a small transparent canvas that trails the cursor while
  hovering a service row and shows that service's object (SEO = magnifier,
  growth = arrow, and so on). It only renders while visible.
*/
export function createFollower(canvas, rows) {
  const SIZE = 300;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(SIZE, SIZE, false);
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  scene.environment = createEnvironment(renderer);
  const light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(-3, 4, 6);
  scene.add(light);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.z = 6;

  const mats = createMaterials();
  const objects = {};
  rows.forEach((row) => {
    const key = row.dataset.object;
    if (!key || objects[key] || !BUILDERS[key]) return;
    const pivot = new THREE.Group();
    pivot.add(BUILDERS[key](mats));
    pivot.scale.setScalar(0.0001);
    pivot.userData.show = 0;
    scene.add(pivot);
    objects[key] = pivot;
  });

  let active = null;
  let rendering = false;
  let lastX = 0;
  let velX = 0;
  const xTo = gsap.quickTo(canvas, 'x', { duration: 0.55, ease: 'power3' });
  const yTo = gsap.quickTo(canvas, 'y', { duration: 0.55, ease: 'power3' });

  function show(key) {
    if (active === key) return;
    Object.entries(objects).forEach(([k, pivot]) => {
      gsap.to(pivot.userData, {
        show: k === key ? 1 : 0,
        duration: k === key ? 0.9 : 0.35,
        ease: k === key ? 'elastic.out(1, 0.6)' : 'power2.in',
        overwrite: true,
      });
    });
    if (key && objects[key]) objects[key].rotation.y = -1.2;
    active = key;
    if (key) start();
  }

  function start() {
    if (rendering) return;
    rendering = true;
    gsap.ticker.add(tick);
  }

  function tick() {
    velX += (0 - velX) * 0.08;
    let anyVisible = false;
    Object.values(objects).forEach((pivot) => {
      const s = pivot.userData.show;
      pivot.scale.setScalar(Math.max(s * 2.1, 0.0001));
      pivot.rotation.y += 0.012;
      pivot.rotation.z = THREE.MathUtils.clamp(-velX * 0.02, -0.5, 0.5);
      pivot.rotation.x = 0.2;
      if (s > 0.001) anyVisible = true;
    });
    renderer.render(scene, camera);
    if (!anyVisible && !active) {
      gsap.ticker.remove(tick);
      rendering = false;
    }
  }

  rows.forEach((row) => {
    row.addEventListener('pointerenter', () => show(row.dataset.object));
  });
  rows[0]?.parentElement.addEventListener('pointerleave', () => show(null));
  window.addEventListener(
    'pointermove',
    (e) => {
      velX = e.clientX - lastX;
      lastX = e.clientX;
      xTo(e.clientX + 120);
      yTo(e.clientY);
    },
    { passive: true }
  );
}
