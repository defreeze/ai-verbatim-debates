/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        surface: '#f7f9fa',
        primary: '#2563eb', // scientific blue
        secondary: '#14b8a6', // teal
        for: '#3b82f6', // blue for 'for'
        against: '#ef4444', // red for 'against'
        neutral: '#e5e7eb', // light gray
        text: '#1e293b', // dark blue-gray for text
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#fff',
            a: {
              color: '#60A5FA',
              '&:hover': {
                color: '#3B82F6',
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 