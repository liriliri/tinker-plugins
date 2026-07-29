/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
      },
      colors: {
        ink: {
          50: '#faf8f5',
          100: '#f3efe8',
          200: '#e8e0d4',
          300: '#d4c8b4',
          400: '#b8a68a',
          500: '#9a8466',
          600: '#7a6650',
          700: '#5c4a3a',
          800: '#3d3128',
          900: '#221c16',
          950: '#110e0b',
        },
        vermillion: {
          400: '#e85d4a',
          500: '#d4432f',
          600: '#b8341f',
        },
      },
    },
  },
  plugins: [],
}
