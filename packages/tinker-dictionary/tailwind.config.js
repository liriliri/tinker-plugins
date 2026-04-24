/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        dotPulse: {
          '0%, 60%, 100%': { opacity: '0.25', transform: 'scale(0.75)' },
          '30%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'dot-pulse': 'dotPulse 1.1s ease-in-out infinite',
        'dot-pulse-2': 'dotPulse 1.1s ease-in-out 0.18s infinite',
        'dot-pulse-3': 'dotPulse 1.1s ease-in-out 0.36s infinite',
      },
    },
  },
  plugins: [],
}
