import * as THREE from 'three';

THREE.ColorManagement.enabled = false;

function faceTexture() {
  // The same mark as the logo: teal disc, green arc, warm dot in the gap.
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  const k = 512 / 48;
  g.fillStyle = '#012834';
  g.beginPath(); g.arc(256, 256, 256, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#4bcd3e'; g.lineWidth = 5 * k; g.lineCap = 'round';
  g.beginPath(); g.arc(256, 256, 14.5 * k, -Math.PI / 2, Math.PI * (1 + 1 / 6) + 0.0, false); g.stroke();
  g.fillStyle = '#f2a679';
  g.beginPath(); g.arc(15.6 * k, 11.2 * k, 3.1 * k, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

export function createCoin(canvas, host) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 0, 5.2);

  const face = faceTexture();
  const rim = new THREE.MeshPhongMaterial({ color: 0x3fbf33, shininess: 90, specular: 0xd8f5d0 });
  const front = new THREE.MeshPhongMaterial({ map: face, shininess: 60, specular: 0x557a80 });
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.16, 96), [rim, front, front]);
  coin.rotation.x = Math.PI / 2;
  const group = new THREE.Group();
  group.add(coin);
  scene.add(group);
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(2, 3, 4);
  scene.add(key);

  const target = { x: -0.25, y: 0.35 };
  const cur = { x: -0.25, y: 0.35 };
  let raf = 0;
  const render = () => renderer.render(scene, camera);
  const loop = () => {
    cur.x += (target.x - cur.x) * 0.1;
    cur.y += (target.y - cur.y) * 0.1;
    group.rotation.x = cur.x;
    group.rotation.y = cur.y;
    render();
    raf = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.001 ? requestAnimationFrame(loop) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const onScroll = () => { target.y = 0.35 + window.scrollY * 0.006; kick(); };
  const onPointer = (e) => {
    const r = host.getBoundingClientRect();
    target.x = -0.25 + ((e.clientY - r.top) / r.height - 0.5) * 0.8;
    target.y = 0.35 + ((e.clientX - r.left) / r.width - 0.5) * 1.2 + window.scrollY * 0.006;
    kick();
  };
  const onTilt = (e) => {
    if (e.beta == null) return;
    target.x = -0.25 + THREE.MathUtils.clamp((e.beta - 45) / 90, -0.6, 0.6);
    target.y = 0.35 + THREE.MathUtils.clamp(e.gamma / 60, -0.8, 0.8);
    kick();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('deviceorientation', onTilt);
  host.addEventListener('pointermove', onPointer);
  kick();

  return {
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('deviceorientation', onTilt);
      host.removeEventListener('pointermove', onPointer);
      renderer.dispose();
      face.dispose();
    },
  };
}
