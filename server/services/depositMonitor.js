/**
 * Deposit Monitoring Service
 *
 * Monitors Solana blockchain for incoming deposits and credits user balances.
 * Uses WebSocket connections for real-time monitoring and fallback polling.
 *
 * SAFETY: Only processes deposits to the treasury address with valid memos
 */

const { Connection, PublicKey } = require('@solana/web3.js')
const { Deposit, User, Settings, AuditLog } = require('../models/database')

class DepositMonitorService {
  constructor(treasuryService) {
    this.treasuryService = treasuryService
    this.connection = treasuryService.connection
    this.treasuryAddress = treasuryService.treasuryKeypair.publicKey.toString()
    this.isMonitoring = false
    this.subscriptionId = null
    this.pollingInterval = null
    this.processedSignatures = new Set()

    // Configuration
    this.minConfirmations = 1 // Devnet default
    this.pollingIntervalMs = 10000 // 10 seconds
    this.maxRetries = 3
  }

  async start() {
    try {
      console.log('🔍 Starting deposit monitoring service...')

      // Load configuration
      await this.loadConfiguration()

      // Start monitoring
      await this.startWebSocketMonitoring()

      // Start fallback polling
      this.startPollingFallback()

      this.isMonitoring = true
      console.log('✅ Deposit monitoring started')
    } catch (error) {
      console.error('❌ Failed to start deposit monitoring:', error)
      throw error
    }
  }

  async stop() {
    console.log('🛑 Stopping deposit monitoring service...')

    this.isMonitoring = false

    // Stop WebSocket subscription
    if (this.subscriptionId) {
      try {
        await this.connection.removeAccountChangeListener(this.subscriptionId)
        this.subscriptionId = null
      } catch (error) {
        console.error('Error removing WebSocket subscription:', error)
      }
    }

    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }

