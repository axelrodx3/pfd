const { TreasuryService } = require('./treasury')
const { AuditLog, User } = require('../models/database')

/**
 * Monitoring and Alerting Service
 * Tracks house wallet balance, suspicious activity, and system health
 */

class MonitoringService {
  constructor() {
    this.treasuryService = null
    this.alertThresholds = {
      LOW_BALANCE: parseInt(process.env.LOW_BALANCE_THRESHOLD || '1000000000'), // 1 SOL
      CRITICAL_BALANCE: parseInt(process.env.CRITICAL_BALANCE_THRESHOLD || '100000000'), // 0.1 SOL
      SUSPICIOUS_ACTIVITY_COUNT: parseInt(process.env.SUSPICIOUS_ACTIVITY_THRESHOLD || '10'),
      RPC_FAILURE_COUNT: parseInt(process.env.RPC_FAILURE_THRESHOLD || '5')
    }
    
    this.metrics = {
      rpcFailures: 0,
      lastBalanceCheck: null,
      lastSuspiciousActivityCheck: null,
      systemHealth: 'healthy'
    }
    
    this.isMonitoring = false
    this.monitoringInterval = null
  }

  async initialize(treasuryService) {
    this.treasuryService = treasuryService
    console.log('🔍 Monitoring service initialized')
  }

  start() {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    this.monitoringInterval = setInterval(async () => {
      await this.checkSystemHealth()
    }, 30000) // Check every 30 seconds
    
    console.log('🔍 Monitoring service started')
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
    console.log('🔍 Monitoring service stopped')
  }

  async checkSystemHealth() {
    try {
      await Promise.all([
        this.checkHouseBalance(),
        this.checkSuspiciousActivity(),
        this.checkRPCHealth()
      ])
    } catch (error) {
      console.error('Health check error:', error)
      await this.alert('SYSTEM_ERROR', { error: error.message })
    }
  }

  async checkHouseBalance() {
    if (!this.treasuryService) return

    try {
      const balance = await this.treasuryService.getBalance()
      this.metrics.lastBalanceCheck = new Date()
      
      if (balance < this.alertThresholds.CRITICAL_BALANCE) {
        await this.alert('CRITICAL_BALANCE', { 
          balance, 
          threshold: this.alertThresholds.CRITICAL_BALANCE 
        })
        this.metrics.systemHealth = 'critical'
      } else if (balance < this.alertThresholds.LOW_BALANCE) {
        await this.alert('LOW_BALANCE', { 
          balance, 
          threshold: this.alertThresholds.LOW_BALANCE 
        })
        this.metrics.systemHealth = 'warning'
      } else {
        this.metrics.systemHealth = 'healthy'
      }
    } catch (error) {
      console.error('Balance check error:', error)
      this.metrics.rpcFailures++
      await this.alert('RPC_ERROR', { error: error.message })
    }
  }

  async checkSuspiciousActivity() {
    try {
      const suspiciousActivity = await AuditLog.getSuspiciousActivity(1) // Last hour
      
      if (suspiciousActivity.length >= this.alertThresholds.SUSPICIOUS_ACTIVITY_COUNT) {
        await this.alert('SUSPICIOUS_ACTIVITY', { 
          count: suspiciousActivity.length,
          activities: suspiciousActivity.slice(0, 5) // First 5 for details
        })
      }
      
      this.metrics.lastSuspiciousActivityCheck = new Date()
    } catch (error) {
      console.error('Suspicious activity check error:', error)
    }
  }

  async checkRPCHealth() {
    if (!this.treasuryService) return

    try {
      // Simple RPC health check
      await this.treasuryService.connection.getLatestBlockhash()
      this.metrics.rpcFailures = 0 // Reset on success
    } catch (error) {
      this.metrics.rpcFailures++
      
      if (this.metrics.rpcFailures >= this.alertThresholds.RPC_FAILURE_COUNT) {
        await this.alert('RPC_FAILURE', { 
          failures: this.metrics.rpcFailures,
          error: error.message 
        })
        this.metrics.systemHealth = 'critical'
      }
    }
  }

  async alert(type, data) {
    const alert = {
      type,
      data,
      timestamp: new Date().toISOString(),
      severity: this.getSeverity(type)
    }

    // Log to audit trail
    await AuditLog.log(null, null, 'ALERT', alert, null, null)

    // Console output (in production, send to monitoring service)
    console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${type}`, data)

    // In production, you would:
    // - Send to Slack/Discord webhook
    // - Send email to admins
    // - Create incident in monitoring system
    // - Send SMS for critical alerts
  }

  getSeverity(type) {
    const critical = ['CRITICAL_BALANCE', 'RPC_FAILURE', 'SYSTEM_ERROR']
    const warning = ['LOW_BALANCE', 'SUSPICIOUS_ACTIVITY']
    
    if (critical.includes(type)) return 'critical'
    if (warning.includes(type)) return 'warning'
    return 'info'
  }

  // Get current system metrics
  getMetrics() {
    return {
      ...this.metrics,
      thresholds: this.alertThresholds,
      isMonitoring: this.isMonitoring
    }
  }

  // Manual alert trigger (for testing)
  async triggerAlert(type, data) {
    await this.alert(type, data)
  }
}

module.exports = MonitoringService
