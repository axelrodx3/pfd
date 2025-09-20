import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { mockAPI } from '../lib/api'

interface LiveFeedProps {
  className?: string
}

/**
 * Live Feed Component
 * Shows recent wins from other players in real-time
 */
export const LiveFeed: React.FC<LiveFeedProps> = ({ className = '' }) => {
  const { recentWins, addToLiveFeed } = useGameStore()
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Start live feed simulation
    mockAPI.startLiveFeed(addToLiveFeed)
    
    return () => {
      mockAPI.stopLiveFeed()
    }
  }, [addToLiveFeed])

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  const getAmountColor = (amount: number) => {
    if (amount >= 5000) return 'text-purple-400'
    if (amount >= 2000) return 'text-pink-400'
    if (amount >= 1000) return 'text-hilo-gold'
    if (amount >= 500) return 'text-hilo-green'
    return 'text-gray-400'
  }

  return (
    <div className={`bg-gray-900 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-hilo-gold flex items-center gap-2">
          🔥 Live Feed
          <motion.div
            className="w-2 h-2 bg-hilo-red rounded-full"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {recentWins.slice(0, 10).map((win, index) => (
                  <motion.div
                    key={win.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{win.avatar}</div>
                      <div>
                        <div className="text-sm font-medium text-white">{win.username}</div>
                        <div className="text-xs text-gray-400">{win.game}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${getAmountColor(win.amount)}`}>
                        {win.amount.toLocaleString()} HILO
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatTime(win.timestamp)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {recentWins.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-2">🎲</div>
                  <div>No recent wins yet</div>
                  <div className="text-sm">Be the first to win big!</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact view when collapsed */}
      {!isExpanded && recentWins.length > 0 && (
        <div className="space-y-1">
          {recentWins.slice(0, 3).map((win) => (
            <motion.div
              key={win.id}
              className="flex items-center justify-between text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <span>{win.avatar}</span>
                <span className="text-gray-300">{win.username}</span>
              </div>
              <div className={`font-bold ${getAmountColor(win.amount)}`}>
                {win.amount.toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LiveFeed
