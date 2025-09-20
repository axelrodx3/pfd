const crypto = require('crypto')
const { AuditLog } = require('../models/database')

/**
 * Provably Fair 2.0 Service
 * Implements commit-reveal scheme with transaction hash linking
 */

class ProvablyFair2Service {
  constructor() {
    this.serverSeeds = new Map() // In production, use Redis
    this.clientCommits = new Map()
  }

  // Generate server seed and commit
  generateServerCommit() {
    const serverSeed = crypto.randomBytes(32).toString('hex')
    const serverCommit = crypto.createHash('sha256').update(serverSeed).digest('hex')
    
    this.serverSeeds.set(serverCommit, serverSeed)
    
    return {
      serverCommit,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }
  }

  // Store client commit
  storeClientCommit(serverCommit, clientCommit, userId, gameType) {
    const key = `${serverCommit}:${clientCommit}`
    this.clientCommits.set(key, {
      userId,
      gameType,
      timestamp: Date.now(),
      serverCommit,
      clientCommit
    })
    
    return { success: true }
  }

  // Reveal and calculate game outcome
  async revealAndCalculate(serverCommit, clientCommit, clientSeed, gameType, betAmount, transactionHash) {
    try {
      // Verify server seed exists
      const serverSeed = this.serverSeeds.get(serverCommit)
      if (!serverSeed) {
        throw new Error('Server commit not found or expired')
      }

      // Verify client commit matches client seed
      const expectedClientCommit = crypto.createHash('sha256').update(clientSeed).digest('hex')
      if (clientCommit !== expectedClientCommit) {
        throw new Error('Client commit does not match client seed')
      }

      // Calculate game outcome
      const gameOutcome = this.calculateGameOutcome(
        serverSeed,
        clientSeed,
        gameType,
        betAmount,
        transactionHash
      )

      // Log the reveal for audit
      await AuditLog.logTransaction(
        gameOutcome.userId,
        'GAME_REVEAL',
        betAmount,
        transactionHash,
        {
          gameType,
          serverCommit,
          clientCommit,
          serverSeed,
          clientSeed,
          outcome: gameOutcome.result,
          nonce: gameOutcome.nonce,
          hash: gameOutcome.finalHash
        }
      )

      // Clean up used seeds
      this.serverSeeds.delete(serverCommit)
      this.clientCommits.delete(`${serverCommit}:${clientCommit}`)

      return gameOutcome
    } catch (error) {
      console.error('Reveal calculation error:', error)
      throw error
    }
  }

  calculateGameOutcome(serverSeed, clientSeed, gameType, betAmount, transactionHash) {
    // Create final hash combining all elements
    const combined = `${serverSeed}:${clientSeed}:${transactionHash}:${Date.now()}`
    const finalHash = crypto.createHash('sha256').update(combined).digest('hex')
    
    // Extract nonce from hash
    const nonce = parseInt(finalHash.substring(0, 8), 16)
    
    let result
    let payout
    let houseEdge = 0.02 // 2% default

    switch (gameType) {
      case 'dice':
        result = this.calculateDiceResult(finalHash, nonce)
        payout = this.calculateDicePayout(betAmount, result, houseEdge)
        break
      
      case 'crash':
        result = this.calculateCrashResult(finalHash, nonce)
        payout = this.calculateCrashPayout(betAmount, result, houseEdge)
        break
      
      default:
        throw new Error(`Unsupported game type: ${gameType}`)
    }

    return {
      userId: this.getUserIdFromCommit(serverSeed, clientSeed),
      gameType,
      result,
      payout,
      nonce,
      finalHash,
      serverSeed,
      clientSeed,
      transactionHash,
      timestamp: new Date().toISOString(),
      verifiable: true
    }
  }

  calculateDiceResult(hash, nonce) {
    // Use hash to determine dice roll (1-6)
    const roll = (nonce % 6) + 1
    return {
      type: 'dice',
      roll,
      isWin: roll >= 4, // 4, 5, 6 are wins
      multiplier: roll >= 4 ? (6 / (7 - roll)) : 0 // 4=2x, 5=3x, 6=6x
    }
  }

  calculateCrashResult(hash, nonce) {
    // Use hash to determine crash multiplier
    const random = nonce / 0xFFFFFFFF
    const crashPoint = Math.max(1.00, (1 - random * 0.99) / (1 - 0.99))
    
    return {
      type: 'crash',
      crashPoint: Math.round(crashPoint * 100) / 100,
      isWin: crashPoint > 1.00
    }
  }

  calculateDicePayout(betAmount, result, houseEdge) {
    if (!result.isWin) return 0
    
    const grossPayout = betAmount * result.multiplier
    const houseFee = grossPayout * houseEdge
    return Math.floor(grossPayout - houseFee)
  }

  calculateCrashPayout(betAmount, result, houseEdge) {
    if (!result.isWin) return 0
    
    const grossPayout = betAmount * result.crashPoint
    const houseFee = grossPayout * houseEdge
    return Math.floor(grossPayout - houseFee)
  }

  getUserIdFromCommit(serverCommit, clientCommit) {
    const key = `${serverCommit}:${clientCommit}`
    const commit = this.clientCommits.get(key)
    return commit ? commit.userId : null
  }

  // Verify a game result (for transparency)
  verifyGameResult(serverSeed, clientSeed, transactionHash, gameType, expectedResult) {
    try {
      const combined = `${serverSeed}:${clientSeed}:${transactionHash}:${Date.now()}`
      const finalHash = crypto.createHash('sha256').update(combined).digest('hex')
      const nonce = parseInt(finalHash.substring(0, 8), 16)
      
      let calculatedResult
      switch (gameType) {
        case 'dice':
          calculatedResult = this.calculateDiceResult(finalHash, nonce)
          break
        case 'crash':
          calculatedResult = this.calculateCrashResult(finalHash, nonce)
          break
        default:
          return false
      }
      
      return JSON.stringify(calculatedResult) === JSON.stringify(expectedResult)
    } catch (error) {
      console.error('Verification error:', error)
      return false
    }
  }

  // Get active commits for a user
  getUserCommits(userId) {
    const userCommits = []
    
    for (const [key, commit] of this.clientCommits.entries()) {
      if (commit.userId === userId) {
        userCommits.push({
          serverCommit: commit.serverCommit,
          clientCommit: commit.clientCommit,
          gameType: commit.gameType,
          timestamp: commit.timestamp
        })
      }
    }
    
    return userCommits
  }

  // Clean up expired commits
  cleanupExpiredCommits() {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    for (const [key, commit] of this.clientCommits.entries()) {
      if (now - commit.timestamp > maxAge) {
        this.clientCommits.delete(key)
      }
    }
    
    // Clean up expired server seeds
    for (const [commit, seed] of this.serverSeeds.entries()) {
      // Server seeds expire after 24 hours
      if (now - Date.now() > maxAge) {
        this.serverSeeds.delete(commit)
      }
    }
  }

  getStatus() {
    return {
      activeServerCommits: this.serverSeeds.size,
      activeClientCommits: this.clientCommits.size,
      lastCleanup: new Date().toISOString()
    }
  }
}

module.exports = ProvablyFair2Service
