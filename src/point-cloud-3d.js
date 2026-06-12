/**
 * point-cloud-3d.js
 * Motor WebGL (Three.js) de la nube de puntos 3D que forma una "sonrisa"
 * (arcada dental en U con profundidad real). Se usa en dos lugares:
 *   - Hero: convergencia + auto-rotación + parallax con el puntero.
 *   - Capa Escaneo del scrollytelling: la formación (scattered → sonrisa) se
 *     controla con el progreso del scroll.
 *
 * Carga diferida (import dinámico de three) y degradación elegante: si no hay
 * WebGL devuelve null y el llamador mantiene el fallback (canvas 2D / SVG).
 *
 * Nota: alude directamente al escáner intraoral 3D real de la clínica.
 */

function webglSupported() {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

// Genera la geometría destino: puntos sobre una arcada dental en U (XZ),
// dientes verticales con altura/ancho que varían hacia el fondo.
function buildArch(count) {
  const TEETH = 16;
  const perTooth = Math.floor(count / TEETH);
  const target = new Float32Array(TEETH * perTooth * 3);
  const shade = new Float32Array(TEETH * perTooth); // 0..1 para teñir profundidad
  let n = 0;
  for (let i = 0; i < TEETH; i++) {
    const u = (i / (TEETH - 1)) * 2 - 1; // -1..1 a lo largo de la arcada
    const cx = u * 3.1;
    const cz = u * u * 2.4 - 0.7; // parábola: centro al frente, lados al fondo
    const halfW = 0.34 - Math.abs(u) * 0.09;
    const halfH = 0.92 - Math.abs(u) * 0.22; // dientes frontales más largos
    for (let k = 0; k < perTooth; k++) {
      const rx = (Math.random() * 2 - 1) * halfW;
      const ry = (Math.random() * 2 - 1) * halfH;
      const rz = (Math.random() * 2 - 1) * 0.14;
      target[n * 3] = cx + rx;
      target[n * 3 + 1] = ry;
      target[n * 3 + 2] = cz + rz;
      shade[n] = Math.random();
      n++;
    }
  }
  return { target, shade, total: n };
}

// Posiciones de partida dispersas (nube difusa en una esfera)
function buildScatter(total) {
  const s = new Float32Array(total * 3);
  for (let i = 0; i < total; i++) {
    const r = 4 + Math.random() * 4;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(Math.random() * 2 - 1);
    s[i * 3] = r * Math.sin(ph) * Math.cos(th);
    s[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.7;
    s[i * 3 + 2] = r * Math.cos(ph);
  }
  return s;
}

function circleTexture(THREE) {
  const size = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export async function createPointCloud(canvas, opts = {}) {
  if (!webglSupported()) return null;
  let THREE;
  try {
    THREE = await import('three');
  } catch (e) {
    return null;
  }

  const {
    count = 3600,
    autoRotate = true,
    parallax = true,
    pointSize = 0.05,
  } = opts;

  const { target, shade, total } = buildArch(count);
  const scatter = buildScatter(total);
  const current = new Float32Array(total * 3);
  current.set(scatter);

  // Colores por punto: azul eléctrico con variación clara según "shade"
  const colors = new Float32Array(total * 3);
  const cA = new THREE.Color('#2B4CFF');
  const cB = new THREE.Color('#9DB0FF');
  for (let i = 0; i < total; i++) {
    const m = shade[i] * 0.6;
    colors[i * 3] = cA.r + (cB.r - cA.r) * m;
    colors[i * 3 + 1] = cA.g + (cB.g - cA.g) * m;
    colors[i * 3 + 2] = cA.b + (cB.b - cA.b) * m;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0.2, 7);
  camera.lookAt(0, 0, 0);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(current, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: pointSize,
    map: circleTexture(THREE),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,
    opacity: 0.95,
  });

  const group = new THREE.Group();
  const points = new THREE.Points(geom, material);
  group.add(points);
  scene.add(group);

  let formation = 0; // 0 = disperso, 1 = sonrisa formada
  let targetForm = 0;
  let raf = null;
  let running = false;
  const pointer = { x: 0, y: 0 };

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function updatePositions(lerpToward) {
    // Acerca formation a targetForm (cuando se anima sola, hero)
    if (lerpToward) formation += (targetForm - formation) * 0.06;
    const f = easeOut(Math.min(1, Math.max(0, formation)));
    const pos = geom.attributes.position.array;
    for (let i = 0; i < total; i++) {
      const j = i * 3;
      pos[j] = scatter[j] + (target[j] - scatter[j]) * f;
      pos[j + 1] = scatter[j + 1] + (target[j + 1] - scatter[j + 1]) * f;
      pos[j + 2] = scatter[j + 2] + (target[j + 2] - scatter[j + 2]) * f;
    }
    geom.attributes.position.needsUpdate = true;
  }

  let t0 = performance.now();
  function frame(now) {
    const dt = (now - t0) / 1000;
    t0 = now;
    updatePositions(autoRotate); // hero: anima hacia targetForm
    if (autoRotate) group.rotation.y += dt * 0.18;
    if (parallax) {
      group.rotation.y += (pointer.x * 0.5 - (group.rotation.y % (Math.PI * 2)) * 0) * 0;
      group.rotation.x += (pointer.y * 0.25 - group.rotation.x) * 0.05;
      group.position.x += (pointer.x * 0.4 - group.position.x) * 0.05;
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  function onPointer(e) {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  }

  resize();
  window.addEventListener('resize', resize);
  if (parallax) window.addEventListener('pointermove', onPointer, { passive: true });

  const api = {
    /** Inicia el loop de render (hero). */
    play() {
      if (running) return;
      running = true;
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    },
    /** Detiene el loop (ahorro de CPU fuera de viewport). */
    pause() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    },
    /** Anima la convergencia hacia la sonrisa (hero, al entrar). */
    formIntro(delay = 0) {
      setTimeout(() => {
        targetForm = 1;
      }, delay);
    },
    /** Fija la formación 0→1 y renderiza un frame (capa Escaneo por scroll). */
    setFormation(v) {
      formation = Math.min(1, Math.max(0, v));
      targetForm = formation;
      updatePositions(false);
      group.rotation.y = -0.5 + formation * 0.5; // ligera rotación con el avance
      renderer.render(scene, camera);
    },
    /** Render puntual (tras setFormation sin loop). */
    renderOnce() {
      renderer.render(scene, camera);
    },
    resize,
    dispose() {
      this.pause();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      geom.dispose();
      material.dispose();
      renderer.dispose();
    },
  };

  return api;
}

export { webglSupported };
