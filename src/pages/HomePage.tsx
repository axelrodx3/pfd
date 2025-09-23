import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { HiloLogo } from '../components/HiloLogo'
import { WalletButton } from '../components/WalletButton'
import { LiveFeed } from '../components/LiveFeed'

/**
 * Home Page Component
 * Hero section with HILO branding and call-to-action
 */
export const HomePage: React.FC = () => {
  const features = [
    {
      icon: '🎲',
      title: 'Provably Fair',
      description: 'Every roll is verifiable and transparent',
    },
    {
      icon: '👑',
      title: 'VIP Tiers',
      description: 'Bronze, Silver, Gold, and Diamond levels',
    },
    {
      icon: '🎯',
      title: 'Daily Challenges',
      description: 'Complete challenges to earn bonus tokens',
    },
    {
      icon: '⚡',
      title: 'Auto-Roll',
      description: 'Set up automatic rolling with stop conditions',
    },
    {
      icon: '🔊',
      title: 'Sound Effects',
      description: 'Immersive audio with customizable settings',
    },
    {
      icon: '🎨',
      title: 'Dice Skins',
      description: 'Classic, Neon, and Gold themed dice',
    },
    {
      icon: '📊',
      title: 'Live Statistics',
      description: 'Track streaks, wins, and performance',
    },
    {
      icon: '🏆',
      title: 'Leaderboards',
      description: 'Compete with players worldwide',
    },
  ]

  const stats = [
    { number: '$2.5M+', label: 'Won Today' },
    { number: '15K+', label: 'Active Players' },
    { number: '99.9%', label: 'Uptime' },
    { number: '50K+', label: 'Games Played' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-hilo-black via-hilo-gray to-hilo-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1),transparent_50%)]" />

        {/* Floating Dice */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl md:text-6xl opacity-5"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 180, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                repeatType: 'reverse',
                delay: i * 1.5,
                ease: "easeInOut"
              }}
            >
              🎲
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="mb-8"
          >
            <HiloLogo size="xl" animated={true} />
          </motion.div>

          {/* Tagline */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <span className="bg-gradient-to-r from-hilo-gold via-hilo-red to-hilo-green bg-clip-text text-transparent animate-gradient-x">
              HIGH OR LOW?
            </span>
          </motion.h1>

          {/* CTA Button */}
          <motion.div
            className="flex justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Link to="/games">
              <motion.button
                className="flex items-center gap-3 px-8 py-4 bg-hilo-gold text-hilo-black rounded-lg font-bold text-lg shadow-lg hover:shadow-hilo-glow-strong transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-xl">🎲</span>
                <span>Start Playing</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Warning removed for cleaner landing page */}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-hilo-gray/50 via-hilo-black to-hilo-gray/50 border-y border-hilo-gray-light/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center p-4 rounded-xl bg-hilo-gray/30 border border-hilo-gray-light/20 hover:border-hilo-gold/30 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-hilo-gold to-hilo-gold-dark bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300 text-sm md:text-base font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-hilo-black to-hilo-gray/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-hilo-gold mb-4">
              Why Choose HILO?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the future of online gaming with cutting-edge
              technology and transparent gameplay.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card-hilo text-center group hover:shadow-hilo-glow transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-bold text-hilo-gold mb-3 group-hover:text-hilo-gold-dark transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Feed Section */}
      <section className="py-24 bg-gradient-to-b from-hilo-gray/20 via-hilo-gray to-hilo-gray/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-hilo-gold mb-4">
              Live Wins Feed
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Watch real-time wins from players around the world
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <LiveFeed />

            <motion.div
              className="bg-gray-900 rounded-lg p-6"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-hilo-gold mb-4">
                Enhanced Features
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🎲</div>
                  <div>
                    <div className="font-semibold text-white">
                      Multiple Dice Skins
                    </div>
                    <div className="text-sm text-gray-400">
                      Classic, Neon, and Gold themes
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🔊</div>
                  <div>
                    <div className="font-semibold text-white">
                      Sound Effects
                    </div>
                    <div className="text-sm text-gray-400">
                      Immersive audio with mute option
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🎉</div>
                  <div>
                    <div className="font-semibold text-white">
                      Confetti Animations
                    </div>
                    <div className="text-sm text-gray-400">
                      Celebrate your big wins
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📊</div>
                  <div>
                    <div className="font-semibold text-white">
                      Detailed Statistics
                    </div>
                    <div className="text-sm text-gray-400">
                      Track your streaks and performance
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
