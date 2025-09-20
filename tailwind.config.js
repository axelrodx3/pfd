/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // HILO Brand Colors
        'hilo-red': '#FF2D2D',
        'hilo-gold': '#FFD700',
        'hilo-green': '#00C853',
        'hilo-black': '#0D0D0D',
        // Extended palette
        'hilo-red-dark': '#CC2424',
        'hilo-gold-dark': '#E6C200',
        'hilo-green-dark': '#00A041',
        'hilo-gray': '#1A1A1A',
        'hilo-gray-light': '#2A2A2A',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Orbitron', 'monospace'],
      },
      animation: {
        'dice-roll': 'diceRoll 0.8s ease-in-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'confetti': 'confetti 3s ease-out',
      },
      keyframes: {
        diceRoll: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '25%': { transform: 'rotate(90deg) scale(1.1)' },
          '50%': { transform: 'rotate(180deg) scale(1.2)' },
          '75%': { transform: 'rotate(270deg) scale(1.1)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
            transform: 'scale(1)'
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(255, 215, 0, 0.6)',
            transform: 'scale(1.02)'
          },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-100vh) rotate(720deg)', opacity: '0' },
        },
      },
      boxShadow: {
        'hilo-glow': '0 0 20px rgba(255, 215, 0, 0.3)',
        'hilo-glow-red': '0 0 20px rgba(255, 45, 45, 0.3)',
        'hilo-glow-green': '0 0 20px rgba(0, 200, 83, 0.3)',
        'hilo-glow-strong': '0 0 40px rgba(255, 215, 0, 0.6)',
      },
    },
  },
  plugins: [],
}
