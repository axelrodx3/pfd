import React from 'react'
import WalletContextProvider, { useWalletContext as realUseWalletContext } from './WalletContext'

/**
 * Wallet Context Wrapper - Attempts to load real wallet context, falls back to safe context
 */
export const WalletContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // On server, just render children (no wallet ops). On client, use real wallet provider only.
  if (typeof window === 'undefined') {
    return <>{children}</>
  }
  return <WalletContextProvider>{children}</WalletContextProvider>
}

// Export a hook that works with either context
export const useWalletContext = () => {
  return realUseWalletContext()
}
