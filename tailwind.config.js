/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'k-bg':     'var(--k-bg)',
        'k-nav':    'var(--k-nav)',
        'k-card':   'var(--k-card)',
        'k-border': 'var(--k-border)',
        'k-cyan':   '#00D4FF',
        'k-teal':   '#0891B2',
        'k-text':   'var(--k-text)',
        'k-muted':  'var(--k-muted)',
        'k-error':  '#EF4444',
        // legacy gray tokens still used in prose/markdown
        'gray-750': '#2d3748',
        'gray-850': '#1a202c',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' },                                           '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(16px)', opacity: '0' },            '100%': { transform: 'translateY(0)', opacity: '1' } },
        tick:    { '0%': { transform: 'scale(0.5)', opacity: '0' },                  '100%': { transform: 'scale(1)',   opacity: '1' } },
        spinSlow:{ '0%': { transform: 'rotate(0deg)' },                              '100%': { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-in-out',
        'slide-up':  'slideUp 0.35s ease-out',
        'tick':      'tick 0.2s ease-out',
        'spin-slow': 'spinSlow 1.2s linear infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
