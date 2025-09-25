/**
 * Game Service
 *
 * Handles game logic, provably fair outcomes, and betting with house fees.
 * Integrates with the payment system for real SOL betting.
 */

const crypto = require('crypto')
const { GamePlay, User, Settings, AuditLog } = require('../models/database')

class GameService {
  constructor() {
    this.houseEdge = 0.02 // 2% house edge
    this.minBetLamports = 1000000 // 0.001 SOL
    this.maxBetLamports = 10000000000 // 10 SOL
  }

  async initialize() {
    try {
      // Load configuration from database
      const houseEdge = await Settings.get('house_edge')
      if (houseEdge) {
        this.houseEdge = parseFloat(houseEdge)
      }

      const minBet = await Settings.get('min_bet_lamports')
      if (minBet) {
        this.minBetLamports = parseInt(minBet)
      }

      const maxBet = await Settings.get('max_bet_lamports')
      if (maxBet) {
        this.maxBetLamports = parseInt(maxBet)
      }

      console.log(
        `🎲 Game service initialized: house_edge=${this.houseEdge}, min_bet=${this.minBetLamports / 1e9} SOL, max_bet=${this.maxBetLamports / 1e9} SOL`
      )
    } catch (error) {
      console.error('Error initializing game service:', error)
    }
  }

  /**
   * Play a dice game
   */
  async playDice(userId, betAmountLamports, selectedSide, clientSeed) {
    try {
      // Validate bet amount
      if (betAmountLamports < this.minBetLamports) {
        throw new Error(`Minimum bet is ${this.minBetLamports / 1e9} SOL`)
      }

      if (betAmountLamports > this.maxBetLamports) {
        throw new Error(`Maximum bet is ${this.maxBetLamports / 1e9} SOL`)
      }

      // Get user and check balance
      const user = await User.getById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      if (user.balance_lamports < betAmountLamports) {
        throw new Error('Insufficient balance')
      }

      // Generate server seed and nonce
      const serverSeed = this.generateServerSeed()
      const nonce = Date.now()

      // Calculate provably fair outcome
      const outcome = this.calculateDiceOutcome(serverSeed, clientSeed, nonce)
      const won = this.checkWin(selectedSide, outcome)

      // Calculate payout and house fee
      const { payoutLamports, houseFeeLamports } = this.calculatePayout(
        betAmountLamports,
        won,
        this.houseEdge
      )

      // Get balance before transaction
      const balanceBefore = user.balance_lamports
      const balanceAfter = balanceBefore - betAmountLamports + payoutLamports

      // Record game play in database with integrity hash (tamper-evident)
      const integrity = crypto
        .createHash('sha256')
        .update(
          [
            userId,
            'dice',
            betAmountLamports,
            clientSeed,
            serverSeed,
            nonce,
            outcome,
            won ? '1' : '0',
            payoutLamports,
            houseFeeLamports,
            balanceBefore,
            balanceAfter,
          ].join('|')
        )
        .digest('hex')

      const playData = {
        userId,
        gameType: 'dice',
        betAmountLamports,
        clientSeed,
        serverSeed,
        nonce,
        outcome: outcome.toString(),
        won,
        payoutLamports,
        houseFeeLamports,
        balanceBeforeLamports: balanceBefore,
        balanceAfterLamports: balanceAfter,
        integrityHash: integrity,
      }

      const playRecord = await GamePlay.create(playData)

      // Update user balance atomically
      const balanceChange = payoutLamports - betAmountLamports
      await User.updateBalance(userId, balanceChange, 'game_play')

      // Log audit trail (include integrity hash)
      await AuditLog.log(
        userId,
        null,
        'game_played',
        `Dice game: bet=${betAmountLamports / 1e9} SOL, side=${selectedSide}, outcome=${outcome}, won=${won}, payout=${payoutLamports / 1e9} SOL, integrity=${integrity}`,
        'system',
        'GameService'
      )

      return {
        playId: playRecord.id,
        outcome,
        won,
        payout: payoutLamports / 1e9,
        houseFee: houseFeeLamports / 1e9,
        balanceBefore: balanceBefore / 1e9,
        balanceAfter: balanceAfter / 1e9,
        serverSeed,
        clientSeed,
        nonce,
        hash: this.generateGameHash(serverSeed, clientSeed, nonce),
      }
    } catch (error) {
      console.error('Error playing dice game:', error)
      throw error
    }
  }

  /**
   * Calculate provably fair dice outcome
   */
  calculateDiceOutcome(serverSeed, clientSeed, nonce) {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`
    const hash = crypto.createHash('sha256').update(combined).digest('hex')

    // Use first 8 characters of hash for dice roll (1-100)
    const hashInt = parseInt(hash.substring(0, 8), 16)
    return (hashInt % 100) + 1
  }

  /**
   * Check if player won based on selected side and outcome
   */
  checkWin(selectedSide, outcome) {
    if (selectedSide === 'high') {
      return outcome > 50
    } else if (selectedSide === 'low') {
      return outcome < 50
    }
    return false
  }

  /**
   * Calculate payout and house fee
   */
  calculatePayout(betAmountLamports, won, houseEdge) {
    if (!won) {
      return {
        payoutLamports: 0,
        houseFeeLamports: Math.floor(betAmountLamports * houseEdge),
      }
    }

    // Calculate payout with house edge (single application)
    // High/Low on 1-100 with boundary at 50 -> win chance ~49%
    const winChance = 0.49
    const multiplier = (1 - houseEdge) / winChance
    const payoutLamports = Math.floor(betAmountLamports * multiplier)
    const houseFeeLamports = Math.floor(betAmountLamports * houseEdge)

    return {
      payoutLamports,
      houseFeeLamports,
      winChance,
      multiplier,
    }
  }

  /**
   * Generate server seed
   */
  generateServerSeed() {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Generate game hash for verification
   */
  generateGameHash(serverSeed, clientSeed, nonce) {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`
    return crypto.createHash('sha256').update(combined).digest('hex')
  }

