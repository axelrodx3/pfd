import React, { useState } from 'react'
import { useWalletContext } from '../contexts/WalletContext'
import { PublicKey } from '@solana/web3.js'

interface SOLTransferProps {
  onTransferSuccess?: (signature: string) => void
  onTransferError?: (error: string) => void
}

const SOLTransfer: React.FC<SOLTransferProps> = ({
  onTransferSuccess,
  onTransferError,
}) => {
  const { publicKey, connected, sendTransaction } = useWalletContext()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!connected || !publicKey) {
      setError('Please connect your wallet first')
      return
    }

    if (!recipient.trim()) {
      setError('Please enter recipient address')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      // Validate recipient address
      try {
        new PublicKey(recipient)
      } catch {
        setError('Invalid recipient address')
        return
      }

      const signature = await sendTransaction(recipient, parseFloat(amount))

      setSuccess(`Transaction successful! Signature: ${signature}`)
      setRecipient('')
      setAmount('')

      onTransferSuccess?.(signature)
    } catch (err: any) {
      const errorMessage = err.message || 'Transfer failed'
      setError(errorMessage)
      onTransferError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestWithdrawal = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      // Request withdrawal from website wallet
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('solana_auth_token')}`,
        },
        body: JSON.stringify({
          recipient: publicKey.toString(),
          amount: parseFloat(amount),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Withdrawal request failed')
      }

      const result = await response.json()
      setSuccess(
        `Withdrawal request submitted! Transaction: ${result.signature}`
      )
      setAmount('')
    } catch (err: any) {
      const errorMessage = err.message || 'Withdrawal request failed'
      setError(errorMessage)
      onTransferError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          SOL Transfer
        </h2>
        <div className="text-center">
          <p className="text-gray-300 mb-4">
            Please connect your wallet to send SOL
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">
        SOL Transfer
      </h2>

      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="block text-white text-sm font-semibold mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            placeholder="Enter Solana address"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-white text-sm font-semibold mb-2">
            Amount (SOL)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.001"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <button
            type="submit"
            disabled={loading || !recipient || !amount}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Sending...' : 'Send SOL'}
          </button>

          <button
            type="button"
            onClick={handleRequestWithdrawal}
            disabled={loading || !amount}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : 'Request Withdrawal'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-900/50 border border-green-500 rounded-lg">
          <p className="text-green-300 text-sm">{success}</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-800 rounded-lg">
        <h3 className="text-white font-semibold mb-2">Transfer Options:</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>
            • <strong>Send SOL:</strong> Transfer from your wallet to another
            address
          </li>
          <li>
            • <strong>Request Withdrawal:</strong> Request SOL from website
            wallet to your address
          </li>
        </ul>
      </div>
    </div>
  )
}

export default SOLTransfer
