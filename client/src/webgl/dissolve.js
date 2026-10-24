// A soft noise dissolve between two flat colors, used behind the engine
// scenes when the active scene changes. Loaded lazily; the stage keeps its
// CSS background if WebGL is unavailable.
import * as THREE from 'three';

// Colors are brand sRGB values; pass them straight through.
THREE.ColorManagement.enabled = false;

const vert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`;
const frag = `
precision highp float;
varying vec2 vUv;
uniform vec3 uFrom; uniform vec3 uTo; uniform float uP; uniform vec2 uRes;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0; float a = 0.5; for(int i=0;i<4;i++){ v += a*noise(p); p *= 2.0; a *= 0.5; } return v; }
void main(){
  vec2 p = vUv * vec2(uRes.x/uRes.y, 1.0) * 3.0;
  float n = fbm(p) * 0.6 + (1.0 - vUv.y) * 0.4;
  float edge = smoothstep(uP - 0.08, uP + 0.08, n * 1.0);
  gl_FragColor = vec4(mix(uTo, uFrom, edge), 1.0);
}`;

export function createDissolve(canvas, initial) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uFrom: { value: new THREE.Color(initial) },
    uTo: { value: new THREE.Color(initial) },
    uP: { value: 1.2 },
    uRes: { value: new THREE.Vector2(1, 1) },
  };
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms })));

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w, h);
    render();
  };
  const render = () => renderer.render(scene, camera);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let raf = 0;
  return {
    to(color, duration = 900) {
      cancelAnimationFrame(raf);
      uniforms.uFrom.value.copy(uniforms.uTo.value);
      uniforms.uTo.value.set(color);
      const start = performance.now();
      const tick = (t) => {
        const k = Math.min(1, (t - start) / duration);
        const e = 1 - Math.pow(1 - k, 3);
        uniforms.uP.value = -0.2 + e * 1.4;
        render();
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); },
  };
}
