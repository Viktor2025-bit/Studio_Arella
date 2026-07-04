import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      colors: {
        shell: '#dde3ef',
        cream: {
          DEFAULT: '#F7F3EA',
          surface: '#FFFDF8',
          '2': '#F1ECE0',
        },
        charcoal: {
          900: '#1A1A1A',
          800: '#262220',
          700: '#3D3833',
        },
        gold: {
          DEFAULT: '#E0A526',
          dark: '#B8841A',
          light: '#FBF0DA',
          mid: '#EFC65E',
        },
        glitch: {
          cyan: '#00E5FF',
          magenta: '#FF2FB0',
        },
        success: { DEFAULT: '#4C9A5A', light: '#E9F3E4' },
        warning: { DEFAULT: '#D98E2B', light: '#FBEEDA' },
        error: { DEFAULT: '#C9483A', light: '#F7E7E2' },
      },
      fontFamily: {
        body: ['var(--font-quicksand)', 'Quicksand', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Fraunces', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
