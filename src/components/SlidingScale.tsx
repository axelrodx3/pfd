import React from 'react'
import { motion } from 'framer-motion'

interface SlidingScaleProps {
  isWin: boolean | null
  isRolling: boolean
  className?: string
}

/**
 * Sliding Scale Component
 * Shows a visual indicator that slides to green (win) or red (lose) side
 * The indicator is a dice that moves along the scale
 */
export const SlidingScale: React.FC<SlidingScaleProps> = ({
  isWin,
  isRolling,
  className = ''
}) => {
  // Calculate position based on win/lose state
  const getPosition = () => {
    if (isWin === null) return 50 // Center position
    return isWin ? 85 : 15 // Green side (right) or red side (left)
  }

  const position = getPosition()

  return (
    <div className={`relative w-full h-8 ${className}`}>
      {/* Scale Background */}
      <div className="relative w-full h-6 bg-gradient-to-r from-red-500 via-gray-600 to-green-500 rounded-full shadow-inner border border-gray-400/30">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/60 transform -translate-x-1/2 shadow-sm" />
        
        {/* Scale markers */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-400 rounded-full border-2 border-white shadow-sm" />
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full border-2 border-white shadow-sm" />
        
        {/* Dice Indicator */}
        <motion.div
          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10"
          animate={{
            x: `${position}%`,
            scale: isRolling ? [1, 1.2, 1] : 1,
            rotate: isRolling ? [0, 5, -5, 0] : 0,
          }}
          transition={{
            x: {
              duration: isRolling ? 0.5 : 1.2,
              ease: isRolling ? "easeInOut" : "easeOut",
              type: "spring",
              stiffness: 200,
              damping: 20
            },
            scale: {
              duration: 0.3,
              ease: "easeInOut",
              repeat: isRolling ? Infinity : 0,
              repeatType: "reverse"
            },
            rotate: {
              duration: 0.2,
              ease: "easeInOut",
              repeat: isRolling ? Infinity : 0,
              repeatType: "reverse"
            }
          }}
        >
          {/* Dice Icon */}
          <div className={`
            w-8 h-8 rounded-lg shadow-lg border-2 flex items-center justify-center relative overflow-hidden
            ${isWin === true 
              ? 'bg-gradient-to-br from-green-400 to-green-600 border-green-300 shadow-green-500/50' 
              : isWin === false 
              ? 'bg-gradient-to-br from-red-400 to-red-600 border-red-300 shadow-red-500/50'
              : 'bg-gradient-to-br from-gray-500 to-gray-700 border-gray-400 shadow-gray-500/50'
            }
            transition-all duration-500
          `}>
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-lg" />
            <div className="text-white text-xs font-bold relative z-10">
              🎲
            </div>
          </div>
        </motion.div>

        {/* Win/Lose Labels */}
        <div className="absolute -top-6 left-0 text-xs font-semibold text-red-400 drop-shadow-sm">
          LOSE
        </div>
        <div className="absolute -top-6 right-0 text-xs font-semibold text-green-400 drop-shadow-sm">
          WIN
        </div>
      </div>

      {/* Glow effect when not rolling */}
      {!isRolling && isWin !== null && (
        <motion.div
          className={`absolute inset-0 rounded-full ${
            isWin ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 0.6, 0.3, 0.6, 0],
            scale: [1, 1.05, 1, 1.02, 1]
          }}
          transition={{
            duration: 2,
            repeat: 2,
            repeatType: "reverse"
          }}
        />
      )}

      {/* Rolling animation effect */}
      {isRolling && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  )
}

export default SlidingScale
