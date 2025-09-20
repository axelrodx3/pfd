import React from 'react'
import { motion } from 'framer-motion'
import { HiloLogo } from './HiloLogo'

interface FooterProps {
  className?: string
}

/**
 * Footer Component
 * Social links and disclaimer for mock gambling site
 *
 * @param className - Additional CSS classes
 */
export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const socialLinks = [
    { name: 'Twitter', icon: '𝕏', url: 'https://twitter.com/hilocasino' },
    { name: 'Discord', icon: '💬', url: 'https://discord.gg/hilocasino' },
    { name: 'Telegram', icon: '📱', url: 'https://t.me/hilocasino' },
  ]

  const footerLinks = [
    { name: 'Terms of Service', url: '/terms' },
    { name: 'Privacy Policy', url: '/privacy' },
    { name: 'Responsible Gaming', url: '/responsible' },
    { name: 'Contact', url: '/contact' },
  ]

  return (
    <footer
      className={`bg-hilo-gray border-t border-hilo-gray-light ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <HiloLogo size="md" animated={false} className="mb-4" />
              <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-md">
                HILO Casino - The ultimate dice gaming experience. Bet high, bet
                low, win big with our provably fair system.
                <span className="block mt-2 text-hilo-red font-semibold">
                  ⚠️ This is a mock gambling site for demonstration purposes
                  only.
                </span>
              </p>
            </motion.div>
          </div>

          {/* Quick Links */}
          <div>
            <motion.h3
              className="text-hilo-gold font-semibold text-lg mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Quick Links
            </motion.h3>
            <motion.ul
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              {footerLinks.map((link, index) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <a
                    href={link.url}
                    className="text-gray-400 hover:text-hilo-gold transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Social Links */}
          <div>
            <motion.h3
              className="text-hilo-gold font-semibold text-lg mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Follow Us
            </motion.h3>
            <motion.div
              className="flex space-x-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    w-10 h-10 bg-hilo-gray-light rounded-lg flex items-center justify-center
                    text-gray-400 hover:text-hilo-gold hover:bg-hilo-gold/10
                    transition-all duration-300 hover:scale-110
                  "
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <span className="text-lg">{social.icon}</span>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="mt-8 pt-8 border-t border-hilo-gray-light"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-500 text-sm">
              © 2024 HILO Casino. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>🔒 SSL Secured</span>
              <span>🛡️ Provably Fair</span>
              <span>🎲 100% Random</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
