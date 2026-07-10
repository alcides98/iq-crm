/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        wolf: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          500: '#3b5bdb',
          600: '#364fc7',
          700: '#2f44a8',
          800: '#1e3a8a',
          900: '#1a347a',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f5f5f7',
          tertiary: '#e8e8ed',
          dark: '#1c1c1e',
          'dark-secondary': '#2c2c2e',
          'dark-tertiary': '#3a3a3c',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'apple-sm': '0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06)',
        'apple': '0 4px 16px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.04)',
        'apple-lg': '0 8px 30px rgba(0,0,0,.10), 0 2px 8px rgba(0,0,0,.06)',
        'apple-dark': '0 4px 16px rgba(0,0,0,.4), 0 1px 4px rgba(0,0,0,.3)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
