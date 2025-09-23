import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Dice1, CreditCard, Trophy, Zap, Star, Crown, Search, Filter, LayoutGrid } from 'lucide-react'
import { useWalletContext } from '../contexts/WalletContextWrapper'
import { WalletRequiredModal } from '../components/WalletRequiredModal'

export const GamesPage: React.FC = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'live' | 'soon'>('all')
  const [layout, setLayout] = useState<'grid' | 'comfortable'>('grid')
  const { connected } = useWalletContext() as any
  const [showWalletRequired, setShowWalletRequired] = useState(false)

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
      id: 'territory-wars',
      title: 'Territory Wars',
      description: 'Turn-based artillery with wagers. Classic stick strategy vibes.',
      icon: Trophy,
      color: 'from-teal-500 to-cyan-600',
      borderColor: 'border-teal-400',
      shadowColor: 'shadow-teal-500/30',
      status: 'available',
      players: '312 playing',
      minBet: '1 HILO',
      maxBet: '10,000 HILO',
      houseEdge: 'Skill-based',
      route: '/territory-wars',
    },
    {
      id: 'modern-territory-wars',
      title: 'Modern Territory Wars',
      description: 'Polished 3D tactical combat with modern UI and particle effects.',
      icon: Star,
      color: 'from-purple-500 to-pink-600',
      borderColor: 'border-purple-400',
      shadowColor: 'shadow-purple-500/30',
      status: 'available',
      players: '156 playing',
      minBet: '1 HILO',
      maxBet: '10,000 HILO',
      houseEdge: 'Skill-based',
      route: '/modern-territory-wars',
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
    if (game.status !== 'available') return
    // Allow browsing into the game page, but gameplay will be guarded.
    navigate(game.route)
  }

  const filteredGames = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return games.filter(g => {
      const byFilter =
        filter === 'all' ? true : filter === 'live' ? g.status === 'available' : g.status !== 'available'
      const byQuery = !normalized
        ? true
        : [g.title, g.description].some(s => s.toLowerCase().includes(normalized))
      return byFilter && byQuery
    })
  }, [games, filter, query])

  return (
    <div className="min-h-screen bg-hilo-black text-white">
      {/* Background accents */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-hilo-gold/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-hilo-green/5 blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <section className="pt-28 px-4">
          <div className="text-center mb-10">
            <motion.h1
              className="text-4xl md:text-5xl font-extrabold tracking-tight"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="bg-gradient-to-r from-hilo-gold via-hilo-red to-hilo-green bg-clip-text text-transparent">
                Play Something Legendary
              </span>
            </motion.h1>
            <motion.p
              className="text-gray-300/90 mt-3 text-lg max-w-2xl mx-auto"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              Fast, fair, and beautiful on-chain gaming. Pick a title and jump in.
            </motion.p>
          </div>

          {/* Controls */}
          <div className="px-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search games"
                  className="pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-hilo-gold/40"
                />
              </div>
              <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-sm rounded-md ${filter === 'all' ? 'bg-hilo-gold/20 text-hilo-gold' : 'text-gray-300 hover:text-white'}`}
                  title="All games"
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('live')}
                  className={`px-3 py-1.5 text-sm rounded-md ${filter === 'live' ? 'bg-hilo-gold/20 text-hilo-gold' : 'text-gray-300 hover:text-white'}`}
                  title="Live"
                >
                  Live
                </button>
                <button
                  onClick={() => setFilter('soon')}
                  className={`px-3 py-1.5 text-sm rounded-md ${filter === 'soon' ? 'bg-hilo-gold/20 text-hilo-gold' : 'text-gray-300 hover:text-white'}`}
                  title="Coming soon"
                >
                  Soon
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 text-gray-400">
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filters</span>
              </div>
              <button
                onClick={() => setLayout(prev => (prev === 'grid' ? 'comfortable' : 'grid'))}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white"
              >
                <LayoutGrid className="w-4 h-4" />
                {layout === 'grid' ? 'Compact' : 'Comfortable'}
              </button>
            </div>
          </div>
        </section>

        {/* Games Grid */}
        <div className={`px-4 grid ${layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'} gap-6 md:gap-8`}>
          <AnimatePresence>
          {filteredGames.map((game, index) => (
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
              exit={{ opacity: 0, y: 10 }}
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
                  <div className="w-16 h-16 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-inner">
                    <game.icon className="w-9 h-9 text-white/90" />
                  </div>
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
          </AnimatePresence>
        </div>

        {/* Bottom Info */}
        <motion.div
          className="mx-4 text-center mt-16 p-8 bg-gray-900/50 rounded-2xl border border-gray-700"
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
