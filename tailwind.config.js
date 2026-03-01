/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff4800',
          light: 'rgba(255, 72, 0, 0.1)',
          dark: '#e6410a',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        success: {
          DEFAULT: '#22c55e',
          light: '#dcfce7',
          dark: '#15803d',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
          dark: '#b45309',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
          dark: '#b91c1c',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#dbeafe',
          dark: '#1d4ed8',
        },
        trophy: '#fbbf24',
      },
      fontFamily: {
        inter: ['Inter'],
      },
    },
  },
  plugins: [],
};
