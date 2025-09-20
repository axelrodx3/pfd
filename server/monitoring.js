const fs = require('fs')
const path = require('path')

/**
 * Security monitoring and logging system
 * Tracks suspicious activities and security events
 */

class SecurityMonitor {
  constructor(options = {}) {
    this.logDir = options.logDir || './logs'
    this.maxLogSize = options.maxLogSize || 10 * 1024 * 1024 // 10MB
    this.maxLogFiles = options.maxLogFiles || 5
    this.alertThresholds = options.alertThresholds || {
      failedAuthAttempts: 5,
      suspiciousTransactions: 3,
      rateLimitViolations: 10,
    }

    this.events = []
    this.alerts = []

    // Ensure log directory exists
    this.ensureLogDirectory()

    // Start monitoring
    this.startMonitoring()
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  /**
   * Log security event
   * @param {string} type - Event type
   * @param {Object} data - Event data
   * @param {string} severity - Event severity (low, medium, high, critical)
   */
  logEvent(type, data, severity = 'medium') {
    const event = {
      timestamp: new Date().toISOString(),
      type,
      severity,
      data: {
        ...data,
        ip: data.ip || 'unknown',
        userAgent: data.userAgent || 'unknown',
      },
      id: this.generateEventId(),
    }

    this.events.push(event)

    // Write to log file
    this.writeToLogFile(event)

    // Check for alerts
    this.checkAlerts(event)

    // Cleanup old events
    this.cleanupEvents()
  }

  /**
   * Write event to log file
   * @param {Object} event - Event to log
   */
  writeToLogFile(event) {
    const logFile = path.join(
      this.logDir,
      `security-${new Date().toISOString().split('T')[0]}.log`
    )
    const logEntry = JSON.stringify(event) + '\n'

    fs.appendFileSync(logFile, logEntry)

    // Rotate logs if needed
    this.rotateLogs(logFile)
  }

  /**
   * Rotate log files when they get too large
   * @param {string} logFile - Current log file path
   */
  rotateLogs(logFile) {
    try {
      const stats = fs.statSync(logFile)

      if (stats.size > this.maxLogSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const rotatedFile = logFile.replace('.log', `-${timestamp}.log`)

        fs.renameSync(logFile, rotatedFile)

        // Keep only maxLogFiles
        const files = fs
          .readdirSync(this.logDir)
          .filter(file => file.startsWith('security-') && file.endsWith('.log'))
          .sort()
          .reverse()

        if (files.length > this.maxLogFiles) {
          files.slice(this.maxLogFiles).forEach(file => {
            fs.unlinkSync(path.join(this.logDir, file))
          })
        }
      }
    } catch (error) {
      console.error('Error rotating logs:', error)
    }
  }

  /**
   * Check for security alerts
   * @param {Object} event - Event to check
   */
  checkAlerts(event) {
    const alerts = []

    // Check for failed authentication attempts
    if (event.type === 'auth_failed') {
      const recentFailures = this.events.filter(
        e =>
          e.type === 'auth_failed' &&
          e.data.ip === event.data.ip &&
          new Date(e.timestamp) > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
      )

      if (recentFailures.length >= this.alertThresholds.failedAuthAttempts) {
        alerts.push({
          type: 'multiple_auth_failures',
          severity: 'high',
          message: `Multiple failed authentication attempts from IP: ${event.data.ip}`,
          count: recentFailures.length,
          ip: event.data.ip,
        })
      }
    }

    // Check for suspicious transaction patterns
    if (event.type === 'transaction_suspicious') {
      const recentSuspicious = this.events.filter(
        e =>
          e.type === 'transaction_suspicious' &&
          new Date(e.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
      )

      if (
        recentSuspicious.length >= this.alertThresholds.suspiciousTransactions
      ) {
        alerts.push({
          type: 'suspicious_activity',
          severity: 'critical',
          message: 'Multiple suspicious transactions detected',
          count: recentSuspicious.length,
        })
      }
    }

    // Check for rate limit violations
    if (event.type === 'rate_limit_exceeded') {
      const recentViolations = this.events.filter(
        e =>
          e.type === 'rate_limit_exceeded' &&
          new Date(e.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
      )

      if (recentViolations.length >= this.alertThresholds.rateLimitViolations) {
        alerts.push({
          type: 'rate_limit_abuse',
          severity: 'high',
          message: 'Excessive rate limit violations detected',
          count: recentViolations.length,
        })
      }
    }

    // Process alerts
    alerts.forEach(alert => {
      this.processAlert(alert)
    })
  }

  /**
   * Process security alert
   * @param {Object} alert - Alert to process
   */
  processAlert(alert) {
    alert.timestamp = new Date().toISOString()
    alert.id = this.generateEventId()

    this.alerts.push(alert)

    // Log alert
    console.warn(`🚨 SECURITY ALERT: ${alert.message}`, alert)

    // Write to alert log
    const alertFile = path.join(this.logDir, 'alerts.log')
    fs.appendFileSync(alertFile, JSON.stringify(alert) + '\n')

    // In production, you might want to send alerts to external services
    // this.sendExternalAlert(alert);
  }

  /**
   * Generate unique event ID
   * @returns {string} Event ID
   */
  generateEventId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * Cleanup old events from memory
   */
  cleanupEvents() {
    const maxEvents = 1000
    if (this.events.length > maxEvents) {
      this.events = this.events.slice(-maxEvents)
    }

    const maxAlerts = 100
    if (this.alerts.length > maxAlerts) {
      this.alerts = this.alerts.slice(-maxAlerts)
    }
  }

  /**
   * Start monitoring system
   */
  startMonitoring() {
    // Log system startup
    this.logEvent(
      'system_startup',
      {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
      'low'
    )

    // Periodic cleanup
    setInterval(
      () => {
        this.cleanupEvents()
      },
      5 * 60 * 1000
    ) // Every 5 minutes

    // Periodic health check
    setInterval(() => {
      this.healthCheck()
    }, 60 * 1000) // Every minute
  }

  /**
   * Health check
   */
  healthCheck() {
    const stats = this.getStats()

    if (stats.activeAlerts > 10) {
      this.logEvent(
        'health_check_warning',
        {
          message: 'High number of active alerts',
          activeAlerts: stats.activeAlerts,
        },
        'medium'
      )
    }
  }

  /**
   * Get monitoring statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const now = Date.now()
    const last24h = now - 24 * 60 * 60 * 1000

    const recentEvents = this.events.filter(
      e => new Date(e.timestamp).getTime() > last24h
    )

    const eventTypes = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1
      return acc
    }, {})

    return {
      totalEvents: this.events.length,
      totalAlerts: this.alerts.length,
      activeAlerts: this.alerts.filter(
        a => new Date(a.timestamp).getTime() > now - 60 * 60 * 1000
      ).length,
      eventsLast24h: recentEvents.length,
      eventTypes,
      uptime: process.uptime(),
    }
  }

  /**
   * Get events by type
   * @param {string} type - Event type
   * @param {number} limit - Maximum number of events
   * @returns {Array} Events
   */
  getEventsByType(type, limit = 100) {
    return this.events.filter(event => event.type === type).slice(-limit)
  }

  /**
   * Get alerts by severity
   * @param {string} severity - Alert severity
   * @returns {Array} Alerts
   */
  getAlertsBySeverity(severity) {
    return this.alerts.filter(alert => alert.severity === severity)
  }
}

// Export singleton instance
const securityMonitor = new SecurityMonitor({
  logDir: process.env.LOG_DIR || './logs',
  alertThresholds: {
    failedAuthAttempts: parseInt(process.env.ALERT_AUTH_FAILURES) || 5,
    suspiciousTransactions: parseInt(process.env.ALERT_SUSPICIOUS_TX) || 3,
    rateLimitViolations: parseInt(process.env.ALERT_RATE_LIMIT) || 10,
  },
})

module.exports = securityMonitor
