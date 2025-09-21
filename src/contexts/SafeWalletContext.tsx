import * as React from 'react'
import { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react'
import { useToast } from '../components/Toast'

/**
 * Safe Wallet Context - Fallback when Solana wallet adapters fail
 * Provides a mock wallet context that doesn't crash the app
 */
interface SafeWalletContextType {
  publicKey: any
  connected: boolean
  connecting: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  getBalance: () => Promise<number>
  gameWallet: any
  gameWalletAddress: string | null
  gameWalletBalance: number
  refreshGameBalance: () => Promise<void>
  walletMapping: any
  userProfile: any
  isInitializing: boolean
}

const SafeWalletContext = createContext<SafeWalletContextType | null>(null)

export const SafeWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [gameWalletBalance, setGameWalletBalance] = useState(0)
  const [isInitializing, setIsInitializing] = useState(false)
  const { success, error } = useToast()

  const connect = useCallback(async () => {
    setConnecting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setConnected(true)
      success('Wallet Connected', 'Mock wallet connected successfully')
    } catch (err) {
      error('Connection Failed', 'Failed to connect wallet')
    } finally {
      setConnecting(false)
    }
  }, [success, error])

  const disconnect = useCallback(async () => {
    try {
      setConnected(false)
      success('Wallet Disconnected', 'Wallet disconnected successfully')
    } catch (err) {
      error('Disconnect Failed', 'Failed to disconnect wallet')
    }
  }, [success, error])

  const getBalance = useCallback(async (): Promise<number> => {
    return 1.5 // Mock balance
  }, [])

  const refreshGameBalance = useCallback(async () => {
    setGameWalletBalance(1.5)
  }, [])

  const contextValue: SafeWalletContextType = {
    publicKey: null,
    connected,
    connecting,
    connect,
    disconnect,
    getBalance,
    gameWallet: null,
    gameWalletAddress: null,
    gameWalletBalance,
    refreshGameBalance,
    walletMapping: null,
    userProfile: null,
    isInitializing,
  }

  return (
    <SafeWalletContext.Provider value={contextValue}>
      {children}
    </SafeWalletContext.Provider>
  )
}

export const useSafeWalletContext = () => {
  const context = useContext(SafeWalletContext)
  if (!context) {
    throw new Error('useSafeWalletContext must be used within SafeWalletProvider')
  }
  return context
}
