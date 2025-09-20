const crypto = require('crypto')
const { User, AuditLog } = require('../models/database')

/**
 * Anti-Abuse Service
 * Implements comprehensive abuse prevention and detection
 */

class AntiAbuseService {
  constructor() {
    this.deviceFingerprints = new Map() // In production, use Redis
    this.abuseFlags = new Map()
    this.rateLimits = new Map()
    
    // Configuration
    this.config = {
      // Multi-account detection
      MAX_ACCOUNTS_PER_IP: parseInt(process.env.MAX_ACCOUNTS_PER_IP || '3'),
      MAX_ACCOUNTS_PER_DEVICE: parseInt(process.env.MAX_ACCOUNTS_PER_DEVICE || '2'),
      
      // Faucet protection
      FAUCET_DAILY_LIMIT: parseInt(process.env.FAUCET_DAILY_LIMIT || '5000000000'), // 5 SOL
      FAUCET_IP_DAILY_LIMIT: parseInt(process.env.FAUCET_IP_DAILY_LIMIT || '10000000000'), // 10 SOL
      FAUCET_COOLDOWN: parseInt(process.env.FAUCET_COOLDOWN || '3600000'), // 1 hour
      
      // Referral protection
      MIN_WAGER_FOR_REFERRAL: parseInt(process.env.MIN_WAGER_FOR_REFERRAL || '1000000000'), // 1 SOL
      REFERRAL_COOLDOWN: parseInt(process.env.REFERRAL_COOLDOWN || '86400000'), // 24 hours
      
      // Suspicious activity thresholds
      SUSPICIOUS_ACTIVITY_THRESHOLD: parseInt(process.env.SUSPICIOUS_ACTIVITY_THRESHOLD || '10'),
      RAPID_ACCOUNT_CREATION_THRESHOLD: parseInt(process.env.RAPID_ACCOUNT_CREATION_THRESHOLD || '5'),
      
      // Withdrawal protection
      LARGE_WITHDRAWAL_THRESHOLD: parseInt(process.env.LARGE_WITHDRAWAL_THRESHOLD || '5000000000'), // 5 SOL
      WITHDRAWAL_COOLDOWN: parseInt(process.env.WITHDRAWAL_COOLDOWN || '1800000'), // 30 minutes
    }
  }

  // Generate device fingerprint
  generateDeviceFingerprint(req) {
    const components = [
      req.ip,
      req.get('User-Agent') || '',
      req.get('Accept-Language') || '',
      req.get('Accept-Encoding') || '',
      req.get('Connection') || ''
    ]
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex')
    
    return fingerprint
  }

  // Check for multi-account abuse
  async checkMultiAccountAbuse(userId, publicKey, req) {
    try {
      const fingerprint = this.generateDeviceFingerprint(req)
      const ipAddress = req.ip
      
      // Check IP-based accounts
      const ipAccounts = await this.getAccountsByIP(ipAddress)
      if (ipAccounts.length >= this.config.MAX_ACCOUNTS_PER_IP) {
        await this.flagAbuse(userId, 'MULTI_ACCOUNT_IP', 'high', {
          ipAddress,
          accountCount: ipAccounts.length,
          threshold: this.config.MAX_ACCOUNTS_PER_IP
        })
        return { allowed: false, reason: 'Too many accounts from this IP' }
      }

      // Check device-based accounts
      const deviceAccounts = await this.getAccountsByDevice(fingerprint)
      if (deviceAccounts.length >= this.config.MAX_ACCOUNTS_PER_DEVICE) {
        await this.flagAbuse(userId, 'MULTI_ACCOUNT_DEVICE', 'high', {
          fingerprint,
          accountCount: deviceAccounts.length,
          threshold: this.config.MAX_ACCOUNTS_PER_DEVICE
        })
        return { allowed: false, reason: 'Too many accounts from this device' }
      }

      // Record device fingerprint
      await this.recordDeviceFingerprint(fingerprint, userId, ipAddress, req.get('User-Agent'))

      return { allowed: true }
    } catch (error) {
      console.error('Error checking multi-account abuse:', error)
      return { allowed: true } // Fail open for safety
    }
  }

