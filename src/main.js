import './style.css';
import { initHeroMesh } from './hero-mesh.js';
import { initScrollytelling } from './scrollytelling.js';
import { initOrthodontics } from './orthodontics.js';
import { initLenis } from './smooth.js';

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Año del footer ---------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

/* ---------- Nav: fondo al hacer scroll ---------- */
const nav = document.getElementById('nav');
const onScroll = () => {
  if (!nav) return;
  nav.classList.toggle('is-scrolled', window.scrollY > 24);
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Reveal de secciones ---------- */
function initReveal() {
  if (prefersReduced) return;
  const targets = document.querySelectorAll(
    'section h2, .spec-card, .tech-card, .team-card, #ba-grid, .contact-form, #instagram .ig-cell'
  );
  targets.forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  targets.forEach((el) => io.observe(el));
}

/* ---------- Smooth scroll (Lenis) ----------
   Lenis se crea como singleton en smooth.js; scrollytelling.js impulsa su RAF
   vía el ticker de GSAP y lo integra con ScrollTrigger. Aquí solo cableamos las
   anclas suaves cuando la instancia esté lista. */
async function initSmoothScroll() {
  const lenis = await initLenis(prefersReduced);
  if (!lenis) return; // reduced-motion: scroll nativo (CSS scroll-behavior)

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -64 });
    });
  });
}

/* ---------- Antes / Después ---------- */
function initBeforeAfter() {
  const grid = document.getElementById('ba-grid');
  if (!grid) return;
  const labels = ['FIG. A — CASO 01', 'FIG. B — CASO 02', 'FIG. C — CASO 03'];
  grid.innerHTML = labels
    .map(
      (lb, i) => `
      <div class="ba" data-ba>
        <div class="ba__layer ba__before"><span class="ba__tag">Antes</span><span>[Foto antes]</span></div>
        <div class="ba__layer ba__after" data-after><span class="ba__tag">Después</span><span>[Foto después]</span></div>
        <div class="ba__handle" data-handle></div>
        <div class="ba__grip" aria-hidden="true">⇄</div>
        <input class="ba__range" type="range" min="0" max="100" value="50"
               aria-label="Comparar antes y después, ${lb}" />
      </div>`
    )
    .join('');

  grid.querySelectorAll('[data-ba]').forEach((box) => {
    const after = box.querySelector('[data-after]');
    const handle = box.querySelector('[data-handle]');
    const grip = box.querySelector('.ba__grip');
    const range = box.querySelector('.ba__range');
    const set = (v) => {
      after.style.clipPath = `inset(0 0 0 ${v}%)`;
      handle.style.left = `${v}%`;
      grip.style.left = `${v}%`;
    };
    range.addEventListener('input', () => set(range.value));
    set(50);
  });
}

/* ---------- Formulario demo (simula envío) ---------- */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('cf-status');
  const btn = form.querySelector('.contact-form__submit');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#cf-name');
    const phone = form.querySelector('#cf-phone');
    if (!name.value.trim() || !phone.value.trim()) {
      status.textContent = 'Completa tu nombre y teléfono.';
      status.className = 'contact-form__status';
      return;
    }
    btn.disabled = true;
    status.textContent = 'Enviando…';
    status.className = 'contact-form__status';
    // Demo: no hay backend. Simulamos un envío exitoso.
    setTimeout(() => {
      status.textContent = '¡Listo! (Demo) Te contactaríamos en horario de atención. La vía real es WhatsApp.';
      status.className = 'contact-form__status is-ok';
      form.reset();
      btn.disabled = false;
    }, 900);
  });
}

/* ---------- Init ---------- */
initReveal();
initBeforeAfter();
initContactForm();
initOrthodontics();
initHeroMesh(prefersReduced);
initSmoothScroll();

// El scrollytelling carga GSAP+ScrollTrigger (y, diferida, la nube 3D). Para no
// inflar el Total Blocking Time de la carga inicial, se inicializa solo cuando
// la sección "El proceso" se acerca al viewport (o, como respaldo, en idle).
(function deferScrollytelling() {
  const section = document.getElementById('diseno');
  if (!section || prefersReduced) {
    // reduced-motion: render estático inmediato (no hay coste de animación)
    initScrollytelling(prefersReduced);
    return;
  }
  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    io.disconnect();
    initScrollytelling(prefersReduced);
  };
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && go()),
    { rootMargin: '0px' } // arranca al entrar la sección (no en la carga inicial)
  );
  io.observe(section);
  // Respaldo tardío (fuera de la ventana de medición de carga) por si no scrollea.
  setTimeout(go, 6000);
})();
