import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { HiloLogo } from './HiloLogo'
import { WalletButton } from './WalletButton'

interface NavigationProps {
  className?: string
}

/**
 * Main Navigation Component
 * Responsive navigation with mobile menu and wallet integration
 * 
 * @param className - Additional CSS classes
 */
export const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/games', label: 'Games', icon: '🎮' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { path: '/provably-fair', label: 'Provably Fair', icon: '🛡️' },
    { path: '/about', label: 'About', icon: 'ℹ️' },
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <motion.nav
      className={`
        fixed top-0 left-0 right-0 z-50 bg-hilo-black/90 backdrop-blur-md border-b border-hilo-gray-light
        ${className}
      `}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <HiloLogo size="md" animated={false} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
                  ${isActive(item.path)
                    ? 'text-hilo-gold bg-hilo-gold/10 shadow-hilo-glow'
                    : 'text-gray-300 hover:text-hilo-gold hover:bg-hilo-gold/5'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Wallet Button */}
          <div className="hidden md:block">
            <WalletButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-hilo-gold hover:bg-hilo-gold/10 transition-all duration-300"
          >
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </motion.div>
          </button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          className="md:hidden"
          initial={false}
          animate={{
            height: isMobileMenuOpen ? 'auto' : 0,
            opacity: isMobileMenuOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className="py-4 space-y-2 border-t border-hilo-gray-light">
            {navItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: isMobileMenuOpen ? 1 : 0,
                  x: isMobileMenuOpen ? 0 : -20,
                }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300
                    ${isActive(item.path)
                      ? 'text-hilo-gold bg-hilo-gold/10 shadow-hilo-glow'
                      : 'text-gray-300 hover:text-hilo-gold hover:bg-hilo-gold/5'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            ))}
            
            {/* Mobile Wallet Button */}
            <motion.div
              className="pt-4 border-t border-hilo-gray-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isMobileMenuOpen ? 1 : 0,
                y: isMobileMenuOpen ? 0 : 20,
              }}
              transition={{ delay: 0.5 }}
            >
              <WalletButton className="w-full justify-center" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  )
}

export default Navigation
