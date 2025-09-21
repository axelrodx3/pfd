import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Mail, Phone, HelpCircle, ExternalLink } from 'lucide-react'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const supportOptions = [
    {
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      icon: MessageCircle,
      action: () => {
        // In a real app, this would open a chat widget
        alert('Live chat would open here')
      }
    },
    {
      title: 'Email Support',
      description: 'Send us an email and we\'ll respond within 24 hours',
      icon: Mail,
      action: () => {
        window.open('mailto:support@hilocasino.com?subject=Support Request')
      }
    },
    {
      title: 'FAQ',
      description: 'Find answers to common questions',
      icon: HelpCircle,
      action: () => {
        // In a real app, this would navigate to FAQ page
        alert('FAQ page would open here')
      }
    },
    {
      title: 'Discord Community',
      description: 'Join our Discord for community support',
      icon: ExternalLink,
      action: () => {
        window.open('https://discord.gg/hilocasino', '_blank')
      }
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-hilo-gray border border-hilo-gray-light rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-hilo-gray-light">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-hilo-gold" />
                Support
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-hilo-gray-light transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-300 text-sm">
                Need help? Choose one of the support options below:
              </p>

              {supportOptions.map((option, index) => {
                const IconComponent = option.icon
                return (
                  <motion.button
                    key={option.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={option.action}
                    className="w-full p-4 bg-hilo-black/50 border border-hilo-gray-light rounded-xl hover:bg-hilo-gold/10 hover:border-hilo-gold/30 transition-all duration-300 text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-hilo-gold/20 rounded-lg group-hover:bg-hilo-gold/30 transition-colors">
                        <IconComponent className="w-5 h-5 text-hilo-gold" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1">{option.title}</h3>
                        <p className="text-gray-400 text-sm">{option.description}</p>
                      </div>
                    </div>
                  </motion.button>
                )
              })}

              {/* Additional Info */}
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                <div className="text-blue-300 text-sm">
                  <strong>Response Times:</strong>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>• Live Chat: Instant</li>
                    <li>• Email: Within 24 hours</li>
                    <li>• Discord: Community support</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SupportModal
