/**
 * smooth.js
 * Instancia única de Lenis (smooth scrolling), compartida entre main.js y
 * scrollytelling.js. Centralizar evita dos bucles RAF y, sobre todo, permite
 * integrar Lenis con GSAP ScrollTrigger (si no, el scrub del scrollytelling se
 * desincroniza del scroll suavizado).
 *
 * Con prefers-reduced-motion no se crea Lenis: scroll nativo.
 */

let _lenis = null;
let _promise = null;

export function initLenis(prefersReduced) {
  if (prefersReduced) return Promise.resolve(null);
  if (_promise) return _promise;
  _promise = import('lenis').then(({ default: Lenis }) => {
    _lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    window.__lenis = _lenis;
    return _lenis;
  });
  return _promise;
}

export function getLenis() {
  return _lenis;
}
