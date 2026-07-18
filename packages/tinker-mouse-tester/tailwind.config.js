/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Familjen Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: [
          'IBM Plex Mono',
          'ui-monospace',
          'SF Mono',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
