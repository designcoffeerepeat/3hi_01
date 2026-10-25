import * as THREE from 'three';

/*
  Generative "reel": three glowing horizon arcs (blue, pink, white) rising out
  of the dark, drawn in a single fragment shader. `uRise` is driven by scroll.
*/
const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uRise;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  // One horizon: a huge planet whose top edge crosses the frame. Drawn back to
  // front; each body occludes what is behind it, then adds a thin rim and halo.
  vec3 horizon(vec3 col, vec2 p, vec2 center, float radius, vec3 tint, float t) {
    vec2 q = p - center;
    float d = length(q) - radius;
    d += (fbm(vec2(atan(q.y, q.x) * 14.0, t * 0.25)) - 0.5) * 0.012;
    float inside = 1.0 - smoothstep(-0.002, 0.002, d);
    vec3 body = tint * 0.05 + tint * exp(d * 14.0) * 0.22;
    col = mix(col, body, inside);
    float rim = exp(-abs(d) * 140.0) * 1.15;
    float halo = exp(-max(d, 0.0) * 9.0) * (1.0 - inside) * 0.28;
    return col + tint * (rim + halo);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    p += uMouse * 0.03;
    float t = uTime;

    vec3 col = vec3(0.012, 0.012, 0.02);
    // faint starfield
    vec2 sp = floor(uv * uRes / 3.0);
    float star = step(0.9985, hash(sp)) * (0.5 + 0.5 * sin(t * 2.0 + hash(sp + 3.0) * 6.28));
    col += star * 0.6;

    float rise = uRise;
    col = horizon(col, p, vec2(0.0, -3.15 + rise * 0.95), 2.5, vec3(0.92, 0.9, 0.98), t + 7.0);
    col = horizon(col, p, vec2(0.32 * aspect, -2.6 + rise * 0.72), 2.1, vec3(1.0, 0.42, 0.72), t + 3.0);
    col = horizon(col, p, vec2(-0.34 * aspect, -2.35 + rise * 0.52), 2.0, vec3(0.2, 0.32, 1.0), t);

    // drifting haze
    col += vec3(0.25, 0.3, 0.8) * fbm(p * 2.0 + vec2(t * 0.05, 0.0)) * 0.035;

    // vignette and grain
    col *= 1.0 - 0.45 * pow(length(uv - 0.5) * 1.3, 2.0);
    col += (hash(uv * uRes + fract(t)) - 0.5) * 0.045;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createReel(canvas, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uTime: { value: 0 },
    uRise: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2() },
  };
  scene.add(
    new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader:
          'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }',
        fragmentShader,
      })
    )
  );

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w, h);
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  window.addEventListener(
    'pointermove',
    (e) => uniforms.uMouse.value.set(e.clientX / innerWidth - 0.5, 0.5 - e.clientY / innerHeight),
    { passive: true }
  );

  let visible = false;
  let rendered = false;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(canvas);
  const timer = new THREE.Timer();
  const timeEl = document.querySelector('[data-reel-time]');

  (function loop() {
    if (visible || !rendered) {
      timer.update();
      const t = timer.getElapsed();
      uniforms.uTime.value = reduced ? 8 : t + 8;
      renderer.render(scene, camera);
      rendered = true;
      if (timeEl && visible) {
        const s = Math.floor(t);
        timeEl.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      }
    }
    requestAnimationFrame(loop);
  })();

  return {
    setRise(v) {
      uniforms.uRise.value = v;
    },
  };
}
