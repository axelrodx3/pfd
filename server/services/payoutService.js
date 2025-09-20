/**
 * Payout Service
 *
 * Handles automated payout processing with queue management and retry logic.
 * Processes withdrawal requests and sends SOL to users.
 *
 * SAFETY: All payouts are logged and require proper authorization
 */

const {
  PayoutJob,
  Withdrawal,
  User,
  Settings,
  AuditLog,
} = require('../models/database')

class PayoutService {
  constructor(treasuryService) {
    this.treasuryService = treasuryService
    this.isProcessing = false
    this.processingInterval = null
    this.maxRetries = 3
    this.retryDelayMs = 30000 // 30 seconds
    this.autoWithdrawLimit = 100000000 // 0.1 SOL default
  }

  async initialize() {
    try {
      console.log('💰 Initializing payout service...')

      // Load configuration
      await this.loadConfiguration()

      // Start processing queue
      this.startProcessing()

      console.log('✅ Payout service initialized')
    } catch (error) {
      console.error('❌ Failed to initialize payout service:', error)
      throw error
    }
  }

  async loadConfiguration() {
    try {
      const autoWithdrawLimit = await Settings.get(
        'auto_withdraw_limit_lamports'
      )
      if (autoWithdrawLimit) {
        this.autoWithdrawLimit = parseInt(autoWithdrawLimit)
      }

      console.log(
        `📊 Payout config: auto_withdraw_limit=${this.autoWithdrawLimit / 1e9} SOL`
      )
    } catch (error) {
      console.error('Error loading payout configuration:', error)
    }
  }

  startProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
    }

    // Process payouts every 30 seconds
    this.processingInterval = setInterval(async () => {
      if (this.isProcessing) return

      try {
        await this.processPayoutQueue()
      } catch (error) {
        console.error('Error processing payout queue:', error)
      }
    }, 30000)

    console.log('⏰ Payout processing started (30s intervals)')
  }

  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    console.log('🛑 Payout processing stopped')
  }

  /**
   * Process all pending payout jobs
   */
  async processPayoutQueue() {
    this.isProcessing = true

    try {
      const pendingJobs = await this.getPendingPayoutJobs()

      if (pendingJobs.length === 0) {
        return
      }

      console.log(`🔄 Processing ${pendingJobs.length} pending payout jobs...`)

      for (const job of pendingJobs) {
        try {
          await this.processPayoutJob(job)
        } catch (error) {
          console.error(`Error processing payout job ${job.id}:`, error)
          await this.handlePayoutJobError(job, error)
        }
      }
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Get pending payout jobs
   */
  async getPendingPayoutJobs() {
    try {
      const db = require('../models/database').db

      return new Promise((resolve, reject) => {
        db.all(
          `SELECT * FROM payout_jobs 
           WHERE status = 'pending' 
           ORDER BY created_at ASC 
           LIMIT 10`,
          (err, rows) => {
            if (err) return reject(err)
            resolve(rows)
          }
        )
      })
    } catch (error) {
      console.error('Error getting pending payout jobs:', error)
      return []
    }
  }

  /**
   * Process a single payout job
   */
  async processPayoutJob(job) {
    try {
      console.log(
        `💰 Processing payout job ${job.id}: ${job.amount_lamports / 1e9} SOL`
      )

      // Update job status to processing
      await this.updatePayoutJobStatus(job.id, 'processing')

      // Get user details
      const user = await User.getById(job.target_user_id)
      if (!user) {
        throw new Error('User not found')
      }

      // Check if this is an auto-approve withdrawal
      if (
        job.type === 'withdrawal' &&
        job.amount_lamports <= this.autoWithdrawLimit
      ) {
        await this.processWithdrawalPayout(job, user)
      } else {
        // Manual approval required
        console.log(
          `⏳ Payout job ${job.id} requires manual approval (amount: ${job.amount_lamports / 1e9} SOL)`
        )
        await this.updatePayoutJobStatus(job.id, 'pending_approval')
        return
      }
    } catch (error) {
      console.error(`Error processing payout job ${job.id}:`, error)
      throw error
    }
  }

  /**
   * Process withdrawal payout
   */
  async processWithdrawalPayout(job, user) {
    try {
      // Get withdrawal details
      const withdrawal = await this.getWithdrawalById(job.target_user_id)
      if (!withdrawal) {
        throw new Error('Withdrawal not found')
      }

      // Check user balance
      if (user.balance_lamports < job.amount_lamports) {
        throw new Error('Insufficient user balance')
      }

      // Deduct from user balance
      await User.updateBalance(
        job.target_user_id,
        -job.amount_lamports,
        'withdrawal'
      )

      // Send SOL from treasury
      const result = await this.treasuryService.sendSOL(
        withdrawal.dest_address,
        job.amount_lamports / 1e9,
        `withdrawal_${withdrawal.id}`
      )

      // Update withdrawal status
      await Withdrawal.updateStatus(
        withdrawal.id,
        'completed',
        result.signature,
        null,
        null
      )

      // Update payout job status
      await this.updatePayoutJobStatus(job.id, 'completed', result.signature)

      // Log audit trail
      await AuditLog.log(
        job.target_user_id,
        null,
        'withdrawal_processed',
        `Withdrawal processed: ${job.amount_lamports / 1e9} SOL to ${withdrawal.dest_address}, tx: ${result.signature}`,
        'system',
        'PayoutService'
      )

      console.log(`✅ Withdrawal completed: ${result.signature}`)
    } catch (error) {
      console.error('Error processing withdrawal payout:', error)
      throw error
    }
  }

  /**
   * Handle payout job error
   */
  async handlePayoutJobError(job, error) {
    const newAttempts = job.attempts + 1

    if (newAttempts >= this.maxRetries) {
      // Mark as failed
      await this.updatePayoutJobStatus(job.id, 'failed', null, error.message)

      console.log(
        `❌ Payout job ${job.id} failed after ${newAttempts} attempts`
      )
    } else {
      // Retry later
      await this.updatePayoutJobStatus(
        job.id,
        'pending',
        null,
        null,
        newAttempts
      )

      console.log(
        `🔄 Payout job ${job.id} will retry (attempt ${newAttempts}/${this.maxRetries})`
      )
    }
  }

  /**
   * Update payout job status
   */
  async updatePayoutJobStatus(
    jobId,
    status,
    txSignature = null,
    lastError = null,
    attempts = null
  ) {
    try {
      const db = require('../models/database').db

      const updates = ['status = ?', 'updated_at = CURRENT_TIMESTAMP']
      const values = [status]

      if (txSignature) {
        updates.push('tx_signature = ?')
        values.push(txSignature)
      }

      if (lastError) {
        updates.push('last_error = ?')
        values.push(lastError)
      }

      if (attempts !== null) {
        updates.push('attempts = ?')
        values.push(attempts)
      }

      if (status === 'completed' || status === 'failed') {
        updates.push('processed_at = CURRENT_TIMESTAMP')
      }

      values.push(jobId)

      return new Promise((resolve, reject) => {
        db.run(
          `UPDATE payout_jobs SET ${updates.join(', ')} WHERE id = ?`,
          values,
          err => {
            if (err) return reject(err)
            resolve()
          }
        )
      })
    } catch (error) {
      console.error('Error updating payout job status:', error)
      throw error
    }
  }

  /**
   * Create payout job
   */
  async createPayoutJob(type, targetUserId, amountLamports) {
    try {
      const db = require('../models/database').db

      return new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO payout_jobs (type, target_user_id, amount_lamports, status)
           VALUES (?, ?, ?, 'pending')`,
          [type, targetUserId, amountLamports],
          function (err) {
            if (err) return reject(err)
            resolve({ id: this.lastID })
          }
        )
      })
    } catch (error) {
      console.error('Error creating payout job:', error)
      throw error
    }
  }

  /**
   * Get withdrawal by user ID
   */
  async getWithdrawalById(userId) {
    try {
      const db = require('../models/database').db

      return new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM withdrawals WHERE user_id = ? AND status = "pending" ORDER BY created_at DESC LIMIT 1',
          [userId],
          (err, row) => {
            if (err) return reject(err)
            resolve(row)
          }
        )
      })
    } catch (error) {
      console.error('Error getting withdrawal:', error)
      return null
    }
  }

  /**
   * Manual approval of payout job
   */
  async approvePayoutJob(jobId, adminId) {
    try {
      const job = await this.getPayoutJobById(jobId)
      if (!job) {
        throw new Error('Payout job not found')
      }

      if (job.status !== 'pending_approval') {
        throw new Error('Payout job is not pending approval')
      }

      // Process the payout
      await this.processPayoutJob(job)

      // Log admin approval
      await AuditLog.log(
        job.target_user_id,
        adminId,
        'payout_approved',
        `Payout job ${jobId} approved by admin`,
        'system',
        'PayoutService'
      )

      console.log(`✅ Payout job ${jobId} approved by admin ${adminId}`)
    } catch (error) {
      console.error('Error approving payout job:', error)
      throw error
    }
  }

  /**
   * Reject payout job
   */
  async rejectPayoutJob(jobId, adminId, reason) {
    try {
      await this.updatePayoutJobStatus(jobId, 'rejected', null, reason)

      // Log admin rejection
      await AuditLog.log(
        null,
        adminId,
        'payout_rejected',
        `Payout job ${jobId} rejected: ${reason}`,
        'system',
        'PayoutService'
      )

      console.log(
        `❌ Payout job ${jobId} rejected by admin ${adminId}: ${reason}`
      )
    } catch (error) {
      console.error('Error rejecting payout job:', error)
      throw error
    }
  }

  /**
   * Get payout job by ID
   */
  async getPayoutJobById(jobId) {
    try {
      const db = require('../models/database').db

      return new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM payout_jobs WHERE id = ?',
          [jobId],
          (err, row) => {
            if (err) return reject(err)
            resolve(row)
          }
        )
      })
    } catch (error) {
      console.error('Error getting payout job:', error)
      return null
    }
  }

  /**
   * Get payout queue status
   */
  async getQueueStatus() {
    try {
      const db = require('../models/database').db

      return new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            COUNT(*) as total_jobs,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending_approval
           FROM payout_jobs`,
          (err, row) => {
            if (err) return reject(err)
            resolve(row)
          }
        )
      })
    } catch (error) {
      console.error('Error getting queue status:', error)
      return null
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      hasInterval: !!this.processingInterval,
      autoWithdrawLimit: this.autoWithdrawLimit / 1e9,
      maxRetries: this.maxRetries,
    }
  }
}

module.exports = PayoutService
