import * as React from 'react'
import { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react'
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  clusterApiUrl,
  PublicKey,
  Transaction,
  SystemProgram,
  Connection,
  Keypair,
} from '@solana/web3.js'
import { useToast } from '../components/Toast'
import { ProfileCreationModal } from '../components/ProfileCreationModal'
import { walletMappingManager } from '../lib/walletMapping'
import { productionLogger } from '../lib/productionLogger'
// Wallet mapping and profile interfaces
interface WalletMapping {
  id: string
  connectedWalletAddress: string
  gameWalletAddress: string
  encryptedSecretKey: any
  createdAt: number
  lastAccessed: number
  isActive: boolean
  isFrozen: boolean
  withdrawalThrottleUntil?: number
}

interface UserProfile {
  id: string
  connectedWalletAddress: string
  username: string
  profilePicture?: string
  profilePictureType?: 'upload' | 'nft' | 'default'
  joinDate: number
  xp: number
  badges: string[]
  currentStreak: number
  longestStreak: number
  totalWins: number
  totalLosses: number
  totalWagered: number
  vipTier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
  isAdmin: boolean
}

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css'

interface WalletContextType {
  // Connected wallet (Phantom, etc.)
  connection: Connection
  publicKey: PublicKey | null
  connected: boolean
  connecting: boolean
  wallet: any
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<Uint8Array>
  
  // Game wallet (generated for gameplay)
  gameWallet: Keypair | null
  gameWalletAddress: string | null
  gameWalletBalance: number
  walletMapping: WalletMapping | null
  userProfile: UserProfile | null
  
  // Wallet operations
  sendTransaction: (to: string, amount: number) => Promise<string>
  depositToGame: (amount: number) => Promise<string>
  withdrawFromGame: (amount: number) => Promise<string>
  getGameBalance: () => Promise<number>
  getBalance: () => Promise<number>
  refreshGameBalance: () => Promise<void>
  
  // Profile operations
  createProfile: (username: string, profilePicture?: string) => Promise<boolean>
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>
  
  // Loading states
  isInitializing: boolean
  isDepositing: boolean
  isWithdrawing: boolean
}

const WalletContext = createContext<WalletContextType | null>(null)

export const useWalletContext = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider')
  }
  return context
}

const WalletContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  console.log('🔗 WalletContextProvider initializing...')
  productionLogger.logInit('WalletContextProvider')
  
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet
  console.log('🔗 Network set to:', network)

  // You can also provide a custom RPC endpoint with fallbacks
  const endpoint = useMemo(() => {
    // Use a more reliable RPC endpoint
    return 'https://api.devnet.solana.com'
  }, [network])

  const wallets = useMemo(() => {
    console.log('🔗 Initializing wallet adapters...')
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log('🔗 Server-side rendering detected, returning empty wallet adapters')
        return []
      }

      // Initialize Solana wallet adapters with Phantom as priority
      const walletAdapters = [
        new PhantomWalletAdapter(), // Priority wallet
        new SolflareWalletAdapter()
      ]
      
      console.log('🔗 Solana wallet adapters initialized successfully:', walletAdapters.length)
      productionLogger.logWalletInit(true, undefined, 'PhantomWalletAdapter, SolflareWalletAdapter')
      return walletAdapters
    } catch (error) {
      console.error('🔗 Failed to initialize wallet adapters:', error)
      console.error('🔗 Wallet adapter error stack:', error instanceof Error ? error.stack : 'No stack trace')
      productionLogger.logWalletInit(false, error instanceof Error ? error : new Error('Unknown wallet init error'))
      return []
    }
  }, [network])

  const connection = useMemo(() => {
    console.log('🔗 Creating Solana connection to:', endpoint)
    try {
      const conn = new Connection(endpoint, 'confirmed')
      console.log('🔗 Solana connection created successfully')
      
      // Test the connection on initialization
      conn.getVersion().then(version => {
        console.log('🔗 Solana RPC connection successful:', version)
      }).catch(error => {
        console.warn('🔗 Solana RPC connection test failed:', error)
      })
      
      return conn
    } catch (error) {
      console.error('🔗 Failed to create Solana connection:', error)
      console.error('🔗 Connection error stack:', error instanceof Error ? error.stack : 'No stack trace')
      // Return a fallback connection
      console.log('🔗 Using fallback connection')
      return new Connection('https://api.devnet.solana.com', 'confirmed')
    }
  }, [endpoint])

  console.log('🔗 Rendering wallet provider components...')
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <WalletContextInner connection={connection}>
            {children}
          </WalletContextInner>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

