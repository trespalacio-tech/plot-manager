/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Verde profundo de finca: hojas en sombra. Tono ya consolidado.
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
        // Terracota apagada: tierra arcillosa de Burgos. Acento cálido,
        // se usa con moderación para destacar (no para alarma).
        earth: {
          50: '#fbf3ee',
          100: '#f4e3d6',
          200: '#e6c4ac',
          300: '#d39f7e',
          400: '#bf7f5b',
          500: '#a86547',
          600: '#8b4f37',
          700: '#6b3e2c',
          800: '#4d2c20',
          900: '#311c14',
        },
        // Crema/hueso: fondo principal, más amable que el blanco puro.
        // Recuerda papel de cuaderno reciclado.
        bone: {
          50: '#fbf9f5',
          100: '#f5f1e9',
          200: '#ebe5d6',
          300: '#dcd2bb',
        },
        // Piedra cálida para bordes y separadores. Reemplaza slate fría
        // donde queremos suavidad sin perder legibilidad.
        stone: {
          50: '#f7f5f1',
          100: '#ecebe4',
          200: '#d9d6cc',
          300: '#bcb7a8',
          400: '#988f7c',
          500: '#73695a',
          600: '#5a5246',
          700: '#433d35',
          800: '#2c2924',
          900: '#1a1815',
        },
      },
      boxShadow: {
        // Sombra suave y cálida (matiz tierra muy diluido), no gris frío.
        soft: '0 1px 2px 0 rgb(67 61 53 / 0.04), 0 1px 1px -1px rgb(67 61 53 / 0.04)',
        card: '0 2px 6px -1px rgb(67 61 53 / 0.06), 0 1px 2px -1px rgb(67 61 53 / 0.04)',
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        // Acento puntual para títulos importantes (opcional, usado raro).
        display: [
          'ui-serif',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
      },
    },
  },
  plugins: [],
};
