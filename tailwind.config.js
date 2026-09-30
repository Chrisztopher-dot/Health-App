/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'elderly-base': ['1.125rem', { lineHeight: '1.75rem' }],
        'elderly-lg': ['1.25rem', { lineHeight: '1.875rem' }],
        'elderly-xl': ['1.5rem', { lineHeight: '2rem' }],
        'elderly-2xl': ['1.875rem', { lineHeight: '2.25rem' }],
        'elderly-3xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        senior: {
          card: '#ffffff',
          bg: '#f8fafc',
          border: '#cbd5e1',
          accent: '#0284c7',
        }
      },
      boxShadow: {
        'elderly-card': '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.04)',
        'elderly-btn': '0 4px 12px 0 rgba(0, 0, 0, 0.12)',
      }
    },
  },
  plugins: [],
}
