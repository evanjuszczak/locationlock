/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'neo-bg': '#1E1E2E',
        'neo-card': '#282838',
        'neo-accent': '#7C3AED', // vibrant purple accent
        'neo-text': '#E4E4E7',
        'neo-muted': '#A1A1AA',
        'neo-border': '#3F3F5A',
        'neo-hover': '#333345',
      },
      boxShadow: {
        'neo': '0 4px 20px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        'neo': '0.75rem',
      }
    },
  },
  plugins: [],
};
