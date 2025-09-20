import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { formatCurrency } from '../lib/utils'

/**
 * Leaderboard Page Component
 * Displays top players with mock data
 */
export const LeaderboardPage: React.FC = () => {
  const { leaderboard, updateLeaderboard } = useGameStore()

  useEffect(() => {
    updateLeaderboard()
  }, [updateLeaderboard])

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇'
      case 1: return '🥈'
      case 2: return '🥉'
      default: return `#${index + 1}`
    }
  }

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'text-hilo-gold'
      case 1: return 'text-gray-300'
      case 2: return 'text-orange-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold text-hilo-gold mb-4">
            🏆 Leaderboard
          </h1>
          <p className="text-xl text-gray-300">
            Top players and their achievements
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            className="card-hilo-glow text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="text-3xl font-bold text-hilo-gold mb-2">
              {leaderboard.length}
            </div>
            <div className="text-gray-400">Total Players</div>
          </motion.div>

          <motion.div
            className="card-hilo-glow text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-3xl font-bold text-hilo-green mb-2">
              {formatCurrency(leaderboard.reduce((sum, player) => sum + player.totalWagered, 0))}
            </div>
            <div className="text-gray-400">Total Wagered</div>
          </motion.div>

          <motion.div
            className="card-hilo-glow text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="text-3xl font-bold text-hilo-red mb-2">
              {leaderboard.length > 0 
                ? Math.round(leaderboard.reduce((sum, player) => sum + player.winRate, 0) / leaderboard.length * 100)
                : 0}%
            </div>
            <div className="text-gray-400">Average Win Rate</div>
          </motion.div>
        </div>

        {/* Leaderboard Table */}
        <motion.div
          className="card-hilo-glow"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hilo-gray-light">
                  <th className="text-left py-4 px-6 text-hilo-gold font-semibold">Rank</th>
                  <th className="text-left py-4 px-6 text-hilo-gold font-semibold">Player</th>
                  <th className="text-right py-4 px-6 text-hilo-gold font-semibold">Wins</th>
                  <th className="text-right py-4 px-6 text-hilo-gold font-semibold">Wagered</th>
                  <th className="text-right py-4 px-6 text-hilo-gold font-semibold">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, index) => (
                  <motion.tr
                    key={player.id}
                    className={`
                      border-b border-hilo-gray-light/50 hover:bg-hilo-gray-light/20 transition-colors
                      ${index < 3 ? 'bg-gradient-to-r from-hilo-gold/5 to-transparent' : ''}
                    `}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl ${getRankColor(index)}`}>
                          {getRankIcon(index)}
                        </span>
                        {index < 3 && (
                          <motion.div
                            className="w-2 h-2 bg-hilo-gold rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{player.avatar}</div>
                        <div>
                          <div className="font-semibold text-white">{player.username}</div>
                          <div className="text-sm text-gray-400">Player #{player.id.split('-')[1]}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6 text-right">
                      <div className="font-semibold text-hilo-green">
                        {player.totalWins.toLocaleString()}
                      </div>
                    </td>
                    
                    <td className="py-4 px-6 text-right">
                      <div className="font-semibold text-hilo-gold">
                        {formatCurrency(player.totalWagered)}
                      </div>
                    </td>
                    
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="font-semibold text-white">
                          {Math.round(player.winRate * 100)}%
                        </div>
                        <div className="w-16 bg-hilo-gray-light rounded-full h-2">
                          <motion.div
                            className="bg-hilo-green h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${player.winRate * 100}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-hilo-gold mb-4">
            Ready to Join the Competition?
          </h3>
          <p className="text-gray-300 mb-6">
            Start playing now and climb the leaderboard!
          </p>
          <motion.a
            href="/game"
            className="btn-hilo-primary text-lg px-8 py-4 inline-block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🎲 Start Playing
          </motion.a>
        </motion.div>
      </div>
    </div>
  )
}

export default LeaderboardPage
