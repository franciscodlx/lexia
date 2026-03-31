/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        correct: '#538D4E',
        present: '#B59F3B',
        absent: '#3A3A3C',
        game: {
          bg: '#121213',
          surface: '#1A1A1B',
          border: '#3A3A3C',
          'border-active': '#565758',
        },
      },
    },
  },
  safelist: [
    'bg-correct', 'bg-present', 'bg-absent',
    'border-correct', 'border-present', 'border-absent',
  ],
  plugins: [],
}
