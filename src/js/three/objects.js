import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/*
  Procedural "objects of growth": inflatable balloon letters for 3H-i plus a
  glossy icon for each service. Everything is generated in code, so there are
  no model files to load. Each builder returns a Group normalised to a unit box.
*/

const TAU = Math.PI * 2;

/** Centre an object and scale it so its largest dimension equals `size`. */
function normalize(object, size = 1) {
  const box = new THREE.Box3().setFromObject(object);
  const dims = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);
  const wrap = new THREE.Group();
  wrap.add(object);
  wrap.scale.setScalar(size / Math.max(dims.x, dims.y, dims.z));
  return wrap;
}

/** Pillow-like extrusion: a thin slab with a deep rounded bevel reads as inflated. */
function puffy(shape, { depth = 0.06, thickness = 0.26, size = 0.16, segments = 12 } = {}) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: thickness,
    bevelSize: size,
    bevelOffset: -size * 0.35,
    bevelSegments: segments,
    curveSegments: 40,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

const sphere = (r, mat) => new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), mat);
const capsule = (r, h, mat) => new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 16, 40), mat);

/* ---------------- balloon letters ---------------- */

export function balloonThree(mat) {
  const g = new THREE.Group();
  const R = 0.5;
  const t = 0.24;
  const arc = (TAU * 2) / 3;
  const bowl = (startAngle, cy) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(R, t, 40, 120, arc), mat);
    m.rotation.z = startAngle;
    m.position.y = cy;
    g.add(m);
  };
  bowl(-Math.PI / 2, R);
  bowl((-5 * Math.PI) / 6, -R);
  const cap = (a, cy) => {
    const s = sphere(t, mat);
    s.position.set(Math.cos(a) * R, cy + Math.sin(a) * R, 0);
    g.add(s);
  };
  cap((5 * Math.PI) / 6, R);
  cap((-5 * Math.PI) / 6, -R);
  cap(-Math.PI / 2, R);
  return normalize(g);
}

export function balloonH(mat) {
  const g = new THREE.Group();
  const r = 0.22;
  for (const x of [-0.46, 0.46]) {
    const c = capsule(r, 1.3, mat);
    c.position.x = x;
    g.add(c);
  }
  const bar = capsule(r * 0.92, 0.5, mat);
  bar.rotation.z = Math.PI / 2;
  g.add(bar);
  return normalize(g);
}

export function balloonI(mat) {
  const g = new THREE.Group();
  const stem = capsule(0.22, 0.95, mat);
  stem.position.y = -0.32;
  const dot = sphere(0.25, mat);
  dot.position.y = 0.78;
  g.add(stem, dot);
  return normalize(g);
}

/* ---------------- inflatables ---------------- */

export function ringFloat(mats) {
  const geo = new THREE.TorusGeometry(0.62, 0.3, 48, 160);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const a = new THREE.Color(0xb59ee0);
  const b = new THREE.Color(0xfaf7ff);
  for (let i = 0; i < pos.count; i++) {
    const angle = Math.atan2(pos.getY(i), pos.getX(i)) + Math.PI;
    const c = Math.floor((angle / TAU) * 8) % 2 ? a : b;
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return normalize(new THREE.Mesh(geo, mats.stripes));
}

export function puffyStar(mat) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.46 : 1;
    const a = Math.PI / 2 + (i / 10) * TAU;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  s.closePath();
  return normalize(new THREE.Mesh(puffy(s, { thickness: 0.2, size: 0.12 }), mat));
}

export function puffyArrow(mat) {
  const s = new THREE.Shape();
  s.moveTo(-0.3, -0.95);
  s.lineTo(0.3, -0.95);
  s.lineTo(0.3, 0.12);
  s.lineTo(0.78, 0.12);
  s.lineTo(0, 0.98);
  s.lineTo(-0.78, 0.12);
  s.lineTo(-0.3, 0.12);
  s.closePath();
  return normalize(new THREE.Mesh(puffy(s, { thickness: 0.24, size: 0.14 }), mat));
}

