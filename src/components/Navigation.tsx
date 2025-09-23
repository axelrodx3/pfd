import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, User, Settings, HelpCircle, ArrowUpDown, Home, Gamepad2, ShieldCheck, Info, Trophy } from 'lucide-react'
import { HiloLogo } from './HiloLogo'
import { RealWalletButton } from './RealWalletButton'
import { AdminPanel } from './AdminPanel'
import { SettingsModal } from './SettingsModal'
import { SupportModal } from './SupportModal'
import { AccountModal } from './AccountModal'
import { useWalletContext } from '../contexts/WalletContextWrapper'
import { useGameStore } from '../store/gameStore'
// Image assets
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - declared in src/types/images.d.ts
import solanaLogo from '../../solanalogo.png'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - declared in src/types/images.d.ts
import usdcLogo from '../../usdclogo.png'
import { WalletRequiredModal } from './WalletRequiredModal'

interface NavigationProps {
  className?: string
}
interface NavItem {
  path: string
  label: string
  icon: React.ElementType
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
  const [showWalletRequired, setShowWalletRequired] = useState(false)
  const [walletRequiredFeature, setWalletRequiredFeature] = useState('')
  const { userProfile, gameWalletBalance, connected } = useWalletContext()
  const { hiloTokens } = useGameStore()
  const location = useLocation()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const balanceRef = useRef<HTMLDivElement>(null)
  const [isBalanceOpen, setIsBalanceOpen] = useState(false)
  // Global listener to open wallet-required modal for gameplay guards
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as any
      setWalletRequiredFeature(detail?.feature || 'this feature')
      setShowWalletRequired(true)
    }
    window.addEventListener('request-wallet-for-feature', handler as EventListener)
    return () => window.removeEventListener('request-wallet-for-feature', handler as EventListener)
  }, [])

  const formatAmount = (value: number, maxFractionDigits: number = 4) => {
    const safe = Number.isFinite(value) ? value : 0
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxFractionDigits,
    }).format(safe)
  }

  // Compact formatter for large values (e.g., 12,345,678 -> 12.3M)
  const formatCompact = (value: number, maxFractionDigits: number = 2) => {
    const safe = Number.isFinite(value) ? value : 0
    // Use compact for values >= 10000; otherwise keep standard formatting
    if (Math.abs(safe) >= 10000) {
      return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        minimumFractionDigits: 0,
        maximumFractionDigits: maxFractionDigits,
      }).format(safe)
    }
    return formatAmount(safe, Math.min(4, Math.max(0, maxFractionDigits)))
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(targetNode)) {
        setIsDropdownOpen(false)
      }
      if (balanceRef.current && !balanceRef.current.contains(targetNode)) {
        setIsBalanceOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const navItems: NavItem[] = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/games', label: 'Games', icon: Gamepad2 },
    { path: '/provably-fair', label: 'Provably Fair', icon: ShieldCheck },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/about', label: 'About', icon: Info },
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const handleWalletRequiredFeature = (featureName: string) => {
    if (!connected) {
      setWalletRequiredFeature(featureName)
      setShowWalletRequired(true)
      setIsDropdownOpen(false)
      return false
    }
    return true
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
      <div className="w-full">
        <div className="flex items-center justify-between w-full h-16 px-6">
          {/* Left: Logo + text */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <HiloLogo size="md" animated={false} />
            </Link>
          </div>

          {/* Right: Balance, Wallet, Hamburger */}
          <div className="flex items-center gap-6">
            {/* Wallet and SOL Balance (desktop) */}
            <div className="hidden md:flex items-center gap-4">
            {/* Balance Dropdown */}
            <div className="relative" ref={balanceRef}>
              <button
                onClick={() => {
                  if (!connected) return
                  setIsBalanceOpen(prev => !prev)
                }}
                className="flex items-center gap-2 px-3 py-2 bg-hilo-gray border border-hilo-gray-light rounded-lg hover:bg-hilo-gold/10 transition-colors"
                title="View balances"
              >
                <span className="w-6 h-6 flex items-center justify-center shrink-0">
                  <img src={solanaLogo} alt="Solana" className="w-full h-full object-contain scale-110" />
                </span>
                <span className="text-sm text-gray-300">Balance:</span>
                <span className="text-sm font-medium text-hilo-gold">
                  {connected ? `${formatAmount(gameWalletBalance || 0, 4)} SOL` : '—'}
                </span>
                <span className="text-gray-400">▾</span>
              </button>

              <AnimatePresence>
                {isBalanceOpen && connected && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-64 bg-hilo-gray border border-hilo-gray-light rounded-xl shadow-2xl z-50"
                  >
                    <div className="py-2">
                      <div className="px-4 py-2 flex items-center gap-3 text-gray-200">
                        <span className="w-6 h-6 flex items-center justify-center shrink-0">
                          <img src={solanaLogo} alt="Solana" className="w-full h-full object-contain scale-110" />
                        </span>
                        <div className="flex-1 flex items-center justify-between">
                          <span>SOL</span>
                          <span
                            className="text-hilo-gold font-medium font-mono tabular-nums whitespace-nowrap text-right max-w-[9rem] overflow-hidden text-ellipsis"
                            title={`${formatAmount(gameWalletBalance || 0, 9)} SOL`}
                          >
                            {formatCompact(gameWalletBalance || 0, 2)}
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-2 flex items-center gap-3 text-gray-200">
                        <span className="w-6 h-6 flex items-center justify-center shrink-0 text-[16px] leading-none">🎲</span>
                        <div className="flex-1 flex items-center justify-between">
                          <span>HILO</span>
                          <span
                            className="text-hilo-gold font-medium font-mono tabular-nums whitespace-nowrap text-right max-w-[9rem] overflow-hidden text-ellipsis"
                            title={`${formatAmount(hiloTokens || 0, 9)} HILO`}
                          >
                            {formatCompact(hiloTokens || 0, 2)}
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-2 flex items-center gap-3 text-gray-200">
                        <span className="w-6 h-6 flex items-center justify-center shrink-0">
                          <img src={usdcLogo} alt="USDC" className="w-full h-full object-contain" />
                        </span>
                        <div className="flex-1 flex items-center justify-between">
                          <span>USDC</span>
                          <span
                            className="text-hilo-gold font-medium font-mono tabular-nums whitespace-nowrap text-right max-w-[9rem] overflow-hidden text-ellipsis"
                            title={`${formatAmount(0, 9)} USDC`}
                          >
                            {formatCompact(0, 2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
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
                        {/* Navigation Items */}
                        {navItems.map(item => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsDropdownOpen(false)}
                            className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors flex items-center gap-3"
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </Link>
                        ))}

                        {/* Separator */}
                        <div className="border-t border-hilo-gray-light my-2"></div>

                        <button
                          onClick={() => {
                            if (handleWalletRequiredFeature('Account')) {
                              setShowAccount(true)
                              setIsDropdownOpen(false)
                            }
                          }}
                          className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors flex items-center gap-3"
                        >
                          <User className="w-4 h-4" />
                          <span>Account</span>
                        </button>

                        <button
                          onClick={() => {
                            if (handleWalletRequiredFeature('Settings')) {
                              setShowSettings(true)
                              setIsDropdownOpen(false)
                            }
                          }}
                          className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors flex items-center gap-3"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>

                        <button
                          onClick={() => {
                            if (handleWalletRequiredFeature('Support')) {
                              setShowSupport(true)
                              setIsDropdownOpen(false)
                            }
                          }}
                          className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors flex items-center gap-3"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span>Support</span>
                        </button>

                        <button
                          onClick={() => {
                            if (handleWalletRequiredFeature('Wallet')) {
                              setIsDropdownOpen(false)
                              // Navigate to wallet page
                              window.location.href = '/wallet'
                            }
                          }}
                          className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-hilo-gold/10 transition-colors flex items-center gap-3"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                          <span>Wallet</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Menu Button (separate icon when desktop actions hidden) */}
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
                  <item.icon className="w-5 h-5" />
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

      {/* Wallet Required Modal */}
      <WalletRequiredModal
        isOpen={showWalletRequired}
        onClose={() => setShowWalletRequired(false)}
        featureName={walletRequiredFeature}
      />
    </motion.nav>
  )
}

export default Navigation
