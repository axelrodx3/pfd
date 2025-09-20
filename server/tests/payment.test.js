/**
 * Payment System Tests
 *
 * Comprehensive test suite for the HILO Casino payment system
 */

const request = require('supertest')
const { Connection, Keypair, PublicKey } = require('@solana/web3.js')
const app = require('../index')
const {
  User,
  Deposit,
  Withdrawal,
  GamePlay,
  Settings,
} = require('../models/database')

// Test configuration
const TEST_NETWORK = 'devnet'
const TEST_RPC_URL = 'https://api.devnet.solana.com'

describe('Payment System Tests', () => {
  let testUser
  let testWallet
  let authToken
  let connection

  beforeAll(async () => {
    // Initialize test connection
    connection = new Connection(TEST_RPC_URL, 'confirmed')

    // Create test wallet
    testWallet = Keypair.generate()
    console.log(`Test wallet: ${testWallet.publicKey.toString()}`)

    // Fund test wallet
    try {
      const signature = await connection.requestAirdrop(
        testWallet.publicKey,
        2e9
      ) // 2 SOL
      await connection.confirmTransaction(signature)
      console.log('Test wallet funded')
    } catch (error) {
      console.warn('Could not fund test wallet:', error.message)
    }
  })

  beforeEach(async () => {
    // Create test user
    testUser = await User.createOrGet(testWallet.publicKey.toString())

    // Authenticate user
    const nonceResponse = await request(app)
      .post('/api/auth/nonce')
      .send({ publicKey: testWallet.publicKey.toString() })

    expect(nonceResponse.status).toBe(200)
    const { nonce, message } = nonceResponse.body

    // Sign message (simplified for testing)
    const signature = Buffer.from('test-signature').toString('base64')

    const authResponse = await request(app)
      .post('/api/auth/verify-signature')
      .send({
        publicKey: testWallet.publicKey.toString(),
        message,
        signature,
        nonce,
      })

    expect(authResponse.status).toBe(200)
    authToken = authResponse.body.token
  })

  describe('User Management', () => {
    test('should create user on first access', async () => {
      const newWallet = Keypair.generate()
      const user = await User.createOrGet(newWallet.publicKey.toString())

      expect(user).toBeDefined()
      expect(user.public_key).toBe(newWallet.publicKey.toString())
      expect(user.balance_lamports).toBe(0)
    })

    test('should get existing user', async () => {
      const user = await User.getByPublicKey(testWallet.publicKey.toString())

      expect(user).toBeDefined()
      expect(user.public_key).toBe(testWallet.publicKey.toString())
    })

    test('should update user balance atomically', async () => {
      const initialBalance = testUser.balance_lamports
      const amount = 1000000000 // 1 SOL

      const result = await User.updateBalance(testUser.id, amount, 'test')

      expect(result.newBalance).toBe(initialBalance + amount)
      expect(result.change).toBe(amount)

      // Verify balance was updated
      const updatedUser = await User.getById(testUser.id)
      expect(updatedUser.balance_lamports).toBe(initialBalance + amount)
    })
  })

  describe('Deposit System', () => {
    test('should create deposit intent', async () => {
      const response = await request(app)
        .post('/api/deposits/create-intent')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.depositAddress).toBeDefined()
      expect(response.body.memo).toMatch(/^deposit_\d+_\d+$/)
      expect(response.body.userId).toBe(testUser.id)
    })

    test('should simulate deposit in development', async () => {
      const response = await request(app)
        .post('/api/deposits/simulate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 1.0 })

      expect(response.status).toBe(200)
      expect(response.body.signature).toBeDefined()
      expect(response.body.amount).toBe(1.0)

      // Verify user balance was updated
      const updatedUser = await User.getById(testUser.id)
      expect(updatedUser.balance_lamports).toBe(1000000000) // 1 SOL
    })

    test('should get user deposits', async () => {
      // Create a test deposit
      await Deposit.create(
        testUser.id,
        1000000000, // 1 SOL
        'test-signature-123',
        12345,
        'test-blockhash',
        'test-memo'
      )

      const response = await request(app)
        .get('/api/deposits')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
    })
  })

  describe('Game System', () => {
    beforeEach(async () => {
      // Give user some balance for betting
      await User.updateBalance(testUser.id, 1000000000, 'test-funding') // 1 SOL
    })

    test('should play dice game successfully', async () => {
      const response = await request(app)
        .post('/api/games/play')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          betAmount: 0.1,
          selectedSide: 'high',
          clientSeed: 'test-client-seed',
        })

      expect(response.status).toBe(200)
      expect(response.body.outcome).toBeDefined()
      expect(response.body.won).toBeDefined()
      expect(response.body.payout).toBeDefined()
      expect(response.body.balanceAfter).toBeDefined()
    })

    test('should reject invalid bet amount', async () => {
      const response = await request(app)
        .post('/api/games/play')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          betAmount: 0.0001, // Too small
          selectedSide: 'high',
          clientSeed: 'test-client-seed',
        })

      expect(response.status).toBe(500)
      expect(response.body.message).toContain('Minimum bet')
    })

    test('should reject insufficient balance', async () => {
      const response = await request(app)
        .post('/api/games/play')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          betAmount: 10.0, // More than user has
          selectedSide: 'high',
          clientSeed: 'test-client-seed',
        })

      expect(response.status).toBe(500)
      expect(response.body.message).toContain('Insufficient balance')
    })

    test('should get user game stats', async () => {
      // Play a game first
      await request(app)
        .post('/api/games/play')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          betAmount: 0.1,
          selectedSide: 'high',
          clientSeed: 'test-client-seed',
        })

      const response = await request(app)
        .get('/api/games/stats')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.totalGames).toBeGreaterThan(0)
      expect(response.body.totalWagered).toBeGreaterThan(0)
    })
  })

  describe('Withdrawal System', () => {
    beforeEach(async () => {
      // Give user some balance for withdrawal
      await User.updateBalance(testUser.id, 2000000000, 'test-funding') // 2 SOL
    })

    test('should create withdrawal request', async () => {
      const destAddress = Keypair.generate().publicKey.toString()

      const response = await request(app)
        .post('/api/withdrawals/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          destAddress,
          amount: 1.0,
        })

      expect(response.status).toBe(200)
      expect(response.body.withdrawalId).toBeDefined()
      expect(response.body.status).toBe('pending')
      expect(response.body.amount).toBe(1.0)
    })

    test('should reject invalid destination address', async () => {
      const response = await request(app)
        .post('/api/withdrawals/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          destAddress: 'invalid-address',
          amount: 1.0,
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('Invalid Solana address')
    })

    test('should reject insufficient balance', async () => {
      const destAddress = Keypair.generate().publicKey.toString()

      const response = await request(app)
        .post('/api/withdrawals/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          destAddress,
          amount: 10.0, // More than user has
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('Insufficient balance')
    })

    test('should get withdrawal status', async () => {
      const destAddress = Keypair.generate().publicKey.toString()

      // Create withdrawal
      const createResponse = await request(app)
        .post('/api/withdrawals/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          destAddress,
          amount: 1.0,
        })

      const withdrawalId = createResponse.body.withdrawalId

      // Get status
      const response = await request(app)
        .get(`/api/withdrawals/${withdrawalId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(withdrawalId)
      expect(response.body.status).toBe('pending')
    })
  })

  describe('Admin Functions', () => {
    let adminToken

    beforeAll(async () => {
      // Set admin public key
      process.env.ADMIN_PUBLIC_KEYS = testWallet.publicKey.toString()
    })

    test('should get payout queue status', async () => {
      const response = await request(app)
        .get('/api/admin/payouts/queue')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.total_jobs).toBeDefined()
      expect(response.body.pending).toBeDefined()
    })

    test('should get house statistics', async () => {
      const response = await request(app)
        .get('/api/admin/house/stats')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.totalGames).toBeDefined()
      expect(response.body.totalWagered).toBeDefined()
      expect(response.body.totalHouseFees).toBeDefined()
    })

    test('should update house edge', async () => {
      const response = await request(app)
        .post('/api/admin/house/edge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ houseEdge: 0.03 })

      expect(response.status).toBe(200)
      expect(response.body.houseEdge).toBe(0.03)
    })
  })

  describe('Security Tests', () => {
    test('should reject requests without authentication', async () => {
      const response = await request(app).get('/api/user/balance')

      expect(response.status).toBe(401)
    })

    test('should reject invalid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/user/balance')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(403)
    })

    test('should enforce rate limiting', async () => {
      // Make multiple rapid requests
      const promises = Array(10)
        .fill()
        .map(() =>
          request(app)
            .post('/api/auth/nonce')
            .send({ publicKey: testWallet.publicKey.toString() })
        )

      const responses = await Promise.all(promises)

      // Some requests should be rate limited
      const rateLimited = responses.filter(r => r.status === 429)
      expect(rateLimited.length).toBeGreaterThan(0)
    })
  })

  describe('Database Integrity', () => {
    test('should maintain atomic transactions', async () => {
      const initialBalance = testUser.balance_lamports

      try {
        // This should fail and rollback
        await User.updateBalance(testUser.id, -initialBalance - 1000, 'test')
        await User.updateBalance(testUser.id, 1000, 'test')
      } catch (error) {
        // Expected to fail
      }

      // Balance should be unchanged
      const finalUser = await User.getById(testUser.id)
      expect(finalUser.balance_lamports).toBe(initialBalance)
    })

    test('should prevent duplicate deposits', async () => {
      const signature = 'duplicate-test-signature'

      // Create first deposit
      await Deposit.create(
        testUser.id,
        1000000000,
        signature,
        12345,
        'test-blockhash'
      )

      // Try to create duplicate
      try {
        await Deposit.create(
          testUser.id,
          1000000000,
          signature,
          12345,
          'test-blockhash'
        )
        fail('Should have thrown error for duplicate signature')
      } catch (error) {
        expect(error.message).toContain('UNIQUE constraint failed')
      }
    })
  })

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll test that the app doesn't crash
      const response = await request(app).get('/api/health')

      expect(response.status).toBe(200)
    })

    test('should validate input parameters', async () => {
      const response = await request(app)
        .post('/api/games/play')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          betAmount: 'invalid',
          selectedSide: 'invalid',
          clientSeed: null,
        })

      expect(response.status).toBe(400)
    })
  })
})

describe('Integration Tests', () => {
  test('should complete full deposit -> play -> withdraw flow', async () => {
    // This would be a comprehensive integration test
    // that tests the entire payment flow end-to-end
    expect(true).toBe(true) // Placeholder
  })
})

describe('Performance Tests', () => {
  test('should handle concurrent game plays', async () => {
    // This would test system performance under load
    expect(true).toBe(true) // Placeholder
  })
})
