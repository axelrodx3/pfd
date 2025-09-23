import React from 'react'
import { Wallet, ExternalLink, AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import { useWalletContext } from '../contexts/WalletContextWrapper'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

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
  const { connect, connecting } = useWalletContext() as any
  const { connected, wallets, select } = useWallet()
  const { setVisible } = useWalletModal()
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" title="Wallet Required">
      {/* Warning Message */}
      <div className="flex items-start gap-3 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-yellow-300 font-medium mb-1">Phantom Wallet Required</p>
          <p className="text-yellow-200 text-sm">
            You need to connect your Phantom wallet to access {featureName}. This ensures secure transactions and account management.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-4 mt-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">How to get started:</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-hilo-gold text-hilo-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="text-white font-medium">Install Phantom Wallet</p>
                <p className="text-gray-400 text-sm">Download and install the Phantom browser extension</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-hilo-gold text-hilo-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="text-white font-medium">Create or Import Wallet</p>
                <p className="text-gray-400 text-sm">Set up your wallet with a new seed phrase or import existing</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-hilo-gold text-hilo-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="text-white font-medium">Connect to HILO Casino</p>
                <p className="text-gray-400 text-sm">Click the wallet button to connect and start playing</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="space-y-3 mt-6">
        <a
          href="https://phantom.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 bg-hilo-black border border-hilo-gray-light rounded-lg hover:bg-hilo-gray transition-colors group"
        >
          <Wallet className="w-5 h-5 text-hilo-gold" />
          <div className="flex-1">
            <p className="text-white font-medium group-hover:text-hilo-gold transition-colors">Install Phantom Wallet</p>
            <p className="text-gray-400 text-sm">phantom.app</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-hilo-gold transition-colors" />
        </a>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-hilo-gray-light text-white rounded-lg hover:bg-hilo-gray transition-colors"
        >
          Got it
        </button>
        <button
          onClick={async () => {
            try {
              // 1) Try programmatic Phantom connect for reliability
              const phantom = wallets?.find(w => w.adapter?.name === 'Phantom')
              if (phantom && select) {
                select(phantom.adapter.name)
                await connect()
                onClose()
                return
              }

              // 2) Otherwise, open the wallet adapter modal (same UX as header button)
              if (setVisible) {
                setVisible(true)
                onClose()
                return
              }

              // 3) Last resort: plain connect
              await connect()
              onClose()
            } catch (e) {
              // keep modal open on error
            }
          }}
          disabled={!!connecting || connected}
          className="flex-1 px-4 py-3 bg-hilo-gold text-hilo-black rounded-lg hover:bg-hilo-gold-dark transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {connected ? 'Connected' : connecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>
    </Modal>
  )
}

export default WalletRequiredModal



