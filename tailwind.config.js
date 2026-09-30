/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './*.html',
    './tools/**/*.html',
    './js/**/*.js',
    './tools/**/*.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        serif: ['"Libre Baskerville"', 'serif'],
      },
      colors: {
        vscode: {
          bg: '#1e1e1e',
          sidebar: '#252526',
          border: '#333333',
          input: '#3c3c3c',
          hover: '#2a2d2e',
          accent: '#007acc',
          accentHover: '#0098ff',
          text: '#d4d4d4',
          muted: '#858585',
          green: '#4ec9b0',
          orange: '#ce9178',
          purple: '#c586c0',
          blue: '#569cd6',
        },
      },
    },
  },
  plugins: [],
}