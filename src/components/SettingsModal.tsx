import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Modal from './Modal'
import {
  X,
  Settings,
  Volume2,
  VolumeX,
  Palette,
  Keyboard,
  Download,
  Trash2,
  Save,
  RotateCcw,
} from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { ThemeSelector } from '../contexts/ThemeContext'
import { LoadingButton } from './LoadingSpinner'
import { useToast } from './Toast'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Ensure Escape closes
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])
  const { success, error } = useToast()
  const {
    soundEnabled,
    muted,
    selectedDiceSkin,
    toggleSound,
    toggleMute,
    setDiceSkin,
    clearHistory,
    gameHistory,
    animationsEnabled,
    hapticsEnabled,
    autoSaveEnabled,
    masterVolume,
    toggleAnimations,
    toggleHaptics,
    toggleAutoSave,
    setMasterVolume,
    resetEverything,
  } = useGameStore()

  const [activeTab, setActiveTab] = useState<
    'general' | 'audio' | 'appearance' | 'data'
  >('general')
  const [isExporting, setIsExporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'audio', label: 'Audio', icon: Volume2 },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data', icon: Download },
  ] as const

  const diceSkins = [
    { id: 'classic', name: 'Classic', description: 'Traditional casino style' },
    { id: 'neon', name: 'Neon', description: 'Bright cyberpunk vibes' },
    { id: 'gold', name: 'Gold', description: 'Luxury golden finish' },
  ] as const

  const handleExportHistory = async () => {
    setIsExporting(true)
    try {
      const csvContent = [
        [
          'Date',
          'Bet Amount',
          'Side',
          'Roll',
          'Result',
          'Won',
          'Winnings',
          'Hash',
        ],
        ...gameHistory.map(game => [
          new Date(game.timestamp).toISOString(),
          game.bet.toString(),
          game.side,
          game.roll.toString(),
          game.result,
          game.won ? 'Yes' : 'No',
          (game.bet * game.multiplier).toString(),
          game.hash,
        ]),
      ]
        .map(row => row.join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hilo-game-history-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleClearHistory = async () => {
    setIsClearing(true)
    try {
      clearHistory()
    } catch (error) {
      console.error('Clear history failed:', error)
    } finally {
      setIsClearing(false)
    }
  }

  const handleResetEverything = () => {
    setResetConfirmText('')
    setShowResetConfirm(true)
  }

  const confirmReset = async () => {
    if (isResetting || resetConfirmText.trim().toUpperCase() !== 'OK') return
    setIsResetting(true)
    try {
      resetEverything()
      setShowResetConfirm(false)
      success('Reset Complete', 'All game data has been reset to defaults')
    } catch (error) {
      console.error('Reset everything failed:', error)
      error('Reset Failed', 'Something went wrong while resetting')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl" panelClassName="md:max-w-3xl no-scrollbar">
      <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-hilo-gold" />
            Settings
          </h2>
          {/* Close handled by Modal's X button */}
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-700 bg-gray-800/50">
            <nav className="p-4 space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      activeTab === tab.id
                        ? 'bg-hilo-gold/20 text-hilo-gold border border-hilo-gold/30'
                        : 'text-gray-300 hover:bg-gray-700/50'
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  General Settings
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">
                        Auto-save Game State
                      </h4>
                      <p className="text-sm text-gray-400">
                        Automatically save your progress
                      </p>
                    </div>
                    <button
                      onClick={toggleAutoSave}
                      className={`w-12 h-6 rounded-full relative transition-colors ${autoSaveEnabled ? 'bg-hilo-gold' : 'bg-gray-600'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${autoSaveEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">
                        Show Animations
                      </h4>
                      <p className="text-sm text-gray-400">
                        Enable visual effects and transitions
                      </p>
                    </div>
                    <button
                      onClick={toggleAnimations}
                      className={`w-12 h-6 rounded-full relative transition-colors ${animationsEnabled ? 'bg-hilo-gold' : 'bg-gray-600'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${animationsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">
                        Haptic Feedback
                      </h4>
                      <p className="text-sm text-gray-400">
                        Vibration on mobile devices
                      </p>
                    </div>
                    <button
                      onClick={toggleHaptics}
                      className={`w-12 h-6 rounded-full relative transition-colors ${hapticsEnabled ? 'bg-hilo-gold' : 'bg-gray-600'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${hapticsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Audio Settings
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">
                        Sound Effects
                      </h4>
                      <p className="text-sm text-gray-400">
                        Play sounds for game actions
                      </p>
                    </div>
                    <button
                      onClick={toggleSound}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        soundEnabled ? 'bg-hilo-gold' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                          soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">Mute All</h4>
                      <p className="text-sm text-gray-400">
                        Disable all audio
                      </p>
                    </div>
                    <button
                      onClick={toggleMute}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        muted ? 'bg-red-500' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                          muted ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-white font-medium">
                      Master Volume
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={masterVolume}
                      onChange={(e) => setMasterVolume(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Appearance Settings
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-white mb-3">
                      Theme & Colors
                    </h4>
                    <ThemeSelector />
                  </div>

                  <div>
                    <h4 className="font-medium text-white mb-3">
                      Dice Skin
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {diceSkins.map(skin => (
                        <button
                          key={skin.id}
                          onClick={() => setDiceSkin(skin.id)}
                          className={`
                            p-4 rounded-lg border transition-all duration-200 text-left
                            ${
                              selectedDiceSkin === skin.id
                                ? 'border-hilo-gold bg-hilo-gold/20 text-hilo-gold'
                                : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                            }
                          `}
                        >
                          <div className="font-medium">{skin.name}</div>
                          <div className="text-sm opacity-75">
                            {skin.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Data Management
                </h3>

                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">
                      Game History
                    </h4>
                    <p className="text-sm text-gray-400 mb-4">
                      {gameHistory.length} games recorded
                    </p>
                    <div className="flex gap-3">
                      <LoadingButton
                        loading={isExporting}
                        loadingText="Exporting..."
                        onClick={handleExportHistory}
                        className="bg-hilo-gold text-hilo-black hover:bg-hilo-gold/90"
                      >
                        <Download className="w-4 h-4" />
                        Export CSV
                      </LoadingButton>

                      <LoadingButton
                        loading={isClearing}
                        loadingText="Clearing..."
                        onClick={handleClearHistory}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear History
                      </LoadingButton>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">
                      Reset Game
                    </h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Reset all progress and start fresh
                    </p>
                    <button onClick={handleResetEverything} disabled={isResetting} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                      <RotateCcw className="w-4 h-4" />
                      {isResetting ? 'Resetting...' : 'Reset Everything'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>

    {/* Reset Confirmation Modal */}
    <Modal isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)} maxWidth="md" title="Confirm Reset" panelClassName={"md:max-w-md"}>
      <div className="space-y-4">
        <p className="text-gray-300 text-sm">This action will:</p>
        <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
          <li>Clear game history and recent wins</li>
          <li>Reset streaks, counters, and totals</li>
          <li>Re-generate provably-fair seeds and reset nonce</li>
          <li>Reset token balances to defaults</li>
        </ul>
        <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-200 text-sm">
          Type <span className="font-bold text-yellow-300">OK</span> to confirm.
        </div>
        <input
          type="text"
          value={resetConfirmText}
          onChange={(e) => setResetConfirmText(e.target.value)}
          placeholder="Type OK"
          className="w-full px-4 py-3 bg-hilo-black border border-hilo-gray-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-hilo-gold focus:ring-1 focus:ring-hilo-gold"
        />
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setShowResetConfirm(false)}
            className="flex-1 px-4 py-3 bg-hilo-gray-light text-white rounded-lg hover:bg-hilo-gray transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmReset}
            disabled={isResetting || resetConfirmText.trim().toUpperCase() !== 'OK'}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isResetting ? 'Resetting...' : 'Confirm Reset'}
          </button>
        </div>
      </div>
    </Modal>
    </>
  )
}
