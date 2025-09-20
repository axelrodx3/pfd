const { User, AuditLog } = require('../models/database')
const { Connection, PublicKey, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js')

/**
 * Mock Faucet Service (Devnet Only)
 * Provides free SOL for testing purposes
 */

class MockFaucetService {
  constructor(connection, treasuryService) {
    this.connection = connection
    this.treasuryService = treasuryService
    this.faucetLimits = {
      DAILY_LIMIT: 5, // 5 SOL per day per user
      PER_REQUEST_LIMIT: 1, // 1 SOL per request
      COOLDOWN: 60 * 60 * 1000, // 1 hour cooldown
      MAX_REQUESTS_PER_DAY: 10
    }
    
    this.userRequests = new Map() // In production, use Redis
    this.isEnabled = process.env.NODE_ENV === 'development' && process.env.SOLANA_NETWORK === 'devnet'
  }

  async requestFaucet(userId, publicKey, amount = 1.0) {
    if (!this.isEnabled) {
      throw new Error('Faucet is only available in development mode on devnet')
    }

    const amountLamports = Math.floor(amount * 1e9)
    
    // Validate amount
    if (amountLamports > this.faucetLimits.PER_REQUEST_LIMIT * 1e9) {
      throw new Error(`Maximum ${this.faucetLimits.PER_REQUEST_LIMIT} SOL per request`)
    }

    // Check user limits
    const userStats = this.getUserStats(userId)
    
    if (userStats.dailyTotal + amountLamports > this.faucetLimits.DAILY_LIMIT * 1e9) {
      throw new Error(`Daily limit exceeded. Limit: ${this.faucetLimits.DAILY_LIMIT} SOL`)
    }

    if (userStats.requestCount >= this.faucetLimits.MAX_REQUESTS_PER_DAY) {
      throw new Error(`Maximum requests per day exceeded: ${this.faucetLimits.MAX_REQUESTS_PER_DAY}`)
    }

    if (userStats.lastRequest && Date.now() - userStats.lastRequest < this.faucetLimits.COOLDOWN) {
      const remainingCooldown = Math.ceil((this.faucetLimits.COOLDOWN - (Date.now() - userStats.lastRequest)) / 1000 / 60)
      throw new Error(`Please wait ${remainingCooldown} minutes before requesting again`)
    }

    try {
      // Send SOL from treasury to user
      const userPublicKey = new PublicKey(publicKey)
      const treasuryKeypair = await this.treasuryService.getKeypair()
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: treasuryKeypair.publicKey,
          toPubkey: userPublicKey,
          lamports: amountLamports
        })
      )

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [treasuryKeypair],
        { commitment: 'confirmed' }
      )

      // Update user stats
      this.updateUserStats(userId, amountLamports)

      // Log the faucet request
      await AuditLog.logTransaction(
        userId,
        'FAUCET_REQUEST',
        amountLamports,
        signature,
        {
          publicKey,
          amount: amount,
          dailyTotal: userStats.dailyTotal + amountLamports,
          requestCount: userStats.requestCount + 1
        }
      )

      return {
        success: true,
        signature,
        amount: amount,
        amountLamports,
        dailyTotal: userStats.dailyTotal + amountLamports,
        remainingDaily: (this.faucetLimits.DAILY_LIMIT * 1e9) - (userStats.dailyTotal + amountLamports)
      }

    } catch (error) {
      console.error('Faucet request error:', error)
      throw new Error(`Faucet request failed: ${error.message}`)
    }
  }

  getUserStats(userId) {
    const today = new Date().toDateString()
    const userKey = `${userId}:${today}`
    
    if (!this.userRequests.has(userKey)) {
      this.userRequests.set(userKey, {
        dailyTotal: 0,
        requestCount: 0,
        lastRequest: null
      })
    }
    
    return this.userRequests.get(userKey)
  }

  updateUserStats(userId, amountLamports) {
    const today = new Date().toDateString()
    const userKey = `${userId}:${today}`
    
    const stats = this.getUserStats(userId)
    stats.dailyTotal += amountLamports
    stats.requestCount += 1
    stats.lastRequest = Date.now()
    
    this.userRequests.set(userKey, stats)
  }

  // Get faucet status for a user
  getUserFaucetStatus(userId) {
    const stats = this.getUserStats(userId)
    const remainingDaily = (this.faucetLimits.DAILY_LIMIT * 1e9) - stats.dailyTotal
    const remainingRequests = this.faucetLimits.MAX_REQUESTS_PER_DAY - stats.requestCount
    
    let cooldownRemaining = 0
    if (stats.lastRequest) {
      const elapsed = Date.now() - stats.lastRequest
      cooldownRemaining = Math.max(0, this.faucetLimits.COOLDOWN - elapsed)
    }

    return {
      isEnabled: this.isEnabled,
      dailyLimit: this.faucetLimits.DAILY_LIMIT,
      perRequestLimit: this.faucetLimits.PER_REQUEST_LIMIT,
      dailyUsed: stats.dailyTotal / 1e9,
      remainingDaily: remainingDaily / 1e9,
      requestCount: stats.requestCount,
      remainingRequests,
      cooldownRemaining: Math.ceil(cooldownRemaining / 1000 / 60), // minutes
      canRequest: remainingDaily > 0 && remainingRequests > 0 && cooldownRemaining === 0
    }
  }

  // Get global faucet stats
  getGlobalStats() {
    const today = new Date().toDateString()
    let totalRequests = 0
    let totalAmount = 0
    
    for (const [key, stats] of this.userRequests.entries()) {
      if (key.endsWith(today)) {
        totalRequests += stats.requestCount
        totalAmount += stats.dailyTotal
      }
    }

    return {
      isEnabled: this.isEnabled,
      totalRequestsToday: totalRequests,
      totalAmountToday: totalAmount / 1e9,
      activeUsers: this.userRequests.size,
      limits: this.faucetLimits
    }
  }

  // Clean up old user data
  cleanup() {
    const today = new Date().toDateString()
    const keysToDelete = []
    
    for (const key of this.userRequests.keys()) {
      if (!key.endsWith(today)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.userRequests.delete(key))
  }

  // Disable faucet (for production)
  disable() {
    this.isEnabled = false
    console.log('🚫 Mock faucet disabled')
  }

  // Enable faucet (for development)
  enable() {
    if (process.env.NODE_ENV === 'development' && process.env.SOLANA_NETWORK === 'devnet') {
      this.isEnabled = true
      console.log('🚰 Mock faucet enabled for development')
    } else {
      throw new Error('Faucet can only be enabled in development mode on devnet')
    }
  }
}

module.exports = MockFaucetService
