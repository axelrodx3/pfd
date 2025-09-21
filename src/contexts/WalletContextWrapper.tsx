import React from 'react'
import { SafeWalletProvider, useSafeWalletContext } from './SafeWalletContext'
import WalletContextProvider, { useWalletContext as realUseWalletContext } from './WalletContext'

/**
 * Wallet Context Wrapper - Attempts to load real wallet context, falls back to safe context
 */
export const WalletContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('🔄 WalletContextWrapper rendering...')
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.log('🔄 Server-side rendering detected, using safe wallet context')
    return <SafeWalletProvider>{children}</SafeWalletProvider>
  }
  
  // Try to use the real wallet context, fall back to safe context on error
  try {
    console.log('🔄 Attempting to use real wallet context...')
    return <WalletContextProvider>{children}</WalletContextProvider>
  } catch (error) {
    console.error('❌ Failed to load real wallet context, using safe fallback:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return <SafeWalletProvider>{children}</SafeWalletProvider>
  }
}

// Export a hook that works with either context
export const useWalletContext = () => {
  try {
    // Try to use the real wallet context first
    return realUseWalletContext()
  } catch (error) {
    // Fall back to safe context
    return useSafeWalletContext()
  }
}
