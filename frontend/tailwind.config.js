/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rag: {
          primary: '#534AB7',
          accent: '#7F77DD',
          light: '#EEEDFE',
          success: '#0F6E56',
          warning: '#BA7517',
          danger: '#A32D2D',
        },
      },
    },
  },
  plugins: [],
}
