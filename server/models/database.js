/**
 * Database Models for HILO Casino Payments
 *
 * SAFETY: This uses SQLite for development. Production should use PostgreSQL
 * with proper connection pooling and backup strategies.
 */

const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Database file location
const DB_PATH =
  process.env.DATABASE_PATH || path.join(__dirname, '../data/hilo_casino.db')

// Initialize database
const db = new sqlite3.Database(DB_PATH, err => {
  if (err) {
    console.error('Error opening database:', err.message)
  } else {
    console.log('📊 Connected to SQLite database')
    initializeTables()
  }
})

/**
 * Initialize all database tables
 */
function initializeTables() {
  // Users table (extend existing)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_key TEXT UNIQUE NOT NULL,
      username TEXT,
      email TEXT,
      balance_lamports INTEGER DEFAULT 0,
      reserved_balance_lamports INTEGER DEFAULT 0,
      pending_withdrawal_lamports INTEGER DEFAULT 0,
      total_deposited_lamports INTEGER DEFAULT 0,
      total_withdrawn_lamports INTEGER DEFAULT 0,
      total_wagered_lamports INTEGER DEFAULT 0,
      total_won_lamports INTEGER DEFAULT 0,
      vip_tier TEXT DEFAULT 'Bronze',
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1,
      kyc_verified BOOLEAN DEFAULT 0
    )
  `)

  // Deposits table
  db.run(`
    CREATE TABLE IF NOT EXISTS deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount_lamports INTEGER NOT NULL,
      signature TEXT UNIQUE NOT NULL,
      slot INTEGER,
      blockhash TEXT,
      confirmations INTEGER DEFAULT 0,
      confirmed BOOLEAN DEFAULT 0,
      memo TEXT,
      deposit_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      credited_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `)

  // Withdrawals table
  db.run(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      dest_address TEXT NOT NULL,
      amount_lamports INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      signature TEXT,
      admin_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME,
      failure_reason TEXT,
      idempotency_key TEXT UNIQUE,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (admin_id) REFERENCES users (id)
    )
  `)

  // Treasury ledger table
  db.run(`
    CREATE TABLE IF NOT EXISTS treasury_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      play_id INTEGER,
      type TEXT NOT NULL,
      amount_lamports INTEGER NOT NULL,
      balance_after_lamports INTEGER NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (play_id) REFERENCES game_plays (id)
    )
  `)

  // Game plays table
  db.run(`
    CREATE TABLE IF NOT EXISTS game_plays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_type TEXT NOT NULL,
      bet_amount_lamports INTEGER NOT NULL,
      client_seed TEXT NOT NULL,
      server_seed TEXT NOT NULL,
      nonce INTEGER NOT NULL,
      outcome TEXT NOT NULL,
      won BOOLEAN NOT NULL,
      payout_lamports INTEGER NOT NULL,
      house_fee_lamports INTEGER NOT NULL,
      balance_before_lamports INTEGER NOT NULL,
      balance_after_lamports INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `)

  // Payout jobs table
  db.run(`
    CREATE TABLE IF NOT EXISTS payout_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      target_user_id INTEGER,
      amount_lamports INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      tx_signature TEXT,
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      last_error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME,
      FOREIGN KEY (target_user_id) REFERENCES users (id)
    )
  `)

  // Audit log table
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      admin_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (admin_id) REFERENCES users (id)
    )
  `)

  // System settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Insert default settings
  db.run(`
    INSERT OR IGNORE INTO system_settings (key, value, description) VALUES
    ('house_edge', '0.02', 'House edge percentage (2%)'),
    ('min_bet_lamports', '1000000', 'Minimum bet in lamports (0.001 SOL)'),
    ('max_bet_lamports', '10000000000', 'Maximum bet in lamports (10 SOL)'),
    ('auto_withdraw_limit_lamports', '100000000', 'Auto-approve withdrawals under this amount (0.1 SOL)'),
    ('min_confirmations', '1', 'Minimum confirmations for deposits'),
    ('allow_onchain', 'false', 'Allow on-chain transactions'),
    ('network', 'devnet', 'Solana network'),
    ('treasury_address', '', 'Treasury wallet address'),
    ('daily_withdraw_limit_lamports', '10000000000', 'Daily withdrawal limit per user (10 SOL)'),
    ('daily_deposit_limit_lamports', '100000000000', 'Daily deposit limit per user (100 SOL)')
  `)

  console.log('✅ Database tables initialized')
}

/**
 * User management functions
 */
const User = {
  // Create or get user
  async createOrGet(publicKey) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE public_key = ?',
        [publicKey],
        (err, row) => {
          if (err) return reject(err)

          if (row) {
            resolve(row)
          } else {
            // Create new user
            db.run(
              'INSERT INTO users (public_key, username) VALUES (?, ?)',
              [publicKey, `Player_${publicKey.slice(0, 8)}`],
              function (err) {
                if (err) return reject(err)
                resolve({
                  id: this.lastID,
                  public_key: publicKey,
                  balance_lamports: 0,
                })
              }
            )
          }
        }
      )
    })
  },

  // Update balance atomically
  async updateBalance(userId, amountLamports, type = 'adjustment') {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION')

        // Get current balance
        db.get(
          'SELECT balance_lamports FROM users WHERE id = ?',
          [userId],
          (err, user) => {
            if (err) {
              db.run('ROLLBACK')
              return reject(err)
            }

            const newBalance = Math.max(
              0,
              user.balance_lamports + amountLamports
            )

            // Update balance
            db.run(
              'UPDATE users SET balance_lamports = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [newBalance, userId],
              err => {
                if (err) {
                  db.run('ROLLBACK')
                  return reject(err)
                }

                // Log to treasury ledger
                db.run(
                  'INSERT INTO treasury_ledger (type, amount_lamports, balance_after_lamports, description) VALUES (?, ?, ?, ?)',
                  [
                    type,
                    amountLamports,
                    newBalance,
                    `User ${userId} balance ${amountLamports > 0 ? 'credit' : 'debit'}`,
                  ],
                  err => {
                    if (err) {
                      db.run('ROLLBACK')
                      return reject(err)
                    }

                    db.run('COMMIT', err => {
                      if (err) return reject(err)
                      resolve({ newBalance, change: amountLamports })
                    })
                  }
                )
              }
            )
          }
        )
      })
    })
  },

  // Get user by ID
  async getById(userId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) return reject(err)
        resolve(row)
      })
    })
  },

  // Get user by public key
  async getByPublicKey(publicKey) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE public_key = ?',
        [publicKey],
        (err, row) => {
          if (err) return reject(err)
          resolve(row)
        }
      )
    })
  },
}

/**
 * Deposit management functions
 */
const Deposit = {
  // Create deposit record
  async create(
    userId,
    amountLamports,
    signature,
    slot,
    blockhash,
    memo = null,
    depositAddress = null
  ) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO deposits (user_id, amount_lamports, signature, slot, blockhash, memo, deposit_address)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          amountLamports,
          signature,
          slot,
          blockhash,
          memo,
          depositAddress,
        ],
        function (err) {
          if (err) return reject(err)
          resolve({ id: this.lastID })
        }
      )
    })
  },

  // Mark deposit as confirmed and credit user
  async confirm(depositId, confirmations) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION')

        // Get deposit details
        db.get(
          'SELECT * FROM deposits WHERE id = ?',
          [depositId],
          (err, deposit) => {
            if (err) {
              db.run('ROLLBACK')
              return reject(err)
            }

            if (!deposit) {
              db.run('ROLLBACK')
              return reject(new Error('Deposit not found'))
            }

            // Update deposit
            db.run(
              'UPDATE deposits SET confirmed = 1, confirmations = ?, credited_at = CURRENT_TIMESTAMP WHERE id = ?',
              [confirmations, depositId],
              err => {
                if (err) {
                  db.run('ROLLBACK')
                  return reject(err)
                }

                // Credit user balance
                User.updateBalance(
                  deposit.user_id,
                  deposit.amount_lamports,
                  'deposit'
                )
                  .then(() => {
                    db.run('COMMIT', err => {
                      if (err) return reject(err)
                      resolve(deposit)
                    })
                  })
                  .catch(err => {
                    db.run('ROLLBACK')
                    reject(err)
                  })
              }
            )
          }
        )
      })
    })
  },

  // Get deposits for user
  async getByUser(userId, limit = 50) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit],
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows)
        }
      )
    })
  },
}

/**
 * Withdrawal management functions
 */
const Withdrawal = {
  // Create withdrawal request
  async create(userId, destAddress, amountLamports, idempotencyKey) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO withdrawals (user_id, dest_address, amount_lamports, idempotency_key)
         VALUES (?, ?, ?, ?)`,
        [userId, destAddress, amountLamports, idempotencyKey],
        function (err) {
          if (err) return reject(err)
          resolve({ id: this.lastID })
        }
      )
    })
  },

  // Update withdrawal status
  async updateStatus(
    withdrawalId,
    status,
    signature = null,
    failureReason = null,
    adminId = null
  ) {
    return new Promise((resolve, reject) => {
      const updates = ['status = ?', 'updated_at = CURRENT_TIMESTAMP']
      const values = [status]

      if (signature) {
        updates.push('signature = ?')
        values.push(signature)
      }

      if (failureReason) {
        updates.push('failure_reason = ?')
        values.push(failureReason)
      }

      if (adminId) {
        updates.push('admin_id = ?')
        values.push(adminId)
      }

      if (status === 'completed') {
        updates.push('processed_at = CURRENT_TIMESTAMP')
      }

      values.push(withdrawalId)

      db.run(
        `UPDATE withdrawals SET ${updates.join(', ')} WHERE id = ?`,
        values,
        err => {
          if (err) return reject(err)
          resolve()
        }
      )
    })
  },

  // Get pending withdrawals
  async getPending() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT w.*, u.public_key, u.username 
         FROM withdrawals w 
         JOIN users u ON w.user_id = u.id 
         WHERE w.status = 'pending' 
         ORDER BY w.created_at ASC`,
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows)
        }
      )
    })
  },
}

/**
 * Game play management functions
 */
const GamePlay = {
  // Record game play
  async create(playData) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO game_plays (
          user_id, game_type, bet_amount_lamports, client_seed, server_seed, nonce,
          outcome, won, payout_lamports, house_fee_lamports, balance_before_lamports, balance_after_lamports
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          playData.userId,
          playData.gameType,
          playData.betAmountLamports,
          playData.clientSeed,
          playData.serverSeed,
          playData.nonce,
          playData.outcome,
          playData.won,
          playData.payoutLamports,
          playData.houseFeeLamports,
          playData.balanceBeforeLamports,
          playData.balanceAfterLamports,
        ],
        function (err) {
          if (err) return reject(err)
          resolve({ id: this.lastID })
        }
      )
    })
  },
}

/**
 * System settings functions
 */
const Settings = {
  // Get setting value
  async get(key) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT value FROM system_settings WHERE key = ?',
        [key],
        (err, row) => {
          if (err) return reject(err)
          resolve(row ? row.value : null)
        }
      )
    })
  },

  // Set setting value
  async set(key, value) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [key, value],
        err => {
          if (err) return reject(err)
          resolve()
        }
      )
    })
  },
}

/**
 * Audit logging functions
 */
const AuditLog = {
  // Log action
  async log(userId, adminId, action, details, ipAddress, userAgent, transactionHash = null) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO audit_log (user_id, admin_id, action, details, ip_address, user_agent, transaction_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, adminId, action, details, ipAddress, userAgent, transactionHash],
        function (err) {
          if (err) return reject(err)
          resolve({ id: this.lastID })
        }
      )
    })
  },

  // Enhanced logging for financial transactions
  async logTransaction(userId, action, amount, transactionHash, details = {}) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO audit_log (user_id, admin_id, action, details, transaction_hash, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [userId, null, action, JSON.stringify({
          amount,
          ...details,
          timestamp: new Date().toISOString()
        }), transactionHash],
        function (err) {
          if (err) return reject(err)
          resolve({ id: this.lastID })
        }
      )
    })
  },

  // Get user's transaction history
  async getUserHistory(userId, limit = 50) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT action, details, transaction_hash, created_at 
         FROM audit_log 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [userId, limit],
        (err, rows) => {
          if (err) return reject(err)
          resolve(rows.map(row => ({
            ...row,
            details: JSON.parse(row.details)
          })))
        }
      )
    })
  },

  // Get suspicious activity
  async getSuspiciousActivity(hours = 24) {
    return new Promise((resolve, reject) => {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
      db.all(
        `SELECT user_id, action, details, ip_address, created_at
         FROM audit_log 
         WHERE action IN ('RATE_LIMIT_EXCEEDED', 'DAILY_LIMIT_EXCEEDED', 'SUSPICIOUS_ACTIVITY')
         AND created_at >= ?
         ORDER BY created_at DESC`,
        [cutoff.toISOString()],
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
}

module.exports = {
  db,
  User,
  Deposit,
  Withdrawal,
  GamePlay,
  Settings,
  AuditLog,
}
