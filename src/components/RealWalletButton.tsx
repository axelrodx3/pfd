import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWalletContext } from '../contexts/WalletContextWrapper'
import { WalletMultiButton, useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
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
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const { success, error } = useToast()
  const { setVisible } = useWalletModal()
  const [showQR, setShowQR] = useState(false)
  const { wallets, select } = useWallet()
  const menuRef = useRef<HTMLDivElement>(null)

  // Update balance when wallet connects (no toast)
  useEffect(() => {
    if (connected && publicKey) {
      updateBalance(false)
    } else {
      setBalance(0)
    }
  }, [connected, publicKey])

  // Close on Escape and outside click
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (menuRef.current && menuRef.current.contains(target)) return
      if (buttonRef.current && buttonRef.current.contains(target)) return
      setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [open])

  const updateBalance = async (showToast: boolean = false) => {
    try {
      setIsLoading(true)
      const currentBalance = await getBalance()
      setBalance(currentBalance)
      // Also refresh in-app game balance dropdown so values stay in sync
      try { await refreshGameBalance() } catch {}
      // Notify user of success only when explicitly requested
      if (showToast) {
        success('Balance Refreshed', `${formatCurrency(currentBalance)} SOL available`)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching balance:', error)
      }
      // Notify user of failure only when explicitly requested
      if (showToast) {
        error('Refresh Failed', 'Unable to fetch your balance. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const shortAddress = publicKey
    ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`
    : ''

  const updateMenuPosition = () => {
    const btn = buttonRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const left = Math.min(rect.left, window.innerWidth - 272) // 272 ~ w-64 + padding
    const top = rect.bottom + 8
    setMenuPos({ top, left })
  }

  useEffect(() => {
    if (!open) return
    updateMenuPosition()
    const onResize = () => updateMenuPosition()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [open])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {!connected ? (
        <div className="relative" ref={dropdownRef}>
          <motion.button
            onClick={() => setOpen(v => !v)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 px-3 py-2 bg-hilo-gray border border-hilo-gray-light rounded-lg hover:bg-hilo-gold/10 hover:border-hilo-gold/30 transition-colors text-sm text-white"
            title="Wallet menu"
            ref={buttonRef}
          >
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-red-500" />
            <span className="font-medium">Connect Wallet</span>
            <span className="text-gray-400">▾</span>
          </motion.button>

          {/* Using document-level outside click handler instead of overlay */}

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="fixed w-64 bg-hilo-gray border border-hilo-gray-light rounded-xl shadow-2xl z-[200]"
                style={{ top: menuPos.top, left: menuPos.left }}
                onMouseDown={(e) => { e.stopPropagation() }}
                onClick={(e) => { e.stopPropagation() }}
                ref={menuRef}
              >
                <div className="py-2">
                  <button
                    onMouseDown={(e) => { e.stopPropagation() }}
                    onClick={async (e) => {
                      e.stopPropagation()
                      try {
                        // Prefer direct Phantom connect to reliably trigger extension
                        const phantom = wallets?.find(w => w.adapter?.name === 'Phantom')
                        if (phantom && select) {
                          select(phantom.adapter.name)
                          await connect()
                          // close after the adapter handles focus
                          setTimeout(() => setOpen(false), 0)
                          return
                        }
                        if (setVisible) setVisible(true)
                        else await connect()
                      } catch (e) {
                        error('Connection Failed', 'Unable to open wallet. Try Phantom option.')
                      }
                    }}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors"
                  >
                    Connect Wallet
                  </button>
                  <button
                    onMouseDown={(e) => { e.stopPropagation() }}
                    onClick={(e) => { e.stopPropagation(); window.open('https://phantom.app/', '_blank') }}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors"
                  >
                    Get Phantom
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="relative">
          <motion.button
            onClick={() => setOpen(v => !v)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 px-3 py-2 bg-hilo-gray border border-hilo-gray-light rounded-lg hover:bg-hilo-gold/10 hover:border-hilo-gold/30 transition-colors text-sm text-white"
            title="Wallet menu"
            ref={buttonRef}
          >
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-hilo-green" />
            <span className="font-medium">{shortAddress}</span>
            <span className="text-gray-400">▾</span>
          </motion.button>

          {/* Using document-level outside click handler instead of overlay */}

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="fixed w-64 bg-hilo-gray border border-hilo-gray-light rounded-xl shadow-2xl z-[200]"
                style={{ top: menuPos.top, left: menuPos.left }}
                onMouseDown={(e) => { e.stopPropagation() }}
                onClick={(e) => { e.stopPropagation() }}
                ref={menuRef}
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
                    onClick={() => updateBalance(true)}
                    disabled={isLoading}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Refreshing...' : 'Refresh Balance'}
                  </button>

                  <button
                    onClick={() => {
                      try {
                        if (setVisible) setVisible(true)
                        setOpen(false)
                      } catch {}
                    }}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors"
                  >
                    Switch Wallet
                  </button>

                  <button
                    onClick={() => setShowQR(v => !v)}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors"
                  >
                    {showQR ? 'Hide QR Code' : 'Show QR Code'}
                  </button>

                  {showQR && (
                    <div className="px-4 pb-2 flex items-center justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(publicKey?.toString() || '')}`}
                        alt="Wallet QR Code"
                        className="rounded-lg border border-hilo-gray-light bg-white p-1"
                      />
                    </div>
                  )}

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
