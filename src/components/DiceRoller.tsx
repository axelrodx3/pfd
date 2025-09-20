import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { getDiceEmoji } from '../lib/utils'
import { Dice3D } from './Dice3D'

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
  const { 
    lastRoll, 
    isRolling, 
    lastResult, 
    lastWin,
    currentBet,
    selectedDiceSkin,
    autoRollEnabled,
    autoRollCount,
    autoRollMax,
    soundEnabled,
    muted
  } = useGameStore()
  
  const [displayRoll, setDisplayRoll] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)

  // Play sound effects
  const playSound = (sound: 'roll' | 'win' | 'lose') => {
    if (!soundEnabled || muted) return
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      switch (sound) {
        case 'roll':
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.1)
          break
        case 'win':
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime) // C5
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1) // E5
          oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2) // G5
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.3)
          break
        case 'lose':
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2)
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.2)
          break
      }
    } catch (error) {
      console.log('Audio not supported')
    }
  }

  // Update display roll when game state changes
  useEffect(() => {
    if (lastRoll !== null) {
      setDisplayRoll(lastRoll)
    }
  }, [lastRoll])

  // Handle rolling animation and sounds
  useEffect(() => {
    if (isRolling) {
      setIsAnimating(true)
      playSound('roll')
      // Show random dice during animation
      const interval = setInterval(() => {
        setDisplayRoll(Math.floor(Math.random() * 6) + 1)
      }, 100)
      
      return () => clearInterval(interval)
    } else {
      setIsAnimating(false)
    }
  }, [isRolling])

  const getDiceSkinStyles = (skin: string) => {
    switch (skin) {
      case 'neon':
        return 'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-400 shadow-cyan-500/50'
      case 'gold':
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-400 shadow-yellow-500/50'
      default: // classic
        return 'bg-hilo-black border-hilo-gold shadow-hilo-glow'
    }
  }

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
    <div className={`dice-container relative ${className}`}>
      {/* Auto-roll indicator */}
      {autoRollEnabled && (
        <motion.div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-hilo-red text-white text-xs px-2 py-1 rounded-full z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          Auto: {autoRollCount}/{autoRollMax}
        </motion.div>
      )}

      {/* 3D Dice Display */}
      <Dice3D
        targetNumber={lastRoll || 1}
        isRolling={isRolling}
        onRollEnd={() => {
          // Show result modal after dice animation completes
          if (lastWin !== null) {
            setShowResultModal(true)
          }
        }}
        onWin={() => {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3000)
        }}
        onLoss={() => {
          // Loss effects handled by Dice3D
        }}
        won={lastWin}
        betAmount={currentBet}
        winnings={lastWin ? currentBet * 1.98 : 0}
        soundEnabled={soundEnabled}
        muted={muted}
        className="mb-4"
      />

      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-hilo-gold rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [-20, 100],
                  x: [0, (Math.random() - 0.5) * 100],
                  rotate: [0, 360],
                  scale: [1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {showResultModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowResultModal(false)}
          >
            <motion.div
              className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4 text-center border-2 border-hilo-gold shadow-2xl"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Result Icon */}
              <motion.div
                className="text-8xl mb-4"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: 2,
                  repeatType: 'reverse',
                }}
              >
                {lastWin ? '🎉' : '😞'}
              </motion.div>

              {/* Result Text */}
              <motion.h2
                className={`text-4xl font-bold mb-4 ${
                  lastWin ? 'text-hilo-green' : 'text-hilo-red'
                }`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {lastWin ? 'YOU WIN!' : 'YOU LOSE!'}
              </motion.h2>

              {/* Roll Details */}
              <motion.div
                className="text-lg text-gray-300 mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="mb-2">
                  <span className="text-hilo-gold font-semibold">Roll:</span> {lastRoll}
                </div>
                <div className="mb-2">
                  <span className="text-hilo-gold font-semibold">Result:</span> {lastResult?.toUpperCase()}
                </div>
                {lastWin && (
                  <div className="text-hilo-green font-semibold">
                    <span className="text-hilo-gold">Multiplier:</span> 1.98x
                  </div>
                )}
              </motion.div>

              {/* OK Button */}
              <motion.button
                onClick={() => setShowResultModal(false)}
                className={`px-8 py-3 rounded-lg font-bold text-xl transition-all duration-300 ${
                  lastWin
                    ? 'bg-hilo-green text-white hover:bg-hilo-green/80 hover:shadow-hilo-glow-green'
                    : 'bg-hilo-red text-white hover:bg-hilo-red/80 hover:shadow-hilo-glow-red'
                }`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                OK
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default DiceRoller

