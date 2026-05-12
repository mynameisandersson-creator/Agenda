import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        agenda: {
          ink: '#172033',
          primary: '#2563eb',
          secondary: '#7c3aed',
          success: '#16a34a',
          warning: '#f59e0b',
          danger: '#ef4444',
          surface: '#f8fafc'
        }
      },
      boxShadow: {
        soft: '0 20px 60px -24px rgba(15, 23, 42, 0.35)'
      }
    }
  },
  plugins: []
};

export default config;