export function speechBubble(mats) {
  const w = 0.9;
  const h = 0.62;
  const r = 0.42;
  const s = new THREE.Shape();
  s.moveTo(-w + r, h);
  s.lineTo(w - r, h);
  s.quadraticCurveTo(w, h, w, h - r);
  s.lineTo(w, -h + r);
  s.quadraticCurveTo(w, -h, w - r, -h);
  s.lineTo(-0.12, -h);
  s.lineTo(-0.66, -h - 0.46);
  s.lineTo(-0.5, -h);
  s.lineTo(-w + r, -h);
  s.quadraticCurveTo(-w, -h, -w, -h + r);
  s.lineTo(-w, h - r);
  s.quadraticCurveTo(-w, h, -w + r, h);
  const geo = puffy(s, { thickness: 0.28, size: 0.16 });
  geo.computeBoundingBox();
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, mats.balloonPink));
  // three "typing" dots, a quiet nod to the three horizons
  const front = geo.boundingBox.max.z * 0.82;
  [-0.42, 0, 0.42].forEach((x) => {
    const d = sphere(0.13, mats.chrome);
    d.position.set(x, 0.08, front);
    g.add(d);
  });
  return normalize(g);
}

export function sparkle(mat) {
  const s = new THREE.Shape();
  const k = 0.14;
  s.moveTo(0, 1);
  s.quadraticCurveTo(k, k, 1, 0);
  s.quadraticCurveTo(k, -k, 0, -1);
  s.quadraticCurveTo(-k, -k, -1, 0);
  s.quadraticCurveTo(-k, k, 0, 1);
  return normalize(new THREE.Mesh(puffy(s, { thickness: 0.18, size: 0.08, depth: 0.04 }), mat));
}

export function cursorPointer(mat) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0, -1.02);
  s.lineTo(0.25, -0.79);
  s.lineTo(0.45, -1.2);
  s.lineTo(0.62, -1.12);
  s.lineTo(0.43, -0.72);
  s.lineTo(0.76, -0.72);
  s.closePath();
  return normalize(new THREE.Mesh(puffy(s, { thickness: 0.16, size: 0.08 }), mat));
}

export function magnifier(mats) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.11, 32, 96), mats.chrome);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 64), mats.lens);
  lens.rotation.x = Math.PI / 2;
  const handle = capsule(0.12, 0.62, mats.balloonBlue);
  const d = 0.42 + 0.11 + 0.42;
  handle.position.set(Math.cos(-Math.PI / 4) * d, Math.sin(-Math.PI / 4) * d, 0);
  handle.rotation.z = Math.PI / 4;
  g.add(ring, lens, handle);
  return normalize(g);
}

export function barChart(mats) {
  const g = new THREE.Group();
  const heights = [0.6, 1.0, 1.5];
  const materials = [mats.balloonBlue, mats.balloonPink, mats.chrome];
  heights.forEach((h, i) => {
    const bar = new THREE.Mesh(new RoundedBoxGeometry(0.42, h, 0.42, 6, 0.14), materials[i]);
    bar.position.set((i - 1) * 0.52, h / 2, 0);
    g.add(bar);
  });
  return normalize(g);
}

export function chromeBlob(mat) {
  const geo = new THREE.SphereGeometry(0.7, 160, 120);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const wobble =
      0.09 * Math.sin(n.x * 3.1 + n.y * 1.7) +
      0.07 * Math.sin(n.y * 4.3 - n.z * 2.2) +
      0.05 * Math.sin(n.z * 5.7 + n.x * 3.3);
    v.addScaledVector(n, wobble);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return normalize(new THREE.Mesh(geo, mat));
}

/** Registry used by both the hero scene and the services follower. */
export const BUILDERS = {
  three: (m) => balloonThree(m.chrome),
  h: (m) => balloonH(m.balloonBlue),
  i: (m) => balloonI(m.balloonPink),
  ring: (m) => ringFloat(m),
  star: (m) => puffyStar(m.foilSilver),
  arrow: (m) => puffyArrow(m.foilBlue),
  bubble: (m) => speechBubble(m),
  sparkle: (m) => sparkle(m.iridescent),
  cursor: (m) => cursorPointer(m.glossInk),
  magnifier: (m) => magnifier(m),
  chart: (m) => barChart(m),
  blob: (m) => chromeBlob(m.chrome),
};
