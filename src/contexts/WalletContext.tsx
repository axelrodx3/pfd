import React, { createContext, useContext, useMemo, useCallback } from 'react'
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  clusterApiUrl,
  PublicKey,
  Transaction,
  SystemProgram,
  Connection,
} from '@solana/web3.js'

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css'

interface WalletContextType {
  connection: any
  publicKey: PublicKey | null
  connected: boolean
  connecting: boolean
  wallet: any
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  sendTransaction: (to: string, amount: number) => Promise<string>
  getBalance: () => Promise<number>
  signMessage: (message: string) => Promise<Uint8Array>
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
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  const wallets = useMemo(
    () => [new SolflareWalletAdapter()], // Removed PhantomWalletAdapter as it's now registered as Standard Wallet
    [network]
  )

  const connection = useMemo(
    () => new Connection(endpoint, 'confirmed'),
    [endpoint]
  )

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
    const balance = await connection.getBalance(publicKey)
    return balance / 1e9 // Convert lamports to SOL
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
    connection,
    publicKey,
    connected,
    connecting,
    wallet,
    connect,
    disconnect,
    sendTransaction,
    getBalance,
    signMessage,
  }

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  )
}

export default WalletContextProvider
