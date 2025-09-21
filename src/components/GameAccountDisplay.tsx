import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWalletContext } from '../contexts/WalletContextWrapper'
import { Copy, RefreshCw, ChevronDown, Wallet, ArrowUpDown, User } from 'lucide-react'
import { useToast } from './Toast'
import { WalletTransferModal } from './WalletTransferModal'

export const GameAccountDisplay: React.FC = () => {
  const { 
    gameWalletAddress,
    gameWalletBalance,
    userProfile,
    refreshGameBalance,
    isInitializing
  } = useWalletContext()
  const { success, error } = useToast()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      success('Copied to Clipboard', 'Address copied!')
    } catch (err) {
      error('Copy Failed', 'Failed to copy to clipboard')
    }
  }

  if (!gameWalletAddress) {
    return null
  }

  const displayName = userProfile?.username || `Player${gameWalletAddress.slice(-6)}`
  const profilePicture = userProfile?.profilePicture

  return (
    <div className="relative">
      {/* Account Display Button */}
      <motion.button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-hilo-gray border border-hilo-gray-light rounded-lg hover:bg-hilo-gray-light transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={isInitializing}
      >
        {profilePicture ? (
          <img
            src={profilePicture}
            alt="Profile"
            className="w-8 h-8 rounded-full border border-hilo-gold/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-hilo-gold/20 flex items-center justify-center">
            <User className="w-4 h-4 text-hilo-gold" />
          </div>
        )}
        <div className="text-left">
          <div className="text-xs text-gray-400">{displayName}</div>
          <div className="text-sm font-medium text-white">
            {gameWalletAddress.slice(0, 8)}...
          </div>
          <div className="text-xs text-hilo-gold">
            {gameWalletBalance.toFixed(4)} SOL
          </div>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isDropdownOpen ? 'rotate-180' : ''
          }`} 
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 bg-hilo-gray border border-hilo-gray-light rounded-xl shadow-2xl z-50"
          >
            <div className="p-4">
              {/* User Profile */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-white mb-2">Profile</h3>
                <div className="bg-hilo-black/50 rounded-lg p-3 border border-hilo-gold/30">
                  <div className="flex items-center gap-3 mb-3">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-12 h-12 rounded-full border border-hilo-gold/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-hilo-gold/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-hilo-gold" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{displayName}</div>
                      <div className="text-xs text-gray-400">
                        {userProfile?.vipTier || 'Bronze'} • {userProfile?.xp || 0} XP
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Game Wallet</span>
                    <button
                      onClick={() => copyToClipboard(gameWalletAddress)}
                      className="text-hilo-gold hover:text-hilo-gold-dark transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-sm font-mono text-white break-all mb-2">
                    {gameWalletAddress}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Balance</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-hilo-gold">
                        {gameWalletBalance.toFixed(4)} SOL
                      </span>
                      <button
                        onClick={refreshGameBalance}
                        className="text-hilo-gold hover:text-hilo-gold-dark transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-hilo-gold text-hilo-black rounded-lg hover:bg-hilo-gold-dark transition-colors"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="text-sm font-medium">Transfer</span>
                </button>
                <button
                  onClick={refreshGameBalance}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-hilo-gray-light text-white rounded-lg hover:bg-hilo-gray transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="mt-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="text-xs text-blue-300">
                  <strong>Note:</strong> This is your game wallet balance on the Solana blockchain. Use Transfer to move SOL between your connected wallet and game wallet.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Modal */}
      <WalletTransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
      />
    </div>
  )
}

export default GameAccountDisplay
