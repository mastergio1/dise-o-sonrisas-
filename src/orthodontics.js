/**
 * orthodontics.js
 * Sub-selector interactivo de las 5 modalidades de ortodoncia. Al cambiar de
 * pestaña, la ilustración SVG (bracket / alineador) cambia con micro-transición
 * y se actualiza el texto descriptivo.
 *
 * Datos reales tomados de la web actual del cliente. Sin promesas médicas
 * añadidas por nuestra cuenta.
 */

const TOOTH = `<rect x="20" y="8" width="32" height="44" rx="9" fill="#ffffff" stroke="#111" stroke-width="2"/>`;
const WIRE = (y) => `<line x1="6" y1="${y}" x2="66" y2="${y}" stroke="#2B4CFF" stroke-width="2.4"/>`;

const MODALITIES = {
  metalicos: {
    detail:
      'Sistema clásico y eficiente para cualquier tipo de corrección, con excelente relación costo-resultado.',
    svg: `<svg viewBox="0 0 72 60" xmlns="http://www.w3.org/2000/svg">
      ${TOOTH}${WIRE(30)}
      <rect x="28" y="24" width="16" height="12" rx="2" fill="#2B4CFF"/>
      <circle cx="36" cy="30" r="2.4" fill="#fff"/>
    </svg>`,
  },
  ceramicos: {
    detail:
      'Brackets del color del diente: la misma técnica, mucho más discretos a la vista.',
    svg: `<svg viewBox="0 0 72 60" xmlns="http://www.w3.org/2000/svg">
      ${TOOTH}${WIRE(30)}
      <rect x="28" y="24" width="16" height="12" rx="2" fill="#eef0f5" stroke="#2B4CFF" stroke-width="1.6"/>
      <circle cx="36" cy="30" r="2.2" fill="#2B4CFF"/>
    </svg>`,
  },
  invisalign: {
    detail:
      'Alineadores transparentes y removibles. Estética y comodidad para corregir sin brackets.',
    svg: `<svg viewBox="0 0 72 60" xmlns="http://www.w3.org/2000/svg">
      ${TOOTH}
      <path d="M16 12 Q36 4 56 12 L56 40 Q36 50 16 40 Z" fill="none" stroke="#2B4CFF" stroke-width="2" stroke-dasharray="3 3"/>
    </svg>`,
  },
  flowjac: {
    detail:
      'Mini tubos Flow Jac System: tecnología poco común en Chile que acelera el movimiento dental durante el tratamiento.',
    svg: `<svg viewBox="0 0 72 60" xmlns="http://www.w3.org/2000/svg">
      ${TOOTH}${WIRE(26)}${WIRE(34)}
      <rect x="26" y="22" width="8" height="16" rx="2" fill="#2B4CFF"/>
      <rect x="38" y="22" width="8" height="16" rx="2" fill="#2B4CFF"/>
      <path d="M58 18 l6 -6 M58 18 l-1 -6 M58 18 l7 1" stroke="#2B4CFF" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    </svg>`,
  },
  infantil: {
    detail:
      'Ortopedia maxilar para niños: guía el crecimiento de los maxilares en la etapa oportuna.',
    svg: `<svg viewBox="0 0 72 60" xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="14" width="24" height="34" rx="7" fill="#ffffff" stroke="#111" stroke-width="2"/>
      <path d="M14 44 Q36 56 58 44" fill="none" stroke="#2B4CFF" stroke-width="2.2"/>
      <circle cx="14" cy="44" r="3" fill="#2B4CFF"/>
      <circle cx="58" cy="44" r="3" fill="#2B4CFF"/>
    </svg>`,
  },
};

export function initOrthodontics() {
  const tabs = document.getElementById('ortho-tabs');
  const illo = document.getElementById('ortho-illustration');
  const detail = document.getElementById('ortho-detail');
  if (!tabs || !illo || !detail) return;

  const render = (key) => {
    const m = MODALITIES[key];
    if (!m) return;
    // micro-transición
    illo.style.opacity = '0';
    detail.style.opacity = '0';
    illo.style.transition = 'opacity .18s ease';
    detail.style.transition = 'opacity .18s ease';
    setTimeout(() => {
      illo.innerHTML = m.svg;
      detail.textContent = m.detail;
      illo.style.opacity = '1';
      detail.style.opacity = '1';
    }, 180);
  };

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.ortho__tab');
    if (!btn) return;
    tabs.querySelectorAll('.ortho__tab').forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
    });
    render(btn.dataset.ortho);
  });

  // Soporte de teclado (flechas) en la lista de pestañas
  tabs.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const list = Array.from(tabs.querySelectorAll('.ortho__tab'));
    const idx = list.findIndex((b) => b.classList.contains('is-active'));
    const next = e.key === 'ArrowRight' ? (idx + 1) % list.length : (idx - 1 + list.length) % list.length;
    list[next].focus();
    list[next].click();
  });

  // Estado inicial
  illo.innerHTML = MODALITIES.metalicos.svg;
}
