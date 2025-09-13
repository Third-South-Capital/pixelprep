import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors that work with CSS variables
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Custom colors for CSS variable integration
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'bg-inverse': 'var(--color-bg-inverse)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'text-inverse': 'var(--color-text-inverse)',
        'border-primary': 'var(--color-border-primary)',
        'border-secondary': 'var(--color-border-secondary)',
        'accent-primary': 'var(--color-accent-primary)',
        'accent-primary-hover': 'var(--color-accent-primary-hover)',
        'accent-secondary': 'var(--color-accent-secondary)',
        'accent-purple': 'var(--color-accent-purple)',
        'accent-purple-hover': 'var(--color-accent-purple-hover)',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    forms,
  ],
}