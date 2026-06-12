import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2018',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Mantén Three.js en su propio chunk para que solo se descargue
        // cuando la capa de Escaneo lo carga de forma diferida (lazy-load).
        manualChunks: {
          gsap: ['gsap'],
        },
      },
    },
  },
});
