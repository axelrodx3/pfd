import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, User, Settings, HelpCircle, ArrowUpDown } from 'lucide-react'
import { HiloLogo } from './HiloLogo'
import { RealWalletButton } from './RealWalletButton'
import { AdminPanel } from './AdminPanel'
import { SettingsModal } from './SettingsModal'
import { SupportModal } from './SupportModal'
import { AccountModal } from './AccountModal'
import { useWalletContext } from '../contexts/WalletContextWrapper'

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const { userProfile, gameWalletBalance } = useWalletContext()
  const location = useLocation()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/games', label: 'Games', icon: '🎮' },
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
        fixed top-0 left-0 right-0 z-50 bg-hilo-black/80 backdrop-blur-xl border-b border-hilo-gray-light/50
        shadow-2xl shadow-hilo-gold/10
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
                  <div className="hidden md:flex items-center justify-center flex-1 space-x-6">
                    {navItems.map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                          relative overflow-hidden group
                          ${
                            isActive(item.path)
                              ? 'text-hilo-gold bg-hilo-gold/10 shadow-hilo-glow'
                              : 'text-gray-300 hover:text-hilo-gold hover:bg-hilo-gold/5'
                          }
                        `}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                        {/* Hover underline effect */}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-hilo-gold transition-all duration-300 group-hover:w-full"></span>
                      </Link>
                    ))}
                  </div>

          {/* Wallet and SOL Balance */}
          <div className="hidden md:flex items-center gap-4">
            {/* SOL Balance Display */}
            {gameWalletBalance !== undefined && (
              <div className="flex items-center gap-2 px-3 py-2 bg-hilo-gray border border-hilo-gray-light rounded-lg">
                <span className="text-sm text-gray-300">Balance:</span>
                <span className="text-sm font-medium text-hilo-gold">
                  {gameWalletBalance.toFixed(4)} SOL
                </span>
              </div>
            )}
            
            {/* Admin Panel Button */}
            {userProfile?.isAdmin && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
              >
                <span className="text-sm">🛡️</span>
                <span className="text-sm font-medium">Admin</span>
              </button>
            )}
            
            {/* Wallet Connect Button */}
            <RealWalletButton />
            
            {/* Hamburger Menu Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-2 rounded-lg text-gray-300 hover:text-hilo-gold hover:bg-hilo-gold/10 transition-all duration-300"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-hilo-gray border border-hilo-gray-light rounded-xl shadow-2xl z-50"
                  >
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowAccount(true)
                          setIsDropdownOpen(false)
                        }}
                        className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors flex items-center gap-3"
                      >
                        <User className="w-4 h-4" />
                        <span>Account</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowSettings(true)
                          setIsDropdownOpen(false)
                        }}
                        className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors flex items-center gap-3"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowSupport(true)
                          setIsDropdownOpen(false)
                        }}
                        className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors flex items-center gap-3"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>Support</span>
                      </button>
                      
                      <Link
                        to="/wallet"
                        onClick={() => setIsDropdownOpen(false)}
                        className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors flex items-center gap-3"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                        <span>Wallet</span>
                      </Link>
                      
                      <Link
                        to="/leaderboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors flex items-center gap-3"
                      >
                        <span>Leaderboard</span>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                    ${
                      isActive(item.path)
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

            {/* Mobile Wallet and Balance */}
            <motion.div
              className="pt-4 border-t border-hilo-gray-light space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: isMobileMenuOpen ? 1 : 0,
                y: isMobileMenuOpen ? 0 : 20,
              }}
              transition={{ delay: 0.5 }}
            >
              {/* SOL Balance Display */}
              {gameWalletBalance !== undefined && (
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-hilo-gray border border-hilo-gray-light rounded-lg">
                  <span className="text-sm text-gray-300">Balance:</span>
                  <span className="text-sm font-medium text-hilo-gold">
                    {gameWalletBalance.toFixed(4)} SOL
                  </span>
                </div>
              )}
              
              {userProfile?.isAdmin && (
                <button
                  onClick={() => {
                    setShowAdminPanel(true)
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-sm">🛡️</span>
                  <span className="text-sm font-medium">Admin Panel</span>
                </button>
              )}
              
              <RealWalletButton className="w-full justify-center" />
              
              {/* Mobile Menu Options */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowAccount(true)
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-hilo-gray border border-hilo-gray-light rounded-lg hover:bg-hilo-gold/10 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-300" />
                  <span className="text-sm text-gray-300">Account</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowSettings(true)
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-hilo-gray border border-hilo-gray-light rounded-lg hover:bg-hilo-gold/10 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-300" />
                  <span className="text-sm text-gray-300">Settings</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowSupport(true)
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-hilo-gray border border-hilo-gray-light rounded-lg hover:bg-hilo-gold/10 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-gray-300" />
                  <span className="text-sm text-gray-300">Support</span>
                </button>
                
                <Link
                  to="/wallet"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-hilo-gray border border-hilo-gray-light rounded-lg hover:bg-hilo-gold/10 transition-colors"
                >
                  <ArrowUpDown className="w-4 h-4 text-gray-300" />
                  <span className="text-sm text-gray-300">Wallet</span>
                </Link>
                
                <Link
                  to="/leaderboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-hilo-gray border border-hilo-gray-light rounded-lg hover:bg-hilo-gold/10 transition-colors"
                >
                  <span className="text-sm text-gray-300">Leaderboard</span>
                </Link>
                
                <div className="col-span-2"></div> {/* Empty cell to balance the grid */}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Admin Panel */}
      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
      />

      {/* Account Modal */}
      <AccountModal
        isOpen={showAccount}
        onClose={() => setShowAccount(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Support Modal */}
      <SupportModal
        isOpen={showSupport}
        onClose={() => setShowSupport(false)}
      />
    </motion.nav>
  )
}

export default Navigation
