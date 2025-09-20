import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900/90 border-green-500/50 text-green-100'
      case 'error':
        return 'bg-red-900/90 border-red-500/50 text-red-100'
      case 'warning':
        return 'bg-yellow-900/90 border-yellow-500/50 text-yellow-100'
      case 'info':
        return 'bg-blue-900/90 border-blue-500/50 text-blue-100'
      default:
        return 'bg-gray-900/90 border-gray-500/50 text-gray-100'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        relative max-w-sm w-full bg-opacity-90 backdrop-blur-sm rounded-lg border p-4 shadow-lg
        ${getStyles()}
      `}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{title}</h4>
          {message && (
            <p className="text-xs opacity-90 mt-1">{message}</p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

export interface ToastContainerProps {
  toasts: ToastProps[]
  onClose: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Toast hook for easy usage
export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (title: string, message?: string) => 
    addToast({ type: 'success', title, message })
  
  const error = (title: string, message?: string) => 
    addToast({ type: 'error', title, message })
  
  const warning = (title: string, message?: string) => 
    addToast({ type: 'warning', title, message })
  
  const info = (title: string, message?: string) => 
    addToast({ type: 'info', title, message })

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}
