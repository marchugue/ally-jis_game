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
          bg: '#121212',          // Web dark canvas
          card: '#1A1A1A',        // Web dark card
          popover: '#1F1F1F',     // Web dark popover/modal
          secondary: '#182232',   // Web dark secondary
          border: '#262626',      // Web dark border
          line: '#262626',        // Line
          primary: '#38C185',     // Web dark emerald primary
          'primary-hover': '#42d494',
          accent: '#F0B247',      // Web dark warm gold accent
          muted: '#94A3B8',       // Web dark muted text
          foreground: '#EDEDED',  // Web dark foreground
          
          // Semantic alias tokens
          s1: '#1A1A1A',          // Primary container
          s2: '#202024',          // Elevated container
          s3: '#26262A',          // Highest elevated container
          tx: '#EDEDED',          // Main text
          mu: '#94A3B8',          // Muted text
          emerald: '#38C185',     // Brand emerald
          gold: '#F0B247',        // Warm gold
          lav: '#38C185',         // Active primary: web emerald
          amb: '#F0B247',         // Warm gold
          blu: '#60A5FA',         // Sky blue
          sage: '#38C185',        // Online status: emerald
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
        pop: 'pop 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        blink: 'blink 1.2s infinite both',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
      }
    },
  },
  plugins: [],
};
