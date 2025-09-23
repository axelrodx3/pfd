import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { DiceRoller } from '../components/DiceRoller'
import { mockAPI } from '../lib/api'
import { useToast } from '../components/Toast'
import { LoadingSpinner, LoadingButton } from '../components/LoadingSpinner'
import { GameRulesModal } from '../components/GameRulesModal'
import { SettingsModal } from '../components/SettingsModal'
import { AdvancedStats } from '../components/AdvancedStats'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { Settings, HelpCircle, BarChart3, Download, X, Menu } from 'lucide-react'

/**
 * Enhanced Game Page Component
 * Full-featured dice game with auto-roll, streaks, challenges, and crypto features
 */
export const EnhancedGamePage: React.FC = () => {
  const {
    // Game state
    currentBet,
    selectedSide,
    isRolling,
    lastRoll,
    lastResult,
    lastWin,
    hiloTokens,

    // Streaks & Stats
    currentWinStreak,
    currentLossStreak,
    maxWinStreak,
    maxLossStreak,
    totalWagered,
    totalWon,
    totalGames,

    // Auto-roll
    autoRollEnabled,
    autoRollCount,
    autoRollMax,
    autoRollStopOnWin,
    autoRollStopOnLoss,

    // Progression
    xp,
    level,
    vipTier,
    dailyChallenges,

    // Settings
    soundEnabled,
    selectedDiceSkin,
    muted,

    // Actions
    setBet,
    selectSide,
    rollDice,
    resetGame,
    toggleAutoRoll,
    setAutoRollSettings,
    setDiceSkin,
    toggleSound,
    toggleMute,
    completeChallenge,
    spinDailyWheel,
    validateGameState,
    recoverGameState,
  } = useGameStore()

  const [showSettings, setShowSettings] = useState(false)
  const [showChallenges, setShowChallenges] = useState(false)
  const [showDailyWheel, setShowDailyWheel] = useState(false)
  const [wheelSpinning, setWheelSpinning] = useState(false)
  const [wheelResult, setWheelResult] = useState<number | null>(null)

  // New enhanced features state
  const [showRules, setShowRules] = useState(false)
  const [showAdvancedStats, setShowAdvancedStats] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [autorollDelay, setAutorollDelay] = useState(false)
  const [showGameMenu, setShowGameMenu] = useState(false)
  const gameMenuRef = useRef<HTMLDivElement>(null)

  const { success, error, warning, info } = useToast()

  // Close game menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gameMenuRef.current && !gameMenuRef.current.contains(event.target as Node)) {
        setShowGameMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleBetChange = (amount: number) => {
    setBet(Math.max(1, Math.min(amount, hiloTokens)))
  }

  const handleSideSelect = (side: 'high' | 'low') => {
    selectSide(side)
  }

  // Enhanced roll dice with loading and feedback
  const handleRollDice = useCallback(async () => {
    if (isRolling || !selectedSide || currentBet > hiloTokens) {
      if (currentBet > hiloTokens) {
        error(
          'Insufficient Funds',
          'You need more HILO tokens to place this bet'
        )
      }
      return
    }

    setIsLoading(true)
    try {
      await rollDice()
      if (lastWin) {
        success('You Won!', `+${(currentBet * 1.98).toLocaleString()} HILO`)
      } else if (lastWin === false) {
        warning('You Lost', `-${currentBet.toLocaleString()} HILO`)
      }
    } catch (err) {
      error('Roll Failed', 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [
    isRolling,
    selectedSide,
    currentBet,
    hiloTokens,
    rollDice,
    lastWin,
    success,
    error,
    warning,
  ])

  const handleRoll = () => {
    if (!isRolling && selectedSide && currentBet <= hiloTokens) {
      handleRollDice()
    }
  }

  // Game state validation and recovery
  useEffect(() => {
    const isValid = validateGameState()
    if (!isValid) {
      console.warn('🚨 Invalid game state detected, attempting recovery...')
      recoverGameState()
    }
  }, [validateGameState, recoverGameState])

  // Auto-roll logic - Continue automatically regardless of win/loss
  useEffect(() => {
    if (
      !autoRollEnabled ||
      isRolling ||
      !selectedSide ||
      currentBet > hiloTokens ||
      autoRollCount >= autoRollMax
    ) {
      setAutorollDelay(false)
      return
    }

    // Determine delay based on last result - wins get delay, losses are immediate
    const delay = lastWin === true ? 2000 : 0 // 2 seconds for wins, immediate for losses

    // Show delay indicator only for wins
    if (lastWin === true) {
      setAutorollDelay(true)
    }

    const timer = setTimeout(() => {
      setAutorollDelay(false)
      try {
        handleRollDice()
      } catch (error) {
        console.error('🚨 Error in auto-roll:', error)
        // Disable auto-roll on error to prevent infinite loops
        toggleAutoRoll()
      }
    }, delay)

    return () => {
      clearTimeout(timer)
      setAutorollDelay(false)
    }
  }, [
    autoRollEnabled,
    isRolling,
    selectedSide,
    currentBet,
    hiloTokens,
    handleRollDice,
    autoRollCount,
    autoRollMax,
    lastWin,
    toggleAutoRoll,
  ])

  // Stop autoroll when max count reached
  useEffect(() => {
    if (autoRollEnabled && autoRollCount >= autoRollMax) {
      toggleAutoRoll()
    }
  }, [autoRollEnabled, autoRollCount, autoRollMax, toggleAutoRoll])

  const handleDailyWheel = async () => {
    setWheelSpinning(true)
    setWheelResult(null)

    try {
      const result = await mockAPI.spinDailyWheel()
      setWheelResult(result.reward)
      spinDailyWheel()
    } catch (error) {
      console.error('Failed to spin wheel:', error)
    } finally {
      setWheelSpinning(false)
    }
  }

  const getVIPTierColor = (tier: string) => {
    switch (tier) {
      case 'Diamond':
        return 'from-purple-500 to-pink-500'
      case 'Gold':
        return 'from-yellow-400 to-yellow-600'
      case 'Silver':
        return 'from-gray-300 to-gray-500'
      default:
        return 'from-orange-400 to-orange-600'
    }
  }

  // Enhanced keyboard shortcuts
  useKeyboardShortcuts({
    onRollDice: () => {
      if (!isRolling && selectedSide && currentBet <= hiloTokens) {
        handleRollDice()
      }
    },
    onSelectHigh: () => selectSide('high'),
    onSelectLow: () => selectSide('low'),
    onQuickBet10: () => setBet(10),
    onQuickBet25: () => setBet(25),
    onQuickBet50: () => setBet(50),
    onQuickBet100: () => setBet(100),
    onMaxBet: () => setBet(hiloTokens),
    onToggleSound: toggleSound,
    onToggleMute: toggleMute,
    onShowRules: () => setShowRules(true),
    onShowHistory: () => setShowAdvancedStats(true),
  })

  return (
    <div className="min-h-screen bg-hilo-black text-white p-6">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-4">
              <div
                className={`px-3 py-1 rounded-full bg-gradient-to-r ${getVIPTierColor(vipTier)} text-white text-sm font-bold`}
              >
                {vipTier}
              </div>
              <div className="text-hilo-gold font-semibold">Level {level}</div>
              <div className="text-gray-400">XP: {xp}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4 w-full lg:w-auto">
            <button
              onClick={() => setShowRules(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Rules
            </button>
            <button
              onClick={() => setShowAdvancedStats(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Stats
            </button>
            <button
              onClick={() => setShowChallenges(true)}
              className="px-4 py-2 bg-hilo-green text-white rounded-lg hover:bg-hilo-green/80 transition-colors"
            >
              🎯 Challenges
            </button>
            <button
              onClick={() => setShowDailyWheel(true)}
              className="px-4 py-2 bg-hilo-gold text-black rounded-lg hover:bg-hilo-gold/80 transition-colors"
            >
              🎡 Daily Wheel
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ⚙️ Settings
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Game Area */}
          <div className="bg-gray-900 rounded-lg p-12 mb-8 relative">
            {/* Hamburger Menu Button */}
            <div className="absolute top-4 right-4" ref={gameMenuRef}>
              <button
                onClick={() => setShowGameMenu(!showGameMenu)}
                className="p-2 rounded-lg text-gray-300 hover:text-hilo-gold hover:bg-hilo-gold/10 transition-all duration-300"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Game Menu Dropdown */}
              <AnimatePresence>
                {showGameMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-50"
                  >
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowRules(true)
                          setShowGameMenu(false)
                        }}
                        className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors flex items-center gap-3"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>Rules</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowAdvancedStats(true)
                          setShowGameMenu(false)
                        }}
                        className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors flex items-center gap-3"
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>Stats</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowChallenges(true)
                          setShowGameMenu(false)
                        }}
                        className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors flex items-center gap-3"
                      >
                        <span>🎯</span>
                        <span>Challenges</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowDailyWheel(true)
                          setShowGameMenu(false)
                        }}
                        className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors flex items-center gap-3"
                      >
                        <span>🎡</span>
                        <span>Daily Wheel</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowSettings(true)
                          setShowGameMenu(false)
                        }}
                        className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors flex items-center gap-3"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Balance & Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
              <div className="text-center">
                <div className="text-2xl font-bold text-hilo-gold">
                  {hiloTokens.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">HILO Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-hilo-green">
                  {currentWinStreak}
                </div>
                <div className="text-sm text-gray-400">Win Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-hilo-red">
                  {currentLossStreak}
                </div>
                <div className="text-sm text-gray-400">Loss Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-hilo-gold">
                  {totalGames}
                </div>
                <div className="text-sm text-gray-400">Total Games</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {totalWon.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Total Won</div>
              </div>
            </div>

            {/* Dice Roller */}
            <div className="flex justify-center items-center mb-8 px-4">
              <div className="relative w-full max-w-lg">
                <DiceRoller />
              </div>
            </div>

            {/* Bet Controls */}
            <div className="space-y-10 max-w-4xl mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
                  Bet Amount (HILO Tokens)
                </label>
                <div className="flex gap-4 justify-center items-center">
                  <input
                    type="number"
                    value={currentBet}
                    onChange={e => handleBetChange(Number(e.target.value))}
                    className="flex-1 px-6 py-4 bg-gray-800 border border-gray-600 rounded-lg text-white text-center font-semibold text-lg"
                    min="1"
                    max={hiloTokens}
                  />
                  <button
                    onClick={() => handleBetChange(currentBet * 2)}
                    className="px-8 py-4 bg-hilo-gold text-black rounded-lg hover:bg-hilo-gold/80 transition-colors font-bold text-lg"
                  >
                    2x
                  </button>
                  <button
                    onClick={() => handleBetChange(Math.floor(hiloTokens / 2))}
                    className="px-8 py-4 bg-hilo-red text-white rounded-lg hover:bg-hilo-red/80 transition-colors font-bold text-lg"
                  >
                    Half
                  </button>
                  <button
                    onClick={() => handleBetChange(hiloTokens)}
                    className="px-8 py-4 bg-hilo-green text-white rounded-lg hover:bg-hilo-green/80 transition-colors font-bold text-lg"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Side Selection */}
              <div className="flex gap-8 justify-center">
                <button
                  onClick={() => handleSideSelect('high')}
                  className={`flex-1 max-w-md py-8 px-12 rounded-xl font-bold text-2xl transition-all duration-300 ${
                    selectedSide === 'high'
                      ? 'bg-hilo-green text-white shadow-hilo-glow-green transform scale-105'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
                  }`}
                >
                  HIGH (4-6)
                </button>
                <button
                  onClick={() => handleSideSelect('low')}
                  className={`flex-1 max-w-md py-8 px-12 rounded-xl font-bold text-2xl transition-all duration-300 ${
                    selectedSide === 'low'
                      ? 'bg-hilo-red text-white shadow-hilo-glow-red transform scale-105'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
                  }`}
                >
                  LOW (1-3)
                </button>
              </div>

              {/* Roll Button and Auto-Roll Toggle */}
              <div className="flex justify-center items-center gap-6 pt-8">
                <button
                  onClick={handleRoll}
                  disabled={
                    isRolling || !selectedSide || currentBet > hiloTokens
                  }
                  className="flex-1 max-w-2xl py-8 px-12 bg-gradient-to-r from-hilo-gold to-hilo-red text-black font-bold text-3xl rounded-xl hover:from-hilo-gold/80 hover:to-hilo-red/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-hilo-gold/30 hover:scale-105 disabled:hover:scale-100"
                >
                  {isRolling ? '🎲 Rolling...' : '🎲 ROLL DICE'}
                </button>

                {/* Apple-style Auto-Roll Toggle */}
                <div className="flex flex-col items-center gap-3">
                  <div className="text-sm text-gray-300 font-medium">
                    Auto-Roll
                  </div>
                  <button
                    onClick={toggleAutoRoll}
                    disabled={isRolling}
                    className={`relative w-16 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50 ${
                      autoRollEnabled
                        ? 'bg-green-500 focus:ring-green-500 hover:bg-green-600'
                        : 'bg-gray-600 focus:ring-gray-500 hover:bg-gray-500'
                    } ${isRolling || !selectedSide || currentBet > hiloTokens ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                        autoRollEnabled ? 'translate-x-8' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  {autoRollEnabled && (
                    <div className="text-xs text-green-400 font-medium text-center">
                      <div>
                        {autoRollCount}/{autoRollMax}
                      </div>
                      <div className="text-gray-400">
                        {autorollDelay ? 'Next roll...' : 'Auto-continues'}
                      </div>
                      {autorollDelay && (
                        <div className="w-4 h-4 mx-auto mt-1">
                          <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Statistics - Underneath the game */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8 max-w-6xl mx-auto">
          <h3 className="text-xl font-bold text-hilo-gold mb-4 text-center">
            Game Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-hilo-green">
                {currentWinStreak}
              </div>
              <div className="text-sm text-gray-400">Win Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-hilo-red">
                {currentLossStreak}
              </div>
              <div className="text-sm text-gray-400">Loss Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-hilo-gold">
                {totalGames}
              </div>
              <div className="text-sm text-gray-400">Total Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {totalWon.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Won</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mt-4 pt-4 border-t border-gray-700">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">
                {totalWagered.toLocaleString()} HILO
              </div>
              <div className="text-sm text-gray-400">Total Wagered</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">
                {totalGames > 0
                  ? ((totalWon / totalWagered) * 100).toFixed(1)
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {/* Settings Modal */}
          {showSettings && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-hilo-gold mb-4">
                  Settings
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Sound Effects</span>
                    <button
                      onClick={toggleSound}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        soundEnabled ? 'bg-hilo-green' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Mute All</span>
                    <button
                      onClick={toggleMute}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        muted ? 'bg-hilo-red' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          muted ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">
                      Dice Skin
                    </label>
                    <div className="flex gap-2">
                      {['classic', 'neon', 'gold'].map(skin => (
                        <button
                          key={skin}
                          onClick={() => setDiceSkin(skin as any)}
                          className={`px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                            selectedDiceSkin === skin
                              ? 'bg-hilo-gold text-black'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {skin}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full mt-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Challenges Modal */}
          {showChallenges && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChallenges(false)}
            >
              <motion.div
                className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-hilo-gold mb-4">
                  Daily Challenges
                </h2>

                <div className="space-y-3">
                  {dailyChallenges.map(challenge => (
                    <div
                      key={challenge.id}
                      className="bg-gray-800 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white">
                          {challenge.title}
                        </h3>
                        <span className="text-hilo-gold font-bold">
                          {challenge.reward} HILO
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        {challenge.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 bg-gray-700 rounded-full h-2 mr-2">
                          <div
                            className="bg-hilo-green h-2 rounded-full transition-all"
                            style={{
                              width: `${(challenge.progress / challenge.maxProgress) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">
                          {challenge.progress}/{challenge.maxProgress}
                        </span>
                      </div>
                      {challenge.completed && (
                        <button
                          onClick={() => completeChallenge(challenge.id)}
                          className="w-full mt-2 py-1 bg-hilo-green text-white rounded text-sm hover:bg-hilo-green/80 transition-colors"
                        >
                          Claim Reward
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowChallenges(false)}
                  className="w-full mt-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Daily Wheel Modal */}
          {showDailyWheel && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDailyWheel(false)}
            >
              <motion.div
                className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 text-center"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-hilo-gold mb-4">
                  Daily Wheel
                </h2>

                <div className="mb-6">
                  <motion.div
                    className="w-32 h-32 mx-auto bg-gradient-to-br from-hilo-gold to-hilo-red rounded-full flex items-center justify-center text-4xl"
                    animate={wheelSpinning ? { rotate: 360 } : {}}
                    transition={
                      wheelSpinning
                        ? { duration: 2, repeat: Infinity, ease: 'linear' }
                        : {}
                    }
                  >
                    🎡
                  </motion.div>
                </div>

                {wheelResult && (
                  <motion.div
                    className="mb-4 p-4 bg-hilo-green rounded-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <div className="text-2xl font-bold text-white">
                      You won {wheelResult} HILO tokens!
                    </div>
                  </motion.div>
                )}

                <button
                  onClick={handleDailyWheel}
                  disabled={wheelSpinning}
                  className="w-full py-3 bg-hilo-gold text-black font-bold rounded-lg hover:bg-hilo-gold/80 transition-colors disabled:opacity-50"
                >
                  {wheelSpinning ? 'Spinning...' : 'Spin Wheel'}
                </button>

                <button
                  onClick={() => setShowDailyWheel(false)}
                  className="w-full mt-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Modals */}
        <GameRulesModal
          isOpen={showRules}
          onClose={() => setShowRules(false)}
        />
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />

        {/* Advanced Stats Modal */}
        {showAdvancedStats && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAdvancedStats(false)}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-hilo-gold" />
                    Advanced Statistics
                  </h2>
                  <button
                    onClick={() => setShowAdvancedStats(false)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
                <AdvancedStats />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-gray-900 rounded-xl p-8 shadow-2xl border border-gray-700">
              <LoadingSpinner size="xl" text="Rolling dice..." />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default EnhancedGamePage
