/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'PingFang SC',
          'Microsoft YaHei',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'Cascadia Code',
          'SF Mono',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      keyframes: {
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        sweep: 'sweep 1.3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-up': 'fadeUp 0.22s ease-out',
      },
    },
  },
  plugins: [],
}
