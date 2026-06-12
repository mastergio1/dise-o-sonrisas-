/**
 * hero-mesh.js
 * Fondo del Hero: nube de puntos que forma la sonrisa (alude al escáner
 * intraoral 3D real de la clínica).
 *
 * Estrategia de capas de calidad:
 *   1) WebGL (Three.js) — nube de puntos 3D con profundidad, convergencia,
 *      auto-rotación y parallax. Carga diferida.
 *   2) Fallback canvas 2D — campo de puntos liviano si no hay WebGL.
 *   3) prefers-reduced-motion — un único frame estático (sin loop).
 */
import { createPointCloud } from './point-cloud-3d.js';

export function initHeroMesh(prefersReduced) {
  const canvas = document.getElementById('hero-mesh');
  if (!canvas) return;

  // reduced-motion: frame estático 2D (sin animación ni WebGL en bucle)
  if (prefersReduced) {
    init2D(canvas, true);
    return;
  }

  // Intenta WebGL 3D; si no hay soporte, cae al campo de puntos 2D.
  const small = window.innerWidth < 640;
  createPointCloud(canvas, {
    count: small ? 2200 : 3600,
    autoRotate: true,
    parallax: !small,
    pointSize: small ? 0.06 : 0.05,
  })
    .then((cloud) => {
      if (!cloud) {
        init2D(canvas, false);
        return;
      }
      cloud.play();
      cloud.formIntro(150); // converge al entrar

      // Pausa fuera de viewport (ahorro de CPU/batería)
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => (e.isIntersecting ? cloud.play() : cloud.pause()));
        },
        { threshold: 0 }
      );
      io.observe(canvas);
    })
    .catch(() => init2D(canvas, false));
}

/* ---------- Fallback / reduced-motion: campo de puntos 2D ---------- */
function init2D(canvas, staticFrame) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let points = [];
  let raf = null;
  let t = 0;

  function build() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cols = w < 640 ? 26 : 40;
    const rows = w < 640 ? 9 : 12;
    points = [];
    const arcW = Math.min(w * 0.7, 760);
    const cx = w / 2;
    const cy = h * 0.46;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nx = (c / (cols - 1)) * 2 - 1;
        const ny = r / (rows - 1);
        const curve = (1 - nx * nx) * 0.5;
        const band = Math.abs(ny - (0.3 + curve * 0.5));
        if (band > 0.32) continue;
        const px = cx + nx * (arcW / 2);
        const py = cy - curve * h * 0.18 + (ny - 0.4) * h * 0.34;
        points.push({
          x: px,
          baseY: py,
          r: 0.9 + Math.random() * 1.3,
          phase: Math.random() * Math.PI * 2,
          a: 0.18 + (1 - Math.abs(nx)) * 0.5,
        });
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of points) {
      const float = staticFrame ? 0 : Math.sin(t * 0.0012 + p.phase) * 2.2;
      ctx.beginPath();
      ctx.arc(p.x, p.baseY + float, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(43,76,255,${p.a.toFixed(3)})`;
      ctx.fill();
    }
  }

  function loop(now) {
    t = now;
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    build();
    if (staticFrame) {
      draw();
      return;
    }
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !staticFrame) {
          if (!raf) raf = requestAnimationFrame(loop);
        } else {
          cancelAnimationFrame(raf);
          raf = null;
        }
      });
    },
    { threshold: 0 }
  );

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 150);
  });

  start();
  io.observe(canvas);
}
