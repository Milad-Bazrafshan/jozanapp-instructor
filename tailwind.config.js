/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/index.css', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'Inter', 'Tahoma', 'sans-serif'],
        latin: ['Inter', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        surface: { DEFAULT: '#ffffff', muted: '#fafafa' },
        primary: { DEFAULT: '#171717', hover: '#262626' },
        ink: {
          800: '#161d2e',
          900: '#0b1220',
        },
        mist: {
          50: '#f4f6fb',
          100: '#e8edf6',
        },
        accent: {
          50: '#eef2ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      boxShadow: {
        card: '0 20px 40px -28px rgba(15, 23, 42, 0.35)',
        soft: '0 8px 24px -18px rgba(15, 23, 42, 0.28)',
      },
    },
  },
  plugins: [],
}
