import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWalletContext } from '../contexts/WalletContextWrapper'
import { walletMappingManager } from '../lib/walletMapping'
import { 
  X, 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Copy,
  Search,
  Crown,
  Zap
} from 'lucide-react'
import { useToast } from './Toast'

interface AdminPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface WalletMapping {
  id: string
  connectedWalletAddress: string
  gameWalletAddress: string
  createdAt: number
  isFrozen: boolean
  withdrawalThrottleUntil?: number
}

interface UserProfile {
  id: string
  connectedWalletAddress: string
  username: string
  joinDate: number
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const { userProfile } = useWalletContext()
  const { success, error } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMapping, setSelectedMapping] = useState<WalletMapping | null>(null)
  const [throttleDuration, setThrottleDuration] = useState(24) // hours
  const [isLoading, setIsLoading] = useState(false)

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Check if user is admin
  if (!userProfile?.isAdmin) {
    return null
  }

  // Demo data - in production, this would come from API
  const mappings: WalletMapping[] = [
    {
      id: 'demo-1',
      connectedWalletAddress: '11111111111111111111111111111112',
      gameWalletAddress: '22222222222222222222222222222223',
      createdAt: Date.now() - 86400000, // 1 day ago
      isFrozen: false
    },
    {
      id: 'demo-2',
      connectedWalletAddress: '33333333333333333333333333333334',
      gameWalletAddress: '44444444444444444444444444444445',
      createdAt: Date.now() - 172800000, // 2 days ago
      isFrozen: true
    }
  ]

  const profiles: UserProfile[] = [
    {
      id: 'demo-1',
      connectedWalletAddress: '11111111111111111111111111111112',
      username: 'AdminUser',
      joinDate: Date.now() - 86400000
    },
    {
      id: 'demo-2',
      connectedWalletAddress: '33333333333333333333333333333334',
      username: 'RegularUser',
      joinDate: Date.now() - 172800000
    }
  ]

  const filteredMappings = mappings.filter(mapping => 
    mapping.connectedWalletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.gameWalletAddress.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleFreezeWallet = async (connectedWalletAddress: string) => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      // In production, this would make an API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      success('Wallet Frozen', 'Wallet has been frozen successfully')
    } catch (err) {
      error('Freeze Failed', 'Failed to freeze wallet. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnfreezeWallet = async (connectedWalletAddress: string) => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      // In production, this would make an API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      success('Wallet Unfrozen', 'Wallet has been unfrozen successfully')
    } catch (err) {
      error('Unfreeze Failed', 'Failed to unfreeze wallet. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleThrottleWallet = async (connectedWalletAddress: string) => {
    if (isLoading || throttleDuration < 1 || throttleDuration > 168) {
      error('Invalid Duration', 'Please enter a valid throttle duration (1-168 hours)')
      return
    }
    
    setIsLoading(true)
    try {
      // In production, this would make an API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      success('Withdrawal Throttled', `Withdrawals blocked for ${throttleDuration} hours`)
    } catch (err) {
      error('Throttle Failed', 'Failed to throttle wallet. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetWallet = async (connectedWalletAddress: string) => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      // In production, this would make an API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      success('Wallet Reset', 'Game wallet has been reset successfully')
    } catch (err) {
      error('Reset Failed', 'Failed to reset wallet. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateGodUser = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      const result = walletMappingManager.createGodUser()
      if (result.success) {
        success('God User Created', result.message)
      } else {
        error('Creation Failed', result.message)
      }
    } catch (err) {
      error('Creation Failed', 'Failed to create god user. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateGodUser = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      const result = walletMappingManager.updateGodUserToMaxLevel()
      if (result.success) {
        success('God User Updated', result.message)
      } else {
        error('Update Failed', result.message)
      }
    } catch (err) {
      error('Update Failed', 'Failed to update god user. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      success('Copied', 'Address copied to clipboard')
    } catch (err) {
      error('Copy Failed', 'Failed to copy to clipboard')
    }
  }

  const getProfileForMapping = (connectedWalletAddress: string): UserProfile | undefined => {
    return profiles.find(profile => profile.connectedWalletAddress === connectedWalletAddress)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-6xl h-[80vh] bg-hilo-gray border border-hilo-gray-light rounded-2xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-hilo-gray-light">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Shield className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Admin Panel</h2>
                  <p className="text-sm text-gray-400">Wallet Management & Security</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full flex">
                {/* Left Panel - Wallet List */}
                <div className="w-1/2 border-r border-hilo-gray-light flex flex-col">
                  {/* Search */}
                  <div className="p-4 border-b border-hilo-gray-light">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search wallets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-hilo-black border border-hilo-gray-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-hilo-gold"
                      />
                    </div>
                  </div>

                  {/* Wallet List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredMappings.map((mapping) => {
                      const profile = getProfileForMapping(mapping.connectedWalletAddress)
                      return (
                        <div
                          key={mapping.id}
                          onClick={() => setSelectedMapping(mapping)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedMapping?.id === mapping.id
                              ? 'border-hilo-gold bg-hilo-gold/10'
                              : 'border-hilo-gray-light hover:border-hilo-gray bg-hilo-black/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-hilo-gold" />
                              <span className="text-sm font-medium text-white">
                                {profile?.username || 'Unknown User'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {mapping.isFrozen && (
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                              )}
                              {mapping.withdrawalThrottleUntil && mapping.withdrawalThrottleUntil > Date.now() && (
                                <Clock className="w-4 h-4 text-yellow-400" />
                              )}
                              {!mapping.isFrozen && (!mapping.withdrawalThrottleUntil || mapping.withdrawalThrottleUntil <= Date.now()) && (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 space-y-1">
                            <div className="flex items-center justify-between">
                              <span>Connected:</span>
                              <span className="font-mono">{mapping.connectedWalletAddress.slice(0, 8)}...</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Game:</span>
                              <span className="font-mono">{mapping.gameWalletAddress.slice(0, 8)}...</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Created:</span>
                              <span>{new Date(mapping.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Right Panel - Wallet Details */}
                <div className="w-1/2 flex flex-col">
                  {selectedMapping ? (
                    <>
                      {/* Wallet Details */}
                      <div className="p-6 border-b border-hilo-gray-light">
                        <h3 className="text-lg font-semibold text-white mb-4">Wallet Details</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Connected Wallet</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-white">
                                {selectedMapping.connectedWalletAddress}
                              </span>
                              <button
                                onClick={() => copyToClipboard(selectedMapping.connectedWalletAddress)}
                                className="text-hilo-gold hover:text-hilo-gold-dark transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Game Wallet</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-white">
                                {selectedMapping.gameWalletAddress}
                              </span>
                              <button
                                onClick={() => copyToClipboard(selectedMapping.gameWalletAddress)}
                                className="text-hilo-gold hover:text-hilo-gold-dark transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Status</span>
                            <div className="flex items-center gap-2">
                              {selectedMapping.isFrozen ? (
                                <span className="text-sm text-red-400">Frozen</span>
                              ) : (
                                <span className="text-sm text-green-400">Active</span>
                              )}
                            </div>
                          </div>
                          {selectedMapping.withdrawalThrottleUntil && selectedMapping.withdrawalThrottleUntil > Date.now() && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">Throttled Until</span>
                              <span className="text-sm text-yellow-400">
                                {new Date(selectedMapping.withdrawalThrottleUntil).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Admin Actions */}
                      <div className="flex-1 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Admin Actions</h3>
                        <div className="space-y-4">
                          {/* Freeze/Unfreeze */}
                          <div className="flex gap-2">
                            {selectedMapping.isFrozen ? (
                              <button
                                onClick={() => handleUnfreezeWallet(selectedMapping.connectedWalletAddress)}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <CheckCircle className="w-4 h-4" />
                                {isLoading ? 'Unfreezing...' : 'Unfreeze Wallet'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleFreezeWallet(selectedMapping.connectedWalletAddress)}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <AlertTriangle className="w-4 h-4" />
                                {isLoading ? 'Freezing...' : 'Freeze Wallet'}
                              </button>
                            )}
                          </div>

                          {/* Throttle */}
                          <div className="space-y-2">
                            <label className="block text-sm text-gray-400">Throttle Duration (hours)</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={throttleDuration}
                                onChange={(e) => setThrottleDuration(Number(e.target.value))}
                                className="flex-1 px-3 py-2 bg-hilo-black border border-hilo-gray-light rounded-lg text-white"
                                min="1"
                                max="168"
                              />
                              <button
                                onClick={() => handleThrottleWallet(selectedMapping.connectedWalletAddress)}
                                disabled={isLoading}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Clock className="w-4 h-4" />
                                {isLoading ? 'Throttling...' : 'Throttle'}
                              </button>
                            </div>
                          </div>

                          {/* Reset Wallet */}
                          <button
                            onClick={() => handleResetWallet(selectedMapping.connectedWalletAddress)}
                            disabled={isLoading}
                            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Shield className="w-4 h-4" />
                            {isLoading ? 'Resetting...' : 'Reset Game Wallet'}
                          </button>

                          {/* God User Management */}
                          <div className="border-t border-hilo-gray-light pt-4 mt-4">
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                              <Crown className="w-4 h-4 text-yellow-500" />
                              God User Management
                            </h4>
                            <div className="space-y-2">
                              <button
                                onClick={handleCreateGodUser}
                                disabled={isLoading}
                                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Crown className="w-4 h-4" />
                                {isLoading ? 'Creating...' : 'Create God User'}
                              </button>
                              <button
                                onClick={handleUpdateGodUser}
                                disabled={isLoading}
                                className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Zap className="w-4 h-4" />
                                {isLoading ? 'Updating...' : 'Update God to Max Level'}
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              Creates or updates the "god" user to level 100 with Diamond VIP tier and admin privileges.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">Select a Wallet</h3>
                        <p className="text-gray-400">Choose a wallet from the list to view details and manage settings.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AdminPanel
