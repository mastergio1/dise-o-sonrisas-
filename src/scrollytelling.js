/**
 * scrollytelling.js
 * Controla "Así diseñamos tu sonrisa": 4 capas (escaneo → estructura → forma
 * → color) sincronizadas con el scroll vía GSAP ScrollTrigger.
 *
 * Con prefers-reduced-motion se renderizan 4 paneles estáticos secuenciales
 * (sin scrub, sin pin), cumpliendo el requisito de accesibilidad.
 */
import { buildSmileSVG } from './smile-svg.js';

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
  gsap.set('#whiten-sweep', { attr: { x: -342 } });
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

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#scrolly',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
    },
  });

  // ---- CAPA 01: ESCANEO ----
  tl.addLabel('scan')
    .to('#frame', { opacity: 1, duration: 0.3 }, 'scan')
    .to('#scan-line', { opacity: 1, duration: 0.1 }, 'scan')
    .to('#scan-line', { attr: { y1: 445, y2: 445 }, duration: 1, ease: 'none' }, 'scan')
    .to(
      qa('.scan-dot'),
      { opacity: 1, scale: 1, duration: 0.6, stagger: { each: 0.004, from: 'center' } },
      'scan'
    )
    .to('#scan-line', { opacity: 0, duration: 0.2 }, 'scan+=1')
    .call(() => setHud(0), null, 'scan');

  // ---- CAPA 02: ESTRUCTURA ----
  tl.addLabel('structure', '+=0.3')
    .call(() => setHud(1), null, 'structure')
    .to('#layer-structure', { opacity: 1, duration: 0.2 }, 'structure')
    .to('#ruler', { opacity: 1, duration: 0.3 }, 'structure')
    .to(qa('.guide-v'), { strokeDashoffset: 0, duration: 0.7, stagger: 0.03 }, 'structure')
    .to('#smile-curve', { strokeDashoffset: 0, duration: 0.8 }, 'structure+=0.2')
    .to(
      qa('.ctrl-pt'),
      { opacity: 1, scale: 1, duration: 0.4, stagger: { each: 0.03, from: 'edges' } },
      'structure+=0.4'
    )
    // los puntos de escaneo se desvanecen al consolidarse la estructura
    .to(qa('.scan-dot'), { opacity: 0.12, duration: 0.5 }, 'structure+=0.2');

  // ---- CAPA 03: FORMA (carillas se dibujan) ----
  tl.addLabel('form', '+=0.3')
    .call(() => setHud(2), null, 'form')
    .to(qa('.tooth'), { strokeDashoffset: 0, duration: 0.8, stagger: 0.04 }, 'form')
    .to(qa('.tooth'), { fillOpacity: 1, duration: 0.6, stagger: 0.03 }, 'form+=0.4')
    .to('#layer-structure', { opacity: 0.35, duration: 0.5 }, 'form+=0.5')
    .to(qa('.scan-dot'), { opacity: 0, duration: 0.3 }, 'form');

  // ---- CAPA 04: COLOR (blanqueamiento + aprobado) ----
  tl.addLabel('color', '+=0.3')
    .call(() => setHud(3), null, 'color')
    .to('#layer-color', { opacity: 1, duration: 0.2 }, 'color')
    .fromTo(
      '#whiten-sweep',
      { attr: { x: -342 } },
      { attr: { x: 86 }, duration: 1, ease: 'none' },
      'color'
    )
    .to('#layer-structure', { opacity: 0, duration: 0.5 }, 'color')
    .to('#frame', { opacity: 0, duration: 0.5 }, 'color+=0.4')
    .to('#approved', { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 'color+=0.6');

  // Refresca medidas tras cargar fuentes/imagenes
  ScrollTrigger.refresh();
  window.addEventListener('load', () => ScrollTrigger.refresh());
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
