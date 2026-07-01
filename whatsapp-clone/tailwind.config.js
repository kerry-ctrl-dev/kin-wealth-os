/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          primary: '#075E54',
          secondary: '#128C7E',
          light: '#DCF8C6',
          dark: '#1F2C34',
          bg: '#FFFFFF',
          bg2: '#ECE5DD',
        },
      },
      animation: {
        'pulse-ring': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
