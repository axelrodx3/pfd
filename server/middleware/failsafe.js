const { MonitoringService } = require('../services/monitoring')

/**
 * Fail-Safe Mode Middleware
 * Blocks transactions when system is in an unsafe state
 */

class FailSafeService {
  constructor() {
    this.isFailSafeMode = false
    this.failSafeReasons = []
    this.monitoringService = null
    this.lastHealthCheck = null
  }

  initialize(monitoringService) {
    this.monitoringService = monitoringService
  }

  // Check if system is safe for transactions
  isSystemSafe() {
    // Check if we're in fail-safe mode
    if (this.isFailSafeMode) {
      return false
    }

    // Check if health check is recent (within last 2 minutes)
    if (!this.lastHealthCheck || Date.now() - this.lastHealthCheck > 120000) {
      this.enterFailSafeMode('HEALTH_CHECK_STALE', 'Health check is stale')
      return false
    }

    // Check monitoring service health
    if (this.monitoringService) {
      const metrics = this.monitoringService.getMetrics()
      if (metrics.systemHealth === 'critical') {
        this.enterFailSafeMode('SYSTEM_CRITICAL', 'System health is critical')
        return false
      }
    }

    return true
  }

  enterFailSafeMode(reason, description) {
    if (!this.isFailSafeMode) {
      this.isFailSafeMode = true
      this.failSafeReasons.push({
        reason,
        description,
        timestamp: new Date().toISOString()
      })
      
      console.log(`🚨 FAIL-SAFE MODE ACTIVATED: ${reason} - ${description}`)
      
      // Log to audit trail
      if (this.monitoringService) {
        this.monitoringService.triggerAlert('FAIL_SAFE_ACTIVATED', {
          reason,
          description,
          timestamp: new Date().toISOString()
        })
      }
    }
  }

  exitFailSafeMode() {
    if (this.isFailSafeMode) {
      this.isFailSafeMode = false
      const lastReason = this.failSafeReasons[this.failSafeReasons.length - 1]
      
      console.log(`✅ FAIL-SAFE MODE DEACTIVATED: ${lastReason?.reason}`)
      
      // Log to audit trail
      if (this.monitoringService) {
        this.monitoringService.triggerAlert('FAIL_SAFE_DEACTIVATED', {
          lastReason: lastReason?.reason,
          timestamp: new Date().toISOString()
        })
      }
    }
  }

  updateHealthCheck() {
    this.lastHealthCheck = Date.now()
    
    // Exit fail-safe if we were in it due to stale health check
    if (this.isFailSafeMode && this.failSafeReasons.some(r => r.reason === 'HEALTH_CHECK_STALE')) {
      this.exitFailSafeMode()
    }
  }

  // Middleware function
  middleware() {
    return (req, res, next) => {
      if (!this.isSystemSafe()) {
        const reasons = this.failSafeReasons.map(r => r.description).join(', ')
        
        return res.status(503).json({
          error: 'System temporarily unavailable',
          message: 'The system is currently in fail-safe mode for your protection',
          reasons: reasons,
          retryAfter: 60 // seconds
        })
      }
      
      next()
    }
  }

  // Get current status
  getStatus() {
    return {
      isFailSafeMode: this.isFailSafeMode,
      reasons: this.failSafeReasons,
      lastHealthCheck: this.lastHealthCheck,
      isSystemSafe: this.isSystemSafe()
    }
  }

  // Manual fail-safe trigger (for testing)
  triggerFailSafe(reason, description) {
    this.enterFailSafeMode(reason, description)
  }

  // Manual fail-safe release (for testing)
  releaseFailSafe() {
    this.exitFailSafeMode()
  }
}

// Singleton instance
const failSafeService = new FailSafeService()

module.exports = {
  FailSafeService,
  failSafeService
}
