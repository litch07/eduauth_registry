/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E40AF',
          hover: '#1E3A8A',
          light: '#3B82F6',
        },
        secondary: {
          DEFAULT: '#059669',
          hover: '#047857',
        },
        surface: '#FFFFFF',
        background: '#F9FAFB',
        border: '#E5E7EB',
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        certificate: '#D97706',
        verified: '#059669',
      },
      fontFamily: {
        sans: ['"Open Sans"', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.08)',
        soft: '0 8px 18px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
