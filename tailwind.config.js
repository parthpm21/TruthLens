/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Sans"', '"Space Grotesk"', '"IBM Plex Sans"', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: '#1ca7c4',
          hover: '#158fa9',
          light: 'rgba(28, 167, 196, 0.1)',
        },
        forensic: {
          bg: '#fafafa',
          card: '#ffffff',
          cardBorder: '#e4e4e7',
          textMuted: '#64748b',
        },
        anomaly: {
          DEFAULT: '#ef4444', // rose-red for manipulated
          light: 'rgba(239, 68, 68, 0.08)',
        },
        warning: {
          DEFAULT: '#f59e0b', // amber-yellow for uncertain
          light: 'rgba(245, 158, 11, 0.08)',
        },
        authentic: {
          DEFAULT: '#10b981', // emerald-green for authentic
          light: 'rgba(16, 185, 129, 0.08)',
        }
      }
    },
  },
  plugins: [],
}
