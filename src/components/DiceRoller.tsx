import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { getDiceEmoji } from '../lib/utils'

interface DiceRollerProps {
  className?: string
}

/**
 * Dice Roller Component
 * Animated dice with physics-like roll animation
 * 
 * @param className - Additional CSS classes
 */
export const DiceRoller: React.FC<DiceRollerProps> = ({ className = '' }) => {
  const { lastRoll, isRolling, lastResult, lastWin } = useGameStore()
  const [displayRoll, setDisplayRoll] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Update display roll when game state changes
  useEffect(() => {
    if (lastRoll !== null) {
      setDisplayRoll(lastRoll)
    }
  }, [lastRoll])

  // Handle rolling animation
  useEffect(() => {
    if (isRolling) {
      setIsAnimating(true)
      // Show random dice during animation
      const interval = setInterval(() => {
        setDisplayRoll(Math.floor(Math.random() * 6) + 1)
      }, 100)
      
      return () => clearInterval(interval)
    } else {
      setIsAnimating(false)
    }
  }, [isRolling])

  const diceVariants = {
    initial: { 
      rotate: 0, 
      scale: 1,
      y: 0 
    },
    rolling: { 
      rotate: [0, 180, 360, 540, 720],
      scale: [1, 1.2, 0.8, 1.1, 1],
      y: [0, -10, 10, -5, 0],
      transition: {
        duration: 2,
        ease: 'easeInOut',
        times: [0, 0.2, 0.4, 0.6, 1]
      }
    },
    landed: {
      rotate: 0,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 20
      }
    }
  }

  const resultVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 20 
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: 0.5
      }
    }
  }

  return (
    <div className={`dice-container ${className}`}>
      {/* Dice Display */}
      <motion.div
        className="relative w-24 h-24 mx-auto mb-4"
        variants={diceVariants}
        initial="initial"
        animate={isRolling ? "rolling" : "landed"}
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-6xl"
          animate={isRolling ? {
            rotate: [0, 90, 180, 270, 360],
          } : false}
          transition={{
            duration: 0.2,
            repeat: isRolling ? Infinity : 0,
            ease: 'linear'
          }}
        >
          {displayRoll ? getDiceEmoji(displayRoll) : '🎲'}
        </motion.div>

        {/* Glow Effect */}
        {isRolling && (
          <motion.div
            className="absolute inset-0 rounded-full bg-hilo-gold opacity-20"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        )}
      </motion.div>

      {/* Result Display */}
      <AnimatePresence>
        {lastRoll !== null && !isRolling && (
          <motion.div
            className="text-center"
            variants={resultVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              className={`
                text-2xl font-bold mb-2
                ${lastWin ? 'text-hilo-green' : 'text-hilo-red'}
              `}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.3,
                repeat: 2,
                repeatType: 'reverse',
              }}
            >
              {lastWin ? '🎉 YOU WIN!' : '💸 YOU LOSE!'}
            </motion.div>
            
            <motion.div
              className="text-lg text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Rolled: {lastRoll} ({lastResult?.toUpperCase()})
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rolling Indicator */}
      <AnimatePresence>
        {isRolling && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-hilo-gold text-lg font-semibold mb-2"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            >
              Rolling...
            </motion.div>
            
            <motion.div
              className="flex justify-center space-x-1"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-hilo-gold rounded-full"
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DiceRoller
