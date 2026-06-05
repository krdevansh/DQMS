import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/themes/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dqms: {
          bg: '#F5F7FA',
          primary: '#2563EB',
          secondary: '#1E293B',
          accent: '#06B6D4',
          white: '#FFFFFF',
        },
        salon: {
          bg: '#0D0D0D',
          secondary: '#161616',
          gold: '#D4AF37',
          neon: '#FF8C42',
          text: '#F5F5F5',
          glass: 'rgba(255,255,255,0.05)',
        },
        hospital: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          surface: '#F8FAFC',
          card: '#FFFFFF',
          text: '#1E293B',
          muted: '#64748B',
          border: '#E2E8F0',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config