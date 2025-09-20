import React from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { formatCurrency } from '../lib/utils'

interface WalletButtonProps {
  className?: string
}

/**
 * Wallet Connect Button Component
 * Shows connect/disconnect state with mock wallet functionality
 * 
 * @param className - Additional CSS classes
 */
export const WalletButton: React.FC<WalletButtonProps> = ({ className = '' }) => {
  const { 
    isConnected, 
    walletAddress, 
    balance, 
    connectWallet, 
    disconnectWallet 
  } = useGameStore()

  const handleClick = () => {
    if (isConnected) {
      disconnectWallet()
    } else {
      connectWallet()
    }
  }

  const shortAddress = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : ''

  return (
    <motion.button
      onClick={handleClick}
      className={`
        relative px-4 py-2 rounded-lg font-semibold transition-all duration-300
        ${isConnected 
          ? 'bg-hilo-green text-white hover:bg-hilo-green-dark hover:shadow-hilo-glow-green' 
          : 'bg-hilo-gold text-hilo-black hover:bg-hilo-gold-dark hover:shadow-hilo-glow-strong'
        }
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2">
        {/* Wallet Icon */}
        <motion.div
          animate={isConnected ? { rotate: [0, 10, -10, 0] } : false}
          transition={{ duration: 0.5 }}
        >
          {isConnected ? '🔓' : '🔒'}
        </motion.div>

        {/* Button Text */}
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">
            {isConnected ? 'Connected' : 'Connect Wallet'}
          </span>
          {isConnected && (
            <motion.span 
              className="text-xs opacity-75"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 0.75, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {shortAddress}
            </motion.span>
          )}
        </div>
      </div>

      {/* Balance Display */}
      {isConnected && (
        <motion.div
          className="absolute -top-2 -right-2 bg-hilo-red text-white text-xs px-2 py-1 rounded-full font-bold"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          {formatCurrency(balance)}
        </motion.div>
      )}

      {/* Glow Effect */}
      {isConnected && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-hilo-green opacity-20"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      )}
    </motion.button>
  )
}

export default WalletButton
