import React from 'react'
import { SafeWalletProvider, useSafeWalletContext } from './SafeWalletContext'
import WalletContextProvider, { useWalletContext as realUseWalletContext } from './WalletContext'

/**
 * Wallet Context Wrapper - Attempts to load real wallet context, falls back to safe context
 */
export const WalletContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always provide Safe context as a base, and layer real wallet provider when in browser.
  if (typeof window === 'undefined') {
    return <SafeWalletProvider>{children}</SafeWalletProvider>
  }
  return (
    <SafeWalletProvider>
      <WalletContextProvider>{children}</WalletContextProvider>
    </SafeWalletProvider>
  )
}

// Export a hook that works with either context
export const useWalletContext = () => {
  try {
    return realUseWalletContext()
  } catch (error) {
    return useSafeWalletContext()
  }
}