  // Check faucet abuse
  async checkFaucetAbuse(userId, amountLamports, req) {
    try {
      const fingerprint = this.generateDeviceFingerprint(req)
      const ipAddress = req.ip
      
      // Check user daily limit
      const userUsage = await this.getFaucetUsage(userId, 'daily')
      if (userUsage + amountLamports > this.config.FAUCET_DAILY_LIMIT) {
        await this.flagAbuse(userId, 'FAUCET_USER_LIMIT', 'medium', {
          userUsage,
          requestedAmount: amountLamports,
          limit: this.config.FAUCET_DAILY_LIMIT
        })
        return { allowed: false, reason: 'Daily faucet limit exceeded' }
      }

      // Check IP daily limit
      const ipUsage = await this.getFaucetUsageByIP(ipAddress, 'daily')
      if (ipUsage + amountLamports > this.config.FAUCET_IP_DAILY_LIMIT) {
        await this.flagAbuse(userId, 'FAUCET_IP_LIMIT', 'medium', {
          ipUsage,
          requestedAmount: amountLamports,
          limit: this.config.FAUCET_IP_DAILY_LIMIT
        })
        return { allowed: false, reason: 'IP daily faucet limit exceeded' }
      }

      // Check cooldown
      const lastUsage = await this.getLastFaucetUsage(userId)
      if (lastUsage && Date.now() - lastUsage < this.config.FAUCET_COOLDOWN) {
        const remainingCooldown = Math.ceil((this.config.FAUCET_COOLDOWN - (Date.now() - lastUsage)) / 1000 / 60)
        return { allowed: false, reason: `Please wait ${remainingCooldown} minutes before requesting again` }
      }

      // Record faucet usage
      await this.recordFaucetUsage(userId, amountLamports, ipAddress, fingerprint, req.get('User-Agent'))

      return { allowed: true }
    } catch (error) {
      console.error('Error checking faucet abuse:', error)
      return { allowed: true }
    }
  }

  // Check referral abuse
  async checkReferralAbuse(referrerId, referredId, referralCode, req) {
    try {
      const fingerprint = this.generateDeviceFingerprint(req)
      const ipAddress = req.ip

      // Check self-referral
      if (referrerId === referredId) {
        await this.flagAbuse(referredId, 'SELF_REFERRAL', 'high', {
          referrerId,
          referredId,
          referralCode
        })
        return { allowed: false, reason: 'Self-referrals are not allowed' }
      }

      // Check same IP referral
      const referrerIP = await this.getUserIP(referrerId)
      if (referrerIP === ipAddress) {
        await this.flagAbuse(referredId, 'SAME_IP_REFERRAL', 'high', {
          referrerId,
          referredId,
          ipAddress
        })
        return { allowed: false, reason: 'Referrals from same IP are not allowed' }
      }

      // Check minimum wager requirement
      const referrer = await User.findById(referrerId)
      if (referrer.total_wagered_lamports < this.config.MIN_WAGER_FOR_REFERRAL) {
        await this.flagAbuse(referredId, 'INSUFFICIENT_WAGER_REFERRAL', 'medium', {
          referrerId,
          totalWagered: referrer.total_wagered_lamports,
          required: this.config.MIN_WAGER_FOR_REFERRAL
        })
        return { allowed: false, reason: 'Referrer must have wagered at least 1 SOL' }
      }

      // Check circular referral (A refers B, B refers A)
      const circularCheck = await this.checkCircularReferral(referrerId, referredId)
      if (circularCheck) {
        await this.flagAbuse(referredId, 'CIRCULAR_REFERRAL', 'high', {
          referrerId,
          referredId
        })
        return { allowed: false, reason: 'Circular referrals are not allowed' }
      }

      // Record referral attempt
      await this.recordReferralAttempt(referrerId, referredId, referralCode, ipAddress, fingerprint, true)

      return { allowed: true }
    } catch (error) {
      console.error('Error checking referral abuse:', error)
      return { allowed: true }
    }
  }

