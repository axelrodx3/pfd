import React, { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  panelClassName?: string
  title?: string
  zIndexClass?: string
}

const maxWidthClass: Record<NonNullable<ModalProps['maxWidth']>, string> = {
  sm: 'md:max-w-sm',
  md: 'md:max-w-md',
  lg: 'md:max-w-lg',
  xl: 'md:max-w-xl',
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'md',
  panelClassName = '',
  title,
  zIndexClass = 'z-[120]',
}) => {
  const panelRef = useRef<HTMLDivElement>(null)

  // ESC to close
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Scroll lock
  useEffect(() => {
    if (!isOpen) return
    const original = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = original
    }
  }, [isOpen])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="overlay-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 ${zIndexClass}`}
        >
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/65 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Centering - clicking anywhere outside the panel closes */}
          <div className="fixed inset-0 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
              key="panel"
              ref={panelRef}
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              className={`relative w-full ${maxWidthClass[maxWidth]} 
                rounded-2xl border border-white/10 shadow-2xl
                bg-[#0e0f12]/90 backdrop-blur-xl max-h-[90vh] overflow-y-auto no-scrollbar
                ${panelClassName}
              `}
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                aria-label="Close"
                onClick={onClose}
                className="absolute right-3 top-3 p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Optional Header */}
              {title && (
                <div className="px-5 md:px-6 pt-5 md:pt-6 pb-4 border-b border-white/10">
                  <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
                </div>
              )}

              {/* Content */}
              <div className={`${title ? 'pt-4' : 'pt-5 md:pt-6'} px-5 md:px-6 pb-5 md:pb-6`}>
                {children}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default Modal


