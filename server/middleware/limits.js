const { User, AuditLog } = require('../models/database')

/**
 * Transaction Limits Middleware
 * Implements per-user daily limits for deposits and withdrawals
 */

// Daily limits in lamports
const DAILY_LIMITS = {
  DEPOSIT: parseInt(process.env.DAILY_DEPOSIT_LIMIT_LAMPORTS || '10000000000'), // 10 SOL
  WITHDRAWAL: parseInt(process.env.DAILY_WITHDRAWAL_LIMIT_LAMPORTS || '5000000000'), // 5 SOL
  GAME_BET: parseInt(process.env.DAILY_GAME_BET_LIMIT_LAMPORTS || '2000000000'), // 2 SOL
}

// Rate limiting windows
const RATE_LIMITS = {
  DEPOSIT: 5, // 5 deposits per hour
  WITHDRAWAL: 3, // 3 withdrawals per hour
  GAME_BET: 100, // 100 bets per hour
}

// Track user activity in memory (in production, use Redis)
const userActivity = new Map()

/**
 * Get user's daily transaction totals
 */
async function getUserDailyTotals(userId, type) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  try {
    // Get total from database
    const query = `
      SELECT COALESCE(SUM(amount_lamports), 0) as total
      FROM ${type === 'deposit' ? 'deposits' : 'withdrawals'}
      WHERE user_id = ? AND created_at >= ? AND created_at < ?
    `
    
    const result = await User.db.get(query, [userId, today.toISOString(), tomorrow.toISOString()])
    return result.total || 0
  } catch (error) {
    console.error('Error getting daily totals:', error)
    return 0
  }
}

/**
 * Check if user has exceeded rate limits
 */
function checkRateLimit(userId, type) {
  const now = Date.now()
  const windowMs = 60 * 60 * 1000 // 1 hour
  const limit = RATE_LIMITS[type.toUpperCase()]
  
  if (!userActivity.has(userId)) {
    userActivity.set(userId, {})
  }
  
  const userData = userActivity.get(userId)
  if (!userData[type]) {
    userData[type] = []
  }
  
  // Remove old entries
  userData[type] = userData[type].filter(timestamp => now - timestamp < windowMs)
  
  // Check if limit exceeded
  if (userData[type].length >= limit) {
    return false
  }
  
  // Add current request
  userData[type].push(now)
  return true
}

/**
 * Transaction limits middleware
 */
function createLimitsMiddleware(type) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' })
      }
      
      const amount = req.body.amount || req.body.amount_lamports || 0
      const amountLamports = typeof amount === 'number' ? amount : parseInt(amount)
      
      // Check rate limit
      if (!checkRateLimit(userId, type)) {
        await AuditLog.log(userId, null, 'RATE_LIMIT_EXCEEDED', {
          type,
          amount: amountLamports,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        })
        
        return res.status(429).json({ 
          error: `Rate limit exceeded for ${type}. Please wait before making another request.` 
        })
      }
      
      // Check daily limit
      const dailyTotal = await getUserDailyTotals(userId, type)
      const limit = DAILY_LIMITS[type.toUpperCase()]
      
      if (dailyTotal + amountLamports > limit) {
        await AuditLog.log(userId, null, 'DAILY_LIMIT_EXCEEDED', {
          type,
          amount: amountLamports,
          dailyTotal,
          limit,
          ip: req.ip
        })
        
        return res.status(400).json({ 
          error: `Daily ${type} limit exceeded. Limit: ${limit / 1e9} SOL, Used: ${dailyTotal / 1e9} SOL, Requested: ${amountLamports / 1e9} SOL` 
        })
      }
      
      // Add to request for logging
      req.transactionLimits = {
        type,
        amount: amountLamports,
        dailyTotal,
        limit,
        remaining: limit - dailyTotal
      }
      
      next()
    } catch (error) {
      console.error('Limits middleware error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

/**
 * Replay protection middleware
 */
function replayProtection(req, res, next) {
  const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey
  
  if (!idempotencyKey) {
    return res.status(400).json({ 
      error: 'Idempotency key required for transaction safety' 
    })
  }
  
  // Check if this key was already used (in production, use Redis)
  const key = `replay:${idempotencyKey}`
  if (userActivity.has(key)) {
    return res.status(409).json({ 
      error: 'Duplicate transaction detected. Please use a new idempotency key.' 
    })
  }
  
  // Mark key as used
  userActivity.set(key, Date.now())
  
  // Clean up old keys (keep last 24 hours)
  const cutoff = Date.now() - (24 * 60 * 60 * 1000)
  for (const [k, v] of userActivity.entries()) {
    if (k.startsWith('replay:') && v < cutoff) {
      userActivity.delete(k)
    }
  }
  
  req.idempotencyKey = idempotencyKey
  next()
}

module.exports = {
  createLimitsMiddleware,
  replayProtection,
  DAILY_LIMITS,
  RATE_LIMITS
}
