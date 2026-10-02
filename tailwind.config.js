/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'sp-bg': '#0d0d0d',
        'sp-card': '#161616',
        'sp-input': '#1e1e1e',
        'sp-orange': '#d4780f',
        'sp-orange-hover': '#b86400',
        'sp-border': '#2a2a2a',
        spincut: {
          bg: '#0A0A0F',
          surface: '#111118',
          card: '#1A1A24',
          border: '#2A2A3A',
          gold: '#D4940A',
          'gold-light': '#E8A820',
          text: '#FFFFFF',
          muted: '#9999AA',
          subtle: '#555566',
        },
      },
      spacing: {
        13: '3.25rem',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.pb-safe': { paddingBottom: 'env(safe-area-inset-bottom)' },
      })
    },
  ],
}
