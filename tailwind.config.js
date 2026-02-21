/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fun-pink': '#FF6B9D',
        'fun-blue': '#4ECDC4',
        'fun-yellow': '#FFE66D',
        'fun-green': '#95E1D3',
        'fun-purple': '#A8D8EA',
      },
      fontFamily: {
        bungee: ['Bungee', 'cursive'],
        fredoka: ['Fredoka', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
