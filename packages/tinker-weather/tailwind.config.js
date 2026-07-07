/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out both',
        'fade-in-up-delay-1': 'fadeInUp 0.4s ease-out 0.1s both',
        'fade-in-up-delay-2': 'fadeInUp 0.4s ease-out 0.2s both',
        'pulse-slow': 'pulse-slow 1.4s ease-in-out infinite',
        'spin-slow': 'spin-slow 1.2s linear infinite',
      },
    },
  },
  plugins: [],
}
