/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2f6b3a',
          50: '#eef7ef',
          100: '#d4ecd7',
          200: '#a9d8b0',
          300: '#7dc587',
          400: '#56b265',
          500: '#2f6b3a',
          600: '#265a30',
          700: '#1e4826',
          800: '#16361c',
          900: '#0d2412',
        },
      },
    },
  },
  plugins: [],
};
