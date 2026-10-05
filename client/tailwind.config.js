/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4A7C59', // Elaichi green
          dark: '#2F5D3A',
          light: '#DDEBDD',
          hover: '#3D684A',
        },
        accent: {
          DEFAULT: '#A8C686', // Soft cardamom
          light: '#CBE0B4',
        },
        gold: {
          DEFAULT: '#C9A227', // Extra premium gold
          light: '#F3D77A',
          dark: '#9C7A17',
        },
        surface: {
          DEFAULT: '#F6FAF6',
          card: '#FFFFFF',
          elevated: '#EFF5F0',
        },
        text: {
          DEFAULT: '#1F2D24',
          muted: '#6B7C70',
          subtle: '#8C9B90',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        elaichi: '0 10px 25px -5px rgba(74, 124, 89, 0.12), 0 8px 10px -6px rgba(74, 124, 89, 0.08)',
        'elaichi-lg': '0 20px 35px -10px rgba(74, 124, 89, 0.2), 0 10px 15px -8px rgba(74, 124, 89, 0.12)',
        'gold-glow': '0 10px 25px -5px rgba(201, 162, 39, 0.3)',
      },
      screens: {
        xs: '360px',
      },
    },
  },
  plugins: [],
};
