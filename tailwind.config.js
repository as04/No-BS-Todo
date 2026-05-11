/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sticky: {
          yellow: '#fef3a8',
          pink: '#fbcfe8',
          blue: '#bfdbfe',
          green: '#bbf7d0',
          purple: '#ddd6fe',
          orange: '#fed7aa',
          gray: '#e5e7eb',
        },
        ink: '#2b2a26',
        paper: '#faf8f3',
      },
      fontFamily: {
        hand: ['"Patrick Hand"', 'Caveat', 'Comic Sans MS', 'cursive'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sticky: '2px 4px 0 rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
