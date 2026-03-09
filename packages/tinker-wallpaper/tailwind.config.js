/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeDown: {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        progress: {
          '0%': { width: '0%', marginLeft: '0%' },
          '50%': { width: '60%', marginLeft: '20%' },
          '100%': { width: '0%', marginLeft: '100%' },
        },
        dotPulse: {
          '0%, 60%, 100%': { opacity: '0.25', transform: 'scale(0.75)' },
          '30%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.22s ease-out',
        'fade-down': 'fadeDown 0.22s ease-out',
        progress: 'progress 1.2s ease-in-out infinite',
        'dot-pulse': 'dotPulse 1.1s ease-in-out infinite',
        'dot-pulse-2': 'dotPulse 1.1s ease-in-out 0.18s infinite',
        'dot-pulse-3': 'dotPulse 1.1s ease-in-out 0.36s infinite',
      },
    },
  },
  plugins: [],
}
