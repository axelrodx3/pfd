/**
 * Enhanced Debug System for HILO Casino
 * Provides comprehensive error catching and logging
 */

export const DEBUG =
  import.meta.env.VITE_DEBUG === 'true' || import.meta.env.DEV

export const debug = {
  info: (message: string, data?: any) => {
    if (DEBUG) {
      console.log(`🔍 [DEBUG] ${message}`, data || '')
    }
  },

  error: (message: string, error?: any) => {
    console.error(`❌ [ERROR] ${message}`, error || '')
    if (DEBUG) {
      showErrorOverlay(message, error)
    }
  },

  warn: (message: string, data?: any) => {
    console.warn(`⚠️ [WARN] ${message}`, data || '')
  },
}

// Global error handlers
export function setupGlobalErrorHandlers() {
  // Catch all JavaScript errors
  window.onerror = (message, source, lineno, colno, error) => {
    debug.error(`Global Error: ${message}`, {
      source,
      line: lineno,
      column: colno,
      error: error?.stack,
    })
    return true // Prevent default error handling
  }

  // Catch unhandled promise rejections
  window.onunhandledrejection = event => {
    debug.error(
      `Unhandled Promise Rejection: ${event.reason}`,
      event.reason?.stack
    )
    event.preventDefault()
  }

  // Catch React errors
  window.addEventListener('error', event => {
    debug.error(`Window Error Event: ${event.message}`, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack,
    })
  })
}

// Error overlay for visible error display
function showErrorOverlay(title: string, error?: any) {
  // Remove existing overlay
  const existing = document.getElementById('debug-error-overlay')
  if (existing) existing.remove()

  const overlay = document.createElement('div')
  overlay.id = 'debug-error-overlay'
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.95);
    color: white;
    z-index: 99999;
    padding: 20px;
    font-family: 'Courier New', monospace;
    overflow: auto;
    border: 2px solid #ff4444;
  `

  const errorDetails =
    error?.stack || error?.toString() || 'No additional details'

  overlay.innerHTML = `
    <div style="background: #d32f2f; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
      <h1 style="margin: 0; color: white; font-size: 24px;">🚨 DEBUG ERROR OVERLAY</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">This overlay only appears when DEBUG=true</p>
    </div>
    <h2 style="color: #ffcdd2; font-size: 20px;">${title}</h2>
    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <h3 style="color: #ffcdd2; margin-top: 0;">Error Details:</h3>
      <pre style="white-space: pre-wrap; overflow: auto; max-height: 300px; color: #ff6b6b;">${errorDetails}</pre>
    </div>
    <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <h3 style="color: #ffcdd2; margin-top: 0;">Timestamp:</h3>
      <p style="color: #ccc;">${new Date().toISOString()}</p>
    </div>
    <button onclick="this.parentElement.remove()" style="
      background: #d32f2f; 
      color: white; 
      border: none; 
      padding: 12px 24px; 
      border-radius: 6px; 
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
    ">Close Error Overlay</button>
  `

  document.body.appendChild(overlay)
}

// Safe execution wrappers
export function safeSync<T>(fn: () => T, context: string): T | null {
  try {
    return fn()
  } catch (error) {
    debug.error(`Error in ${context}`, error)
    return null
  }
}

export async function safeAsync<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    debug.error(`Error in ${context}`, error)
    return null
  }
}
