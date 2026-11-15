/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './plugins/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0070d1',
        'primary-pressed': '#0064b7',
        link: '#0064b7',
        commerce: '#d53b00',
        ink: '#000000',
        body: 'rgba(0,0,0,0.6)',
        mute: '#6b6b6b',
        ash: '#cccccc',
        hairline: '#f3f3f3',
        'surface-card': '#f5f7fa',
      },
      fontFamily: {
        display: ['Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        body: ['Inter', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
