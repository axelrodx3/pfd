import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowUpRight, ArrowDownLeft, Wallet, Coins, RefreshCw } from 'lucide-react'
import { useWalletContext } from '../contexts/WalletContextWrapper'

interface WalletTransferModalProps {
  isOpen: boolean
  onClose: () => void
}

type TransferType = 'deposit' | 'withdraw'

export const WalletTransferModal: React.FC<WalletTransferModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    gameWalletBalance, 
    refreshGameBalance 
  } = useWalletContext()
  
  // Check if transfer methods are available (they might not be in safe context)
  const context = useWalletContext() as any
  const depositToGame = context.depositToGame
  const withdrawFromGame = context.withdrawFromGame
  const isDepositing = context.isDepositing || false
  const isWithdrawing = context.isWithdrawing || false
  
  const [transferType, setTransferType] = useState<TransferType>('deposit')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const numAmount = parseFloat(amount)
    
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (transferType === 'withdraw' && numAmount > gameWalletBalance) {
      setError('Insufficient game wallet balance')
      return
    }

    setError('')

    try {
      if (transferType === 'deposit') {
        if (depositToGame) {
          await depositToGame(numAmount)
        } else {
          setError('Deposit functionality not available in demo mode')
          return
        }
      } else {
        if (withdrawFromGame) {
          await withdrawFromGame(numAmount)
        } else {
          setError('Withdrawal functionality not available in demo mode')
          return
        }
      }
      
      setAmount('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed')
    }
  }

  const handleClose = () => {
    setAmount('')
    setError('')
    onClose()
  }

  const isProcessing = isDepositing || isWithdrawing

  const quickAmounts = transferType === 'deposit' ? [10, 50, 100, 500] : [25, 50, 100, gameWalletBalance]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-hilo-gray border border-hilo-gray-light rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-hilo-gray-light">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  transferType === 'deposit' ? 'bg-green-500/20' : 'bg-blue-500/20'
                }`}>
                  {transferType === 'deposit' ? (
                    <ArrowDownLeft className="w-6 h-6 text-green-400" />
                  ) : (
                    <ArrowUpRight className="w-6 h-6 text-blue-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {transferType === 'deposit' ? 'Deposit to Game' : 'Withdraw from Game'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {transferType === 'deposit' 
                      ? 'Transfer HILO from your connected wallet to your game wallet'
                      : 'Transfer HILO from your game wallet to your connected wallet'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Transfer Type Selector */}
              <div className="flex bg-hilo-black rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setTransferType('deposit')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    transferType === 'deposit'
                      ? 'bg-green-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  disabled={isProcessing}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span className="font-medium">Deposit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTransferType('withdraw')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    transferType === 'withdraw'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  disabled={isProcessing}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="font-medium">Withdraw</span>
                </button>
              </div>

              {/* Balance Display */}
              <div className="bg-hilo-black/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-hilo-gold" />
                    <span className="text-sm text-gray-400">Game Wallet Balance</span>
                  </div>
                  <button
                    onClick={refreshGameBalance}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Coins className="w-6 h-6 text-hilo-gold" />
                  <span className="text-2xl font-bold text-white">
                    {gameWalletBalance.toLocaleString()}
                  </span>
                  <span className="text-lg text-hilo-gold">HILO</span>
                </div>
              </div>

              {/* Transfer Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Amount Input */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-white mb-2">
                    Amount (HILO)
                  </label>
                  <div className="relative">
                    <input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 bg-hilo-black border border-hilo-gray-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-hilo-gold focus:ring-1 focus:ring-hilo-gold"
                      disabled={isProcessing}
                      min="0.01"
                      step="0.01"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-gray-400">HILO</span>
                    </div>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Quick Amounts
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {quickAmounts.map((quickAmount) => (
                      <button
                        key={quickAmount}
                        type="button"
                        onClick={() => setAmount(quickAmount.toString())}
                        className="px-3 py-2 bg-hilo-gray-light text-white rounded-lg hover:bg-hilo-gold hover:text-hilo-black transition-colors text-sm font-medium disabled:opacity-50"
                        disabled={isProcessing || (transferType === 'withdraw' && quickAmount > gameWalletBalance)}
                      >
                        {transferType === 'withdraw' && quickAmount === gameWalletBalance ? 'All' : quickAmount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg"
                  >
                    <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-hilo-gray-light text-white rounded-lg hover:bg-hilo-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                    className="flex-1 px-4 py-3 bg-hilo-gold text-hilo-black rounded-lg hover:bg-hilo-gold-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-hilo-black border-t-transparent rounded-full animate-spin" />
                        {transferType === 'deposit' ? 'Depositing...' : 'Withdrawing...'}
                      </>
                    ) : (
                      <>
                        {transferType === 'deposit' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                        {transferType === 'deposit' ? 'Deposit' : 'Withdraw'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-hilo-gray-light">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span>Transactions are processed securely on the blockchain</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default WalletTransferModal
