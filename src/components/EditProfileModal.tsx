import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, User, Image as ImageIcon, Check, AlertCircle, Calendar } from 'lucide-react'
import { useWalletContext } from '../contexts/WalletContextWrapper'
import { useToast } from './Toast'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose
}) => {
  const { userProfile, updateProfile } = useWalletContext()
  const { success, error } = useToast()
  const [username, setUsername] = useState(userProfile?.username || '')
  const [profilePicture, setProfilePicture] = useState<string | null>(userProfile?.profilePicture || null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if username was changed recently (within a week)
  const canChangeUsername = () => {
    if (!userProfile?.lastUsernameChange) return true
    const oneWeek = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    return Date.now() - userProfile.lastUsernameChange > oneWeek
  }

  const daysUntilUsernameChange = () => {
    if (!userProfile?.lastUsernameChange) return 0
    const oneWeek = 7 * 24 * 60 * 60 * 1000
    const timeLeft = oneWeek - (Date.now() - userProfile.lastUsernameChange)
    return Math.ceil(timeLeft / (24 * 60 * 60 * 1000))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image must be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePicture(e.target?.result as string)
        setErrorMessage('')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    
    if (!username.trim()) {
      setErrorMessage('Username is required')
      return
    }

    if (username.length < 3 || username.length > 20) {
      setErrorMessage('Username must be between 3 and 20 characters')
      return
    }

    // Check if username is being changed and if it's allowed
    const usernameChanged = username !== userProfile?.username
    if (usernameChanged && !canChangeUsername()) {
      setErrorMessage(`You can only change your username once per week. ${daysUntilUsernameChange()} days remaining.`)
      return
    }

    setIsUpdating(true)
    try {
      const updates: any = {
        profilePicture: profilePicture || undefined
      }

      // Only update username if it changed and is allowed
      if (usernameChanged && canChangeUsername()) {
        updates.username = username
        updates.lastUsernameChange = Date.now()
      }

      await updateProfile(updates)
      success('Profile Updated', 'Your profile has been updated successfully!')
      onClose()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update profile'
      setErrorMessage(errorMsg)
      error('Update Failed', errorMsg)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClose = () => {
    setUsername(userProfile?.username || '')
    setProfilePicture(userProfile?.profilePicture || null)
    setErrorMessage('')
    onClose()
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
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-hilo-gray border border-hilo-gray-light rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-hilo-gray-light">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-hilo-gold/20 rounded-lg">
                  <User className="w-6 h-6 text-hilo-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                  <p className="text-sm text-gray-400">Update your profile information</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isUpdating}
                className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-hilo-gray-light border-2 border-hilo-gray-light overflow-hidden">
                        {profilePicture ? (
                          <img
                            src={profilePicture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
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
                        className="flex items-center gap-2 px-4 py-2 bg-hilo-gold text-hilo-black rounded-lg hover:bg-hilo-gold-dark transition-colors font-medium"
                      >
                        <Upload className="w-4 h-4" />
                        Choose Image
                      </button>
                      <p className="text-xs text-gray-400 mt-1">
                        Max 5MB, JPG/PNG recommended
                      </p>
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-hilo-black border border-hilo-gray-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-hilo-gold focus:ring-1 focus:ring-hilo-gold"
                      placeholder="Enter your username"
                      disabled={isUpdating}
                      maxLength={20}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Username change limit warning */}
                  {!canChangeUsername() && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                      <Calendar className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <p className="text-xs text-yellow-300">
                        Username changes are limited to once per week. {daysUntilUsernameChange()} days remaining.
                      </p>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-300">{errorMessage}</p>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-3 bg-hilo-gray-light text-white rounded-lg hover:bg-hilo-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || !username.trim()}
                    className="flex-1 px-4 py-3 bg-hilo-gold text-hilo-black rounded-lg hover:bg-hilo-gold-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-hilo-black border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Update Profile
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
                <span>Profile changes are saved automatically</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default EditProfileModal



