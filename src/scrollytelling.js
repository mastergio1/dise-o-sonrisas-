/**
 * scrollytelling.js
 * Controla "Así diseñamos tu sonrisa": 4 capas (escaneo → estructura → forma
 * → color) sincronizadas con el scroll vía GSAP ScrollTrigger.
 *
 * Con prefers-reduced-motion se renderizan 4 paneles estáticos secuenciales
 * (sin scrub, sin pin), cumpliendo el requisito de accesibilidad.
 */
import { buildSmileSVG } from './smile-svg.js';
import { initLenis } from './smooth.js';
import { createPointCloud, webglSupported } from './point-cloud-3d.js';

const STEPS = [
  { step: '01 / 04', label: 'Escaneo 3D', note: 'Sin pastas de impresión' },
  { step: '02 / 04', label: 'Estructura', note: 'Guías · ortodoncia · Flow Jac' },
  { step: '03 / 04', label: 'Forma', note: 'Carillas que encajan' },
  { step: '04 / 04', label: 'Color', note: 'Blanqueamiento · diseño aprobado' },
];

export async function initScrollytelling(prefersReduced) {
  const stage = document.getElementById('scrolly-stage');
  if (!stage) return;

  const { svg } = buildSmileSVG();

  if (prefersReduced) {
    renderStatic(svg);
    return;
  }

  stage.innerHTML = svg;
  const { gsap, ScrollTrigger } = await loadGsap();
  gsap.registerPlugin(ScrollTrigger);

  const q = (sel) => stage.querySelector(sel);
  const qa = (sel) => Array.from(stage.querySelectorAll(sel));

  const stepEl = document.getElementById('scrolly-step');
  const labelEl = document.getElementById('scrolly-label');
  const noteEl = document.getElementById('scrolly-note');

  // Estado inicial: solo puntos de escaneo, dientes y guías ocultos.
  // El "dibujado" de trazos usa strokeDasharray/offset (pathLength=100),
  // sin depender del plugin premium DrawSVG.
  gsap.set(qa('.tooth'), { strokeDasharray: 100, strokeDashoffset: 100, fillOpacity: 0 });
  gsap.set(qa('.scan-dot'), { opacity: 0, scale: 0, transformOrigin: 'center' });
  gsap.set('#layer-structure', { opacity: 0 });
  gsap.set(qa('.guide-v, #smile-curve'), { strokeDashoffset: 100 });
  gsap.set(qa('.ctrl-pt'), { opacity: 0, scale: 0, transformOrigin: 'center' });
  gsap.set('#ruler', { opacity: 0 });
  gsap.set('#layer-color', { opacity: 0 });
  gsap.set('#whiten-bar', { attr: { x: 40 } });
  gsap.set('#frame', { opacity: 0 });
  gsap.set('#approved', { opacity: 0, scale: 0, transformOrigin: 'center' });
  gsap.set('#scan-line', { opacity: 0, attr: { y1: 175, y2: 175 } });

  let current = -1;
  const setHud = (i) => {
    if (i === current || !STEPS[i]) return;
    current = i;
    stepEl.textContent = STEPS[i].step;
    labelEl.textContent = STEPS[i].label;
    noteEl.textContent = STEPS[i].note;
  };
  setHud(0);

  // ---- Capa Escaneo en 3D (WebGL) ----
  // Detectamos WebGL de forma SÍNCRONA (barato, sin importar Three.js) para
  // decidir el timeline. La creación PESADA de la nube (import de Three.js +
  // shaders) se DIFIERE a requestIdleCallback, fuera de la ventana de carga,
  // para no inflar el Total Blocking Time. Sin WebGL: fallback a puntos SVG.
  const willUse3D = webglSupported();
  let scanCanvas = null;
  if (willUse3D) {
    scanCanvas = document.createElement('canvas');
    scanCanvas.className = 'scrolly__scan3d';
    scanCanvas.id = 'scan3d';
    scanCanvas.setAttribute('aria-hidden', 'true');
    scanCanvas.style.opacity = '0';
    stage.parentElement.insertBefore(scanCanvas, stage.nextSibling);
    // Los puntos SVG no se usan cuando hay 3D
    gsap.set(qa('.scan-dot'), { opacity: 0 });
  }

  // Integra Lenis con ScrollTrigger: cada scroll de Lenis actualiza el scrub.
  // (Lenis corre su propio RAF en smooth.js, lo que permite diferir GSAP.)
  const lenis = await initLenis(false);
  if (lenis) lenis.on('scroll', ScrollTrigger.update);

  // Timeline de 4 unidades: una por capa (escaneo·estructura·forma·color).
  // La etapa se fija con pin; cada capa ocupa 1 unidad, con un "hold" final.
  const texts = Array.from(document.querySelectorAll('.scrolly__text'));
  gsap.set(texts, { opacity: 0 });
  gsap.set(texts[0], { opacity: 1 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '#scrolly',
      start: 'top top',
      end: 'bottom bottom',
      pin: '#scrolly-pin',
      pinSpacing: false, // #scrolly ya aporta la altura del scroll
      scrub: 0.6,
    },
  });

  // Cross-fade de los bloques de texto en los límites de cada capa
  const fadeText = (from, to, at) => {
    if (texts[from]) tl.to(texts[from], { opacity: 0, duration: 0.2 }, at);
    if (texts[to]) tl.to(texts[to], { opacity: 1, duration: 0.2 }, at + 0.05);
  };

  // ---- CAPA 01: ESCANEO (0 → 1) ----
  tl.call(() => setHud(0), null, 0)
    .to('#frame', { opacity: 1, duration: 0.25 }, 0)
    .to('#scan-line', { opacity: 1, duration: 0.08 }, 0)
    .to('#scan-line', { attr: { y1: 445, y2: 445 }, duration: 0.7 }, 0)
    .to('#scan-line', { opacity: 0, duration: 0.15 }, 0.7);

  if (!willUse3D) {
    // Fallback SVG: los .scan-dot aparecen formando la sonrisa.
    // (Con WebGL, la nube 3D la maneja un ScrollTrigger dedicado, diferido.)
    tl.to(
      qa('.scan-dot'),
      { opacity: 1, scale: 1, duration: 0.5, stagger: { each: 0.003, from: 'center' } },
      0.05
    );
  }

  // ---- CAPA 02: ESTRUCTURA (1 → 2) ----
  tl.call(() => setHud(1), null, 1)
    .to('#layer-structure', { opacity: 1, duration: 0.15 }, 1)
    .to('#ruler', { opacity: 1, duration: 0.25 }, 1)
    .to(qa('.guide-v'), { strokeDashoffset: 0, duration: 0.5, stagger: 0.02 }, 1.05)
    .to('#smile-curve', { strokeDashoffset: 0, duration: 0.55 }, 1.2)
    .to(
      qa('.ctrl-pt'),
      { opacity: 1, scale: 1, duration: 0.35, stagger: { each: 0.02, from: 'edges' } },
      1.45
    );
  if (!willUse3D) tl.to(qa('.scan-dot'), { opacity: 0.12, duration: 0.4 }, 1);

  // ---- CAPA 03: FORMA (2 → 3) ----
  tl.call(() => setHud(2), null, 2)
    .to(qa('.tooth'), { strokeDashoffset: 0, duration: 0.6, stagger: 0.03 }, 2)
    .to(qa('.tooth'), { fillOpacity: 1, duration: 0.5, stagger: 0.025 }, 2.35)
    .to('#layer-structure', { opacity: 0.35, duration: 0.4 }, 2.5);
  if (!willUse3D) tl.to(qa('.scan-dot'), { opacity: 0, duration: 0.3 }, 2);

  // ---- CAPA 04: COLOR (3 → 4, con hold final) ----
  // La barra eléctrica barre los dientes y, a su paso, el relleno pasa de
  // marfil "antes" a blanco puro (efecto blanqueamiento, izquierda→derecha).
  tl.call(() => setHud(3), null, 3)
    .to('#layer-color', { opacity: 1, duration: 0.12 }, 3)
    .fromTo('#whiten-bar', { attr: { x: 40 } }, { attr: { x: 500 }, duration: 0.7 }, 3)
    .to(qa('.tooth'), { fill: '#ffffff', duration: 0.5, stagger: 0.04 }, 3.05)
    .to('#layer-structure', { opacity: 0, duration: 0.4 }, 3.1)
    .to('#frame', { opacity: 0, duration: 0.4 }, 3.3)
    .to('#layer-color', { opacity: 0, duration: 0.25 }, 3.65)
    .to('#approved', { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 3.6)
    .to({}, { duration: 0.4 }); // hold: la sonrisa terminada se sostiene

  // Cross-fade del texto en cada cambio de capa
  fadeText(0, 1, 0.82);
  fadeText(1, 2, 1.82);
  fadeText(2, 3, 2.82);

  // Refresca medidas tras cargar fuentes/imagenes
  ScrollTrigger.refresh();
  window.addEventListener('load', () => ScrollTrigger.refresh());

  // ---- Creación DIFERIDA de la nube 3D de la capa Escaneo ----
  // Se hace en idle para no bloquear el hilo principal durante la carga. Un
  // ScrollTrigger dedicado mapea el primer cuarto del scroll (capa Escaneo) a
  // la formación de la nube y la desvanece al entrar la capa Estructura.
  if (willUse3D && scanCanvas) {
    const enable3DScan = () => {
      createPointCloud(scanCanvas, {
        count: window.innerWidth < 640 ? 1800 : 2400,
        autoRotate: false,
        parallax: false,
        pointSize: window.innerWidth < 640 ? 0.06 : 0.05,
      })
        .then((cloud) => {
          if (!cloud) {
            // Sin WebGL real: recupera los puntos SVG como fallback
            scanCanvas.remove();
            gsap.set(qa('.scan-dot'), { opacity: 1, scale: 1 });
            return;
          }
          cloud.setFormation(0);
          ScrollTrigger.create({
            trigger: '#scrolly',
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: (self) => {
              const p = self.progress; // 0..1 sobre las 4 capas
              const form = Math.min(1, p / 0.25); // escaneo = primer cuarto
              cloud.setFormation(form);
              // visible durante el escaneo; se desvanece al entrar estructura
              const op = p < 0.25 ? 1 : Math.max(0, 1 - (p - 0.25) / 0.06);
              scanCanvas.style.opacity = String(op);
            },
          });
        })
        .catch(() => {
          scanCanvas.remove();
          gsap.set(qa('.scan-dot'), { opacity: 1, scale: 1 });
        });
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(enable3DScan, { timeout: 3000 });
    } else {
      setTimeout(enable3DScan, 1500);
    }
  }
}

