/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#07070c', 2: '#11111a', 3: '#181824' },
        surface: { DEFAULT: '#11111a', 2: '#181824' },
        line: 'rgba(255,255,255,0.09)',
        mist: '#e8e8f0',
        muted: '#9a9ab0',
        accent: {
          violet: '#7c5cff',
          magenta: '#ff4d8d',
          amber: '#ffb84d',
        },
        star: '#fbbf24',
      },
      fontFamily: {
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 12px 40px -12px rgba(124, 92, 255, 0.45)',
        'glow-pink': '0 12px 40px -12px rgba(255, 77, 141, 0.45)',
        card: '0 20px 50px -20px rgba(0, 0, 0, 0.7)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        pop: {
          '0%': { transform: 'scale(0.4)' },
          '60%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
        pop: 'pop 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'toast-in': 'toastIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'float-slow': 'floatSlow 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
