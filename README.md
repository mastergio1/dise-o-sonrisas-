# Diseño de Sonrisas — Sitio demo (especulativo)

Pieza **#4** del portafolio. Demo **no oficial** creada como propuesta de venta
para la clínica real _Diseño de Sonrisas — Clínica de Odontología Estética_
(Tomás Moro 1806, Las Condes, Santiago de Chile).

Concepto: tratar a la clínica como un **estudio de diseño de sonrisas**. La web
toma el lenguaje visual de las herramientas de diseño (retículas, reglas, puntos
de control, capas) con una estética **editorial-técnica**: blanco puro,
tipografía negra contundente y un único acento azul eléctrico.

---

## Los 3 argumentos de venta

1. **Su nombre ES la keyword.** La clínica se llama literalmente como el término
   más buscado del rubro estético dental ("diseño de sonrisas"). Hoy lo
   desperdician con un Wix sin SEO; aquí se convierte en `H1`, `title`, meta
   description y `schema.org/Dentist`.
2. **Su tecnología, visible.** Tienen escáner intraoral 3D y radiología propia
   (inversión real) que su web actual esconde. Aquí son el héroe del relato: el
   scrollytelling "Así diseñamos tu sonrisa" nace del escaneo 3D.
3. **De Wix amateur a estudio de diseño.** Su web actual tiene typos publicados,
   fotos caseras y email Gmail. Esta pieza es una experiencia con objetivo
   **Lighthouse 90+**, accesibilidad **AA** y conversión real por WhatsApp.

(Los mismos 3 argumentos están comentados al inicio de `index.html`.)

---

## Cómo correr

```bash
npm install
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # build de producción en dist/ (limpio, sin warnings)
npm run preview  # sirve el build de producción
```

Requiere Node 18+.

---

## Stack

- **Vite 6** + HTML/CSS/JS vanilla + **Tailwind CSS 3** (mismo stack que las
  webs #1–#3 del portafolio).
- **GSAP + ScrollTrigger** (lazy-load, chunk aparte) para el scrollytelling por
  capas y micro-interacciones.
- **Lenis** para smooth scrolling (lazy-load; se desactiva con reduced-motion).
- **SVG procedimental** para la sonrisa y las ilustraciones de ortodoncia.
- **Canvas 2D** para la malla de puntos del Hero.

### Sobre Three.js (decisión de implementación)

El prompt contempla Three.js (points cloud) como **opción** para la capa de
Escaneo, con fallback SVG. Para proteger el objetivo Lighthouse 90+ y un LCP
rápido, se eligió el **camino de fallback**: la nube de puntos del Hero usa
canvas 2D y la capa de Escaneo del scrollytelling usa puntos SVG animados con
GSAP. Si más adelante se quiere elevar la capa Escaneo con Three.js, debe
hacerse con `import()` diferido y manteniendo el fallback actual.

---

## Estructura

```
index.html              · Marca, SEO, schema.org y todas las secciones
src/main.js             · Entry: nav, reveal, antes/después, formulario, init
src/style.css           · Tailwind + componentes (scrollytelling, fichas, etc.)
src/smile-svg.js        · Genera el SVG de la sonrisa (dientes, puntos, guías)
src/scrollytelling.js   · Timeline GSAP de las 4 capas + fallback estático
src/orthodontics.js     · Sub-selector de las 5 modalidades de ortodoncia
src/hero-mesh.js        · Malla de puntos del Hero (canvas 2D)
public/favicon.svg      · Favicon
```

---

## Accesibilidad y performance

- `prefers-reduced-motion`: el scrollytelling se muestra como **4 paneles
  estáticos secuenciales**; se desactivan Lenis, el loop del Hero y los reveal.
- Focus visible AA en toda la interfaz; contraste AA.
- Fuentes con `display=swap`; sin layout shift.
- Selector de ortodoncia operable por teclado (flechas ← →).
- Las fuentes pesadas (GSAP/ScrollTrigger/Lenis) van en chunks diferidos.

---

## Cómo personalizar

### Cambiar el color de acento

El acento eléctrico está definido en **un solo lugar** como variable CSS y
replicado en Tailwind:

- `src/style.css` → `:root { --electric: #2B4CFF; }` (afecta CSS de componentes,
  focus, scrollytelling).
- `tailwind.config.js` → `colors.electric` (afecta clases `text-electric`,
  `bg-electric`, etc.).
- Los SVG procedimentales usan el literal `#2B4CFF` en `src/smile-svg.js` y
  `src/orthodontics.js`: reemplázalo ahí si cambias el acento.

### Cambiar textos

Todos los textos de copy viven en `index.html`. Los textos de las modalidades de
ortodoncia están en `src/orthodontics.js` (`MODALITIES`). Los pasos del
scrollytelling, en `index.html` (`.scrolly__panel`) y en `src/scrollytelling.js`
(`STEPS` para el HUD).

---

## ✅ Checklist `[CONFIRMAR CON CLIENTE]`

Cero datos inventados. Antes de publicar, confirmar/reemplazar:

- [ ] **Email definitivo.** La demo propone `contacto@disenodesonrisas.cl`
      (marcado "(propuesto)" en el footer). El actual es Gmail
      `disenodesonrisas@gmail.com`. Definir y crear el correo de dominio.
- [ ] **Equipo.** Sección "Equipo" tiene 4 tarjetas placeholder
      `[Nombre]` / `[Especialidad]` con silueta. Pedir fotos y nombres reales.
- [ ] **Casos antes/después.** 3 comparadores con placeholder
      `[Foto antes]` / `[Foto después]`. Pedir **fotos autorizadas** de casos
      reales (consentimiento del paciente).
- [ ] **Instagram.** Grid de 6 posts es demo. Conectar el feed real de
      `@disenodesonrisaschile` (o cargar imágenes manualmente).
- [ ] **Trayectoria / cifras / testimonios.** NO se inventaron. Si el cliente
      quiere mostrar años de experiencia, número de pacientes o testimonios,
      debe proveerlos.
- [ ] **Agenda online.** Hoy reservan solo por WhatsApp. El formulario es demo
      (no envía datos). Definir integración (Dentalink / AgendaPro / Reservo).
- [ ] **OG image.** `og-image.png` referenciada en los meta tags aún no existe;
      generar una imagen 1200×630.
- [ ] **Dominio.** El sitio asume `https://www.disenodesonrisas.cl/` en canonical
      y schema. Confirmar dominio real.
- [ ] **Mapa.** El iframe de Google Maps apunta a la dirección por texto;
      verificar que el pin caiga exacto en el local.

---

> **Sitio demo no oficial** · pieza de portafolio. Datos de contacto y dirección
> verificados en la web actual del cliente (10-06-2026). El email de dominio es
> una propuesta.
