/**
 * Production-safe logging utility
 * Provides structured logging for production environments
 */

interface LogContext {
  component?: string
  action?: string
  userId?: string
  walletAddress?: string
  error?: Error
  metadata?: Record<string, any>
}

class ProductionLogger {
  private isProduction = process.env.NODE_ENV === 'production'

  /**
   * Log initialization events
   */
  logInit(component: string, metadata?: Record<string, any>) {
    this.log('INIT', { component, ...metadata })
  }

  /**
   * Log wallet-related events
   */
  logWalletEvent(action: string, metadata?: Record<string, any>) {
    this.log('WALLET', { action, ...metadata })
  }

  /**
   * Log errors with context
   */
  logError(error: Error, context?: LogContext) {
    this.log('ERROR', {
      message: error.message,
      stack: error.stack,
      ...context
    })
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric: string, value: number, unit: string = 'ms') {
    this.log('PERFORMANCE', { metric, value, unit })
  }

  /**
   * Core logging method
   */
  private log(level: string, data: Record<string, any>) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      ...data
    }

    if (this.isProduction) {
      // In production, use structured logging
      console.log(JSON.stringify(logEntry))
    } else {
      // In development, use formatted logging
      console.log(`[${level}]`, data)
    }
  }

  /**
   * Log wallet initialization specifically
   */
  logWalletInit(success: boolean, error?: Error, walletType?: string) {
    this.logWalletEvent('INIT', {
      success,
      walletType,
      error: error ? {
        message: error.message,
        name: error.name
      } : undefined
    })
  }

  /**
   * Log WASM loading events
   */
  logWasmEvent(event: string, module?: string, success?: boolean, error?: Error) {
    this.log('WASM', {
      event,
      module,
      success,
      error: error ? {
        message: error.message,
        name: error.name
      } : undefined
    })
  }
}

// Export singleton instance
export const productionLogger = new ProductionLogger()

// Export for direct use
export default productionLogger
