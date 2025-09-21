import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

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

// Add comprehensive error handling for production debugging
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  console.error('Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  })
  
  const root = document.getElementById('root')
  if (root && !root.innerHTML.includes('Error')) {
    root.innerHTML = `
      <div style="padding: 20px; color: red; background: white; min-height: 100vh; font-family: monospace;">
        <h1>Application Error</h1>
        <p><strong>Error:</strong> ${event.error?.message || 'Unknown error'}</p>
        <p><strong>File:</strong> ${event.filename}:${event.lineno}:${event.colno}</p>
        <p><strong>Stack:</strong></p>
        <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${event.error?.stack || 'No stack trace'}</pre>
        <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">
          Reload Page
        </button>
      </div>
    `
  }
})

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  console.error('Promise rejection details:', {
    reason: event.reason,
    promise: event.promise
  })
})

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
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