const WalletContextInner: React.FC<{
  children: React.ReactNode
  connection: any
}> = ({ children, connection }) => {
  const {
    publicKey,
    connected,
    connecting,
    wallet,
    connect,
    disconnect,
    signMessage: walletSignMessage,
  } = useWallet()

  const { success, error } = useToast()

  // Game wallet state
  const [gameWallet, setGameWallet] = useState<Keypair | null>(null)
  const [gameWalletAddress, setGameWalletAddress] = useState<string | null>(null)
  const [gameWalletBalance, setGameWalletBalance] = useState<number>(0)
  const [walletMapping, setWalletMapping] = useState<WalletMapping | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  
  // Loading states
  const [isInitializing, setIsInitializing] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [showProfileCreation, setShowProfileCreation] = useState(false)

  // Initialize game wallet when connected wallet changes
  useEffect(() => {
    let isMounted = true

    const initializeGameWallet = async () => {
      if (!publicKey || !connected) {
        if (isMounted) {
          setGameWallet(null)
          setGameWalletAddress(null)
          setGameWalletBalance(0)
          setWalletMapping(null)
          setUserProfile(null)
        }
        return
      }

      setIsInitializing(true)
      try {
        const walletAddress = publicKey.toString()
        
        // Get or create game wallet using the wallet manager
        const { gameWallet, mapping, isNew } = await walletMappingManager.getOrCreateGameWallet(walletAddress)
        
        if (isMounted) {
          setGameWallet(gameWallet)
          setGameWalletAddress(gameWallet.publicKey.toString())
          setWalletMapping(mapping)
          
          // Load or create user profile
          let profile = walletMappingManager.getProfile(walletAddress)
          if (!profile) {
            // Show profile creation modal for new users
            setShowProfileCreation(true)
            
            // Create a temporary profile with default username
            profile = walletMappingManager.createOrUpdateProfile({
              connectedWalletAddress: walletAddress,
              username: `Player${walletAddress.slice(-6)}`,
              joinDate: Date.now(),
              xp: 0,
              badges: [],
              currentStreak: 0,
              longestStreak: 0,
              totalWins: 0,
              totalLosses: 0,
              totalWagered: 0,
              vipTier: 'Bronze',
              isAdmin: walletAddress === '11111111111111111111111111111112'
            })
          }
        setUserProfile(profile)
        
        // Fetch REAL balance from the newly created/restored game wallet
        await refreshGameBalance()
        
        if (isNew) {
          success('Welcome!', 'Your game wallet has been created successfully')
        }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize game wallet'
        error('Initialization Error', errorMessage)
        // Reset wallet state on error
        if (isMounted) {
          setGameWallet(null)
          setGameWalletAddress(null)
          setGameWalletBalance(0)
          setWalletMapping(null)
          setUserProfile(null)
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    initializeGameWallet()

    return () => {
      isMounted = false
    }
  }, [publicKey, connected, success, error])

  // Refresh game balance - fetch REAL balance from Solana blockchain
  const refreshGameBalance = useCallback(async () => {
    if (!gameWallet || !gameWalletAddress || !connection) return
    
    try {
      // Validate game wallet address
      if (!gameWalletAddress || gameWalletAddress.length < 32) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Invalid game wallet address:', gameWalletAddress)
        }
        return
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Fetching REAL game wallet balance for:', gameWalletAddress)
      }

      // Fetch REAL balance from Solana blockchain
      let balance: number = 0
      let attempts = 0
      const maxAttempts = 3
      
      while (attempts < maxAttempts) {
        try {
          const balancePromise = connection.getBalance(gameWallet.publicKey)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Balance fetch timeout')), 8000)
          )
          
          const lamportsBalance = await Promise.race([balancePromise, timeoutPromise]) as number
          balance = lamportsBalance / 1e9 // Convert lamports to SOL
          break // Success, exit retry loop
        } catch (retryError) {
          attempts++
          if (process.env.NODE_ENV === 'development') {
            console.log(`Game wallet balance fetch attempt ${attempts} failed:`, retryError)
          }
          
          if (attempts >= maxAttempts) {
            throw retryError
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      setGameWalletBalance(balance)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ REAL game wallet balance: ${balance} SOL`)
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to refresh REAL game balance:', err)
      }
      // Set balance to 0 if we can't fetch it (new wallet will have 0 SOL)
      setGameWalletBalance(0)
    }
  }, [gameWallet, gameWalletAddress, connection])

  // Deposit from connected wallet to game wallet
  const depositToGame = useCallback(async (amount: number): Promise<string> => {
    if (!publicKey || !gameWallet || !wallet) {
      throw new Error('Wallet not properly initialized')
    }

    if (amount <= 0) {
      throw new Error('Invalid deposit amount')
    }

    setIsDepositing(true)
    try {
      // Simulate the transaction
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate network delay
      
      const newBalance = gameWalletBalance + amount
      setGameWalletBalance(newBalance)
      
      success('Deposit Successful', `Deposited ${amount} HILO to your game wallet`)
      
      return 'simulated-deposit-tx-hash'
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Deposit failed'
      error('Deposit Failed', errorMessage)
      throw err
    } finally {
      setIsDepositing(false)
    }
  }, [publicKey, gameWallet, gameWalletBalance, wallet, success, error])

  // Withdraw from game wallet to connected wallet
  const withdrawFromGame = useCallback(async (amount: number): Promise<string> => {
    if (!publicKey || !gameWallet || !wallet) {
      throw new Error('Wallet not properly initialized')
    }

    if (amount <= 0) {
      throw new Error('Invalid withdrawal amount')
    }

    if (amount > gameWalletBalance) {
      throw new Error('Insufficient game wallet balance')
    }

    setIsWithdrawing(true)
    try {
      // Simulate the transaction
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate network delay
      
      const newBalance = gameWalletBalance - amount
      setGameWalletBalance(newBalance)
      
      success('Withdrawal Successful', `Withdrew ${amount} HILO to your connected wallet`)
      
      return 'simulated-withdrawal-tx-hash'
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Withdrawal failed'
      error('Withdrawal Failed', errorMessage)
      throw err
    } finally {
      setIsWithdrawing(false)
    }
  }, [publicKey, gameWallet, gameWalletBalance, wallet, success, error])

  // Create user profile
  const createProfile = useCallback(async (username: string, profilePicture?: string): Promise<boolean> => {
    if (!publicKey) return false

    try {
      // Check username uniqueness
      if (!walletMappingManager.isUsernameUnique(username)) {
        throw new Error('Username is already taken')
      }

      const profile = walletMappingManager.createOrUpdateProfile({
        connectedWalletAddress: publicKey.toString(),
        username,
        profilePicture,
        profilePictureType: profilePicture ? 'upload' : 'default'
      })

      setUserProfile(profile)
      success('Profile Created', `Welcome, ${username}!`)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile'
      error('Profile Creation Failed', errorMessage)
      return false
    }
  }, [publicKey, success, error])

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!publicKey) return false

    try {
      const success = walletMappingManager.updateProfileStats(publicKey.toString(), updates)
      if (success) {
        const updatedProfile = walletMappingManager.getProfile(publicKey.toString())
        if (updatedProfile) {
          setUserProfile(updatedProfile)
          return true
        }
      }
      return false
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update profile:', err)
      }
      return false
    }
  }, [publicKey])

  // Handle profile creation completion
  const handleProfileCreationComplete = useCallback(() => {
    setShowProfileCreation(false)
  }, [])

  const sendTransaction = useCallback(
    async (to: string, amount: number): Promise<string> => {
      if (!publicKey || !wallet) {
        throw new Error('Wallet not connected')
      }

      // Security validation
      if (!to || typeof to !== 'string' || to.length < 32 || to.length > 44) {
        throw new Error('Invalid recipient address')
      }

      if (
        !amount ||
        typeof amount !== 'number' ||
        amount <= 0 ||
        amount > 1000
      ) {
        throw new Error('Invalid amount. Must be between 0 and 1000 SOL')
      }

      // Validate recipient address
      let toPublicKey: PublicKey
      try {
        toPublicKey = new PublicKey(to)
      } catch (error) {
        throw new Error('Invalid recipient address format')
      }

      // Prevent self-transfer
      if (toPublicKey.equals(publicKey)) {
        throw new Error('Cannot send SOL to yourself')
      }

      const lamports = Math.floor(amount * 1e9) // Convert SOL to lamports, ensure integer

      // Check balance before creating transaction
      const balance = await connection.getBalance(publicKey)
      const feeEstimate = 5000 // Estimated transaction fee

      if (balance < lamports + feeEstimate) {
        throw new Error('Insufficient balance for transaction')
      }

      // Create transaction with recent blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash('confirmed')

      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: publicKey,
      }).add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: toPublicKey,
          lamports,
        })
      )

      // Simulate transaction first
      try {
        const simulation = await connection.simulateTransaction(transaction)
        if (simulation.value.err) {
          throw new Error(
            `Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`
          )
        }
      } catch (error: any) {
        throw new Error(`Transaction simulation failed: ${error.message}`)
      }

      // Send transaction
      const signature = await wallet.adapter.sendTransaction(
        transaction,
        connection,
        { skipPreflight: false }
      )

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        'confirmed'
      )

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        )
      }

      return signature
    },
    [publicKey, wallet, connection]
  )

  const getBalance = useCallback(async (): Promise<number> => {
    if (!publicKey) return 0
    
    try {
      // Validate public key before fetching balance
      if (!publicKey.toString() || publicKey.toString().length < 32) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Invalid public key for balance fetch:', publicKey?.toString())
        }
        return 0
      }

      // Check if connection is available
      if (!connection) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Solana connection not available')
        }
        return 0
      }

      // Try to fetch balance with retry mechanism
      if (process.env.NODE_ENV === 'development') {
        console.log('Attempting to fetch balance for:', publicKey.toString())
      }
      
      let balance: number = 0
      let attempts = 0
      const maxAttempts = 3
      
      while (attempts < maxAttempts) {
        try {
          const balancePromise = connection.getBalance(publicKey)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Balance fetch timeout')), 8000)
          )
          
          balance = await Promise.race([balancePromise, timeoutPromise]) as number
          break // Success, exit retry loop
        } catch (retryError) {
          attempts++
          if (process.env.NODE_ENV === 'development') {
            console.log(`Balance fetch attempt ${attempts} failed:`, retryError)
          }
          
          if (attempts >= maxAttempts) {
            throw retryError
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      const solBalance = balance / 1e9 // Convert lamports to SOL
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Successfully fetched balance: ${solBalance} SOL (${balance} lamports)`)
      }
      
      return solBalance
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch connected wallet balance:', err)
      }
      
      // Return 0 for failed balance fetches - no mock balances
      return 0
    }
  }, [publicKey, connection])

  const signMessage = useCallback(
    async (message: string): Promise<Uint8Array> => {
      if (!walletSignMessage) {
        throw new Error('Wallet does not support message signing')
      }
      return await walletSignMessage(new TextEncoder().encode(message))
    },
    [walletSignMessage]
  )

  const contextValue: WalletContextType = {
    // Connected wallet
    connection,
    publicKey,
    connected,
    connecting,
    wallet,
    connect,
    disconnect,
    signMessage,
    
    // Game wallet
    gameWallet,
    gameWalletAddress,
    gameWalletBalance,
    walletMapping,
    userProfile,
    
    // Wallet operations
    sendTransaction,
    depositToGame,
    withdrawFromGame,
    getGameBalance: async () => {
      await refreshGameBalance()
      return gameWalletBalance
    },
    getBalance,
    refreshGameBalance,
    
    // Profile operations
    createProfile,
    updateProfile,
    
    // Loading states
    isInitializing,
    isDepositing,
    isWithdrawing,
  }

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
      
      {/* Profile Creation Modal */}
      <ProfileCreationModal
        isOpen={showProfileCreation}
        onClose={() => setShowProfileCreation(false)}
        onComplete={handleProfileCreationComplete}
      />
    </WalletContext.Provider>
  )
}

export default WalletContextProvider
