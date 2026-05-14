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
      },
    },
  },
  plugins: [],
}
