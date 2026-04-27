import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sky: {
          blue: '#8BA4B6',
          light: '#B8CDDA',
          dark: '#5A7A8E',
        },
        paper: {
          white: '#FAF8F5',
          cream: '#F5F0E8',
          aged: '#EDE6D9',
        },
        ink: {
          black: '#1A1A1A',
          gray: '#6B6B6B',
          light: '#A3A3A3',
        },
        seal: {
          red: '#C44536',
          dark: '#9B2D20',
        },
        garden: {
          soil: '#5C4033',
          sprout: '#7BA05B',
          leaf: '#4A8C3F',
          bud: '#E8A87C',
          bloom: '#F4D03F',
        },
      },
      fontFamily: {
        display: ['PingFang SC', 'system-ui', 'sans-serif'],
        body: ['PingFang SC', 'system-ui', 'sans-serif'],
        calligraphy: ['STKaiti', 'KaiTi', 'serif'],
      },
      borderRadius: {
        garden: '16px',
        petal: '12px',
      },
      animation: {
        'moon-rise': 'moonRise 2s ease-out forwards',
        'seed-grow': 'seedGrow 3s ease-in-out infinite',
        'parabola-in': 'parabolaIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'fade-mist': 'fadeMist 1.5s ease-out forwards',
        'unfold-scroll': 'unfoldScroll 0.8s ease-out forwards',
      },
      keyframes: {
        moonRise: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        seedGrow: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.15)' },
        },
        parabolaIn: {
          '0%': { opacity: '0', transform: 'translateY(20px) translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0) translateX(0)' },
        },
        fadeMist: {
          '0%': { filter: 'blur(12px)', opacity: '0.3' },
          '100%': { filter: 'blur(0)', opacity: '1' },
        },
        unfoldScroll: {
          '0%': { maxHeight: '0', opacity: '0' },
          '100%': { maxHeight: '500px', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
