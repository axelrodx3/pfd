import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Dice1, CreditCard, Trophy, Zap, Star, Crown } from 'lucide-react'

export const GamesPage: React.FC = () => {
  const navigate = useNavigate()

  const games = [
    {
      id: 'dice',
      title: 'HILO Dice',
      description: 'Bet high or low on dice rolls. Simple, fast, and exciting!',
      icon: Dice1,
      color: 'from-blue-500 to-purple-600',
      borderColor: 'border-blue-400',
      shadowColor: 'shadow-blue-500/30',
      status: 'available',
      players: '2.4k playing',
      minBet: '1 HILO',
      maxBet: '10,000 HILO',
      houseEdge: '2%',
      route: '/game',
    },
    {
      id: 'blackjack',
      title: 'Blackjack',
      description: 'Beat the dealer by getting as close to 21 as possible.',
      icon: CreditCard,
      color: 'from-green-500 to-emerald-600',
      borderColor: 'border-green-400',
      shadowColor: 'shadow-green-500/30',
      status: 'coming-soon',
      players: 'Coming Soon',
      minBet: '5 HILO',
      maxBet: '50,000 HILO',
      houseEdge: '0.5%',
      route: '/blackjack',
    },
    {
      id: 'roulette',
      title: 'Roulette',
      description: 'Spin the wheel and bet on numbers, colors, or sections.',
      icon: Zap,
      color: 'from-red-500 to-pink-600',
      borderColor: 'border-red-400',
      shadowColor: 'shadow-red-500/30',
      status: 'coming-soon',
      players: 'Coming Soon',
      minBet: '2 HILO',
      maxBet: '25,000 HILO',
      houseEdge: '2.7%',
      route: '/roulette',
    },
    {
      id: 'slots',
      title: 'Slots',
      description: 'Spin the reels and match symbols for big wins!',
      icon: Star,
      color: 'from-yellow-500 to-orange-600',
      borderColor: 'border-yellow-400',
      shadowColor: 'shadow-yellow-500/30',
      status: 'coming-soon',
      players: 'Coming Soon',
      minBet: '1 HILO',
      maxBet: '5,000 HILO',
      houseEdge: '3-5%',
      route: '/slots',
    },
    {
      id: 'poker',
      title: 'Poker',
      description: 'Play against other players in exciting poker games.',
      icon: Crown,
      color: 'from-purple-500 to-indigo-600',
      borderColor: 'border-purple-400',
      shadowColor: 'shadow-purple-500/30',
      status: 'coming-soon',
      players: 'Coming Soon',
      minBet: '10 HILO',
      maxBet: '100,000 HILO',
      houseEdge: '0%',
      route: '/poker',
    },
    {
      id: 'tournaments',
      title: 'Tournaments',
      description: 'Compete in daily and weekly tournaments for prizes.',
      icon: Trophy,
      color: 'from-amber-500 to-yellow-600',
      borderColor: 'border-amber-400',
      shadowColor: 'shadow-amber-500/30',
      status: 'coming-soon',
      players: 'Coming Soon',
      minBet: 'Entry Fee',
      maxBet: 'Varies',
      houseEdge: '0%',
      route: '/tournaments',
    },
  ]

  const handleGameClick = (game: (typeof games)[0]) => {
    if (game.status === 'available') {
      navigate(game.route)
    }
  }

  return (
    <div className="min-h-screen bg-hilo-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            className="text-5xl font-bold text-hilo-gold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Choose Your Game
          </motion.h1>
          <motion.p
            className="text-xl text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Select from our collection of exciting casino games. Each game
            offers unique thrills and opportunities to win big!
          </motion.p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              className={`
                relative group cursor-pointer transition-all duration-300
                ${
                  game.status === 'available'
                    ? 'hover:scale-105 hover:shadow-2xl'
                    : 'opacity-60 cursor-not-allowed'
                }
              `}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => handleGameClick(game)}
            >
              <div
                className={`
                bg-gradient-to-br ${game.color} rounded-2xl p-6 h-full
                border-2 ${game.borderColor} shadow-xl ${game.shadowColor}
                relative overflow-hidden
              `}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {game.status === 'available' ? (
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      LIVE
                    </div>
                  ) : (
                    <div className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      SOON
                    </div>
                  )}
                </div>

                {/* Game Icon */}
                <div className="mb-6">
                  <game.icon className="w-16 h-16 text-white/90" />
                </div>

                {/* Game Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {game.title}
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {game.description}
                    </p>
                  </div>

                  {/* Game Stats */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-white/70 text-sm">
                      <span>Players:</span>
                      <span className="font-semibold">{game.players}</span>
                    </div>
                    <div className="flex justify-between items-center text-white/70 text-sm">
                      <span>Min Bet:</span>
                      <span className="font-semibold">{game.minBet}</span>
                    </div>
                    <div className="flex justify-between items-center text-white/70 text-sm">
                      <span>Max Bet:</span>
                      <span className="font-semibold">{game.maxBet}</span>
                    </div>
                    <div className="flex justify-between items-center text-white/70 text-sm">
                      <span>House Edge:</span>
                      <span className="font-semibold">{game.houseEdge}</span>
                    </div>
                  </div>

                  {/* Play Button */}
                  <div className="pt-4">
                    {game.status === 'available' ? (
                      <motion.button
                        className="w-full bg-white/20 backdrop-blur-sm text-white font-bold py-3 px-6 rounded-xl
                                 hover:bg-white/30 transition-all duration-200 border border-white/30
                                 group-hover:scale-105"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Play Now
                      </motion.button>
                    ) : (
                      <div
                        className="w-full bg-white/10 backdrop-blur-sm text-white/60 font-bold py-3 px-6 rounded-xl
                                    border border-white/20 text-center"
                      >
                        Coming Soon
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Info */}
        <motion.div
          className="text-center mt-16 p-8 bg-gray-900/50 rounded-2xl border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-2xl font-bold text-hilo-gold mb-4">
            🎰 More Games Coming Soon!
          </h3>
          <p className="text-gray-300 max-w-3xl mx-auto">
            We&apos;re constantly adding new and exciting games to our platform.
            Stay tuned for Blackjack, Roulette, Slots, Poker, and exclusive
            tournaments. Each game is designed with provably fair mechanics and
            stunning visuals.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default GamesPage
