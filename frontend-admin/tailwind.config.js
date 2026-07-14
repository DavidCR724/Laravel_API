/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E5C765',
          dark: '#AD8A2A',
        },
        leather: {
          DEFAULT: '#5C4033',
          light: '#7A5A46',
          dark: '#3E2B22',
        },
        denim: {
          DEFAULT: '#2E4053',
          light: '#3E5570',
          dark: '#1C2833',
        },
        cream: '#FAF7F2',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
