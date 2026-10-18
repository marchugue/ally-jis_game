/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          bg: '#16171a',
          s1: '#1d1f23',
          s2: '#25282d',
          s3: '#2e3137',
          line: '#30343a',
          tx: '#ece8e1',
          mu: '#8e929b',
          lav: '#a99bc4',
          amb: '#d6a25c',
          blu: '#7b97b8',
          sage: '#8fae9d',
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'sans-serif'],
      },
      keyframes: {
        pop: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        blink: {
          '0%, 80%, 100%': { opacity: '0.2' },
          '40%': { opacity: '1' },
        }
      },
      animation: {
        pop: 'pop 0.22s ease-out',
        blink: 'blink 1.2s infinite both',
      }
    },
  },
  plugins: [],
};
