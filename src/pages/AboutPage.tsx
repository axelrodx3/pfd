import React from 'react'
import { motion } from 'framer-motion'

/**
 * About Page Component
 * Disclaimer and information about the mock gambling site
 */
export const AboutPage: React.FC = () => {
  const features = [
    {
      icon: '🎯',
      title: 'Fair Gaming',
      description:
        'Provably fair system ensures every game is transparent and verifiable',
    },
    {
      icon: '🔒',
      title: 'Secure Platform',
      description: 'Bank-level security protects your data and transactions',
    },
    {
      icon: '⚡',
      title: 'Instant Payouts',
      description: 'Win instantly with no waiting periods or delays',
    },
    {
      icon: '📱',
      title: 'Mobile First',
      description: 'Optimized for all devices with responsive design',
    },
    {
      icon: '🏆',
      title: 'Leaderboards',
      description: 'Compete with players worldwide and climb the ranks',
    },
    {
      icon: '🎨',
      title: 'Modern UI',
      description: 'Beautiful, intuitive interface with smooth animations',
    },
  ]

  const team = [
    {
      name: 'Alex Developer',
      role: 'Lead Developer',
      avatar: '👨‍💻',
      description: 'Full-stack developer with 5+ years experience',
    },
    {
      name: 'Sarah Designer',
      role: 'UI/UX Designer',
      avatar: '👩‍🎨',
      description: 'Creative designer specializing in gaming interfaces',
    },
    {
      name: 'Mike Security',
      role: 'Security Expert',
      avatar: '👨‍🔒',
      description: 'Cybersecurity specialist ensuring platform safety',
    },
  ]

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
            ℹ️ About HILO Casino
          </h1>
          <p className="text-xl text-gray-300">
            Learn more about our platform and mission
          </p>
        </motion.div>

        {/* Important Disclaimer */}
        <motion.div
          className="card-hilo-glow mb-12 border-2 border-hilo-red"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-3xl font-bold text-hilo-red mb-4">
              IMPORTANT DISCLAIMER
            </h2>
            <div className="text-lg text-gray-300 space-y-4 max-w-4xl mx-auto">
              <p>
                <strong>
                  HILO Casino is a MOCK gambling website created for
                  demonstration purposes only.
                </strong>
              </p>
              <p>
                This platform is designed to showcase modern web development
                techniques, including React, TypeScript, Framer Motion, and
                provably fair gaming concepts.
              </p>
              <p>
                <strong>No real money is involved.</strong> All transactions,
                balances, and winnings are simulated and have no monetary value.
              </p>
              <p>
                This project is intended for educational and portfolio purposes
                only. Please do not use this as a basis for real gambling
                activities.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          className="card-hilo mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-hilo-gold mb-6 text-center">
            Our Mission
          </h2>
          <div className="text-center max-w-4xl mx-auto">
            <p className="text-xl text-gray-300 leading-relaxed mb-6">
              HILO Casino was created to demonstrate the power of modern web
              technologies in creating engaging, interactive gaming experiences.
              Our goal is to showcase best practices in:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-hilo-green">✓</span>
                  <span>React & TypeScript development</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-hilo-green">✓</span>
                  <span>Framer Motion animations</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-hilo-green">✓</span>
                  <span>Tailwind CSS styling</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-hilo-green">✓</span>
                  <span>State management with Zustand</span>
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-hilo-green">✓</span>
                  <span>Provably fair gaming concepts</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-hilo-green">✓</span>
                  <span>Responsive design principles</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-hilo-green">✓</span>
                  <span>Modern testing practices</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-hilo-green">✓</span>
                  <span>Clean, maintainable code</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-hilo-gold mb-8 text-center">
            Platform Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card-hilo text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-hilo-gold mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Team */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-hilo-gold mb-8 text-center">
            Development Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                className="card-hilo text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-6xl mb-4">{member.avatar}</div>
                <h3 className="text-xl font-semibold text-hilo-gold mb-1">
                  {member.name}
                </h3>
                <p className="text-hilo-green font-medium mb-2">
                  {member.role}
                </p>
                <p className="text-gray-400 text-sm">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Technology Stack */}
        <motion.div
          className="card-hilo-glow"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <h2 className="text-3xl font-bold text-hilo-gold mb-8 text-center">
            Technology Stack
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'React', icon: '⚛️', color: 'text-blue-400' },
              { name: 'TypeScript', icon: '🔷', color: 'text-blue-500' },
              { name: 'Vite', icon: '⚡', color: 'text-yellow-400' },
              { name: 'Tailwind CSS', icon: '🎨', color: 'text-cyan-400' },
              { name: 'Framer Motion', icon: '🎬', color: 'text-pink-400' },
              { name: 'Zustand', icon: '🐻', color: 'text-orange-400' },
              { name: 'Vitest', icon: '🧪', color: 'text-green-400' },
              { name: 'ESLint', icon: '🔍', color: 'text-purple-400' },
            ].map((tech, index) => (
              <motion.div
                key={tech.name}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 1.4 + index * 0.05 }}
                whileHover={{ scale: 1.1 }}
              >
                <div className="text-4xl mb-2">{tech.icon}</div>
                <div className={`font-semibold ${tech.color}`}>{tech.name}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
        >
          <h3 className="text-2xl font-bold text-hilo-gold mb-4">
            Ready to Explore?
          </h3>
          <p className="text-gray-300 mb-6">
            Experience our mock gambling platform and see what modern web
            development can create!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="/game"
              className="btn-hilo-primary text-lg px-8 py-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🎲 Try the Game
            </motion.a>
            <motion.a
              href="/provably-fair"
              className="btn-hilo-outline text-lg px-8 py-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🛡️ Learn About Fair Gaming
            </motion.a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AboutPage
