import React, { useState, useEffect } from 'react'
import { useWalletContext } from '../contexts/WalletContextWrapper'
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui'
import { PublicKey } from '@solana/web3.js'
import QRCode from 'qrcode-generator'

interface SolanaWalletProps {
  onAuthSuccess?: (publicKey: string, signature: string) => void
  onAuthError?: (error: string) => void
}

const SolanaWallet: React.FC<SolanaWalletProps> = ({
  onAuthSuccess,
  onAuthError,
}) => {
  const {
    publicKey,
    connected,
    connecting,
    connect,
    disconnect,
    getBalance,
    signMessage,
  } = useWalletContext()

  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [authStep, setAuthStep] = useState<
    'connect' | 'sign' | 'authenticated'
  >('connect')

  // Update balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      updateBalance()
      generateQRCode()
    } else {
      setBalance(0)
      setQrCodeDataUrl(null)
      setAuthStep('connect')
    }
  }, [connected, publicKey])

  const updateBalance = async () => {
    try {
      const currentBalance = await getBalance()
      setBalance(currentBalance)
      setError(null) // Clear any previous errors
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching balance:', err)
      }
      // Show 0 for failed balance fetches - no mock balances
      setBalance(0)
    }
  }

  const generateQRCode = () => {
    if (!publicKey) return

    try {
      const qr = QRCode(0, 'M')
      qr.addData(publicKey.toString())
      qr.make()

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const cellSize = 8
      const margin = 16

      canvas.width = qr.getModuleCount() * cellSize + margin * 2
      canvas.height = qr.getModuleCount() * cellSize + margin * 2

      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.fillStyle = '#000000'
        for (let row = 0; row < qr.getModuleCount(); row++) {
          for (let col = 0; col < qr.getModuleCount(); col++) {
            if (qr.isDark(row, col)) {
              ctx.fillRect(
                col * cellSize + margin,
                row * cellSize + margin,
                cellSize,
                cellSize
              )
            }
          }
        }
      }

      setQrCodeDataUrl(canvas.toDataURL())
    } catch (err) {
      console.error('Error generating QR code:', err)
    }
  }

  const handleConnect = async () => {
    try {
      setLoading(true)
      setError(null)
      await connect()
      setAuthStep('sign')
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet')
      onAuthError?.(err.message || 'Failed to connect wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleSignMessage = async () => {
    if (!publicKey) return

    try {
      setLoading(true)
      setError(null)

      // Request server-generated nonce and message
      const nonceResp = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ publicKey: publicKey.toString() }),
      })
      if (!nonceResp.ok) {
        throw new Error('Failed to initialize authentication')
      }
      const { nonce, message } = await nonceResp.json()

      // Sign server-provided message
      const signature = await signMessage(message)
      const signatureBase64 = Buffer.from(signature).toString('base64')

      // Verify signature and establish session (HttpOnly cookie)
      const response = await fetch('/api/auth/verify-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          publicKey: publicKey.toString(),
          message,
          signature: signatureBase64,
          nonce,
        }),
      })

      if (!response.ok) {
        throw new Error('Authentication failed')
      }

      setAuthStep('authenticated')
      onAuthSuccess?.(publicKey.toString(), signatureBase64)
    } catch (err: any) {
      setError(err.message || 'Failed to sign message')
      onAuthError?.(err.message || 'Failed to sign message')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      // Session cookie will expire server-side; no client token storage
      setAuthStep('connect')
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect')
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">
        Solana Wallet
      </h2>

      {!connected ? (
        <div className="text-center">
          <div className="mb-4">
            <p className="text-gray-300 text-sm mb-2">
              Connect your wallet to authenticate and manage your SOL
            </p>
            <p className="text-gray-400 text-xs">
              Connecting only proves ownership - no funds can be accessed
              without your confirmation
            </p>
          </div>

          <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !rounded-lg !px-6 !py-3 !text-white !font-semibold" />

          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Wallet Info */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">Wallet Connected</h3>
            <p className="text-gray-300 text-sm break-all">
              {publicKey?.toString()}
            </p>
            <p className="text-yellow-400 font-semibold mt-2">
              Balance: {balance.toFixed(4)} SOL
            </p>
          </div>

          {/* QR Code for Deposit */}
          {qrCodeDataUrl && (
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <h3 className="text-white font-semibold mb-2">Deposit Address</h3>
              <div className="flex justify-center mb-2">
                <img src={qrCodeDataUrl} alt="QR Code" className="w-32 h-32" />
              </div>
              <p className="text-gray-300 text-xs break-all">
                {publicKey?.toString()}
              </p>
            </div>
          )}

          {/* Authentication Steps */}
          {authStep === 'sign' && (
            <div className="bg-blue-900/50 border border-blue-500 rounded-lg p-4">
              <h3 className="text-blue-300 font-semibold mb-2">
                Authentication Required
              </h3>
              <p className="text-blue-200 text-sm mb-4">
                Please sign a message to authenticate your wallet. This proves
                ownership and cannot access your funds.
              </p>
              <button
                onClick={handleSignMessage}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Signing...' : 'Sign Message'}
              </button>
            </div>
          )}

          {authStep === 'authenticated' && (
            <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
              <h3 className="text-green-300 font-semibold mb-2">
                ✅ Authenticated
              </h3>
              <p className="text-green-200 text-sm">
                Your wallet is now authenticated and ready to use.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={updateBalance}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Refresh Balance
            </button>
            <WalletDisconnectButton className="!bg-red-600 hover:!bg-red-700 !rounded-lg !px-4 !py-2" />
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SolanaWallet
