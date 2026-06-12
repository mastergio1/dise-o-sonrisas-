/**
 * hero-mesh.js
 * Malla de puntos del "escaneo" como fondo sutil del Hero. Implementada en
 * canvas 2D (sin dependencias pesadas en el primer render) para no penalizar
 * el objetivo Lighthouse 90+.
 *
 * Nota: el prompt contempla Three.js (points cloud) como opción para la capa
 * Escaneo. Elegimos el camino de fallback (canvas/SVG) para mantener el bundle
 * liviano y el LCP rápido; la mejora con Three.js queda documentada en README.
 *
 * Con prefers-reduced-motion: se dibuja un único frame estático (sin loop).
 */

export function initHeroMesh(prefersReduced) {
  const canvas = document.getElementById('hero-mesh');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let points = [];
  let raf = null;
  let t = 0;

  const COLORS = { dot: '#2B4CFF', faint: 'rgba(43,76,255,0.18)' };

  function smileY(nx) {
    // nx en [-1,1]; curva de sonrisa (más bajo al centro)
    return 0.5 + 0.16 * (1 - nx * nx) * -1 + 0.22; // base + curva
  }

  function build() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Densidad adaptada al ancho (menos puntos en mobile)
    const cols = w < 640 ? 26 : 40;
    const rows = w < 640 ? 9 : 12;
    points = [];
    const arcW = Math.min(w * 0.7, 760);
    const cx = w / 2;
    const cy = h * 0.46;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nx = (c / (cols - 1)) * 2 - 1; // -1..1
        const ny = r / (rows - 1); // 0..1
        // Banda de sonrisa: solo puntos cerca de la curva
        const curve = (1 - nx * nx) * 0.5; // 0..0.5
        const band = Math.abs(ny - (0.3 + curve * 0.5));
        if (band > 0.32) continue;
        const px = cx + nx * (arcW / 2);
        const py = cy - curve * h * 0.18 + (ny - 0.4) * h * 0.34;
        points.push({
          x: px,
          y: py,
          baseY: py,
          r: 0.9 + Math.random() * 1.3,
          phase: Math.random() * Math.PI * 2,
          // distancia al centro para opacidad (más densos al centro)
          a: 0.18 + (1 - Math.abs(nx)) * 0.5,
        });
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of points) {
      const float = prefersReduced ? 0 : Math.sin(t * 0.0012 + p.phase) * 2.2;
      const y = p.baseY + float;
      ctx.beginPath();
      ctx.arc(p.x, y, p.r, 0, Math.PI * 2);
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
    if (prefersReduced) {
      draw();
      return;
    }
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  // Pausa cuando el hero sale de viewport (ahorro de batería/CPU)
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !prefersReduced) {
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
