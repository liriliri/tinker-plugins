/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'Manrope', 'Noto Sans SC', 'sans-serif'],
        sans: ['Manrope', 'Noto Sans SC', 'PingFang SC', 'sans-serif'],
        mono: ['Azeret Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
