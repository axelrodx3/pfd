import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWalletContext } from '../contexts/WalletContextWrapper'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { formatCurrency } from '../lib/utils'
import { useToast } from './Toast'

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
  const { publicKey, connected, connecting, connect, disconnect, getBalance, refreshGameBalance } = useWalletContext()

  const [balance, setBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { success, error } = useToast()

  // Update balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      updateBalance()
    } else {
      setBalance(0)
    }
  }, [connected, publicKey])

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dropdownRef.current) return
      if (dropdownRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const updateBalance = async () => {
    try {
      setIsLoading(true)
      const currentBalance = await getBalance()
      setBalance(currentBalance)
      // Also refresh in-app game balance dropdown so values stay in sync
      try { await refreshGameBalance() } catch {}
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
    <div className={`relative ${className}`} ref={dropdownRef}>
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
        <div className="relative">
          <motion.button
            onClick={() => setOpen(v => !v)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 px-3 py-2 bg-hilo-gray border border-hilo-gray-light rounded-lg hover:bg-hilo-gold/10 hover:border-hilo-gold/30 transition-colors text-sm text-white"
            title="Wallet menu"
          >
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-hilo-green" />
            <span className="font-medium">{shortAddress}</span>
            <span className="text-gray-400">▾</span>
          </motion.button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-64 bg-hilo-gray border border-hilo-gray-light rounded-xl shadow-2xl z-[200]"
              >
                <div className="py-2">
                  <div className="px-4 py-3 border-b border-hilo-gray-light">
                    <div className="text-xs text-gray-400">Connected</div>
                    <div className="text-sm font-mono text-white break-all">{publicKey?.toString()}</div>
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(publicKey?.toString() || '')
                        success('Copied', 'Wallet address copied to clipboard')
                        setOpen(false)
                      } catch {
                        error('Copy Failed', 'Unable to copy wallet address')
                      }
                    }}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors"
                  >
                    Copy Address
                  </button>

                  <button
                    onClick={() => {
                      const pk = publicKey?.toString()
                      if (pk) window.open(`https://solscan.io/account/${pk}`, '_blank')
                      setOpen(false)
                    }}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors"
                  >
                    View on Explorer
                  </button>

                  <button
                    onClick={updateBalance}
                    disabled={isLoading}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Refreshing...' : 'Refresh Balance'}
                  </button>

                  <div className="border-t border-hilo-gray-light my-2" />

                  <button
                    onClick={async () => {
                      try {
                        await disconnect()
                        setOpen(false)
                      } catch {}
                    }}
                    className="w-full px-4 py-3 text-left text-red-400 hover:text-white hover:bg-red-500/10 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default RealWalletButton
