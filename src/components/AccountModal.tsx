import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from './Modal'
import { X, User, Copy, RefreshCw, ExternalLink, Edit, Share2 } from 'lucide-react'
import { useWalletContext } from '../contexts/WalletContextWrapper'
import { useToast } from './Toast'
import { EditProfileModal } from './EditProfileModal'

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
  const [showEditProfile, setShowEditProfile] = useState(false)

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

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
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" title="Account">
        <div className="max-h-[70vh] overflow-y-auto">
            {/* Header */}
            <div className="hidden" />

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
                    {/* Removed inline Edit button to focus on the main Edit Profile action below */}
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
                    setShowEditProfile(true)
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-hilo-gold text-hilo-black rounded-lg hover:bg-hilo-gold-dark transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Edit Profile</span>
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      const shareUrl = gameWalletAddress
                        ? `https://solscan.io/account/${gameWalletAddress}`
                        : window.location.origin
                      const shareData = {
                        title: 'HILO Casino',
                        text: 'Check out my game wallet on HILO Casino',
                        url: shareUrl,
                      } as any
                      if (navigator.share && typeof navigator.share === 'function') {
                        await navigator.share(shareData)
                        success('Shared', 'Share sheet opened')
                      } else {
                        await navigator.clipboard.writeText(shareUrl)
                        success('Link Copied', 'Wallet link copied to clipboard')
                      }
                    } catch (e) {
                      error('Share Failed', 'Unable to share at the moment')
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-hilo-gray-light text-white rounded-lg hover:bg-hilo-gray transition-colors"
                  title="Share wallet link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="text-xs text-blue-300">
                  <strong>Note:</strong> Your game wallet is automatically generated and managed securely. You can view transactions on Solscan using the external link button.
                </div>
              </div>
            </div>
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
    </>
  )
}

export default AccountModal
