import React, { useEffect, useRef, useId } from 'react'
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
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

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

  // Manage focus: save previous, focus first, trap Tab, and restore on close
  useEffect(() => {
    if (!isOpen) return
    previouslyFocusedRef.current = document.activeElement as HTMLElement

    // Focus first focusable element or panel itself
    const focusFirstElement = () => {
      const panel = panelRef.current
      if (!panel) return
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      const first = Array.from(focusable).find(el => !el.hasAttribute('inert') && el.offsetParent !== null)
      ;(first || panel).focus()
    }
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => el.offsetParent !== null)
      if (focusable.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement
      if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      }
    }
    // Defer focus until after mount/animation tick
    const t = setTimeout(focusFirstElement, 0)
    window.addEventListener('keydown', trap)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', trap)
      // Restore focus
      const prev = previouslyFocusedRef.current
      if (prev && typeof prev.focus === 'function') {
        try { prev.focus() } catch {}
      }
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
              aria-labelledby={title ? titleId : undefined}
              className={`relative w-full ${maxWidthClass[maxWidth]} 
                rounded-2xl border border-white/10 shadow-2xl
                bg-[#0e0f12]/90 backdrop-blur-xl max-h-[90vh] overflow-y-auto no-scrollbar
                ${panelClassName}
              `}
              onClick={e => e.stopPropagation()}
              tabIndex={-1}
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
                  <h2 id={titleId} className="text-xl md:text-2xl font-bold text-white">{title}</h2>
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


