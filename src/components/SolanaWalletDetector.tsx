import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface SolanaWalletDetectorProps {
  children: React.ReactNode
}

/**
 * Solana Wallet Detector Component
 * Detects if any Solana wallet is available and shows appropriate UI
 */
export const SolanaWalletDetector: React.FC<SolanaWalletDetectorProps> = ({ children }) => {
  const [hasSolanaWallet, setHasSolanaWallet] = useState<boolean | null>(null)
  const [detectedWallets, setDetectedWallets] = useState<string[]>([])

  useEffect(() => {
    const detectSolanaWallets = () => {
      if (typeof window === 'undefined') {
        setHasSolanaWallet(false)
        return
      }

      const wallets: string[] = []
      
      // Check for Phantom
      if ((window as any).solana?.isPhantom) {
        wallets.push('Phantom')
      }
      
      // Check for Solflare
      if ((window as any).solflare) {
        wallets.push('Solflare')
      }
      
      // Check for other common Solana wallets
      if ((window as any).solana?.isBackpack) {
        wallets.push('Backpack')
      }
      
      if ((window as any).solana?.isGlow) {
        wallets.push('Glow')
      }

      setDetectedWallets(wallets)
      setHasSolanaWallet(wallets.length > 0)
    }

    // Initial detection - immediate
    detectSolanaWallets()

    // Set a timeout to ensure we don't stay in loading state forever
    const timeout = setTimeout(() => {
      if (hasSolanaWallet === null) {
        setHasSolanaWallet(false)
      }
    }, 1000) // 1 second timeout

    // Listen for wallet installation events
    const handleWalletDetected = () => {
      detectSolanaWallets()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('solana#initialized', handleWalletDetected)
      
      // Check periodically for newly installed wallets
      const interval = setInterval(detectSolanaWallets, 2000)

      return () => {
        clearTimeout(timeout)
        window.removeEventListener('solana#initialized', handleWalletDetected)
        clearInterval(interval)
      }
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [hasSolanaWallet])

  // Still detecting - show loading state briefly
  if (hasSolanaWallet === null) {
    return (
      <div className="min-h-screen bg-hilo-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎰</div>
          <div className="text-xl text-hilo-gold">Loading HILO Casino...</div>
          <div className="text-sm text-gray-400 mt-2">Checking for wallet...</div>
        </div>
      </div>
    )
  }

  // No Solana wallet detected - show warning but allow app to continue
  if (!hasSolanaWallet) {
    return (
      <div className="relative">
        {/* Warning Banner */}
        <div className="bg-yellow-900/50 border-b border-yellow-500/50 p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-yellow-300">
            <span>⚠️</span>
            <span className="text-sm">
              No Solana wallet detected. 
              <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200 ml-1">
                Install Phantom
              </a>
              {' '}to connect your wallet.
            </span>
          </div>
        </div>
        {/* App Content */}
        {children}
      </div>
    )
  }

  // Wallet detected, show app normally
  return <>{children}</>
}

export default SolanaWalletDetector
