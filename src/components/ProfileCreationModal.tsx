import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, User, Image as ImageIcon, Check, AlertCircle } from 'lucide-react'
import { useWalletContext } from '../contexts/WalletContextWrapper'

interface ProfileCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export const ProfileCreationModal: React.FC<ProfileCreationModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const { createProfile, userProfile } = useWalletContext()
  const [username, setUsername] = useState('')
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePicture(e.target?.result as string)
        setError('')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      setError('Username is required')
      return
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long')
      return
    }

    if (username.length > 20) {
      setError('Username must be less than 20 characters')
      return
    }

    // Validate username format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      const success = await createProfile(username.trim(), profilePicture || undefined)
      if (success) {
        onComplete()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      setUsername('')
      setProfilePicture(null)
      setError('')
      onClose()
    }
  }

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
                <div className="p-2 bg-hilo-gold/20 rounded-lg">
                  <User className="w-6 h-6 text-hilo-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Create Your Profile</h2>
                  <p className="text-sm text-gray-400">Set up your gaming identity</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isCreating}
                className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Profile Picture (Optional)
                </label>
                <div className="flex items-center gap-4">
                  {/* Profile Picture Preview */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-hilo-black border-2 border-hilo-gray-light flex items-center justify-center overflow-hidden">
                      {profilePicture ? (
                        <img
                          src={profilePicture}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    {profilePicture && (
                      <button
                        type="button"
                        onClick={() => setProfilePicture(null)}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-hilo-gold/20 text-hilo-gold rounded-lg hover:bg-hilo-gold/30 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {profilePicture ? 'Change' : 'Upload'}
                      </span>
                    </button>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                  Username *
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full px-4 py-3 bg-hilo-black border border-hilo-gray-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-hilo-gold focus:ring-1 focus:ring-hilo-gold"
                    disabled={isCreating}
                    maxLength={20}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {username && (
                      <div className="flex items-center gap-1">
                        {username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username) ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-400">
                    3-20 characters, letters, numbers, and underscores only
                  </p>
                  <span className="text-xs text-gray-400">
                    {username.length}/20
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isCreating}
                  className="flex-1 px-4 py-3 bg-hilo-gray-light text-white rounded-lg hover:bg-hilo-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !username.trim() || username.length < 3}
                  className="flex-1 px-4 py-3 bg-hilo-gold text-hilo-black rounded-lg hover:bg-hilo-gold-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-hilo-black border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Create Profile
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-hilo-gray-light">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>Your profile data is stored securely and locally</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ProfileCreationModal
