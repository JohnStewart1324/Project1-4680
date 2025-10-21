/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./renderer/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          100: '#1a1a1a',
          200: '#2d2d2d',
          300: '#404040',
          400: '#525252',
          500: '#737373',
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
