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
  muted = false
}) => {
  const [currentFace, setCurrentFace] = useState(1)
  const [showResult, setShowResult] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)
  const [showFloatingResult, setShowFloatingResult] = useState(false)

  // Sound effects
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
          // Win chime sound
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime) // C5
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1) // E5
          oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2) // G5
          oscillator.frequency.setValueAtTime(1047, audioContext.currentTime + 0.3) // C6
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.4)
          break
        case 'lose':
          // Muted thud sound
          oscillator.frequency.setValueAtTime(150, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.3)
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.3)
          break
      }
    } catch (error) {
      console.log('Audio not supported')
    }
  }

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
      
      // Play roll sound
      playSound('roll')
      
      // Random dice faces during rolling
      const rollInterval = setInterval(() => {
        setCurrentFace(Math.floor(Math.random() * 6) + 1)
      }, 100)

      // Stop rolling after 2.5 seconds and land on target
      const rollTimeout = setTimeout(() => {
        clearInterval(rollInterval)
        setCurrentFace(targetNumber)
        setShowResult(true)
        
        // Suspense delay before showing results (1-2 seconds)
        setTimeout(() => {
          if (won) {
            playSound('win')
            onWin?.()
          } else {
            playSound('lose')
            onLoss?.()
          }
          setAnimationComplete(true)
          setShowFloatingResult(true)
          onRollEnd()
        }, 1500) // 1.5 second suspense delay
      }, 2500) // 2.5 second roll duration

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
      <div className="relative w-48 h-48 mx-auto mb-6">
        {/* Table Surface with Enhanced Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl">
          {/* Outer Glow Ring */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-hilo-gold/40 via-hilo-red/40 to-hilo-green/40 blur-xl" />
          
          {/* Inner Glow Edge */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-hilo-gold/30 via-hilo-red/30 to-hilo-green/30 blur-sm" />
          
          {/* Floating Grid Pattern */}
          <div className="absolute inset-4 rounded-2xl border-2 border-hilo-gold/50">
            <div className="grid grid-cols-6 grid-rows-6 h-full gap-1 p-4">
              {[...Array(36)].map((_, i) => (
                <motion.div 
                  key={i} 
                  className="border border-hilo-gold/30 rounded-sm"
                  animate={{
                    opacity: [0.1, 0.4, 0.1],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </div>

          {/* Corner Accents with Enhanced Glow */}
          <motion.div 
            className="absolute top-3 left-3 w-4 h-4 bg-hilo-gold/80 rounded-full blur-sm"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute top-3 right-3 w-4 h-4 bg-hilo-red/80 rounded-full blur-sm"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
          <motion.div 
            className="absolute bottom-3 left-3 w-4 h-4 bg-hilo-green/80 rounded-full blur-sm"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          <motion.div 
            className="absolute bottom-3 right-3 w-4 h-4 bg-hilo-gold/80 rounded-full blur-sm"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5
            }}
          />

          {/* Center Glow Effect */}
          <motion.div 
            className="absolute inset-8 rounded-2xl bg-gradient-to-br from-hilo-gold/10 via-transparent to-hilo-gold/10"
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* 3D Dice */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            perspective: '1200px',
            transformStyle: 'preserve-3d'
          }}
        >
          <motion.div
            className="relative w-24 h-24"
            style={{
              transformStyle: 'preserve-3d'
            }}
            animate={isRolling ? {
              rotateX: [0, 180, 360, 540, 720, 900, 1080, 1260, 1440, 1620, 1800],
              rotateY: [0, 90, 180, 270, 360, 450, 540, 630, 720, 810, 900],
              rotateZ: [0, 45, 90, 135, 180, 225, 270, 315, 360, 405, 450],
              scale: [1, 1.3, 0.7, 1.4, 0.6, 1.2, 0.8, 1.1, 0.9, 1.05, 1],
              y: [0, -25, 15, -30, 20, -15, 25, -20, 10, -5, 0],
              x: [0, 15, -20, 25, -15, 20, -10, 15, -5, 8, 0]
            } : {
              rotateX: currentRotation.rotateX,
              rotateY: currentRotation.rotateY,
              rotateZ: 0,
              scale: 1,
              y: 0,
              x: 0
            }}
            transition={isRolling ? {
              duration: 2.5,
              ease: "easeInOut",
              times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
            } : {
              duration: 0.8,
              ease: "easeOut",
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
          >
            {/* Dice Cube */}
            <div
              className={`absolute inset-0 rounded-xl shadow-2xl border-2 transition-all duration-500 ${
                showResult && won 
                  ? 'bg-gradient-to-br from-hilo-green/90 to-hilo-gold/90 border-hilo-gold shadow-hilo-glow-green' 
                  : showResult && !won
                  ? 'bg-gradient-to-br from-hilo-red/90 to-gray-800/90 border-hilo-red shadow-hilo-glow-red'
                  : 'bg-gradient-to-br from-white to-gray-200 border-gray-300'
              }`}
              style={{
                transform: 'translateZ(10px)'
              }}
            >
              {/* Dice Dots */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-16 h-16">
                  {getDiceDots(currentFace).map((dot, index) => (
                    <div
                      key={index}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        dot 
                          ? showResult && won
                            ? 'bg-white shadow-lg'
                            : showResult && !won
                            ? 'bg-gray-200'
                            : 'bg-gray-800'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Enhanced Glow Effect */}
              {showResult && (
                <motion.div
                  className={`absolute inset-0 rounded-xl ${
                    won 
                      ? 'bg-gradient-to-br from-hilo-green/20 to-hilo-gold/20' 
                      : 'bg-gradient-to-br from-hilo-red/20 to-gray-800/20'
                  }`}
                  animate={{
                    opacity: [0, 1, 0.8, 1, 0],
                    scale: [1, 1.1, 1.05, 1.1, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: won ? 2 : 1,
                    repeatType: 'reverse'
                  }}
                />
              )}
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

      {/* Enhanced Win Effects */}
      <AnimatePresence>
        {showResult && won && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Confetti Burst */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`confetti-${i}`}
                className={`absolute w-3 h-3 rounded-full ${
                  i % 4 === 0 ? 'bg-hilo-gold' :
                  i % 4 === 1 ? 'bg-hilo-green' :
                  i % 4 === 2 ? 'bg-hilo-red' : 'bg-white'
                }`}
                style={{
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: [0, (Math.random() - 0.5) * 300],
                  y: [0, -Math.random() * 150 - 100],
                  rotate: [0, 360, 720],
                  scale: [1, 1.2, 0],
                  opacity: [1, 0.8, 0]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.05,
                  ease: "easeOut"
                }}
              />
            ))}
            
            {/* Coin Burst */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`coin-${i}`}
                className="absolute w-4 h-4 bg-hilo-gold rounded-full shadow-lg"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: [0, (Math.random() - 0.5) * 250],
                  y: [0, -Math.random() * 120 - 80],
                  rotate: [0, 180, 360],
                  scale: [1, 1.3, 0.8, 0],
                  opacity: [1, 0.9, 0.6, 0]
                }}
                transition={{
                  duration: 2.5,
                  delay: i * 0.08,
                  ease: "easeOut"
                }}
              />
            ))}
            
            {/* Sparkle Effects */}
            {[...Array(15)].map((_, i) => (
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
                  delay: i * 0.06,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Loss Effects */}
      <AnimatePresence>
        {showResult && !won && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Shake Effect */}
            <motion.div
              className="absolute inset-0 bg-hilo-red/20 rounded-2xl"
              animate={{
                x: [-3, 3, -3, 3, -2, 2, 0],
                y: [-2, 2, -2, 2, -1, 1, 0],
                scale: [1, 1.02, 1, 1.01, 1],
                opacity: [0.4, 0.1, 0.4, 0.1, 0.3, 0.1, 0]
              }}
              transition={{
                duration: 1,
                ease: "easeInOut"
              }}
            />
            
            {/* Loss Particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`loss-particle-${i}`}
                className="absolute w-2 h-2 bg-hilo-red/70 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: [0, (Math.random() - 0.5) * 100],
                  y: [0, Math.random() * 80 + 40],
                  scale: [1, 0.5, 0],
                  opacity: [1, 0.6, 0]
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
            
            {/* Crack Effect */}
            <motion.div
              className="absolute inset-0 border-2 border-hilo-red/30 rounded-2xl"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.5, 0.8, 0.3, 0]
              }}
              transition={{
                duration: 1.5,
                ease: "easeOut"
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
