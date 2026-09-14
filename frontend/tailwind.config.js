/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FDFDFD',
          100: '#FBFBFA',
          200: '#F4F4F2',
          300: '#EBEBEA',
        },
        clinical: {
          navy: '#0F172A',
          slate: '#334155',
          blue: '#2563EB',
          border: '#E2E8F0',
        },
        risk: {
          crit: {
            bg: '#FEF2F2',
            border: '#FECACA',
            text: '#991B1B',
            solid: '#DC2626',
          },
          watch: {
            bg: '#FFFBEB',
            border: '#FDE68A',
            text: '#92400E',
            solid: '#D97706',
          },
          normal: {
            bg: '#ECFDF5',
            border: '#A7F3D0',
            text: '#065F46',
            solid: '#059669',
          }
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
