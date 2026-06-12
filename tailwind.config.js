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
        meta: '#8A8A8A', // gris medio (metadatos)
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
