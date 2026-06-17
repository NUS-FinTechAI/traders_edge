/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Primary backgrounds
        'bg-primary': {
          light: '#ffffff',
          dark: '#0f172a', // slate-900
        },
        'bg-secondary': {
          light: '#f8fafc', // slate-50
          dark: '#1e293b', // slate-800
        },
        
        // Text colors
        'text-primary': {
          light: '#0f172a', // slate-900
          dark: '#f8fafc', // slate-50
        },
        'text-secondary': {
          light: '#475569', // slate-600
          dark: '#cbd5e1', // slate-300
        },
        
        // Action colors
        'action-success': {
          light: '#059669', // emerald-600
          dark: '#10b981', // emerald-500
        },
        'action-danger': {
          light: '#dc2626', // red-600
          dark: '#ef4444', // red-500
        },
        
        // Semantic colors for components
        'surface': {
          light: '#ffffff',
          dark: '#1e293b', // slate-800
        },
        'surface-elevated': {
          light: '#f1f5f9', // slate-100
          dark: '#334155', // slate-700
        },
        'border': {
          light: '#e2e8f0', // slate-200
          dark: '#475569', // slate-600
        },
      },
    },
  },
  plugins: [],
}