    console.log('✅ Deposit monitoring stopped')
  }

  async loadConfiguration() {
    try {
      const minConfirmations = await Settings.get('min_confirmations')
      if (minConfirmations) {
        this.minConfirmations = parseInt(minConfirmations)
      }

      console.log(
        `📊 Monitoring config: min_confirmations=${this.minConfirmations}`
      )
    } catch (error) {
      console.error('Error loading configuration:', error)
    }
  }

  async startWebSocketMonitoring() {
    try {
      console.log('🔌 Starting WebSocket monitoring...')

      // Monitor treasury account for changes
      this.subscriptionId = this.connection.onAccountChange(
        new PublicKey(this.treasuryAddress),
        async (accountInfo, context) => {
          console.log(`📊 Treasury account changed at slot ${context.slot}`)
          await this.checkForNewDeposits()
        },
        'confirmed'
      )

      console.log('✅ WebSocket monitoring started')
    } catch (error) {
      console.error('❌ WebSocket monitoring failed:', error)
      console.log('🔄 Falling back to polling mode...')
    }
  }

  startPollingFallback() {
    console.log('⏰ Starting polling fallback...')

    this.pollingInterval = setInterval(async () => {
      if (this.isMonitoring) {
        await this.checkForNewDeposits()
      }
    }, this.pollingIntervalMs)

    console.log('✅ Polling fallback started')
  }

  async checkForNewDeposits() {
    try {
      // Get recent transactions for treasury address
      const signatures = await this.connection.getSignaturesForAddress(
        new PublicKey(this.treasuryAddress),
        { limit: 50 }
      )

      for (const sigInfo of signatures) {
        if (this.processedSignatures.has(sigInfo.signature)) {
          continue // Already processed
        }

        // Check if transaction has enough confirmations
        if (
          sigInfo.confirmationStatus === 'confirmed' ||
          sigInfo.confirmationStatus === 'finalized'
        ) {
          await this.processTransaction(sigInfo.signature)
        }
      }
    } catch (error) {
      console.error('Error checking for deposits:', error)
    }
  }

  async processTransaction(signature) {
    try {
      console.log(`🔍 Processing transaction: ${signature}`)

      // Get transaction details
      const txDetails =
        await this.treasuryService.getTransactionDetails(signature)

      if (!txDetails) {
        console.log(`⚠️  Transaction not found: ${signature}`)
        return
      }

      // Check if transaction is to treasury address
      const isToTreasury = txDetails.transfers.some(
        transfer => transfer.to === this.treasuryAddress
      )

      if (!isToTreasury) {
        console.log(`⚠️  Transaction not to treasury: ${signature}`)
        this.processedSignatures.add(signature)
        return
      }

      // Extract memo and amount
      const memo = txDetails.memo
      const transfer = txDetails.transfers.find(
        t => t.to === this.treasuryAddress
      )

      if (!transfer) {
        console.log(`⚠️  No transfer found in transaction: ${signature}`)
        this.processedSignatures.add(signature)
        return
      }

      // Parse memo to get user ID
      const userId = this.parseUserIdFromMemo(memo)

      if (!userId) {
        console.log(`⚠️  Invalid memo format: ${memo}`)
        this.processedSignatures.add(signature)
        return
      }

      // Check if deposit already exists
      const existingDeposit = await this.checkExistingDeposit(signature)
      if (existingDeposit) {
        console.log(`⚠️  Deposit already processed: ${signature}`)
        this.processedSignatures.add(signature)
        return
      }

      // Create deposit record
      await this.createDepositRecord({
        userId,
        amountLamports: transfer.amount,
        signature,
        slot: txDetails.slot,
        blockhash: txDetails.blockhash,
        confirmations: txDetails.confirmations,
        memo,
      })

      this.processedSignatures.add(signature)
    } catch (error) {
      console.error(`Error processing transaction ${signature}:`, error)
    }
  }

  parseUserIdFromMemo(memo) {
    if (!memo) return null

    // Expected memo format: "deposit_<userId>_<timestamp>"
    const match = memo.match(/^deposit_(\d+)_\d+$/)
    return match ? parseInt(match[1]) : null
  }

  async checkExistingDeposit(signature) {
    try {
      const db = require('../models/database').db

      return new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM deposits WHERE signature = ?',
          [signature],
          (err, row) => {
            if (err) return reject(err)
            resolve(row)
          }
        )
      })
    } catch (error) {
      console.error('Error checking existing deposit:', error)
      return null
    }
  }

  async createDepositRecord(depositData) {
    try {
      console.log(
        `💰 Creating deposit record for user ${depositData.userId}: ${depositData.amountLamports / 1e9} SOL`
      )

      // Create deposit record
      const deposit = await Deposit.create(
        depositData.userId,
        depositData.amountLamports,
        depositData.signature,
        depositData.slot,
        depositData.blockhash,
        depositData.memo,
        this.treasuryAddress
      )

      // Mark as confirmed and credit user
      await Deposit.confirm(deposit.id, depositData.confirmations)

      // Log audit trail
      await AuditLog.log(
        depositData.userId,
        null,
        'deposit_confirmed',
        `Deposit confirmed: ${depositData.amountLamports / 1e9} SOL from ${depositData.signature}`,
        'system',
        'DepositMonitor'
      )

      console.log(
        `✅ Deposit credited: ${depositData.amountLamports / 1e9} SOL to user ${depositData.userId}`
      )
    } catch (error) {
      console.error('Error creating deposit record:', error)
    }
  }

  // Manual deposit simulation for testing
  async simulateDeposit(userId, amountSOL, memo = null) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Deposit simulation not allowed in production')
    }

    try {
      console.log(`🧪 Simulating deposit for user ${userId}: ${amountSOL} SOL`)

      const amountLamports = Math.floor(amountSOL * 1e9)
      const signature = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      await this.createDepositRecord({
        userId,
        amountLamports,
        signature,
        slot: 999999999, // Fake slot
        blockhash: 'sim_blockhash',
        confirmations: this.minConfirmations,
        memo: memo || `sim_deposit_${userId}_${Date.now()}`,
      })

      console.log(`✅ Simulated deposit completed: ${signature}`)
      return { signature, amount: amountSOL }
    } catch (error) {
      console.error('Error simulating deposit:', error)
      throw error
    }
  }

  // Get monitoring status
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      treasuryAddress: this.treasuryAddress,
      minConfirmations: this.minConfirmations,
      processedSignatures: this.processedSignatures.size,
      hasWebSocket: !!this.subscriptionId,
      hasPolling: !!this.pollingInterval,
    }
  }
}

module.exports = DepositMonitorService
