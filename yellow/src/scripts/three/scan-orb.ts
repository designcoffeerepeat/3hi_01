import * as THREE from 'three';
import { createStage, follower, gloss, loop, palette } from './common';

export type ScanState = { phase: 'idle' | 'scanning' | 'done'; score?: number };

/**
 * The "AI brain" beside the scan form: a cloud of points on a sphere around
 * a glossy core, with orbit rings. It idles slowly, spins up and sweeps a
 * scan ring while a scan runs, then settles and tints by the score.
 * Listens for `scan:state` events on window.
 */
export function mountScanOrb(canvas: HTMLCanvasElement) {
  const c = palette();
  const { renderer, scene } = createStage(canvas);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0, 9);

  const orb = new THREE.Group();
  scene.add(orb);

  // Points on a Fibonacci sphere, mostly ink with a few white.
  const N = 900;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const base = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = i * Math.PI * (3 - Math.sqrt(5));
    const v = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(2.2);
    v.toArray(base, i * 3);
    v.toArray(pos, i * 3);
    (i % 6 === 0 ? c.white : c.ink).toArray(col, i * 3);
  }
  const pts = new THREE.BufferGeometry();
  pts.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pts.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const cloud = new THREE.Points(
    pts,
    new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
  );
  orb.add(cloud);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.05, 6),
    gloss(c.white, { roughness: 0.12 })
  );
  orb.add(core);
  const cage = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.45, 1),
    new THREE.MeshBasicMaterial({
      color: c.ink,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    })
  );
  orb.add(cage);

  const rings = [2.7, 3.15].map((r, i) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.035, 12, 200),
      gloss(i ? c.white : c.ink)
    );
    m.rotation.x = Math.PI / 2 + (i ? -0.5 : 0.35);
    m.rotation.y = i ? 0.4 : -0.2;
    orb.add(m);
    return m;
  });
  const moons = rings.map((ring, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 16), gloss(i ? c.ink : c.white));
    ring.add(m);
    return m;
  });

  // Horizontal scan ring that sweeps the sphere while scanning.
  const sweep = new THREE.Mesh(
    new THREE.TorusGeometry(2.3, 0.02, 8, 160),
    new THREE.MeshBasicMaterial({ color: c.ink, transparent: true, opacity: 0 })
  );
  sweep.rotation.x = Math.PI / 2;
  orb.add(sweep);

  let state: ScanState = { phase: 'idle' };
  let energy = 0; // 0 idle .. 1 scanning
  let spin = 0;
  const target = new THREE.Color().copy(c.white);
  addEventListener('scan:state', (e) => {
    state = (e as CustomEvent<ScanState>).detail;
    if (state.phase === 'done' && state.score != null) {
      // Low scores darken the core, high scores keep it bright.
      target.copy(c.ink).lerp(c.white, state.score / 100);
    } else target.copy(c.white);
  });

  const ease = follower(2.5);
  const tmp = new THREE.Vector3();

  loop(
    canvas,
    renderer,
    (w, h) => {
      camera.aspect = w / h;
      camera.position.z = w / h < 1 ? 11 : 9;
      camera.updateProjectionMatrix();
    },
    (t, dt) => {
      const p = ease(dt);
      const want = state.phase === 'scanning' ? 1 : 0;
      energy += (want - energy) * (1 - Math.exp(-dt * 3));
      spin += dt * (0.15 + energy * 1.6);

      orb.rotation.y = spin + p.x * 0.4;
      orb.rotation.x = p.y * 0.25;
      cage.rotation.x = -spin * 0.7;
      rings[0].rotation.z = spin * 0.8;
      rings[1].rotation.z = -spin * 0.6;
      moons.forEach((m, i) =>
        m.position.set(
          Math.cos(t * (0.8 + i * 0.3)) * (2.7 + i * 0.45),
          Math.sin(t * (0.8 + i * 0.3)) * (2.7 + i * 0.45),
          0
        )
      );

      // Breathing points: a ripple that grows while scanning.
      const amp = 0.04 + energy * 0.22;
      for (let i = 0; i < N; i++) {
        tmp.fromArray(base, i * 3);
        const k = 1 + Math.sin(t * 2.2 + tmp.y * 3 + tmp.x * 2) * amp;
        tmp.multiplyScalar(k).toArray(pos, i * 3);
      }
      pts.attributes.position.needsUpdate = true;

      (core.material as THREE.MeshPhysicalMaterial).color.lerp(target, 1 - Math.exp(-dt * 2));
      core.scale.setScalar(1 + Math.sin(t * 3) * 0.02 + energy * 0.08);

      sweep.position.y = Math.sin(t * 2.4) * 2;
      sweep.scale.setScalar(Math.sqrt(Math.max(0.05, 1 - (sweep.position.y / 2.3) ** 2)));
      (sweep.material as THREE.MeshBasicMaterial).opacity = energy;

      renderer.render(scene, camera);
    }
  );
}
