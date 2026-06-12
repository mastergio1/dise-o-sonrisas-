/**
 * smile-svg.js
 * Construye procedimentalmente el SVG de la sonrisa que protagoniza el
 * scrollytelling. Devuelve el markup y las geometrías auxiliares (centros de
 * dientes, puntos de escaneo) para que scrollytelling.js anime cada capa.
 *
 * ViewBox 0 0 600 600. Arco superior de 10 dientes siguiendo una curva de
 * sonrisa (los bordes incisales suben hacia los costados).
 */

const VIEW = 600;
const TOP_Y = 252; // borde superior (encía) de los dientes
const ARC_BASE = 372; // borde incisal en el centro
const ARC_K = 0.0011; // curvatura de la sonrisa

// Anchos por diente (simétrico: incisivos centrales más anchos)
const WIDTHS = [40, 40, 32, 27, 23, 23, 27, 32, 40, 40];
const GAP = 4;

function incisalY(centerX) {
  // Curva de sonrisa: más bajo al centro, sube hacia los lados
  return ARC_BASE - ARC_K * (centerX - 300) * (centerX - 300);
}

function roundedToothPath(x, w, topY, botY, r = 7) {
  // Diente: esquinas inferiores redondeadas (borde incisal)
  return [
    `M ${x.toFixed(1)} ${topY.toFixed(1)}`,
    `L ${(x + w).toFixed(1)} ${topY.toFixed(1)}`,
    `L ${(x + w).toFixed(1)} ${(botY - r).toFixed(1)}`,
    `Q ${(x + w).toFixed(1)} ${botY.toFixed(1)} ${(x + w - r).toFixed(1)} ${botY.toFixed(1)}`,
    `L ${(x + r).toFixed(1)} ${botY.toFixed(1)}`,
    `Q ${x.toFixed(1)} ${botY.toFixed(1)} ${x.toFixed(1)} ${(botY - r).toFixed(1)}`,
    'Z',
  ].join(' ');
}

function buildTeeth() {
  const totalW = WIDTHS.reduce((a, b) => a + b, 0) + GAP * (WIDTHS.length - 1);
  let cursor = 300 - totalW / 2;
  const teeth = [];
  for (let i = 0; i < WIDTHS.length; i++) {
    const w = WIDTHS[i];
    const cx = cursor + w / 2;
    const botY = incisalY(cx);
    teeth.push({
      i,
      x: cursor,
      w,
      cx,
      cy: (TOP_Y + botY) / 2,
      topY: TOP_Y,
      botY,
      d: roundedToothPath(cursor, w, TOP_Y, botY),
    });
    cursor += w + GAP;
  }
  return teeth;
}

// Genera puntos pseudo-aleatorios (deterministas) dentro de cada diente
function scanPoints(teeth, perTooth = 14) {
  const pts = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  teeth.forEach((t) => {
    for (let k = 0; k < perTooth; k++) {
      const px = t.x + 3 + rnd() * (t.w - 6);
      const py = t.topY + 6 + rnd() * (t.botY - t.topY - 10);
      pts.push({ x: px, y: py });
    }
  });
  return pts;
}

