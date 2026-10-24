// Fine guilloche line work, the security-print pattern on bank notes and
// cards, drawn on offer tiles. On hover the lines bend gently around the
// pointer. Loaded lazily; tiles keep a flat color without WebGL.
import * as THREE from 'three';

// Colors are brand sRGB values; pass them straight through.
THREE.ColorManagement.enabled = false;

const vert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`;
const frag = `
precision highp float;
varying vec2 vUv;
uniform vec3 uBg; uniform vec3 uLine; uniform vec2 uMouse; uniform float uHover; uniform float uTime; uniform vec2 uRes;
void main(){
  vec2 asp = vec2(uRes.x/uRes.y, 1.0);
  vec2 p = (vUv - 0.5) * asp;
  vec2 m = (uMouse - 0.5) * asp;
  vec2 d = p - m;
  float r = length(d);
  float pull = uHover * 0.09 * exp(-r * r * 9.0);
  p -= normalize(d + 1e-5) * pull;
  float a = atan(p.y, p.x);
  float rr = length(p - vec2(0.55, -0.35) * asp.x * 0.5);
  float wave = rr * 70.0 + sin(a * 7.0 + uTime * 0.2) * 0.9 + sin(a * 3.0) * 0.6;
  float line = 1.0 - smoothstep(0.0, 0.2, abs(fract(wave) - 0.5) * 2.0 - 0.8);
  // Quiet at rest; the lines come up a little where the pointer is.
  float glow = 0.07 + uHover * 0.16 * exp(-r * r * 6.0);
  float fade = smoothstep(0.15, 0.9, vUv.y);
  gl_FragColor = vec4(mix(uBg, uLine, line * glow * (0.35 + 0.65 * fade)), 1.0);
}`;

export function createGuilloche(canvas, { bg, line }, { animate }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uBg: { value: new THREE.Color(bg) },
    uLine: { value: new THREE.Color(line) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uHover: { value: 0 },
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
  };
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms })));
  const render = () => renderer.render(scene, camera);
  const resize = () => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    uniforms.uRes.value.set(canvas.clientWidth, canvas.clientHeight);
    render();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let target = 0;
  let raf = 0;
  const loop = () => {
    uniforms.uHover.value += (target - uniforms.uHover.value) * 0.08;
    uniforms.uTime.value += 0.016;
    render();
    if (Math.abs(target - uniforms.uHover.value) > 0.002 || target > 0) raf = requestAnimationFrame(loop);
    else raf = 0;
  };
  const host = canvas.parentElement;
  const move = (e) => {
    const r = host.getBoundingClientRect();
    uniforms.uMouse.value.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
  };
  const enter = () => { if (!animate()) return; target = 1; if (!raf) raf = requestAnimationFrame(loop); };
  const leave = () => { target = 0; if (!raf) raf = requestAnimationFrame(loop); };
  host.addEventListener('pointermove', move);
  host.addEventListener('pointerenter', enter);
  host.addEventListener('pointerleave', leave);
  return {
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect();
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerenter', enter);
      host.removeEventListener('pointerleave', leave);
      renderer.dispose();
    },
  };
}