  /**
   * Verify game outcome
   */
  verifyGameOutcome(serverSeed, clientSeed, nonce, expectedOutcome) {
    const calculatedOutcome = this.calculateDiceOutcome(
      serverSeed,
      clientSeed,
      nonce
    )
    return calculatedOutcome === expectedOutcome
  }

  /**
   * Get game statistics for user
   */
  async getUserGameStats(userId) {
    try {
      const db = require('../models/database').db

      return new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            COUNT(*) as total_games,
            SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END) as wins,
            SUM(bet_amount_lamports) as total_wagered,
            SUM(payout_lamports) as total_won,
            SUM(house_fee_lamports) as total_house_fees
           FROM game_plays 
           WHERE user_id = ?`,
          [userId],
          (err, row) => {
            if (err) return reject(err)

            const stats = {
              totalGames: row.total_games || 0,
              wins: row.wins || 0,
              losses: (row.total_games || 0) - (row.wins || 0),
              winRate: row.total_games > 0 ? row.wins / row.total_games : 0,
              totalWagered: (row.total_wagered || 0) / 1e9,
              totalWon: (row.total_won || 0) / 1e9,
              totalHouseFees: (row.total_house_fees || 0) / 1e9,
              netProfit:
                ((row.total_won || 0) - (row.total_wagered || 0)) / 1e9,
            }

            resolve(stats)
          }
        )
      })
    } catch (error) {
      console.error('Error getting user game stats:', error)
      throw error
    }
  }

  /**
   * Get recent game history for user
   */
  async getUserGameHistory(userId, limit = 50) {
    try {
      const db = require('../models/database').db

      return new Promise((resolve, reject) => {
        db.all(
          `SELECT 
            id, game_type, bet_amount_lamports, outcome, won, 
            payout_lamports, house_fee_lamports, created_at
           FROM game_plays 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT ?`,
          [userId, limit],
          (err, rows) => {
            if (err) return reject(err)

            const history = rows.map(row => ({
              id: row.id,
              gameType: row.game_type,
              betAmount: row.bet_amount_lamports / 1e9,
              outcome: row.outcome,
              won: !!row.won,
              payout: row.payout_lamports / 1e9,
              houseFee: row.house_fee_lamports / 1e9,
              createdAt: row.created_at,
            }))

            resolve(history)
          }
        )
      })
    } catch (error) {
      console.error('Error getting user game history:', error)
      throw error
    }
  }

  /**
   * Get house statistics
   */
  async getHouseStats() {
    try {
      const db = require('../models/database').db

      return new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            COUNT(*) as total_games,
            SUM(bet_amount_lamports) as total_wagered,
            SUM(payout_lamports) as total_paid_out,
            SUM(house_fee_lamports) as total_house_fees,
            AVG(house_fee_lamports) as avg_house_fee
           FROM game_plays`,
          (err, row) => {
            if (err) return reject(err)

            const stats = {
              totalGames: row.total_games || 0,
              totalWagered: (row.total_wagered || 0) / 1e9,
              totalPaidOut: (row.total_paid_out || 0) / 1e9,
              totalHouseFees: (row.total_house_fees || 0) / 1e9,
              avgHouseFee: (row.avg_house_fee || 0) / 1e9,
              netProfit:
                ((row.total_house_fees || 0) -
                  ((row.total_paid_out || 0) - (row.total_wagered || 0))) /
                1e9,
            }

            resolve(stats)
          }
        )
      })
    } catch (error) {
      console.error('Error getting house stats:', error)
      throw error
    }
  }

  /**
   * Update house edge setting
   */
  async updateHouseEdge(newHouseEdge) {
    if (newHouseEdge < 0 || newHouseEdge > 0.5) {
      throw new Error('House edge must be between 0 and 0.5 (50%)')
    }

    await Settings.set('house_edge', newHouseEdge.toString())
    this.houseEdge = newHouseEdge

    console.log(`🎲 House edge updated to ${(newHouseEdge * 100).toFixed(2)}%`)
  }

  /**
   * Update bet limits
   */
  async updateBetLimits(minBetLamports, maxBetLamports) {
    if (minBetLamports < 1000) {
      throw new Error(
        'Minimum bet must be at least 1000 lamports (0.000001 SOL)'
      )
    }

    if (maxBetLamports < minBetLamports) {
      throw new Error('Maximum bet must be greater than minimum bet')
    }

    await Settings.set('min_bet_lamports', minBetLamports.toString())
    await Settings.set('max_bet_lamports', maxBetLamports.toString())

    this.minBetLamports = minBetLamports
    this.maxBetLamports = maxBetLamports

    console.log(
      `🎲 Bet limits updated: min=${minBetLamports / 1e9} SOL, max=${maxBetLamports / 1e9} SOL`
    )
  }
}

module.exports = GameService
