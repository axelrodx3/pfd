import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingResult } from './FloatingResult'

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
  className = ''
}) => {
  const [currentFace, setCurrentFace] = useState(1)
  const [showResult, setShowResult] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)
  const [showFloatingResult, setShowFloatingResult] = useState(false)

  // Dice faces with proper rotations for each number
  const diceFaces = {
    1: { rotateX: 0, rotateY: 0 },
    2: { rotateX: 0, rotateY: 90 },
    3: { rotateX: 0, rotateY: 180 },
    4: { rotateX: 0, rotateY: 270 },
    5: { rotateX: 90, rotateY: 0 },
    6: { rotateX: -90, rotateY: 0 }
  }

  // Handle rolling animation
  useEffect(() => {
    if (isRolling) {
      setShowResult(false)
      setAnimationComplete(false)
      
      // Random dice faces during rolling
      const rollInterval = setInterval(() => {
        setCurrentFace(Math.floor(Math.random() * 6) + 1)
      }, 100)

      // Stop rolling after 2 seconds and land on target
      const rollTimeout = setTimeout(() => {
        clearInterval(rollInterval)
        setCurrentFace(targetNumber)
        setShowResult(true)
        
        // Trigger win/loss effects
        setTimeout(() => {
          if (won) {
            onWin?.()
          } else {
            onLoss?.()
          }
          setAnimationComplete(true)
          setShowFloatingResult(true)
          onRollEnd()
        }, 500)
      }, 2000)

      return () => {
        clearInterval(rollInterval)
        clearTimeout(rollTimeout)
      }
    }
  }, [isRolling, targetNumber, won, onWin, onLoss, onRollEnd])

  // Get the rotation for the current face
  const currentRotation = diceFaces[currentFace as keyof typeof diceFaces]

  return (
    <div className={`relative ${className}`}>
      {/* 3D Environment - Enhanced Glowing Table */}
      <div className="relative w-40 h-40 mx-auto mb-6">
        {/* Table Surface with Enhanced Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl">
          {/* Outer Glow Ring */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-hilo-gold/30 via-hilo-red/30 to-hilo-green/30 blur-lg" />
          
          {/* Inner Glow Edge */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-hilo-gold/20 via-hilo-red/20 to-hilo-green/20 blur-sm" />
          
          {/* Floating Grid Pattern */}
          <div className="absolute inset-3 rounded-2xl border border-hilo-gold/40">
            <div className="grid grid-cols-4 grid-rows-4 h-full gap-1 p-3">
              {[...Array(16)].map((_, i) => (
                <motion.div 
                  key={i} 
                  className="border border-hilo-gold/20 rounded"
                  animate={{
                    opacity: [0.1, 0.3, 0.1],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </div>
          </div>

          {/* Corner Accents */}
          <div className="absolute top-2 left-2 w-3 h-3 bg-hilo-gold/60 rounded-full blur-sm" />
          <div className="absolute top-2 right-2 w-3 h-3 bg-hilo-red/60 rounded-full blur-sm" />
          <div className="absolute bottom-2 left-2 w-3 h-3 bg-hilo-green/60 rounded-full blur-sm" />
          <div className="absolute bottom-2 right-2 w-3 h-3 bg-hilo-gold/60 rounded-full blur-sm" />
        </div>

        {/* 3D Dice */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
        >
          <motion.div
            className="relative w-20 h-20"
            style={{
              transformStyle: 'preserve-3d'
            }}
            animate={isRolling ? {
              rotateX: [0, 360, 720, 1080, 1440],
              rotateY: [0, 180, 360, 540, 720],
              rotateZ: [0, 90, 180, 270, 360],
              scale: [1, 1.2, 0.8, 1.1, 1],
              y: [0, -20, 10, -10, 0],
              x: [0, 10, -15, 5, 0]
            } : {
              rotateX: currentRotation.rotateX,
              rotateY: currentRotation.rotateY,
              rotateZ: 0,
              scale: 1,
              y: 0,
              x: 0
            }}
            transition={isRolling ? {
              duration: 2,
              ease: "easeInOut",
              times: [0, 0.2, 0.4, 0.6, 1]
            } : {
              duration: 0.5,
              ease: "easeOut"
            }}
          >
            {/* Dice Cube */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-white to-gray-200 rounded-lg shadow-lg border-2 border-gray-300"
              style={{
                transform: 'translateZ(8px)'
              }}
            >
              {/* Dice Dots */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-3 grid-rows-3 gap-1 w-12 h-12">
                  {getDiceDots(currentFace).map((dot, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        dot ? 'bg-gray-800' : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Win/Loss Glow Effect */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  className={`absolute inset-0 rounded-lg ${
                    won 
                      ? 'bg-gradient-to-br from-hilo-green/30 to-hilo-gold/30' 
                      : 'bg-gradient-to-br from-hilo-red/30 to-gray-800/30'
                  }`}
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{ 
                    opacity: [0, 1, 0.8, 1],
                    scale: [1, 1.2, 1.1, 1]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1,
                    repeat: won ? 2 : 1,
                    repeatType: 'reverse'
                  }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Bouncing Shadow */}
        <motion.div
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-black/20 rounded-full blur-sm"
          animate={isRolling ? {
            scale: [1, 1.5, 0.8, 1.2, 1],
            opacity: [0.2, 0.4, 0.1, 0.3, 0.2]
          } : {
            scale: 1,
            opacity: 0.2
          }}
          transition={{
            duration: 2,
            ease: "easeInOut"
          }}
        />

        {/* Floating Result Display */}
        <FloatingResult
          amount={winnings - betAmount}
          isWin={won || false}
          isVisible={showFloatingResult}
          onComplete={() => setShowFloatingResult(false)}
        />
      </div>

      {/* Win/Loss Effects */}
      <AnimatePresence>
        {showResult && won && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Confetti/Coin Burst */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-hilo-gold rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: [0, (Math.random() - 0.5) * 200],
                  y: [0, -Math.random() * 100 - 50],
                  rotate: [0, 360],
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
      </AnimatePresence>

      {/* Loss Shake Effect */}
      <AnimatePresence>
        {showResult && !won && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-hilo-red/10 rounded-2xl"
              animate={{
                x: [-2, 2, -2, 2, 0],
                opacity: [0.3, 0.1, 0.3, 0.1, 0]
              }}
              transition={{
                duration: 0.5,
                ease: "easeInOut"
              }}
            />
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
    6: [true, false, true, true, false, true, true, false, true]
  }
  
  return patterns[face as keyof typeof patterns] || patterns[1]
}

export default Dice3D
