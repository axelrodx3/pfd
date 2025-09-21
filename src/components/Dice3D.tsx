import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingResult } from './FloatingResult'
import { formatCurrency } from '../lib/utils'

interface Dice3DProps {
  targetNumber: number
  isRolling: boolean
  onRollEnd: () => void
  onWin?: () => void
  onLoss?: () => void
  won?: boolean
  betAmount?: number
  winnings?: number
  className?: string
  soundEnabled?: boolean
  muted?: boolean
}

/**
 * 3D Dice Component with Physics-like Animation
 * Creates a realistic dice rolling experience with proper landing on target number
 */
export const Dice3D: React.FC<Dice3DProps> = ({
  targetNumber,
  isRolling,
  onRollEnd,
  onWin,
  onLoss,
  won,
  betAmount = 0,
  winnings = 0,
  className = '',
  soundEnabled = true,
  muted = false,
}) => {
  const [currentFace, setCurrentFace] = useState(1)
  const [showResult, setShowResult] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)
  const [showFloatingResult, setShowFloatingResult] = useState(false)
  const [isLanding, setIsLanding] = useState(false)

  // Sound effects with proper error handling
  const playSound = React.useCallback((sound: 'roll' | 'win' | 'lose') => {
    if (!soundEnabled || muted) return

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return

      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      switch (sound) {
        case 'roll':
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(
            400,
            audioContext.currentTime + 0.1
          )
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.1
          )
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.1)
          break
        case 'win':
          // Win chime sound
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime) // C5
          oscillator.frequency.setValueAtTime(
            659,
            audioContext.currentTime + 0.1
          ) // E5
          oscillator.frequency.setValueAtTime(
            784,
            audioContext.currentTime + 0.2
          ) // G5
          oscillator.frequency.setValueAtTime(
            1047,
            audioContext.currentTime + 0.3
          ) // C6
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.4
          )
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.4)
          break
        case 'lose':
          // Muted thud sound
          oscillator.frequency.setValueAtTime(150, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(
            80,
            audioContext.currentTime + 0.3
          )
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.3
          )
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.3)
          break
      }
    } catch (error) {
      // Silently fail for audio - not critical functionality
      if (process.env.NODE_ENV === 'development') {
        console.warn('Audio playback failed:', error)
      }
    }
  }, [soundEnabled, muted])

  // Simple dice face display

  // Update currentFace when targetNumber changes (when not rolling)
  useEffect(() => {
    if (!isRolling && targetNumber) {
      setCurrentFace(targetNumber)
      if (won !== null && won !== undefined) {
        setShowResult(true)
      }
    }
  }, [targetNumber, isRolling, won])

  // Reset dice state when a new game starts (isRolling becomes true)
  useEffect(() => {
    if (isRolling) {
      setShowResult(false)
      setAnimationComplete(false)
      setShowFloatingResult(false)
      setIsLanding(false)
    }
  }, [isRolling])

  // Handle rolling animation
  useEffect(() => {
    if (!isRolling) return

    setShowResult(false)
    setAnimationComplete(false)
    setShowFloatingResult(false)

    // Play roll sound
    playSound('roll')

    // Random dice faces during rolling
    const rollInterval = setInterval(() => {
      setCurrentFace(Math.floor(Math.random() * 6) + 1)
    }, 80) // Slightly faster for smoother animation

    // Stop rolling after 1.8 seconds and land on target
    const rollTimeout = setTimeout(() => {
      clearInterval(rollInterval)
      // Set landing state for smooth transition
      setIsLanding(true)
      // Immediately set the target number to prevent dice from disappearing
      setCurrentFace(targetNumber)

      // Small delay to let the motion animation finish smoothly
      const resultTimeout = setTimeout(() => {
        // Show results after dice lands
        setShowResult(true)
        if (won === true) {
          playSound('win')
          onWin?.()
        } else if (won === false) {
          playSound('lose')
          onLoss?.()
        }
        setAnimationComplete(true)
        setShowFloatingResult(true)
        onRollEnd()
      }, 200) // Small delay for smooth transition

      // Cleanup result timeout on unmount
      return () => clearTimeout(resultTimeout)
    }, 1800) // 1.8 second roll duration

    return () => {
      clearInterval(rollInterval)
      clearTimeout(rollTimeout)
    }
  }, [isRolling, targetNumber, won, onWin, onLoss, onRollEnd, playSound])

  // Simple dice display

  return (
    <div className={`relative ${className}`}>
      {/* Simple Dice Container */}
      <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center">
        {/* Simple Dice */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="relative w-20 h-20"
            animate={
              isRolling
                ? {
                    rotate: [0, 180, 360, 540, 720],
                    scale: [1, 1.1, 0.9, 1.05, 1],
                    y: [0, -8, 4, -6, 0],
                  }
                : {
                    rotate: 0,
                    scale: 1,
                    y: 0,
                  }
            }
            transition={
              isRolling
                ? {
                    duration: 1.5,
                    ease: 'easeInOut',
                  }
                : {
                    duration: 0.3,
                    ease: 'easeOut',
                  }
            }
          >
            {/* Simple Dice */}
            <div
              className={`w-full h-full rounded-lg shadow-lg border-2 transition-all duration-300 flex items-center justify-center ${
                showResult && won === true
                  ? 'bg-green-500 border-green-600 shadow-green-500/30'
                  : showResult && won === false
                    ? 'bg-red-500 border-red-600 shadow-red-500/30'
                    : 'bg-white border-gray-300 shadow-gray-400/20'
              }`}
            >
              {/* Dice Dots */}
              <div className="grid grid-cols-3 grid-rows-3 gap-1 w-16 h-16">
                {getDiceDots(Math.max(1, Math.min(6, currentFace))).map((dot, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      dot ? 'bg-black' : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Simple Result Glow */}
            {showResult && (won === true || won === false) && (
              <motion.div
                className={`absolute inset-0 rounded-lg ${
                  won ? 'bg-green-400/20' : 'bg-red-400/20'
                }`}
                initial={{ opacity: 0, scale: 1 }}
                animate={{
                  opacity: [0, 0.4, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: 1,
                  repeatType: 'reverse',
                }}
              />
            )}
          </motion.div>
        </div>

        {/* Simple Shadow */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-black/20 rounded-full" />

        {/* Floating Result Display */}
        <FloatingResult
          amount={winnings - betAmount}
          isWin={won || false}
          isVisible={showFloatingResult}
          onComplete={() => setShowFloatingResult(false)}
          className="z-50"
        />

        {/* Result Display - Cloud bubble next to dice */}
        {showResult && (won === true || won === false) && (
          <motion.div
            className="absolute -right-52 top-1/4 transform -translate-y-1/2 z-40"
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.8, 1, 1, 0.9],
              x: [20, 0, 0, -10],
            }}
            transition={{
              duration: 6,
              times: [0, 0.1, 0.8, 1],
              ease: 'easeInOut',
            }}
            onAnimationComplete={() => setShowResult(false)}
          >
            <div className="relative">
              {/* Cloud bubble */}
              <div
                className={`
                bg-gradient-to-br from-white/95 to-gray-100/95 backdrop-blur-sm 
                rounded-3xl px-4 py-3 shadow-2xl border-2
                ${won ? 'border-green-300 shadow-green-500/30' : 'border-red-300 shadow-red-500/30'}
                relative
              `}
              >
                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${won ? 'text-green-600' : 'text-red-600'} mb-1`}
                  >
                    {won ? '🎉 WIN!' : '💸 LOSE!'}
                  </div>
                  <div className="text-sm text-gray-700 font-semibold">
                    {won
                      ? `Rolled: ${currentFace}`
                      : `Amount Lost: ${formatCurrency(betAmount)} HILO`}
                  </div>
                  {won && (
                    <div className="text-xs text-green-600 font-bold mt-1">
                      +{formatCurrency(winnings - betAmount)} HILO
                    </div>
                  )}
                </div>

                {/* Cloud tail */}
                <div
                  className={`
                  absolute -left-2 top-1/2 transform -translate-y-1/2 w-0 h-0
                  border-t-8 border-b-8 border-r-8 border-transparent
                  ${won ? 'border-r-green-300' : 'border-r-red-300'}
                `}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Simple Win Effects Only */}
      <AnimatePresence>
        {showResult && won && (
          <motion.div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-4xl font-bold text-green-500">WIN!</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Generate dice dot pattern for a given face (1-6)
 */
function getDiceDots(face: number): boolean[] {
  const patterns = {
    1: [false, false, false, false, true, false, false, false, false],
    2: [true, false, false, false, false, false, false, false, true],
    3: [true, false, false, false, true, false, false, false, true],
    4: [true, false, true, false, false, false, true, false, true],
    5: [true, false, true, false, true, false, true, false, true],
    6: [true, false, true, true, false, true, true, false, true],
  }

  return patterns[face as keyof typeof patterns] || patterns[1]
}

export default Dice3D
