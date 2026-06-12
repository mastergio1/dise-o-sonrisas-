/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        // Dirección de arte — editorial-técnica
        paper: '#F5F5F3', // gris papel (base)
        ink: '#111111', // tinta negra (tipografía)
        electric: '#2B4CFF', // único acento: azul eléctrico
        'electric-soft': '#8AA0FF', // variante clara para texto sobre fondo oscuro
        meta: '#6E6E6E', // gris medio (metadatos) — contraste AA sobre blanco
      },
      fontFamily: {
        // display grotesca contundente + Inter para texto
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
      maxWidth: {
        editorial: '1320px',
      },
    },
  },
  plugins: [],
};
