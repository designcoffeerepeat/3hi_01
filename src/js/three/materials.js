import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

let foilTexture = null;

/**
 * Crinkled foil normal map: a tileable Voronoi pattern where every cell gets
 * its own tilted normal, which reads as hand-crumpled metal foil.
 */
function getFoilNormal() {
  if (foilTexture) return foilTexture;
  const size = 256;
  const cells = 240;
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pts = Array.from({ length: cells }, () => ({
    x: rand() * size,
    y: rand() * size,
    nx: (rand() - 0.5) * 1.1,
    ny: (rand() - 0.5) * 1.1,
  }));
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let best = Infinity;
      let cell = pts[0];
      for (const p of pts) {
        let dx = Math.abs(x - p.x);
        let dy = Math.abs(y - p.y);
        dx = Math.min(dx, size - dx);
        dy = Math.min(dy, size - dy);
        const d = dx * dx + dy * dy;
        if (d < best) {
          best = d;
          cell = p;
        }
      }
      const nz = Math.sqrt(Math.max(0.05, 1 - cell.nx * cell.nx - cell.ny * cell.ny));
      const i = (y * size + x) * 4;
      data[i] = (cell.nx * 0.5 + 0.5) * 255;
      data[i + 1] = (cell.ny * 0.5 + 0.5) * 255;
      data[i + 2] = (nz * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  foilTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  foilTexture.wrapS = foilTexture.wrapT = THREE.RepeatWrapping;
  foilTexture.magFilter = THREE.LinearFilter;
  foilTexture.minFilter = THREE.LinearMipmapLinearFilter;
  foilTexture.generateMipmaps = true;
  foilTexture.needsUpdate = true;
  return foilTexture;
}

function foil(repeat) {
  const t = getFoilNormal().clone();
  t.repeat.set(repeat, repeat);
  t.needsUpdate = true;
  return t;
}

/** Shared physically based materials for the inflatable, foil and chrome objects. */
export function createMaterials() {
  const balloon = (color, sheen = 0xffffff) =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.2,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      sheen: 0.6,
      sheenColor: new THREE.Color(sheen),
      sheenRoughness: 0.35,
    });

  return {
    chrome: new THREE.MeshPhysicalMaterial({ color: 0xf5f6f9, metalness: 1, roughness: 0.07 }),
    foilSilver: new THREE.MeshPhysicalMaterial({
      color: 0xe9ecf2,
      metalness: 1,
      roughness: 0.2,
      normalMap: foil(1.4),
      normalScale: new THREE.Vector2(1.1, 1.1),
    }),
    foilBlue: new THREE.MeshPhysicalMaterial({
      color: 0x5470ff,
      metalness: 1,
      roughness: 0.22,
      normalMap: foil(1.6),
      normalScale: new THREE.Vector2(1, 1),
    }),
    balloonBlue: balloon(0x2f4bff, 0x9fb0ff),
    balloonPink: balloon(0xff7fbd, 0xffd3e8),
    balloonMauve: balloon(0xb59ee0, 0xf0e6ff),
    stripes: new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      sheen: 0.4,
      sheenColor: new THREE.Color(0xffffff),
    }),
    glossInk: new THREE.MeshPhysicalMaterial({
      color: 0x111115,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
    }),
    iridescent: new THREE.MeshPhysicalMaterial({
      color: 0xf4f0ff,
      metalness: 0.35,
      roughness: 0.08,
      clearcoat: 1,
      iridescence: 1,
      iridescenceIOR: 1.9,
      iridescenceThicknessRange: [160, 860],
    }),
    lens: new THREE.MeshPhysicalMaterial({
      color: 0xcfdcff,
      roughness: 0.02,
      clearcoat: 1,
      transparent: true,
      opacity: 0.38,
    }),
  };
}

/**
 * Studio reflections: Three's RoomEnvironment plus brand-coloured light panels,
 * so chrome surfaces pick up blue and pink highlights.
 */
export function createEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const panel = (color, intensity, pos, rot, w = 4, h = 6) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(intensity),
        side: THREE.DoubleSide,
      })
    );
    m.position.set(...pos);
    m.rotation.set(...rot);
    room.add(m);
  };
  panel(0x2f4bff, 6, [-9, 3, 2], [0, Math.PI / 2, 0]);
  panel(0xff7fbd, 5, [9, 1, -2], [0, -Math.PI / 2, 0]);
  panel(0xffffff, 3, [0, 10, 0], [Math.PI / 2, 0, 0], 8, 3);
  const texture = pmrem.fromScene(room, 0.035).texture;
  room.traverse((o) => o.geometry?.dispose?.());
  pmrem.dispose();
  return texture;
}
