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
            setTimeout(() => onComplete(), 2000)
          }}
        >
          {/* Main Floating Number */}
          <motion.div
            className={`
              px-6 py-3 rounded-full border-2 font-bold text-2xl
              ${getColorClasses()}
              ${getGlowEffect()}
              backdrop-blur-sm
            `}
            animate={{
              y: [-20, -40, -60],
              scale: [1, 1.1, 0.9],
              opacity: [1, 0.8, 0]
            }}
            transition={{
              duration: 2,
              ease: "easeOut",
              times: [0, 0.5, 1]
            }}
          >
            {isPositive ? '+' : '-'}{displayAmount.toLocaleString()} HILO
          </motion.div>

          {/* Static Smaller Value (stays for 2 seconds) */}
          <motion.div
            className={`
              absolute top-16 px-3 py-1 rounded-full border
              ${getColorClasses()}
              text-sm font-semibold
            `}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0.8, 1, 1, 0.8]
            }}
            transition={{
              duration: 2.5,
              times: [0, 0.2, 0.8, 1],
              ease: "easeInOut"
            }}
          >
            {isPositive ? '+' : '-'}{displayAmount.toLocaleString()}
          </motion.div>

          {/* Particle Effects for Wins */}
          {isWin && isPositive && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-hilo-gold rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: [0, (Math.random() - 0.5) * 100],
                    y: [0, -Math.random() * 80 - 40],
                    scale: [1, 0],
                    opacity: [1, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Loss Shake Effect */}
          {!isWin && !isPositive && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-hilo-red/10 rounded-full"
                animate={{
                  x: [-2, 2, -2, 2, 0],
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.1, 0.3, 0.1, 0]
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FloatingResult
