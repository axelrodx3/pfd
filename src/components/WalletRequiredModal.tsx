import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet, ExternalLink, AlertTriangle } from 'lucide-react'

interface WalletRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  featureName?: string
}

export const WalletRequiredModal: React.FC<WalletRequiredModalProps> = ({
  isOpen,
  onClose,
  featureName = 'this feature'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-hilo-gray border border-hilo-gray-light rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-hilo-gray-light">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Wallet Required</h2>
                  <p className="text-sm text-gray-400">Connect your wallet to access {featureName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Warning Message */}
              <div className="flex items-start gap-3 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-300 font-medium mb-1">
                    Phantom Wallet Required
                  </p>
                  <p className="text-yellow-200 text-sm">
                    You need to connect your Phantom wallet to access {featureName}. This ensures secure transactions and account management.
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">How to get started:</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-hilo-gold text-hilo-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="text-white font-medium">Install Phantom Wallet</p>
                        <p className="text-gray-400 text-sm">
                          Download and install the Phantom browser extension
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-hilo-gold text-hilo-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="text-white font-medium">Create or Import Wallet</p>
                        <p className="text-gray-400 text-sm">
                          Set up your wallet with a new seed phrase or import existing
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-hilo-gold text-hilo-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="text-white font-medium">Connect to HILO Casino</p>
                        <p className="text-gray-400 text-sm">
                          Click the wallet button to connect and start playing
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="space-y-3">
                <a
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-hilo-black border border-hilo-gray-light rounded-lg hover:bg-hilo-gray transition-colors group"
                >
                  <Wallet className="w-5 h-5 text-hilo-gold" />
                  <div className="flex-1">
                    <p className="text-white font-medium group-hover:text-hilo-gold transition-colors">
                      Install Phantom Wallet
                    </p>
                    <p className="text-gray-400 text-sm">phantom.app</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-hilo-gold transition-colors" />
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-hilo-gray-light">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-hilo-gray-light text-white rounded-lg hover:bg-hilo-gray transition-colors"
                >
                  Got it
                </button>
                <button
                  onClick={() => {
                    // Trigger wallet connection
                    const walletButton = document.querySelector('[data-wallet-button]') as HTMLButtonElement
                    if (walletButton) {
                      walletButton.click()
                    }
                    onClose()
                  }}
                  className="flex-1 px-4 py-3 bg-hilo-gold text-hilo-black rounded-lg hover:bg-hilo-gold-dark transition-colors font-medium"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default WalletRequiredModal



