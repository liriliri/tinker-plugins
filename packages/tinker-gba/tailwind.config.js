/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
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
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'ping-slow': {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        float: 'float 3s ease-in-out infinite',
        'ping-slow': 'ping-slow 2s cubic-bezier(0,0,0.2,1) infinite',
        'fade-up': 'fadeUp 0.22s ease-out',
      },
    },
  },
  plugins: [],
}
