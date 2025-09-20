import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { HiloLogo } from '../components/HiloLogo'
import { WalletButton } from '../components/WalletButton'

/**
 * Home Page Component
 * Hero section with HILO branding and call-to-action
 */
export const HomePage: React.FC = () => {
  const features = [
    {
      icon: '🎲',
      title: 'Provably Fair',
      description: 'Every roll is verifiable and transparent'
    },
    {
      icon: '⚡',
      title: 'Instant Payouts',
      description: 'Win instantly with no waiting periods'
    },
    {
      icon: '🔒',
      title: 'Secure & Safe',
      description: 'Your funds are protected with bank-level security'
    },
    {
      icon: '🏆',
      title: 'Leaderboards',
      description: 'Compete with players worldwide'
    }
  ]

  const stats = [
    { number: '$2.5M+', label: 'Won Today' },
    { number: '15K+', label: 'Active Players' },
    { number: '99.9%', label: 'Uptime' },
    { number: '50K+', label: 'Games Played' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-hilo-black via-hilo-gray to-hilo-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1),transparent_50%)]" />
        
        {/* Floating Dice */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-6xl opacity-10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                repeatType: 'reverse',
                delay: i * 0.5,
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
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <span className="text-hilo-gold">Bet High.</span>{' '}
            <span className="text-hilo-red">Bet Low.</span>{' '}
            <span className="text-hilo-green">Win Big.</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Experience the thrill of dice gaming with our provably fair system. 
            No tricks, no gimmicks - just pure, transparent gameplay.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Link to="/game">
              <motion.button
                className="btn-hilo-primary text-lg px-8 py-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🎲 Start Playing
              </motion.button>
            </Link>
            
            <WalletButton className="text-lg px-8 py-4" />
          </motion.div>

          {/* Warning */}
          <motion.div
            className="mt-8 p-4 bg-hilo-red/10 border border-hilo-red/30 rounded-lg max-w-md mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <p className="text-hilo-red text-sm font-semibold">
              ⚠️ This is a mock gambling site for demonstration purposes only
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-hilo-gray">
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
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-3xl md:text-4xl font-bold text-hilo-gold mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
              Experience the future of online gaming with cutting-edge technology 
              and transparent gameplay.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card-hilo text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-hilo-gold mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
