import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Copy, RefreshCw, ExternalLink } from 'lucide-react'
import { useWalletContext } from '../contexts/WalletContextWrapper'
import { useToast } from './Toast'

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const { 
    userProfile, 
    gameWalletAddress, 
    gameWalletBalance, 
    refreshGameBalance,
    isInitializing 
  } = useWalletContext()
  const { success, error } = useToast()

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      success('Copied to Clipboard', 'Address copied!')
    } catch (err) {
      error('Copy Failed', 'Failed to copy to clipboard')
    }
  }

  const displayName = userProfile?.username || `Player${gameWalletAddress?.slice(-6) || ''}`
  const profilePicture = userProfile?.profilePicture

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-hilo-gray border border-hilo-gray-light rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-hilo-gray-light">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-hilo-gold" />
                Account
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-hilo-gray-light transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Profile</h3>
                <div className="bg-hilo-black/50 rounded-lg p-4 border border-hilo-gold/30">
                  <div className="flex items-center gap-4 mb-4">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-16 h-16 rounded-full border border-hilo-gold/30"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-hilo-gold/20 flex items-center justify-center">
                        <User className="w-8 h-8 text-hilo-gold" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-white">{displayName}</div>
                      <div className="text-sm text-gray-400">
                        {userProfile?.vipTier || 'Bronze'} • {userProfile?.xp || 0} XP
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-gray-400">Games Played</div>
                      <div className="text-white font-medium">{userProfile?.gamesPlayed || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Win Rate</div>
                      <div className="text-white font-medium">
                        {userProfile?.winRate ? `${(userProfile.winRate * 100).toFixed(1)}%` : '0%'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet Section */}
              {gameWalletAddress && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Game Wallet</h3>
                  <div className="bg-hilo-black/50 rounded-lg p-4 border border-hilo-gray-light">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Address</span>
                      <button
                        onClick={() => copyToClipboard(gameWalletAddress)}
                        className="text-hilo-gold hover:text-hilo-gold-dark transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-sm font-mono text-white break-all mb-4">
                      {gameWalletAddress}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Balance</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-hilo-gold">
                          {gameWalletBalance?.toFixed(4) || '0.0000'} SOL
                        </span>
                        <button
                          onClick={refreshGameBalance}
                          disabled={isInitializing}
                          className="text-hilo-gold hover:text-hilo-gold-dark transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${isInitializing ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // In a real app, this would navigate to profile edit
                    alert('Profile editing would open here')
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-hilo-gold text-hilo-black rounded-lg hover:bg-hilo-gold-dark transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Edit Profile</span>
                </button>
                
                <button
                  onClick={() => {
                    window.open(`https://solscan.io/account/${gameWalletAddress}`, '_blank')
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-hilo-gray-light text-white rounded-lg hover:bg-hilo-gray transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="text-xs text-blue-300">
                  <strong>Note:</strong> Your game wallet is automatically generated and managed securely. You can view transactions on Solscan using the external link button.
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AccountModal