export function buildSmileSVG() {
  const teeth = buildTeeth();
  const pts = scanPoints(teeth);

  const teethPaths = teeth
    .map(
      (t) =>
        `<path class="tooth" data-i="${t.i}" d="${t.d}" pathLength="100" fill="#ffffff" stroke="#111111" stroke-width="1.6" stroke-linejoin="round"/>`
    )
    .join('');

  const scanDots = pts
    .map(
      (p) =>
        `<circle class="scan-dot" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.1" fill="#2B4CFF"/>`
    )
    .join('');

  // Puntos de control sobre los bordes incisales (lenguaje de software de diseño)
  const controlPts = teeth
    .map(
      (t) =>
        `<rect class="ctrl-pt" x="${(t.cx - 3).toFixed(1)}" y="${(t.botY - 3).toFixed(
          1
        )}" width="6" height="6" fill="#ffffff" stroke="#2B4CFF" stroke-width="1.4"/>`
    )
    .join('');

  // Líneas guía verticales por diente + curva de sonrisa
  const guideLines = teeth
    .map(
      (t) =>
        `<line class="guide-v" x1="${t.cx.toFixed(1)}" y1="210" x2="${t.cx.toFixed(
          1
        )}" y2="${(t.botY + 22).toFixed(1)}" stroke="#2B4CFF" stroke-width="0.8" stroke-dasharray="3 4" pathLength="100"/>`
    )
    .join('');

  // Curva de sonrisa (bezier que sigue los bordes incisales)
  const first = teeth[0];
  const last = teeth[teeth.length - 1];
  const smileCurve = `M ${first.cx.toFixed(1)} ${(first.botY + 14).toFixed(
    1
  )} Q 300 ${(ARC_BASE + 40).toFixed(1)} ${last.cx.toFixed(1)} ${(last.botY + 14).toFixed(1)}`;

  // Regla horizontal decorativa
  const ruler = (() => {
    const ticks = [];
    for (let x = 130; x <= 470; x += 17) {
      const long = (x - 130) % 51 === 0;
      ticks.push(
        `<line x1="${x}" y1="206" x2="${x}" y2="${long ? 196 : 201}" stroke="#2B4CFF" stroke-width="0.8"/>`
      );
    }
    return `<line x1="128" y1="206" x2="472" y2="206" stroke="#2B4CFF" stroke-width="0.8"/>${ticks.join(
      ''
    )}`;
  })();

  const svg = `
  <svg viewBox="0 0 ${VIEW} ${VIEW}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
    <defs>
      <linearGradient id="whiten" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#cfd9ff"/>
        <stop offset="50%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#ffffff"/>
      </linearGradient>
      <clipPath id="teethClip">${teeth.map((t) => `<path d="${t.d}"/>`).join('')}</clipPath>
    </defs>

    <!-- Encuadre de lienzo de diseño -->
    <g id="frame" opacity="0">
      <rect x="86" y="170" width="428" height="280" fill="none" stroke="#2B4CFF" stroke-width="1" stroke-dasharray="2 6"/>
      <text x="86" y="162" font-family="'Space Grotesk',sans-serif" font-size="13" fill="#2B4CFF" letter-spacing="1">FIG. 01 — SONRISA</text>
    </g>

    <!-- CAPA 04: tinte de blanqueamiento (clip a los dientes) -->
    <g id="layer-color" opacity="0">
      <rect id="whiten-sweep" x="86" y="170" width="428" height="280" fill="url(#whiten)" clip-path="url(#teethClip)"/>
    </g>

    <!-- CAPA 02/03: los dientes (forma) -->
    <g id="layer-form">${teethPaths}</g>

    <!-- CAPA 02: estructura / guías -->
    <g id="layer-structure" opacity="0">
      <g id="ruler">${ruler}</g>
      <g id="guides">${guideLines}</g>
      <path id="smile-curve" d="${smileCurve}" fill="none" stroke="#2B4CFF" stroke-width="1.6" pathLength="100"/>
      <g id="control-pts">${controlPts}</g>
    </g>

    <!-- CAPA 01: nube de puntos del escaneo -->
    <g id="layer-scan">${scanDots}</g>

    <!-- Línea de escaneo que barre -->
    <line id="scan-line" x1="86" y1="170" x2="514" y2="170" stroke="#2B4CFF" stroke-width="2" opacity="0"/>

    <!-- Check "Diseño aprobado" -->
    <g id="approved" opacity="0" transform="translate(300 486)">
      <circle r="17" fill="#2B4CFF"/>
      <path d="M -7 0 L -2 6 L 8 -6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`;

  return { svg, teeth, points: pts };
}
