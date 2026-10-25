import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Reads the brand palette from CSS so the 3D scenes always match tokens in global.css. */
export function palette() {
  const css = getComputedStyle(document.documentElement);
  const get = (name: string) => new THREE.Color(css.getPropertyValue(name).trim() || '#ffffff');
  return {
    paper: get('--paper'),
    ink: get('--ink'),
    blue: get('--blue'),
    blueDeep: get('--blue-deep'),
    pink: get('--pink'),
    mauve: get('--mauve'),
    chrome: get('--chrome'),
  };
}

/** Renderer + soft studio lighting shared by every scene. */
export function createStage(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  scene.add(key, new THREE.AmbientLight(0xffffff, 0.35));

  return { renderer, scene };
}

/** Glossy, slightly candy-like material used for the floating objects. */
export function gloss(
  color: THREE.Color,
  extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}
) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.18,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    ...extra,
  });
}

/**
 * Runs `frame` on every animation frame while the canvas is on screen,
 * and resizes the renderer to the canvas's CSS box.
 */
export function loop(
  canvas: HTMLCanvasElement,
  renderer: THREE.WebGLRenderer,
  onResize: (w: number, h: number) => void,
  frame: (t: number, dt: number) => void
) {
  let visible = true;
  let raf = 0;
  let prev = performance.now();

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    onResize(w, h);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const tick = (now: number) => {
    const dt = Math.min((now - prev) / 1000, 0.05);
    prev = now;
    frame(now / 1000, dt);
    if (visible && !reducedMotion()) raf = requestAnimationFrame(tick);
  };

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) {
      prev = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }).observe(canvas);

  // One frame straight away so reduced-motion users still see the scene.
  tick(performance.now());
}

/** Raw pointer position in -1..1. Each scene eases its own copy with `follower()`. */
export const pointer = { x: 0, y: 0 };
addEventListener(
  'pointermove',
  (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
  },
  { passive: true }
);

export function follower(speed = 4) {
  const state = { x: 0, y: 0 };
  return (dt: number) => {
    const k = 1 - Math.exp(-dt * speed);
    state.x += (pointer.x - state.x) * k;
    state.y += (pointer.y - state.y) * k;
    return state;
  };
}
