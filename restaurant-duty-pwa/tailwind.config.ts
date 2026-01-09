import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // iPad-optimized touch targets
      spacing: {
        '11': '2.75rem', // 44px minimum touch target
        '13': '3.25rem', // 52px
        '14': '3.5rem',  // 56px
      },
      // Template accent colors
      colors: {
        'pass': {
          DEFAULT: '#E07A5F',
          light: '#F5D0C5',
          dark: '#B85A44',
        },
        'floor': {
          DEFAULT: '#3D5A80',
          light: '#C5D5E4',
          dark: '#2C4259',
        },
        'closing': {
          DEFAULT: '#6B4C9A',
          light: '#D4C5E8',
          dark: '#4E3672',
        },
      },
      // Animation for modals
      animation: {
        'in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      // Font sizes for iPad readability
      fontSize: {
        'touch': ['1.125rem', { lineHeight: '1.5' }], // 18px
        'touch-lg': ['1.25rem', { lineHeight: '1.5' }], // 20px
      },
      // Border radius for modern cards
      borderRadius: {
        'xl': '0.75rem',   // 12px
        '2xl': '1rem',     // 16px
        '3xl': '1.5rem',   // 24px
      },
      // Box shadow for elevated elements
      boxShadow: {
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 4px 12px -4px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.15), 0 8px 24px -4px rgba(0, 0, 0, 0.15)',
        'modal': '0 8px 32px -8px rgba(0, 0, 0, 0.2), 0 16px 48px -16px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
