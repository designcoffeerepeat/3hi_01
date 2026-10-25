import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { THREE_MARK_PATH } from '../../assets/three-path';
import { createStage, follower, gloss, loop, palette, reducedMotion } from './common';

/**
 * Hero: the "3" from the 3H-i logo, extruded into a glossy yellow object,
 * with a few playful shapes floating at different depths around it.
 * Mouse movement shifts near objects more than far ones (parallax), and
 * scrolling lifts everything gently out of frame.
 */
export function mountHero(canvas: HTMLCanvasElement) {
  const c = palette();
  const { renderer, scene } = createStage(canvas);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  // --- the "3" ------------------------------------------------------------
  const svg = new SVGLoader().parse(
    `<svg xmlns="http://www.w3.org/2000/svg"><path d="${THREE_MARK_PATH}"/></svg>`
  );
  const shapes = svg.paths.flatMap((p) => SVGLoader.createShapes(p));
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 7,
    bevelEnabled: true,
    bevelThickness: 1.4,
    bevelSize: 0.9,
    bevelSegments: 6,
    curveSegments: 24,
  });
  geo.center();
  geo.scale(0.11, -0.11, 0.11); // SVG y points down
  geo.computeVertexNormals();
  const three = new THREE.Mesh(geo, gloss(c.yellow, { roughness: 0.22, clearcoatRoughness: 0.12 }));
  const mark = new THREE.Group();
  mark.add(three);
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
    add(new THREE.SphereGeometry(0.5, 48, 32), c.ink, 1.2),
    add(new RoundedBoxGeometry(0.85, 0.85, 0.85, 6, 0.22), c.yellow, 0.8),
    add(new THREE.TorusGeometry(0.45, 0.18, 32, 64), c.ink, 1.0),
    add(new THREE.CapsuleGeometry(0.22, 0.7, 8, 24), c.white, 1.4, { roughness: 0.3 }),
    add(new THREE.IcosahedronGeometry(0.42, 0), c.chrome, 0.6, { metalness: 0.9, roughness: 0.15 }),
    add(new THREE.SphereGeometry(0.28, 32, 16), c.yellow, 1.6),
  ];

  // Layout tables: [x, y, z] per object, for wide and narrow screens; null hides one.
  type Layout = { mark: number[]; scale: number; spots: (number[] | null)[] };
  const WIDE: Layout = {
    mark: [3.9, 0.3, 0],
    scale: 0.82,
    spots: [[5.6, 1.4, 0], [0.2, 3.0, -1.5], [-2.6, 1.6, 0], null, [-5.6, 2.2, -2], [1.6, 1.6, 3]],
  };
  const NARROW: Layout = {
    mark: [0.5, 1.75, 0],
    scale: 0.4,
    spots: [[1.6, 2.9, 0.5], [-1.5, 2.8, -1.5], null, null, [-1.4, 0.6, 1], [1.7, 0.6, 2]],
  };
  let layout = WIDE;
  const applyLayout = () => {
    mark.position.fromArray(layout.mark);
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

      // The 3 turns to face the cursor and keeps a slow sway of its own.
      mark.rotation.y = -0.35 + p.x * 0.5 + Math.sin(t * 0.5) * 0.12;
      mark.rotation.x = p.y * 0.25 + Math.sin(t * 0.7) * 0.04;
      mark.rotation.z = -0.08;
      mark.position.y = layout.mark[1] + Math.sin(t * 0.9) * 0.08 + s * 2.6;
      mark.scale.setScalar(pop(t, 0) * layout.scale);

      floaters.forEach((f, i) => {
        if (!f.mesh.visible) return;
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
