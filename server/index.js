const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const rateLimit = require('express-rate-limit')
const {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} = require('@solana/web3.js')
const bs58 = require('bs58')
const {
  getSecurityConfig,
  solanaSecurityMiddleware,
  rateLimitConfig,
} = require('./security')
const authManager = require('./auth')

// Import new services
const TreasuryService = require('./services/treasury')
const DepositMonitorService = require('./services/depositMonitor')
const GameService = require('./services/gameService')
const PayoutService = require('./services/payoutService')
const {
  User,
  Deposit,
  Withdrawal,
  Settings,
  AuditLog,
} = require('./models/database')

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware with comprehensive CSP
const securityConfig = getSecurityConfig({
  development: process.env.NODE_ENV === 'development',
  rpcUrl: SOLANA_RPC_URL,
})

app.use(helmet(securityConfig))
app.use(solanaSecurityMiddleware)

// Additional security headers
app.use((req, res, next) => {
  // Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY')
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff')
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade')
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  
  next()
})

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
)

app.use(express.json({ limit: '1mb' })) // Reduced limit for security

// Input validation middleware
const validatePaymentInput = (req, res, next) => {
  const { amount, address } = req.body
  
  // Validate amount
  if (amount !== undefined) {
    if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
      return res.status(400).json({ error: 'Invalid amount' })
    }
  }
  
  // Validate Solana address
  if (address !== undefined) {
    if (typeof address !== 'string' || address.length < 32 || address.length > 44) {
      return res.status(400).json({ error: 'Invalid Solana address format' })
    }
  }
  
  next()
}

// Rate limiting middleware
app.use('/api/auth/nonce', rateLimit(rateLimitConfig.nonce))
app.use('/api/auth/verify-signature', rateLimit(rateLimitConfig.signature))
app.use('/api/wallet/withdraw', rateLimit(rateLimitConfig.withdrawal))
app.use('/api/deposits', rateLimit(rateLimitConfig.general), validatePaymentInput)
app.use('/api/games/play', rateLimit(rateLimitConfig.general), validatePaymentInput)
app.use('/api/withdrawals', rateLimit(rateLimitConfig.withdrawal), validatePaymentInput)
app.use('/api/', rateLimit(rateLimitConfig.general))

// Initialize services
let treasuryService
let depositMonitorService
let gameService
let payoutService

async function initializeServices() {
  try {
    console.log('🚀 Initializing HILO Casino services...')

    // Initialize treasury service
    treasuryService = new TreasuryService()
    await treasuryService.initialize()

    // Initialize game service
    gameService = new GameService()
    await gameService.initialize()

    // Initialize payout service
    payoutService = new PayoutService(treasuryService)
    await payoutService.initialize()

    // Initialize deposit monitor
    depositMonitorService = new DepositMonitorService(treasuryService)
    await depositMonitorService.start()

    console.log('✅ All services initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize services:', error)
    process.exit(1)
  }
}

// Initialize services on startup
initializeServices()

// JWT secret
const JWT_SECRET =
  process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex')
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// Get client IP helper
const getClientIP = req => {
  return (
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    '127.0.0.1'
  )
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Access token required' })
  }

  try {
    const user = authManager.verifyJWT(token)
    authManager.updateSessionActivity(user.publicKey)
    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' })
  }
}

// Generate nonce endpoint
app.post('/api/auth/nonce', (req, res) => {
  try {
    const { publicKey } = req.body
    const clientIP = getClientIP(req)

    if (!publicKey) {
      return res.status(400).json({ message: 'Public key required' })
    }

    const nonceData = authManager.generateNonce(publicKey, clientIP)

    res.json({
      nonce: nonceData.nonce,
      message: nonceData.message,
      expiresIn: nonceData.expires,
    })
  } catch (error) {
    console.error('Error generating nonce:', error)
    res.status(400).json({ message: error.message })
  }
})

