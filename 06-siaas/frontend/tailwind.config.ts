import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'glass-bg':     'rgba(255,255,255,0.05)',
        'glass-border': 'rgba(255,255,255,0.10)',
        'purple-glow':  '#a78bfa',
        'blue-glow':    '#60a5fa',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        'card-gradient': 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(96,165,250,0.1))',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
