import React from 'react'
import { motion } from 'framer-motion'

interface HiloLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  className?: string
}

/**
 * HILO Logo Component
 * Features gold text, red die, and green glow effects
 * 
 * @param size - Logo size variant
 * @param animated - Whether to show animation effects
 * @param className - Additional CSS classes
 */
export const HiloLogo: React.FC<HiloLogoProps> = ({ 
  size = 'md', 
  animated = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl',
  }

  const dieSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  }

  return (
    <motion.div
      className={`flex items-center gap-3 ${className}`}
      initial={animated ? { opacity: 0, y: -20 } : false}
      animate={animated ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {/* Red Die with Green Glow */}
      <motion.div
        className={`${dieSizeClasses[size]} relative`}
        animate={animated ? {
          rotate: [0, 5, -5, 0],
          scale: [1, 1.1, 1],
        } : false}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      >
        <span className="text-hilo-red drop-shadow-lg">🎲</span>
        {animated && (
          <motion.div
            className="absolute inset-0 text-hilo-green opacity-30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            🎲
          </motion.div>
        )}
      </motion.div>

      {/* HILO Text */}
      <motion.div
        className={`${sizeClasses[size]} font-display font-bold`}
        animate={animated ? {
          textShadow: [
            '0 0 10px rgba(255, 215, 0, 0.5)',
            '0 0 20px rgba(255, 215, 0, 0.8)',
            '0 0 10px rgba(255, 215, 0, 0.5)',
          ],
        } : false}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      >
        <span className="bg-gradient-to-r from-hilo-gold via-yellow-300 to-hilo-gold bg-clip-text text-transparent">
          HILO
        </span>
      </motion.div>

      {/* Subtitle for larger sizes */}
      {(size === 'lg' || size === 'xl') && (
        <motion.div
          className="text-hilo-gold/70 text-sm font-medium"
          initial={animated ? { opacity: 0 } : false}
          animate={animated ? { opacity: 1 } : false}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          CASINO
        </motion.div>
      )}
    </motion.div>
  )
}

export default HiloLogo
