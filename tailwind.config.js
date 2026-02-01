/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coral: '#E86B4F',
        cream: '#FDF8F3',
        forest: '#2D4739',
        sand: '#F5E6D3',
      },
    },
  },
  plugins: [],
}
