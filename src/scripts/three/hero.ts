import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createStage, follower, gloss, loop, palette, reducedMotion } from './common';

/**
 * Hero: the three horizons of the 3H-i mark rendered as glossy arcs,
 * with a few playful objects floating at different depths around them.
 * Mouse movement shifts near objects more than far ones (parallax),
 * and scrolling lifts everything gently out of frame.
 */
export function mountHero(canvas: HTMLCanvasElement) {
  const c = palette();
  const { renderer, scene } = createStage(canvas);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  // --- the mark: three arcs over a horizon bar -------------------------
  const mark = new THREE.Group();
  const arcs = [
    { r: 2.6, color: c.ink, tube: 0.36 },
    { r: 1.75, color: c.blue, tube: 0.36 },
  ].map(({ r, color, tube }, i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 48, 160, Math.PI), gloss(color));
    m.position.z = -i * 0.12;
    mark.add(m);
    return m;
  });
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
    gloss(c.pink, { roughness: 0.25 })
  );
  mark.add(sun);
  const bar = new THREE.Mesh(new RoundedBoxGeometry(6.6, 0.32, 0.9, 4, 0.16), gloss(c.ink));
  bar.position.y = -0.2;
  mark.add(bar);
  scene.add(mark);

  // --- floating objects, each with a depth used for parallax ------------
  type Floater = {
    mesh: THREE.Mesh;
    base: THREE.Vector3;
    depth: number;
    spin: THREE.Vector3;
    phase: number;
  };
  const floaters: Floater[] = [];
  const add = (geo: THREE.BufferGeometry, color: THREE.Color, depth: number, extra = {}) => {
    const mesh = new THREE.Mesh(geo, gloss(color, extra));
    scene.add(mesh);
    const f = {
      mesh,
      base: new THREE.Vector3(),
      depth,
      spin: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, 0).multiplyScalar(0.5),
      phase: Math.random() * Math.PI * 2,
    };
    floaters.push(f);
    return f;
  };
  const objects = [
    add(new THREE.SphereGeometry(0.55, 48, 32), c.blue, 1.2),
    add(new RoundedBoxGeometry(0.9, 0.9, 0.9, 6, 0.22), c.pink, 0.8),
    add(new THREE.TorusGeometry(0.45, 0.18, 32, 64), c.mauve, 1.0),
    add(new THREE.CapsuleGeometry(0.22, 0.7, 8, 24), c.paper, 1.4, { roughness: 0.3 }),
    add(new THREE.IcosahedronGeometry(0.42, 0), c.chrome, 0.6, { metalness: 0.9, roughness: 0.15 }),
    add(new THREE.SphereGeometry(0.28, 32, 16), c.pink, 1.6),
    add(new THREE.ConeGeometry(0.38, 0.7, 40), c.blue, 0.9),
  ];

  // Layout tables: [x, y, z] per object, for wide and narrow screens.
  const WIDE = {
    mark: [3.3, 0.7, 0],
    scale: 0.82,
    spots: [
      [6.1, 3.0, 0.5],
      [-0.3, 2.5, -1],
      [6.0, -2.3, 1.5],
      [2.3, -1.3, 2.6],
      [-2.6, 3.0, -2.5],
      [-4.6, 1.9, 1],
      [3.9, 3.5, -2],
    ],
  };
  // Portrait screens keep objects in the band above the headline; null hides one.
  const NARROW = {
    mark: [0, 1.45, 0],
    scale: 0.42,
    spots: [
      [1.45, 0.35, 1],
      [-1.5, 2.6, -1],
      [1.45, 2.65, 0.5],
      null,
      [-1.35, 0.25, 1.2],
      null,
      null,
    ],
  };
  type Layout = { mark: number[]; scale: number; spots: (number[] | null)[] };
  let layout: Layout = WIDE;
  const applyLayout = () => {
    mark.position.fromArray(layout.mark);
    mark.scale.setScalar(layout.scale);
    objects.forEach((o, i) => {
      const spot = layout.spots[i];
      o.mesh.visible = !!spot;
      if (spot) o.base.fromArray(spot);
    });
  };

  const ease = follower(3);
  let scroll = 0;
  addEventListener('scroll', () => (scroll = scrollY / innerHeight), { passive: true });

  // Intro: everything pops in from scale 0 with a little overshoot.
  const start = performance.now() / 1000;
  const still = reducedMotion();
  const pop = (t: number, delay: number) => {
    if (still) return 1;
    const x = Math.min(Math.max((t - start - delay) / 0.9, 0), 1);
    const s = 1.7;
    return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  };

  loop(
    canvas,
    renderer,
    (w, h) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      layout = w / h < 0.9 ? NARROW : WIDE;
      applyLayout();
    },
    (t, dt) => {
      const p = ease(dt);
      const s = Math.min(scroll, 1.5);

      mark.rotation.y = p.x * 0.35 + Math.sin(t * 0.4) * 0.05;
      mark.rotation.x = p.y * 0.18;
      mark.position.y = layout.mark[1] + s * 2.4;
      const ms = pop(t, 0) * layout.scale;
      mark.scale.setScalar(ms);
      arcs.forEach((a, i) => (a.rotation.z = Math.sin(t * 0.6 + i) * 0.02));

      floaters.forEach((f, i) => {
        const k = pop(t, 0.25 + i * 0.07);
        f.mesh.position.set(
          f.base.x - p.x * f.depth * 0.6,
          f.base.y +
            p.y * f.depth * 0.4 +
            Math.sin(t * 0.9 + f.phase) * 0.18 +
            s * (2 + f.depth * 2.2),
          f.base.z
        );
        f.mesh.rotation.x += f.spin.x * 0.02;
        f.mesh.rotation.y += f.spin.y * 0.02 + 0.003;
        f.mesh.scale.setScalar((layout === NARROW ? 0.6 : 1) * k);
      });

      renderer.render(scene, camera);
    }
  );
}
