/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          900: '#0a0a0b',
          800: '#0e0e10',
          700: '#18181b',
          600: '#242428',
          500: '#2f2f34'
        },
        accent: {
          terra: '#b5483c',
          'terra-hover': '#c85a4d',
          'terra-soft': '#c98a82',
          'terra-dot': '#c06b60',
          blue: '#3b82f6',
          amber: '#d4a15a',
          red: '#b5483c',
          green: '#76b900'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        pulse: 'tpPulse 1.6s infinite',
        blink: 'tpBlink 1s infinite',
        shimmer: 'tpShimmer 2.5s linear infinite',
        'slide-up': 'tpSlideUp 280ms ease-out',
        'notif-in': 'tpNotifIn 320ms cubic-bezier(0.2,0.9,0.3,1.1)'
      },
      keyframes: {
        tpPulse: {
          '0%, 100%': { opacity: 0.5, transform: 'scale(1)' },
          '50%':     { opacity: 1,   transform: 'scale(1.15)' }
        },
        tpBlink: {
          '0%, 50%':    { opacity: 1 },
          '51%, 100%':  { opacity: 0 }
        },
        tpShimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        tpSlideUp: {
          'from': { transform: 'translateY(8px)', opacity: 0 },
          'to':   { transform: 'translateY(0)', opacity: 1 }
        },
        tpNotifIn: {
          'from': { transform: 'translateX(120%)', opacity: 0 },
          'to':   { transform: 'translateX(0)', opacity: 1 }
        }
      }
    }
  },
  plugins: []
};
