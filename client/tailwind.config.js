/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#1a1d29',
          surface: '#252936',
          border: '#2d3142',
          text: '#e4e6eb',
          'text-secondary': '#9ca3af',
        }
      }
    },
  },
  plugins: [],
}