  // Check withdrawal abuse
  async checkWithdrawalAbuse(userId, amountLamports, req) {
    try {
      const fingerprint = this.generateDeviceFingerprint(req)
      
      // Check large withdrawal cooldown
      if (amountLamports > this.config.LARGE_WITHDRAWAL_THRESHOLD) {
        const lastLargeWithdrawal = await this.getLastLargeWithdrawal(userId)
        if (lastLargeWithdrawal && Date.now() - lastLargeWithdrawal < this.config.WITHDRAWAL_COOLDOWN) {
          const remainingCooldown = Math.ceil((this.config.WITHDRAWAL_COOLDOWN - (Date.now() - lastLargeWithdrawal)) / 1000 / 60)
          return { allowed: false, reason: `Large withdrawal cooldown: ${remainingCooldown} minutes remaining` }
        }
      }

      // Check for suspicious withdrawal patterns
      const recentWithdrawals = await this.getRecentWithdrawals(userId, 24) // Last 24 hours
      const totalRecent = recentWithdrawals.reduce((sum, w) => sum + w.amount_lamports, 0)
      
      if (totalRecent + amountLamports > this.config.LARGE_WITHDRAWAL_THRESHOLD * 3) {
        await this.flagAbuse(userId, 'EXCESSIVE_WITHDRAWALS', 'high', {
          recentTotal: totalRecent,
          currentAmount: amountLamports,
          threshold: this.config.LARGE_WITHDRAWAL_THRESHOLD * 3
        })
        return { allowed: false, reason: 'Excessive withdrawal activity detected' }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Error checking withdrawal abuse:', error)
      return { allowed: true }
    }
  }

  // Flag abuse
  async flagAbuse(userId, flagType, severity, details) {
    try {
      const flag = {
        user_id: userId,
        flag_type: flagType,
        severity,
        details: JSON.stringify(details),
        ip_address: details.ipAddress || null,
        device_fingerprint: details.fingerprint || null,
        is_resolved: false,
        created_at: new Date().toISOString()
      }

      await new Promise((resolve, reject) => {
        User.db.run(
          `INSERT INTO abuse_flags (user_id, flag_type, severity, details, ip_address, device_fingerprint, is_resolved) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [flag.user_id, flag.flag_type, flag.severity, flag.details, 
           flag.ip_address, flag.device_fingerprint, flag.is_resolved],
          function(err) {
            if (err) return reject(err)
            resolve({ id: this.lastID })
          }
        )
      })

      // Log to audit trail
      await AuditLog.log(userId, null, 'ABUSE_FLAGGED', {
        flagType,
        severity,
        details
      })

      console.log(`🚨 Abuse flagged: ${flagType} for user ${userId} (${severity})`)
    } catch (error) {
      console.error('Error flagging abuse:', error)
    }
  }

  // Get accounts by IP
  async getAccountsByIP(ipAddress) {
    return new Promise((resolve, reject) => {
      User.db.all(
        `SELECT DISTINCT user_id FROM device_fingerprints WHERE ip_address = ?`,
        [ipAddress],
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows.map(row => row.user_id))
        }
      )
    })
  }

  // Get accounts by device
  async getAccountsByDevice(fingerprint) {
    return new Promise((resolve, reject) => {
      User.db.all(
        `SELECT DISTINCT user_id FROM device_fingerprints WHERE fingerprint = ?`,
        [fingerprint],
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows.map(row => row.user_id))
        }
      )
    })
  }

  // Record device fingerprint
  async recordDeviceFingerprint(fingerprint, userId, ipAddress, userAgent) {
    return new Promise((resolve, reject) => {
      User.db.run(
        `INSERT OR REPLACE INTO device_fingerprints (fingerprint, user_id, ip_address, user_agent, last_seen) 
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [fingerprint, userId, ipAddress, userAgent],
        function(err) {
          if (err) return reject(err)
          resolve({ id: this.lastID })
        }
      )
    })
  }

  // Get faucet usage
  async getFaucetUsage(userId, period = 'daily') {
    const cutoff = this.getCutoffDate(period)
    return new Promise((resolve, reject) => {
      User.db.get(
        `SELECT COALESCE(SUM(amount_lamports), 0) as total 
         FROM faucet_usage 
         WHERE user_id = ? AND created_at >= ?`,
        [userId, cutoff],
        (err, row) => {
          if (err) return reject(err)
          resolve(row.total)
        }
      )
    })
  }

  // Get faucet usage by IP
  async getFaucetUsageByIP(ipAddress, period = 'daily') {
    const cutoff = this.getCutoffDate(period)
    return new Promise((resolve, reject) => {
      User.db.get(
        `SELECT COALESCE(SUM(amount_lamports), 0) as total 
         FROM faucet_usage 
         WHERE ip_address = ? AND created_at >= ?`,
        [ipAddress, cutoff],
        (err, row) => {
          if (err) return reject(err)
          resolve(row.total)
        }
      )
    })
  }

  // Record faucet usage
  async recordFaucetUsage(userId, amountLamports, ipAddress, fingerprint, userAgent) {
    return new Promise((resolve, reject) => {
      User.db.run(
        `INSERT INTO faucet_usage (user_id, amount_lamports, ip_address, device_fingerprint, user_agent) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, amountLamports, ipAddress, fingerprint, userAgent],
        function(err) {
          if (err) return reject(err)
          resolve({ id: this.lastID })
        }
      )
    })
  }

  // Get suspicious activity
  async getSuspiciousActivity(hours = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    return new Promise((resolve, reject) => {
      User.db.all(
        `SELECT af.*, u.username, u.public_key 
         FROM abuse_flags af 
         LEFT JOIN users u ON af.user_id = u.id 
         WHERE af.created_at >= ? AND af.is_resolved = 0 
         ORDER BY af.created_at DESC`,
        [cutoff],
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows.map(row => ({
            ...row,
            details: JSON.parse(row.details)
          })))
        }
      )
    })
  }

  // Helper methods
  getCutoffDate(period) {
    const now = new Date()
    switch (period) {
      case 'daily':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      case 'weekly':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case 'monthly':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    }
  }

  async getLastFaucetUsage(userId) {
    return new Promise((resolve, reject) => {
      User.db.get(
        `SELECT created_at FROM faucet_usage 
         WHERE user_id = ? 
         ORDER BY created_at DESC LIMIT 1`,
        [userId],
        (err, row) => {
          if (err) return reject(err)
          resolve(row ? new Date(row.created_at).getTime() : null)
        }
      )
    })
  }

  async checkCircularReferral(userId1, userId2) {
    // Check if userId1 was referred by userId2
    const user1 = await User.findById(userId1)
    return user1 && user1.referred_by === userId2
  }

  async recordReferralAttempt(referrerId, referredId, referralCode, ipAddress, fingerprint, isValid) {
    return new Promise((resolve, reject) => {
      User.db.run(
        `INSERT INTO referral_attempts (referrer_id, referred_id, referral_code, ip_address, device_fingerprint, is_valid) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [referrerId, referredId, referralCode, ipAddress, fingerprint, isValid],
        function(err) {
          if (err) return reject(err)
          resolve({ id: this.lastID })
        }
      )
    })
  }

  async getUserIP(userId) {
    return new Promise((resolve, reject) => {
      User.db.get(
        `SELECT ip_address FROM device_fingerprints 
         WHERE user_id = ? 
         ORDER BY last_seen DESC LIMIT 1`,
        [userId],
        (err, row) => {
          if (err) return reject(err)
          resolve(row ? row.ip_address : null)
        }
      )
    })
  }

  async getLastLargeWithdrawal(userId) {
    return new Promise((resolve, reject) => {
      User.db.get(
        `SELECT created_at FROM withdrawals 
         WHERE user_id = ? AND amount_lamports > ? 
         ORDER BY created_at DESC LIMIT 1`,
        [userId, this.config.LARGE_WITHDRAWAL_THRESHOLD],
        (err, row) => {
          if (err) return reject(err)
          resolve(row ? new Date(row.created_at).getTime() : null)
        }
      )
    })
  }

  async getRecentWithdrawals(userId, hours) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    return new Promise((resolve, reject) => {
      User.db.all(
        `SELECT amount_lamports, created_at FROM withdrawals 
         WHERE user_id = ? AND created_at >= ? 
         ORDER BY created_at DESC`,
        [userId, cutoff],
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows)
        }
      )
    })
  }
}

module.exports = AntiAbuseService
