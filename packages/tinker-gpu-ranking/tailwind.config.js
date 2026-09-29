/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        ui: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif',
        ],
        data: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      colors: {
        panel: {
          DEFAULT: '#eceef1',
          dark: '#1a1c20',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#22252a',
        },
        line: {
          DEFAULT: '#d5d8de',
          dark: '#33363d',
        },
        ink: {
          DEFAULT: '#1a1d23',
          dark: '#e8eaed',
          mute: '#6e7480',
          faint: '#9aa0a8',
        },
        probe: {
          DEFAULT: '#0f766e',
          soft: '#14b8a6',
          dim: '#ccfbf1',
          dark: '#2dd4bf',
          'dark-dim': '#134e4a',
        },
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.2s ease-out both',
      },
    },
  },
  plugins: [],
}
