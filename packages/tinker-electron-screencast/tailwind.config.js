/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        dotPulse: {
          '0%, 60%, 100%': { opacity: '0.25', transform: 'scale(0.75)' },
          '30%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'dot-pulse': 'dotPulse 1.1s ease-in-out infinite',
        'dot-pulse-2': 'dotPulse 1.1s ease-in-out 0.18s infinite',
        'dot-pulse-3': 'dotPulse 1.1s ease-in-out 0.36s infinite',
      },
    },
  },
  plugins: [],
}
