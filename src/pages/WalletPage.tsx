import React, { useState } from 'react'
import { motion } from 'framer-motion'
import SolanaWallet from '../components/SolanaWallet'
import SOLTransfer from '../components/SOLTransfer'

const WalletPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wallet' | 'transfer'>('wallet')
  const [authStatus, setAuthStatus] = useState<{
    isAuthenticated: boolean
    publicKey: string | null
  }>({
    isAuthenticated: false,
    publicKey: null,
  })

  const handleAuthSuccess = (publicKey: string, signature: string) => {
    setAuthStatus({
      isAuthenticated: true,
      publicKey,
    })
  }

  const handleAuthError = (error: string) => {
    console.error('Authentication error:', error)
    setAuthStatus({
      isAuthenticated: false,
      publicKey: null,
    })
  }

  const handleTransferSuccess = (signature: string) => {
    console.log('Transfer successful:', signature)
  }

  const handleTransferError = (error: string) => {
    console.error('Transfer error:', error)
  }

  return (
    <div className="min-h-screen bg-hilo-black py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-hilo-gold mb-4">
            Solana Wallet
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Connect your Phantom, Solflare, or Backpack wallet to authenticate
            and manage your SOL securely
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-gray-800 rounded-lg p-1 inline-flex">
            <button
              onClick={() => setActiveTab('wallet')}
              className={`px-6 py-3 rounded-md font-semibold transition-all duration-300 ${
                activeTab === 'wallet'
                  ? 'bg-hilo-gold text-hilo-black'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Wallet Connection
            </button>
            <button
              onClick={() => setActiveTab('transfer')}
              className={`px-6 py-3 rounded-md font-semibold transition-all duration-300 ${
                activeTab === 'transfer'
                  ? 'bg-hilo-gold text-hilo-black'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              SOL Transfer
            </button>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center"
        >
          {activeTab === 'wallet' ? (
            <SolanaWallet
              onAuthSuccess={handleAuthSuccess}
              onAuthError={handleAuthError}
            />
          ) : (
            <SOLTransfer
              onTransferSuccess={handleTransferSuccess}
              onTransferError={handleTransferError}
            />
          )}
        </motion.div>

        {/* Security Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              🔒 Security & Trust
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-hilo-gold mb-4">
                  What We Do
                </h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✅</span>
                    <span>
                      Request minimal permissions - only signMessage for
                      authentication
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✅</span>
                    <span>
                      Use nonce-based authentication to prevent replay attacks
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✅</span>
                    <span>Implement rate limiting to prevent abuse</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✅</span>
                    <span>
                      Use HTTPS and security headers for all communications
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-hilo-gold mb-4">
                  What We Don&apos;t Do
                </h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-red-400 mr-2">❌</span>
                    <span>Never request access to your private keys</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-400 mr-2">❌</span>
                    <span>
                      Never auto-connect or connect without explicit permission
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-400 mr-2">❌</span>
                    <span>
                      Never sign transactions without your explicit approval
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-400 mr-2">❌</span>
                    <span>Never store your private keys or sensitive data</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">
                🛡️ Phantom Safety
              </h4>
              <p className="text-blue-200 text-sm">
                This implementation follows all Solana security best practices
                to ensure Phantom and other wallets will not show unsafe site
                warnings. We only request the minimum permissions necessary and
                never attempt to access your funds without explicit consent.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Authentication Status */}
        {authStatus.isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></span>
              <span className="text-sm font-medium">
                Authenticated: {authStatus.publicKey?.slice(0, 8)}...
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default WalletPage
