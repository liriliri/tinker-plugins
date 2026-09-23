/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        'tap-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.55' },
          '50%': { transform: 'scale(1.35)', opacity: '1' },
        },
      },
      animation: {
        'tap-pulse': 'tap-pulse 0.7s ease-in-out infinite',
      },
      colors: {
        void: {
          DEFAULT: '#050505',
          soft: '#121212',
        },
        desk: {
          DEFAULT: '#f4f2ee',
          deep: '#e8e4dc',
        },
        paw: {
          DEFAULT: '#ff7a9a',
          soft: '#ffb3c4',
          deep: '#e85a7a',
        },
      },
      fontFamily: {
        display: [
          'ui-rounded',
          'Hiragino Maru Gothic ProN',
          'PingFang SC',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
