/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // High-end SaaS Indigo & Amber Palette (completely native colors)
        primary: {
          50: '#f5f7ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#f59e0b',    // Amber Accent
          600: '#4f46e5',    // Indigo Primary
          700: '#4338ca',
          800: '#3730a3',
          900: '#1e1b4b',    // Deep Navy/Indigo
        }
      }
    },
  },
  plugins: [],
}
