import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWalletContext } from '../contexts/WalletContextWrapper'
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui'
import { formatCurrency } from '../lib/utils'

interface RealWalletButtonProps {
  className?: string
}

/**
 * Real Solana Wallet Connect Button Component
 * Uses actual Solana wallet connection instead of mock functionality
 */
export const RealWalletButton: React.FC<RealWalletButtonProps> = ({
  className = '',
}) => {
  const { publicKey, connected, connecting, connect, disconnect, getBalance } = useWalletContext()

  const [balance, setBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)

  // Update balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      updateBalance()
    } else {
      setBalance(0)
    }
  }, [connected, publicKey])

  const updateBalance = async () => {
    try {
      setIsLoading(true)
      const currentBalance = await getBalance()
      setBalance(currentBalance)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching balance:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const shortAddress = publicKey
    ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`
    : ''

  return (
    <div className={`relative ${className}`}>
      {!connected ? (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <WalletMultiButton 
            className="!bg-hilo-gold hover:!bg-hilo-gold-dark !text-hilo-black !font-semibold !px-4 !py-2 !rounded-lg !transition-all !duration-300 hover:!shadow-hilo-glow-strong"
            data-wallet-button="true"
          />
        </motion.div>
      ) : (
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Wallet Info */}
          <div className="flex items-center gap-2 px-3 py-2 bg-hilo-green/10 border border-hilo-green/30 rounded-lg">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              🔓
            </motion.div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-hilo-green">
                Connected
              </span>
              <span className="text-xs text-gray-300">{shortAddress}</span>
            </div>
          </div>

          {/* Balance */}
          <div className="flex items-center gap-2 px-3 py-2 bg-hilo-gold/10 border border-hilo-gold/30 rounded-lg">
            <span className="text-sm font-medium text-hilo-gold">
              {isLoading ? '...' : `${balance.toFixed(4)} SOL`}
            </span>
            <button
              onClick={updateBalance}
              disabled={isLoading}
              className="text-xs text-hilo-gold hover:text-hilo-gold-dark disabled:opacity-50"
              title="Refresh balance"
            >
              {isLoading ? '⟳' : '↻'}
            </button>
          </div>

          {/* Disconnect Button */}
          <WalletDisconnectButton className="!bg-hilo-red hover:!bg-hilo-red-dark !text-white !px-3 !py-2 !rounded-lg !text-sm !font-medium !transition-all !duration-300 hover:!shadow-hilo-glow-red" />
        </motion.div>
      )}
    </div>
  )
}

export default RealWalletButton
