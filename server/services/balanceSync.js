const { User, Deposit, Withdrawal } = require('../models/database')
const { Connection, PublicKey } = require('@solana/web3.js')

/**
 * Balance Synchronization Service
 * Reconciles in-app balances with on-chain state
 */

class BalanceSyncService {
  constructor(connection) {
    this.connection = connection
    this.syncInterval = null
    this.isSyncing = false
    this.lastSyncTime = null
  }

  start() {
    if (this.syncInterval) return
    
    // Sync every 5 minutes
    this.syncInterval = setInterval(async () => {
      await this.syncAllBalances()
    }, 5 * 60 * 1000)
    
    console.log('🔄 Balance sync service started')
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    console.log('🔄 Balance sync service stopped')
  }

  async syncAllBalances() {
    if (this.isSyncing) return
    
    this.isSyncing = true
    try {
      console.log('🔄 Starting balance synchronization...')
      
      // Get all users with pending transactions
      const usersWithPending = await this.getUsersWithPendingTransactions()
      
      for (const user of usersWithPending) {
        await this.syncUserBalance(user.id, user.public_key)
      }
      
      this.lastSyncTime = new Date()
      console.log(`✅ Balance sync completed for ${usersWithPending.length} users`)
    } catch (error) {
      console.error('Balance sync error:', error)
    } finally {
      this.isSyncing = false
    }
  }

  async getUsersWithPendingTransactions() {
    return new Promise((resolve, reject) => {
      User.db.all(`
        SELECT DISTINCT u.id, u.public_key 
        FROM users u
        WHERE u.public_key IS NOT NULL
        AND (
          EXISTS (SELECT 1 FROM deposits d WHERE d.user_id = u.id AND d.confirmed = 0)
          OR EXISTS (SELECT 1 FROM withdrawals w WHERE w.user_id = u.id AND w.status = 'pending')
        )
      `, (err, rows) => {
        if (err) return reject(err)
        resolve(rows)
      })
    })
  }

  async syncUserBalance(userId, publicKey) {
    try {
      const userPublicKey = new PublicKey(publicKey)
      const onChainBalance = await this.connection.getBalance(userPublicKey)
      const onChainBalanceSOL = onChainBalance / 1e9
      
      // Get user's current in-app balance
      const user = await User.findById(userId)
      const inAppBalance = user.balance_lamports / 1e9
      
      // Check for discrepancies
      const discrepancy = Math.abs(onChainBalanceSOL - inAppBalance)
      
      if (discrepancy > 0.001) { // 0.001 SOL threshold
        console.log(`⚠️ Balance discrepancy for user ${userId}: On-chain: ${onChainBalanceSOL} SOL, In-app: ${inAppBalance} SOL`)
        
        // Log the discrepancy
        await this.logBalanceDiscrepancy(userId, onChainBalanceSOL, inAppBalance, discrepancy)
        
        // In production, you might want to:
        // - Create a support ticket
        // - Notify administrators
        // - Pause user transactions until resolved
      }
      
      // Update pending deposits
      await this.updatePendingDeposits(userId, userPublicKey)
      
      // Update pending withdrawals
      await this.updatePendingWithdrawals(userId, userPublicKey)
      
    } catch (error) {
      console.error(`Error syncing balance for user ${userId}:`, error)
    }
  }

  async updatePendingDeposits(userId, userPublicKey) {
    try {
      // Get pending deposits for this user
      const pendingDeposits = await Deposit.findByUserId(userId, { status: 'pending' })
      
      for (const deposit of pendingDeposits) {
        // Check if deposit has been confirmed on-chain
        if (deposit.signature) {
          const confirmation = await this.connection.getSignatureStatus(deposit.signature)
          
          if (confirmation.value?.confirmationStatus === 'finalized') {
            // Deposit confirmed, update status
            await Deposit.updateStatus(deposit.id, 'confirmed')
            console.log(`✅ Deposit ${deposit.id} confirmed for user ${userId}`)
          }
        }
      }
    } catch (error) {
      console.error(`Error updating pending deposits for user ${userId}:`, error)
    }
  }

  async updatePendingWithdrawals(userId, userPublicKey) {
    try {
      // Get pending withdrawals for this user
      const pendingWithdrawals = await Withdrawal.findByUserId(userId, { status: 'pending' })
      
      for (const withdrawal of pendingWithdrawals) {
        // Check if withdrawal has been confirmed on-chain
        if (withdrawal.signature) {
          const confirmation = await this.connection.getSignatureStatus(withdrawal.signature)
          
          if (confirmation.value?.confirmationStatus === 'finalized') {
            // Withdrawal confirmed, update status
            await Withdrawal.updateStatus(withdrawal.id, 'completed')
            console.log(`✅ Withdrawal ${withdrawal.id} confirmed for user ${userId}`)
          }
        }
      }
    } catch (error) {
      console.error(`Error updating pending withdrawals for user ${userId}:`, error)
    }
  }

  async logBalanceDiscrepancy(userId, onChainBalance, inAppBalance, discrepancy) {
    try {
      await User.db.run(`
        INSERT INTO balance_discrepancies (user_id, on_chain_balance, in_app_balance, discrepancy, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `, [userId, onChainBalance, inAppBalance, discrepancy])
    } catch (error) {
      console.error('Error logging balance discrepancy:', error)
    }
  }

  // Get pending transactions for a user
  async getUserPendingTransactions(userId) {
    try {
      const deposits = await Deposit.findByUserId(userId, { status: 'pending' })
      const withdrawals = await Withdrawal.findByUserId(userId, { status: 'pending' })
      
      return {
        deposits: deposits.map(d => ({
          id: d.id,
          amount: d.amount_lamports / 1e9,
          status: d.confirmed ? 'confirmed' : 'pending',
          signature: d.signature,
          createdAt: d.created_at
        })),
        withdrawals: withdrawals.map(w => ({
          id: w.id,
          amount: w.amount_lamports / 1e9,
          status: w.status,
          signature: w.signature,
          createdAt: w.created_at
        }))
      }
    } catch (error) {
      console.error('Error getting pending transactions:', error)
      return { deposits: [], withdrawals: [] }
    }
  }

  // Manual sync for a specific user
  async syncUserBalanceManual(userId) {
    const user = await User.findById(userId)
    if (!user || !user.public_key) {
      throw new Error('User not found or no public key')
    }
    
    await this.syncUserBalance(userId, user.public_key)
  }

  getStatus() {
    return {
      isRunning: !!this.syncInterval,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime
    }
  }
}

module.exports = BalanceSyncService
