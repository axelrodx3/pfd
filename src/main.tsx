import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { errorReporter } from './lib/errorReporting'

// Comprehensive production debugging
console.log('🚀 HILO Casino - Main.tsx loaded')
console.log('Environment:', {
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  BASE_URL: import.meta.env.BASE_URL,
  VITE_SOLANA_NETWORK: import.meta.env.VITE_SOLANA_NETWORK,
  VITE_SOLANA_RPC_URL: import.meta.env.VITE_SOLANA_RPC_URL
})

// Enhanced comprehensive error handling for production debugging
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', event.error)
  console.error('🚨 Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  })

  // Report the error using our error reporting system
  if (event.error) {
    const isTestError = event.error.message?.includes('Test:') || event.message?.includes('Test:')
    const errorType = isTestError ? 'test_error' : 'component_error'
    const level = isTestError ? 'low' : 'critical'
    
    errorReporter.reportError(event.error, errorType, level, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      message: event.message
    })
  }

  // Handle test errors gracefully
  if (event.error?.message?.includes('Test:') || event.message?.includes('Test:')) {
    console.log('✅ Test error handled gracefully, not crashing the app')
    return
  }

  // Only show error UI for real errors, not test errors
  const root = document.getElementById('root')
  if (root && !root.innerHTML.includes('Error') && !event.error?.message?.includes('Test:')) {
    root.innerHTML = `
      <div style="padding: 20px; color: red; background: white; min-height: 100vh; font-family: monospace;">
        <h1>Application Error</h1>
        <p><strong>Error:</strong> ${event.error?.message || 'Unknown error'}</p>
        <p><strong>File:</strong> ${event.filename}:${event.lineno}:${event.colno}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Stack:</strong></p>
        <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${event.error?.stack || 'No stack trace'}</pre>
        <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">
          Reload Page
        </button>
      </div>
    `
  }
})

// Enhanced unhandled promise rejection handling
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason)
  console.error('🚨 Promise rejection details:', {
    reason: event.reason,
    promise: event.promise,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  })

  // Report the promise rejection using our error reporting system
  const isTestError = typeof event.reason === 'string' && event.reason.includes('Test:')
  const errorType = isTestError ? 'test_error' : 'promise_rejection'
  const level = isTestError ? 'low' : 'high'
  
  errorReporter.reportPromiseRejection(event.reason, {
    promise: event.promise,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  })

  // Try to recover from common promise rejection scenarios
  const reason = event.reason
  
  // Handle network-related promise rejections
  if (reason && typeof reason === 'object') {
    if (reason.message && reason.message.includes('fetch')) {
      console.warn('🌐 Network error detected, attempting recovery...')
      errorReporter.reportNetworkError(new Error(reason.message), { originalReason: reason })
      // Could implement retry logic here
    }
    
    if (reason.message && reason.message.includes('wallet')) {
      console.warn('💳 Wallet error detected, attempting recovery...')
      errorReporter.reportWalletError(new Error(reason.message), { originalReason: reason })
      // Could implement wallet reconnection logic here
    }
  }

  // Prevent the default behavior (which would log to console)
  // Only do this for known recoverable errors
  if (reason && typeof reason === 'string' && reason.includes('Test:')) {
    event.preventDefault()
    console.log('✅ Prevented test error from crashing the app')
  }
})

// Register service worker for PWA functionality (disabled in development)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration)
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError)
      })
  })
} else {
  console.log('Service worker disabled in development mode')
  // Unregister any existing service workers in development
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        console.log('Unregistering service worker:', registration)
        registration.unregister()
      })
    })
  }
}

// The app will render normally now

// Add loading state while React initializes
const root = document.getElementById('root')
if (root) {
  root.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0d0d0d; color: white; font-family: monospace;">
      <div style="text-align: center;">
        <div style="font-size: 24px; margin-bottom: 20px;">🎲</div>
        <div>Loading HILO Casino...</div>
        <div style="font-size: 12px; color: #666; margin-top: 10px;">If this takes too long, check the console for errors</div>
      </div>
    </div>
  `
}

try {
  console.log('Starting React app initialization...')
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  console.log('React app rendered successfully')
} catch (error) {
  console.error('Failed to render React app:', error)
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; color: red; background: white; min-height: 100vh; font-family: monospace;">
        <h1>React Rendering Error</h1>
        <p><strong>Error:</strong> ${error}</p>
        <p><strong>Stack:</strong></p>
        <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error instanceof Error ? error.stack : 'No stack trace'}</pre>
        <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">
          Reload Page
        </button>
      </div>
    `
  }
}
