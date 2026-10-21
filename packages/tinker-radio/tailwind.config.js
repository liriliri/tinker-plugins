/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'PingFang SC',
          'Noto Sans SC',
          'sans-serif',
        ],
        serif: [
          'Iowan Old Style',
          'Palatino Linotype',
          'Palatino',
          'Songti SC',
          'serif',
        ],
        mono: ['ui-monospace', 'SF Mono', 'PingFang SC', 'monospace'],
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(0.92)', opacity: '0.45' },
          '50%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        breathe: 'breathe 2.8s ease-in-out infinite',
      },
      colors: {
        night: { DEFAULT: '#080a10', card: '#12141c' },
        cream: { DEFAULT: '#f5f1e8', dim: '#aeb8c9' },
        signal: { DEFAULT: '#f36b45', deep: '#d4532e' },
        dial: { DEFAULT: '#e4c07a', deep: '#c9a15a' },
        line: '#22262e',
      },
    },
  },
  plugins: [],
}
