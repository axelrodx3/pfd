import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { formatCurrency } from '../lib/utils'
import { mockAPI } from '../lib/api'

interface WalletButtonProps {
  className?: string
}

/**
 * Enhanced Wallet Connect Button Component
 * Shows connect/disconnect state with mock wallet functionality, VIP tier, faucet, and HILO token balance
 * 
 * @param className - Additional CSS classes
 */
export const WalletButton: React.FC<WalletButtonProps> = ({ className = '' }) => {
  const { 
    isConnected, 
    walletAddress, 
    balance, 
    hiloTokens,
    vipTier,
    level,
    connectWallet, 
    disconnectWallet,
    claimFaucet
  } = useGameStore()

  const [isClaiming, setIsClaiming] = useState(false)
  const [showFaucet, setShowFaucet] = useState(false)

  const handleClick = () => {
    if (isConnected) {
      disconnectWallet()
    } else {
      connectWallet()
    }
  }

  const handleClaimFaucet = async () => {
    setIsClaiming(true)
    try {
      const result = await mockAPI.claimFaucet()
      if (result.success) {
        claimFaucet()
        setShowFaucet(false)
      }
    } catch (error) {
      console.error('Failed to claim faucet:', error)
      // Show error message to user
      alert(error instanceof Error ? error.message : 'Failed to claim faucet')
    } finally {
      setIsClaiming(false)
    }
  }

  const shortAddress = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : ''

  const getVIPTierColor = (tier: string) => {
    switch (tier) {
      case 'Diamond': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      case 'Gold': return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
      case 'Silver': return 'bg-gradient-to-r from-gray-300 to-gray-500 text-black'
      default: return 'bg-gradient-to-r from-orange-400 to-orange-600 text-black'
    }
  }

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={handleClick}
        className={`
          relative px-4 py-2 rounded-lg font-semibold transition-all duration-300
          ${isConnected 
            ? 'bg-hilo-green text-white hover:bg-hilo-green-dark hover:shadow-hilo-glow-green' 
            : 'bg-hilo-gold text-hilo-black hover:bg-hilo-gold-dark hover:shadow-hilo-glow-strong'
          }
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

        {/* HILO Token Balance Display */}
        {isConnected && (
          <motion.div
            className="absolute -top-2 -right-2 bg-hilo-red text-white text-xs px-2 py-1 rounded-full font-bold"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            {hiloTokens.toLocaleString()} HILO
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

      {/* VIP Badge and Faucet Button */}
      {isConnected && (
        <motion.div
          className="absolute top-12 left-0 flex items-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* VIP Badge */}
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${getVIPTierColor(vipTier)}`}>
            {vipTier}
          </div>
          
          {/* Level Badge */}
          <div className="px-2 py-1 bg-hilo-gold text-black text-xs font-bold rounded-full">
            Lv.{level}
          </div>

          {/* Faucet Button */}
          <motion.button
            onClick={() => setShowFaucet(!showFaucet)}
            className="px-3 py-1 bg-hilo-green text-white text-xs rounded-lg hover:bg-hilo-green/80 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            💧 Faucet
          </motion.button>
        </motion.div>
      )}

      {/* Faucet Modal */}
      {showFaucet && (
        <motion.div
          className="absolute top-20 left-0 bg-hilo-black border border-hilo-gold rounded-lg p-4 shadow-lg z-50 min-w-64"
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-center">
            <h3 className="text-hilo-gold font-bold mb-2">Free HILO Tokens</h3>
            <p className="text-sm text-gray-300 mb-4">
              Claim 1,000 HILO tokens to start playing!
            </p>
            <div className="space-y-2">
              <motion.button
                onClick={handleClaimFaucet}
                disabled={isClaiming}
                className="w-full px-4 py-2 bg-hilo-green text-white rounded-lg hover:bg-hilo-green/80 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isClaiming ? 'Claiming...' : 'Claim 1,000 HILO'}
              </motion.button>
              <motion.button
                onClick={() => setShowFaucet(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default WalletButton