// Verify signature endpoint
app.post('/api/auth/verify-signature', async (req, res) => {
  try {
    const { publicKey, message, signature, nonce } = req.body
    const clientIP = getClientIP(req)

    if (!publicKey || !message || !signature || !nonce) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const result = authManager.verifySignature(
      nonce,
      publicKey,
      signature,
      message,
      clientIP
    )

    res.json({
      token: result.token,
      message: 'Authentication successful',
      publicKey: result.publicKey,
      expiresIn: result.expiresIn,
    })
  } catch (error) {
    console.error('Error verifying signature:', error)
    res.status(400).json({ message: error.message })
  }
})

// Get wallet balance endpoint
app.get(
  '/api/wallet/balance/:publicKey',
  authenticateToken,
  async (req, res) => {
    try {
      const { publicKey } = req.params

      if (req.user.publicKey !== publicKey) {
        return res.status(403).json({ message: 'Unauthorized' })
      }

      const balance = await connection.getBalance(new PublicKey(publicKey))
      const solBalance = balance / 1e9 // Convert lamports to SOL

      res.json({
        balance: solBalance,
        lamports: balance,
      })
    } catch (error) {
      console.error('Error fetching balance:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
)

// Get treasury balance endpoint
app.get('/api/wallet/treasury-balance', authenticateToken, async (req, res) => {
  try {
    const balance = await treasuryService.getBalance()
    res.json(balance)
  } catch (error) {
    console.error('Error fetching treasury balance:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Withdraw from treasury endpoint
app.post('/api/wallet/withdraw', authenticateToken, async (req, res) => {
  try {
    const { recipient, amount } = req.body

    if (!recipient || !amount) {
      return res.status(400).json({ message: 'Recipient and amount required' })
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' })
    }

    // Validate recipient address
    let recipientPubkey
    try {
      recipientPubkey = new PublicKey(recipient)
    } catch (error) {
      return res.status(400).json({ message: 'Invalid recipient address' })
    }

    // Check treasury balance
    const treasuryBalance = await connection.getBalance(
      treasuryKeypair.publicKey
    )
    const requiredLamports = Math.floor(amount * 1e9)

    if (treasuryBalance < requiredLamports) {
      return res.status(400).json({ message: 'Insufficient treasury balance' })
    }

    // Create and send transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasuryKeypair.publicKey,
        toPubkey: recipientPubkey,
        lamports: requiredLamports,
      })
    )

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [treasuryKeypair],
      { commitment: 'confirmed' }
    )

    res.json({
      signature,
      message: 'Withdrawal successful',
      amount,
      recipient,
    })
  } catch (error) {
    console.error('Error processing withdrawal:', error)
    res.status(500).json({ message: 'Withdrawal failed: ' + error.message })
  }
})

// ============================================================================
// PAYMENT SYSTEM API ENDPOINTS
// ============================================================================

// Get user balance
app.get('/api/user/balance', authenticateToken, async (req, res) => {
  try {
    const user = await User.getByPublicKey(req.user.publicKey)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      balance: user.balance_lamports / 1e9,
      lamports: user.balance_lamports,
      reserved: user.reserved_balance_lamports / 1e9,
      pending: user.pending_withdrawal_lamports / 1e9,
    })
  } catch (error) {
    console.error('Error fetching user balance:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Create deposit intent
app.post('/api/deposits/create-intent', authenticateToken, async (req, res) => {
  try {
    const user = await User.createOrGet(req.user.publicKey)
    const memo = `deposit_${user.id}_${Date.now()}`

    const depositInfo = await treasuryService.createDepositAddress(
      user.id,
      memo
    )

    res.json({
      depositAddress: depositInfo.address,
      memo: depositInfo.memo,
      instructions: depositInfo.instructions,
      userId: user.id,
    })
  } catch (error) {
    console.error('Error creating deposit intent:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Simulate deposit (dev only)
app.post('/api/deposits/simulate', authenticateToken, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res
        .status(403)
        .json({ message: 'Deposit simulation not allowed in production' })
    }

    const { amount } = req.body
    const user = await User.createOrGet(req.user.publicKey)

    const result = await depositMonitorService.simulateDeposit(user.id, amount)

    res.json({
      message: 'Deposit simulated successfully',
      signature: result.signature,
      amount: result.amount,
    })
  } catch (error) {
    console.error('Error simulating deposit:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get user deposits
app.get('/api/deposits', authenticateToken, async (req, res) => {
  try {
    const user = await User.getByPublicKey(req.user.publicKey)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const deposits = await Deposit.getByUser(user.id)

    res.json(
      deposits.map(deposit => ({
        id: deposit.id,
        amount: deposit.amount_lamports / 1e9,
        signature: deposit.signature,
        confirmed: !!deposit.confirmed,
        confirmations: deposit.confirmations,
        createdAt: deposit.created_at,
        creditedAt: deposit.credited_at,
      }))
    )
  } catch (error) {
    console.error('Error fetching deposits:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Play dice game
app.post('/api/games/play', authenticateToken, async (req, res) => {
  try {
    const { betAmount, selectedSide, clientSeed } = req.body

    if (!betAmount || !selectedSide || !clientSeed) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    if (!['high', 'low'].includes(selectedSide)) {
      return res.status(400).json({ message: 'Invalid selected side' })
    }

    const user = await User.createOrGet(req.user.publicKey)
    const betAmountLamports = Math.floor(betAmount * 1e9)

    const result = await gameService.playDice(
      user.id,
      betAmountLamports,
      selectedSide,
      clientSeed
    )

    res.json(result)
  } catch (error) {
    console.error('Error playing game:', error)
    res.status(500).json({ message: error.message || 'Internal server error' })
  }
})

// Get user game stats
app.get('/api/games/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.getByPublicKey(req.user.publicKey)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const stats = await gameService.getUserGameStats(user.id)
    res.json(stats)
  } catch (error) {
    console.error('Error fetching game stats:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get user game history
app.get('/api/games/history', authenticateToken, async (req, res) => {
  try {
    const user = await User.getByPublicKey(req.user.publicKey)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const limit = parseInt(req.query.limit) || 50
    const history = await gameService.getUserGameHistory(user.id, limit)
    res.json(history)
  } catch (error) {
    console.error('Error fetching game history:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Request withdrawal
app.post('/api/withdrawals/request', authenticateToken, async (req, res) => {
  try {
    const { destAddress, amount } = req.body

    if (!destAddress || !amount) {
      return res
        .status(400)
        .json({ message: 'Destination address and amount required' })
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' })
    }

    // Validate Solana address
    try {
      new PublicKey(destAddress)
    } catch (error) {
      return res.status(400).json({ message: 'Invalid Solana address' })
    }

    const user = await User.getByPublicKey(req.user.publicKey)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const amountLamports = Math.floor(amount * 1e9)

    if (user.balance_lamports < amountLamports) {
      return res.status(400).json({ message: 'Insufficient balance' })
    }

    // Check daily withdrawal limit
    const dailyLimit = await Settings.get('daily_withdraw_limit_lamports')
    const dailyLimitLamports = parseInt(dailyLimit) || 10000000000 // 10 SOL default

    // TODO: Implement daily limit check

    // Create withdrawal request
    const idempotencyKey = crypto.randomUUID()
    const withdrawal = await Withdrawal.create(
      user.id,
      destAddress,
      amountLamports,
      idempotencyKey
    )

    // Create payout job
    await payoutService.createPayoutJob('withdrawal', user.id, amountLamports)

    res.json({
      withdrawalId: withdrawal.id,
      status: 'pending',
      amount: amount,
      destAddress: destAddress,
      idempotencyKey: idempotencyKey,
    })
  } catch (error) {
    console.error('Error creating withdrawal request:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get withdrawal status
app.get('/api/withdrawals/:id', authenticateToken, async (req, res) => {
  try {
    const withdrawalId = req.params.id
    const user = await User.getByPublicKey(req.user.publicKey)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get withdrawal details
    const db = require('./models/database').db
    const withdrawal = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM withdrawals WHERE id = ? AND user_id = ?',
        [withdrawalId, user.id],
        (err, row) => {
          if (err) return reject(err)
          resolve(row)
        }
      )
    })

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' })
    }

    res.json({
      id: withdrawal.id,
      amount: withdrawal.amount_lamports / 1e9,
      destAddress: withdrawal.dest_address,
      status: withdrawal.status,
      signature: withdrawal.signature,
      createdAt: withdrawal.created_at,
      processedAt: withdrawal.processed_at,
      failureReason: withdrawal.failure_reason,
    })
  } catch (error) {
    console.error('Error fetching withdrawal:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// ============================================================================
// ADMIN API ENDPOINTS
// ============================================================================

// Admin middleware (simplified - in production use proper role-based auth)
const requireAdmin = (req, res, next) => {
  // For demo purposes, check if user is in admin list
  const adminPublicKeys = (process.env.ADMIN_PUBLIC_KEYS || '')
    .split(',')
    .filter(Boolean)

  if (
    adminPublicKeys.length === 0 ||
    adminPublicKeys.includes(req.user.publicKey)
  ) {
    next()
  } else {
    res.status(403).json({ message: 'Admin access required' })
  }
}

// Get payout queue status
app.get(
  '/api/admin/payouts/queue',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const queueStatus = await payoutService.getQueueStatus()
      res.json(queueStatus)
    } catch (error) {
      console.error('Error fetching payout queue:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
)

// Approve payout job
app.post(
  '/api/admin/payouts/:jobId/approve',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const jobId = req.params.jobId
      await payoutService.approvePayoutJob(jobId, req.user.publicKey)

      res.json({ message: 'Payout job approved successfully' })
    } catch (error) {
      console.error('Error approving payout job:', error)
      res
        .status(500)
        .json({ message: error.message || 'Internal server error' })
    }
  }
)

// Reject payout job
app.post(
  '/api/admin/payouts/:jobId/reject',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { reason } = req.body
      const jobId = req.params.jobId

      if (!reason) {
        return res.status(400).json({ message: 'Rejection reason required' })
      }

      await payoutService.rejectPayoutJob(jobId, req.user.publicKey, reason)

      res.json({ message: 'Payout job rejected successfully' })
    } catch (error) {
      console.error('Error rejecting payout job:', error)
      res
        .status(500)
        .json({ message: error.message || 'Internal server error' })
    }
  }
)

// Get house statistics
app.get(
  '/api/admin/house/stats',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const stats = await gameService.getHouseStats()
      res.json(stats)
    } catch (error) {
      console.error('Error fetching house stats:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
)

// Update house edge
app.post(
  '/api/admin/house/edge',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { houseEdge } = req.body

      if (typeof houseEdge !== 'number' || houseEdge < 0 || houseEdge > 0.5) {
        return res
          .status(400)
          .json({ message: 'House edge must be between 0 and 0.5' })
      }

      await gameService.updateHouseEdge(houseEdge)

      res.json({ message: 'House edge updated successfully', houseEdge })
    } catch (error) {
      console.error('Error updating house edge:', error)
      res
        .status(500)
        .json({ message: error.message || 'Internal server error' })
    }
  }
)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    network: process.env.SOLANA_NETWORK || 'devnet',
    treasuryAddress:
      treasuryService?.treasuryKeypair?.publicKey?.toString() ||
      'Not initialized',
    services: {
      treasury: !!treasuryService,
      depositMonitor: !!depositMonitorService,
      gameService: !!gameService,
      payoutService: !!payoutService,
    },
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error)
  res.status(500).json({ message: 'Internal server error' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' })
})

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 HILO Casino API server running on port ${PORT}`)
  console.log(`🌐 Network: ${process.env.SOLANA_NETWORK || 'devnet'}`)
  console.log(`🔐 JWT secret: ${JWT_SECRET.substring(0, 8)}...`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...')

  if (depositMonitorService) {
    await depositMonitorService.stop()
  }

  if (payoutService) {
    payoutService.stopProcessing()
  }

  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...')

  if (depositMonitorService) {
    await depositMonitorService.stop()
  }

  if (payoutService) {
    payoutService.stopProcessing()
  }

  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

module.exports = app