/**
 * Fallback estático: 4 paneles secuenciales, cada uno con un recorte distinto
 * de la animación congelado en su estado final de capa.
 */
function renderStatic(svgBase) {
  const wrap = document.getElementById('scrolly-static');
  const dynamic = document.getElementById('scrolly');
  if (!wrap || !dynamic) return;

  dynamic.style.display = 'none';
  wrap.hidden = false;

  const panels = [
    {
      tag: 'Capa 01 — Escaneo',
      title: 'Escaneamos, no moldeamos.',
      body:
        'Un escáner intraoral 3D captura cada diente en puntos precisos. Sin pastas, sin arcadas: tu boca se convierte en un modelo digital.',
      classes: 'state-scan',
    },
    {
      tag: 'Capa 02 — Estructura',
      title: 'Trazamos las guías.',
      body:
        'Líneas, reglas y curvas alinean la posición de cada pieza. Aquí entra la ortodoncia, incluido el Flow Jac System.',
      classes: 'state-structure',
    },
    {
      tag: 'Capa 03 — Forma',
      title: 'Dibujamos la forma.',
      body:
        'Las carillas cerámicas se diseñan sobre cada diente como piezas que encajan: proporción, borde y textura.',
      classes: 'state-form',
    },
    {
      tag: 'Capa 04 — Color',
      title: 'Afinamos el color.',
      body:
        'Un blanqueamiento gradúa el tono hasta el punto justo. El lienzo se limpia y la sonrisa queda lista: diseño aprobado.',
      classes: 'state-color',
    },
  ];

  wrap.innerHTML = panels
    .map(
      (p) => `
      <div class="scrolly-static__panel">
        <div class="${p.classes}">${svgBase}</div>
        <div>
          <span class="scrolly__panel-tag">${p.tag}</span>
          <h3 class="scrolly__panel-title">${p.title}</h3>
          <p class="mt-3 text-ink/70">${p.body}</p>
        </div>
      </div>`
    )
    .join('');

  // Estados estáticos por capa mediante CSS inline mínimo
  const style = document.createElement('style');
  style.textContent = `
    .scrolly-static .state-scan #layer-structure,
    .scrolly-static .state-scan #layer-color,
    .scrolly-static .state-scan #layer-form { opacity: 0; }
    .scrolly-static .state-structure #layer-color { opacity: 0; }
    .scrolly-static .state-structure #layer-form .tooth { fill-opacity: 0; }
    .scrolly-static .state-structure #layer-structure { opacity: 1; }
    .scrolly-static .state-form #layer-color { opacity: 0; }
    .scrolly-static .state-form #layer-structure { opacity: 0.35; }
    .scrolly-static .state-form #layer-scan { opacity: 0; }
    .scrolly-static .state-color #layer-scan,
    .scrolly-static .state-color #layer-structure { opacity: 0; }
    .scrolly-static .state-color #layer-color { opacity: 1; }
    .scrolly-static .state-color #whiten-sweep { x: 86px; }
    .scrolly-static .state-color #approved { opacity: 1; }
  `;
  document.head.appendChild(style);
}

// Carga GSAP + ScrollTrigger (+ DrawSVG no disponible: usamos strokeDashoffset)
async function loadGsap() {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
  ]);
  return { gsap, ScrollTrigger };
}
