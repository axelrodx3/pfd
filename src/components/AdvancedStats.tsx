import React from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Clock, 
  Award,
  BarChart3,
  Zap
} from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { formatCurrency } from '../lib/utils'

export const AdvancedStats: React.FC = () => {
  const {
    totalGames,
    totalWon,
    totalWagered,
    currentWinStreak,
    currentLossStreak,
    maxWinStreak,
    maxLossStreak,
    gameHistory,
    hiloTokens,
    balance
  } = useGameStore()

  // Calculate advanced statistics
  const winRate = totalGames > 0 ? (gameHistory.filter(game => game.won).length / totalGames) * 100 : 0
  const averageBet = totalGames > 0 ? totalWagered / totalGames : 0
  const profitLoss = totalWon - totalWagered
  const netWorth = hiloTokens + balance
  const biggestWin = Math.max(...gameHistory.map(game => game.won ? game.bet * game.multiplier : 0), 0)
  const biggestLoss = Math.max(...gameHistory.map(game => !game.won ? game.bet : 0), 0)
  
  // Calculate recent performance (last 10 games)
  const recentGames = gameHistory.slice(0, 10)
  const recentWinRate = recentGames.length > 0 ? (recentGames.filter(game => game.won).length / recentGames.length) * 100 : 0
  
  // Calculate hourly stats
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const recentHourGames = gameHistory.filter(game => new Date(game.timestamp) > oneHourAgo)
  const gamesPerHour = recentHourGames.length

  const stats = [
    {
      title: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-500/30',
      trend: recentWinRate > winRate ? 'up' : recentWinRate < winRate ? 'down' : 'stable'
    },
    {
      title: 'Average Bet',
      value: formatCurrency(averageBet),
      icon: DollarSign,
      color: 'text-hilo-gold',
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-500/30'
    },
    {
      title: 'Profit/Loss',
      value: formatCurrency(profitLoss),
      icon: profitLoss >= 0 ? TrendingUp : TrendingDown,
      color: profitLoss >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: profitLoss >= 0 ? 'bg-green-900/20' : 'bg-red-900/20',
      borderColor: profitLoss >= 0 ? 'border-green-500/30' : 'border-red-500/30'
    },
    {
      title: 'Net Worth',
      value: formatCurrency(netWorth),
      icon: Award,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-500/30'
    },
    {
      title: 'Biggest Win',
      value: formatCurrency(biggestWin),
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-500/30'
    },
    {
      title: 'Biggest Loss',
      value: formatCurrency(biggestLoss),
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-500/30'
    },
    {
      title: 'Games/Hour',
      value: gamesPerHour.toString(),
      icon: Clock,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      borderColor: 'border-purple-500/30'
    },
    {
      title: 'Max Win Streak',
      value: maxWinStreak.toString(),
      icon: Zap,
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/20',
      borderColor: 'border-orange-500/30'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-hilo-gold" />
          Advanced Statistics
        </h3>
        <div className="text-sm text-gray-400">
          {totalGames} total games
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            className={`
              ${stat.bgColor} ${stat.borderColor}
              border rounded-xl p-4 backdrop-blur-sm
            `}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              {stat.trend && (
                <div className={`text-xs ${
                  stat.trend === 'up' ? 'text-green-400' : 
                  stat.trend === 'down' ? 'text-red-400' : 
                  'text-gray-400'
                }`}>
                  {stat.trend === 'up' ? '↗' : stat.trend === 'down' ? '↘' : '→'}
                </div>
              )}
            </div>
            <div className={`text-2xl font-bold ${stat.color} mb-1`}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-400">
              {stat.title}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-hilo-gold" />
          Recent Performance
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Last 10 Games Win Rate</span>
            <span className={`font-semibold ${recentWinRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
              {recentWinRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Current Streak</span>
            <span className={`font-semibold ${currentWinStreak > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {currentWinStreak > 0 ? `+${currentWinStreak}` : currentLossStreak}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Games This Hour</span>
            <span className="font-semibold text-hilo-gold">{gamesPerHour}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button className="px-4 py-2 bg-hilo-gold text-hilo-black rounded-lg font-semibold hover:bg-hilo-gold/90 transition-colors">
          Export History
        </button>
        <button className="px-4 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors">
          Reset Stats
        </button>
        <button className="px-4 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors">
          Share Stats
        </button>
      </div>
    </div>
  )
}
