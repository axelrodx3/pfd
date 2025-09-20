const { User, AuditLog } = require('../models/database')

/**
 * Casino Economics Service
 * Manages house edge, bankroll pools, leaderboards, and prize distributions
 */

class CasinoEconomicsService {
  constructor() {
    this.gamePools = new Map() // In production, use Redis
    this.prizePools = new Map()
    this.leaderboardCache = new Map()
    this.cacheExpiry = 5 * 60 * 1000 // 5 minutes
  }

  // Initialize game pools
  async initializeGamePools() {
    try {
      const gameTypes = ['dice', 'crash', 'slots', 'plinko']
      
      for (const gameType of gameTypes) {
        const pool = await this.getOrCreateGamePool(gameType)
        this.gamePools.set(gameType, pool)
      }
      
      console.log('✅ Casino economics initialized')
    } catch (error) {
      console.error('Error initializing casino economics:', error)
    }
  }

  // Get or create game pool
  async getOrCreateGamePool(gameType) {
    return new Promise((resolve, reject) => {
      User.db.get(
        'SELECT * FROM game_pools WHERE game_type = ?',
        [gameType],
        (err, row) => {
          if (err) return reject(err)
          
          if (row) {
            resolve(row)
          } else {
            // Create new game pool
            const defaultPool = {
              game_type: gameType,
              bankroll_lamports: 0,
              house_edge_percent: this.getDefaultHouseEdge(gameType),
              min_bet_lamports: 1000000, // 0.001 SOL
              max_bet_lamports: 10000000000, // 10 SOL
              is_active: true
            }
            
            User.db.run(
              `INSERT INTO game_pools (game_type, bankroll_lamports, house_edge_percent, 
               min_bet_lamports, max_bet_lamports, is_active) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [gameType, defaultPool.bankroll_lamports, defaultPool.house_edge_percent,
               defaultPool.min_bet_lamports, defaultPool.max_bet_lamports, defaultPool.is_active],
              function(err) {
                if (err) return reject(err)
                resolve({ id: this.lastID, ...defaultPool })
              }
            )
          }
        }
      )
    })
  }

  // Get default house edge per game type
  getDefaultHouseEdge(gameType) {
    const edges = {
      dice: 1.0,    // 1% house edge
      crash: 2.0,   // 2% house edge
      slots: 3.0,   // 3% house edge
      plinko: 2.5   // 2.5% house edge
    }
    return edges[gameType] || 2.0
  }

  // Update house edge for a game
  async updateHouseEdge(gameType, newEdge) {
    try {
      await new Promise((resolve, reject) => {
        User.db.run(
          'UPDATE game_pools SET house_edge_percent = ?, updated_at = CURRENT_TIMESTAMP WHERE game_type = ?',
          [newEdge, gameType],
          function(err) {
            if (err) return reject(err)
            resolve({ changes: this.changes })
          }
        )
      })

      // Update cache
      const pool = this.gamePools.get(gameType)
      if (pool) {
        pool.house_edge_percent = newEdge
        this.gamePools.set(gameType, pool)
      }

      // Log the change
      await AuditLog.log(null, null, 'HOUSE_EDGE_UPDATE', {
        gameType,
        newEdge,
        timestamp: new Date().toISOString()
      })

      return { success: true, newEdge }
    } catch (error) {
      console.error('Error updating house edge:', error)
      throw error
    }
  }

  // Add to bankroll pool
  async addToBankroll(gameType, amountLamports, source = 'house_profit') {
    try {
      await new Promise((resolve, reject) => {
        User.db.run(
          'UPDATE game_pools SET bankroll_lamports = bankroll_lamports + ?, updated_at = CURRENT_TIMESTAMP WHERE game_type = ?',
          [amountLamports, gameType],
          function(err) {
            if (err) return reject(err)
            resolve({ changes: this.changes })
          }
        )
      })

      // Update cache
      const pool = this.gamePools.get(gameType)
      if (pool) {
        pool.bankroll_lamports += amountLamports
        this.gamePools.set(gameType, pool)
      }

      // Log the transaction
      await AuditLog.log(null, null, 'BANKROLL_ADD', {
        gameType,
        amount: amountLamports,
        source,
        timestamp: new Date().toISOString()
      })

      return { success: true }
    } catch (error) {
      console.error('Error adding to bankroll:', error)
      throw error
    }
  }

  // Get leaderboard
  async getLeaderboard(type = 'balance', limit = 50) {
    try {
      const cacheKey = `${type}_${limit}`
      const cached = this.leaderboardCache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }

      let orderClause
      switch (type) {
        case 'balance':
          orderClause = 'ORDER BY balance_lamports DESC'
          break
        case 'xp':
          orderClause = 'ORDER BY xp DESC'
          break
        case 'wins':
          orderClause = 'ORDER BY total_won_lamports DESC'
          break
        case 'streaks':
          orderClause = 'ORDER BY JSON_EXTRACT(streaks, "$.wins") DESC'
          break
        case 'referrals':
          orderClause = 'ORDER BY referrals_count DESC'
          break
        default:
          orderClause = 'ORDER BY balance_lamports DESC'
      }

      const users = await User.getLeaderboard(orderClause, limit)
      
      const leaderboard = users.map((user, index) => ({
        rank: index + 1,
        id: user.id,
        username: user.username,
        avatarUrl: user.avatar_url,
        level: user.level || 1,
        value: this.getLeaderboardValue(user, type),
        publicKey: user.public_key
      }))

      // Cache the result
      this.leaderboardCache.set(cacheKey, {
        data: leaderboard,
        timestamp: Date.now()
      })

      return leaderboard
    } catch (error) {
      console.error('Error getting leaderboard:', error)
      return []
    }
  }

  // Get leaderboard value for a user
  getLeaderboardValue(user, type) {
    switch (type) {
      case 'balance':
        return (user.balance_lamports || 0) / 1e9
      case 'xp':
        return user.xp || 0
      case 'wins':
        return (user.total_won_lamports || 0) / 1e9
      case 'streaks':
        const streaks = user.streaks ? JSON.parse(user.streaks) : {}
        return streaks.wins || 0
      case 'referrals':
        return user.referrals_count || 0
      default:
        return 0
    }
  }

  // Create prize pool
  async createPrizePool(poolType, totalLamports, distributionSchedule = 'weekly') {
    try {
      const nextDistribution = this.calculateNextDistribution(distributionSchedule)
      
      const result = await new Promise((resolve, reject) => {
        User.db.run(
          `INSERT INTO prize_pools (pool_type, total_lamports, distribution_schedule, 
           next_distribution, is_active) VALUES (?, ?, ?, ?, ?)`,
          [poolType, totalLamports, distributionSchedule, nextDistribution, true],
          function(err) {
            if (err) return reject(err)
            resolve({ id: this.lastID })
          }
        )
      })

      // Log creation
      await AuditLog.log(null, null, 'PRIZE_POOL_CREATED', {
        poolType,
        totalLamports,
        distributionSchedule,
        nextDistribution
      })

      return { success: true, poolId: result.id }
    } catch (error) {
      console.error('Error creating prize pool:', error)
      throw error
    }
  }

  // Distribute prize pool
  async distributePrizePool(poolId, distributionType = 'leaderboard') {
    try {
      const pool = await this.getPrizePool(poolId)
      if (!pool) throw new Error('Prize pool not found')

      let distributions = []
      
      switch (distributionType) {
        case 'leaderboard':
          distributions = await this.distributeByLeaderboard(pool)
          break
        case 'random':
          distributions = await this.distributeRandomly(pool)
          break
        case 'proportional':
          distributions = await this.distributeProportionally(pool)
          break
      }

      // Record distributions
      for (const dist of distributions) {
        await this.recordDistribution(poolId, dist)
      }

      // Update pool
      await this.updatePrizePool(poolId, {
        distributed_lamports: pool.distributed_lamports + distributions.reduce((sum, d) => sum + d.amount_lamports, 0),
        last_distribution: new Date().toISOString(),
        next_distribution: this.calculateNextDistribution(pool.distribution_schedule)
      })

      return { success: true, distributions: distributions.length }
    } catch (error) {
      console.error('Error distributing prize pool:', error)
      throw error
    }
  }

  // Distribute by leaderboard ranking
  async distributeByLeaderboard(pool) {
    const leaderboard = await this.getLeaderboard('balance', 10) // Top 10
    const totalAmount = pool.total_lamports - pool.distributed_lamports
    const distributions = []

    const prizeDistribution = [0.4, 0.25, 0.15, 0.1, 0.05, 0.025, 0.0125, 0.0125, 0.0125, 0.0125] // Top 10 get prizes

    for (let i = 0; i < Math.min(leaderboard.length, 10); i++) {
      const user = leaderboard[i]
      const amount = Math.floor(totalAmount * prizeDistribution[i])
      
      if (amount > 0) {
        distributions.push({
          user_id: user.id,
          amount_lamports: amount,
          rank: i + 1,
          distribution_type: 'leaderboard'
        })
      }
    }

    return distributions
  }

  // Record distribution
  async recordDistribution(poolId, distribution) {
    return new Promise((resolve, reject) => {
      User.db.run(
        `INSERT INTO prize_distributions (pool_id, user_id, amount_lamports, rank, distribution_type) 
         VALUES (?, ?, ?, ?, ?)`,
        [poolId, distribution.user_id, distribution.amount_lamports, 
         distribution.rank, distribution.distribution_type],
        function(err) {
          if (err) return reject(err)
          resolve({ id: this.lastID })
        }
      )
    })
  }

  // Get prize pool
  async getPrizePool(poolId) {
    return new Promise((resolve, reject) => {
      User.db.get(
        'SELECT * FROM prize_pools WHERE id = ?',
        [poolId],
        (err, row) => {
          if (err) return reject(err)
          resolve(row)
        }
      )
    })
  }

  // Update prize pool
  async updatePrizePool(poolId, updates) {
    const fields = Object.keys(updates)
    const values = Object.values(updates)
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    
    return new Promise((resolve, reject) => {
      User.db.run(
        `UPDATE prize_pools SET ${setClause} WHERE id = ?`,
        [...values, poolId],
        function(err) {
          if (err) return reject(err)
          resolve({ changes: this.changes })
        }
      )
    })
  }

  // Calculate next distribution date
  calculateNextDistribution(schedule) {
    const now = new Date()
    switch (schedule) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  // Get house statistics
  async getHouseStats() {
    try {
      const stats = await new Promise((resolve, reject) => {
        User.db.get(
          `SELECT 
            SUM(total_wagered_lamports) as total_wagered,
            SUM(total_won_lamports) as total_won,
            COUNT(*) as total_users,
            AVG(balance_lamports) as avg_balance
          FROM users WHERE is_active = 1`,
          (err, row) => {
            if (err) return reject(err)
            resolve(row)
          }
        )
      })

      const gamePoolStats = await this.getGamePoolStats()
      
      return {
        totalWagered: (stats.total_wagered || 0) / 1e9,
        totalWon: (stats.total_won || 0) / 1e9,
        houseProfit: ((stats.total_wagered || 0) - (stats.total_won || 0)) / 1e9,
        totalUsers: stats.total_users || 0,
        avgBalance: (stats.avg_balance || 0) / 1e9,
        gamePools: gamePoolStats
      }
    } catch (error) {
      console.error('Error getting house stats:', error)
      return {}
    }
  }

  // Get game pool statistics
  async getGamePoolStats() {
    try {
      const pools = await new Promise((resolve, reject) => {
        User.db.all(
          'SELECT * FROM game_pools WHERE is_active = 1',
          (err, rows) => {
            if (err) return reject(err)
            resolve(rows)
          }
        )
      })

      return pools.map(pool => ({
        gameType: pool.game_type,
        bankroll: pool.bankroll_lamports / 1e9,
        houseEdge: pool.house_edge_percent,
        minBet: pool.min_bet_lamports / 1e9,
        maxBet: pool.max_bet_lamports / 1e9
      }))
    } catch (error) {
      console.error('Error getting game pool stats:', error)
      return []
    }
  }

  // Clear cache
  clearCache() {
    this.leaderboardCache.clear()
  }
}

module.exports = CasinoEconomicsService
