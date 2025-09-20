import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FloatingResultProps {
  amount: number
  isWin: boolean
  isVisible: boolean
  onComplete: () => void
  className?: string
}

/**
 * FloatingResult Component
 * Shows animated earnings/losses that float up and fade out
 * Similar to slot machine or roulette win displays
 */
export const FloatingResult: React.FC<FloatingResultProps> = ({
  amount,
  isWin,
  isVisible,
  onComplete,
  className = ''
}) => {
  const isPositive = amount > 0
  const displayAmount = Math.abs(amount)
  
  const getColorClasses = () => {
    if (isWin && isPositive) {
      return 'text-hilo-green bg-hilo-green/20 border-hilo-green/50'
    } else if (!isWin && !isPositive) {
      return 'text-hilo-red bg-hilo-red/20 border-hilo-red/50'
    } else {
      return 'text-hilo-gold bg-hilo-gold/20 border-hilo-gold/50'
    }
  }

  const getGlowEffect = () => {
    if (isWin && isPositive) {
      return 'shadow-hilo-glow-green'
    } else if (!isWin && !isPositive) {
      return 'shadow-hilo-glow-red'
    } else {
      return 'shadow-hilo-glow'
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`absolute inset-0 pointer-events-none flex items-center justify-center ${className}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onAnimationComplete={() => {
            setTimeout(() => onComplete(), 3000)
          }}
        >
          {/* Main Floating Number */}
          <motion.div
            className={`
              px-6 py-3 rounded-xl border-2 font-bold text-2xl
              ${getColorClasses()}
              ${getGlowEffect()}
              backdrop-blur-md
              shadow-2xl
              z-50
            `}
            animate={{
              y: [-20, -40, -60, -80],
              scale: [1, 1.1, 1, 0.9],
              opacity: [1, 0.9, 0.7, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{
              duration: 2,
              ease: "easeOut",
              times: [0, 0.3, 0.7, 1]
            }}
          >
            <span className="flex items-center gap-2">
              {isPositive ? '🎉' : '💸'}
              {isPositive ? '+' : '-'}{displayAmount.toLocaleString()} HILO
            </span>
          </motion.div>

          {/* Static Smaller Value (stays for 2 seconds) */}
          <motion.div
            className={`
              absolute top-16 px-3 py-1.5 rounded-lg border
              ${getColorClasses()}
              text-base font-semibold
              backdrop-blur-sm
              shadow-lg
              z-40
            `}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ 
              opacity: [0, 1, 1, 1, 0],
              scale: [0.8, 1.05, 1, 1, 0.8],
              y: [10, 0, 0, 0, -5]
            }}
            transition={{
              duration: 2.5,
              times: [0, 0.2, 0.3, 0.8, 1],
              ease: "easeInOut"
            }}
          >
            {isPositive ? '+' : '-'}{displayAmount.toLocaleString()}
          </motion.div>

          {/* Enhanced Particle Effects for Wins */}
          {isWin && isPositive && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Gold Coins */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`coin-${i}`}
                  className="absolute w-3 h-3 bg-hilo-gold rounded-full shadow-lg"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: [0, (Math.random() - 0.5) * 150],
                    y: [0, -Math.random() * 120 - 60],
                    scale: [1, 1.2, 0],
                    opacity: [1, 0.8, 0],
                    rotate: [0, 360, 720]
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.08,
                    ease: "easeOut"
                  }}
                />
              ))}
              
              {/* Sparkles */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: [0, (Math.random() - 0.5) * 200],
                    y: [0, -Math.random() * 100 - 50],
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.05,
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Enhanced Loss Shake Effect */}
          {!isWin && !isPositive && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-hilo-red/20 rounded-2xl"
                animate={{
                  x: [-3, 3, -3, 3, -2, 2, 0],
                  y: [-2, 2, -2, 2, -1, 1, 0],
                  scale: [1, 1.05, 1, 1.02, 1],
                  opacity: [0.4, 0.1, 0.4, 0.1, 0.3, 0.1, 0]
                }}
                transition={{
                  duration: 1.2,
                  ease: "easeInOut"
                }}
              />
              
              {/* Loss Particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`loss-${i}`}
                  className="absolute w-2 h-2 bg-hilo-red/60 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: [0, (Math.random() - 0.5) * 80],
                    y: [0, Math.random() * 60 + 30],
                    scale: [1, 0.5, 0],
                    opacity: [1, 0.5, 0]
                  }}
                  transition={{
                    duration: 1,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FloatingResult
