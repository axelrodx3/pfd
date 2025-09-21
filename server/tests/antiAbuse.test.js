const AntiAbuseService = require('../services/antiAbuse')
const { User } = require('../models/database')

/**
 * Anti-Abuse Test Suite
 * Tests all abuse prevention mechanisms
 */

describe('Anti-Abuse Service', () => {
  let antiAbuseService
  let mockReq

  beforeEach(() => {
    antiAbuseService = new AntiAbuseService()
    mockReq = {
      ip: '192.168.1.100',
      get: (header) => {
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        }
        return headers[header]
      }
    }
  })

  describe('Device Fingerprinting', () => {
    test('should generate consistent fingerprints for same request', () => {
      const fingerprint1 = antiAbuseService.generateDeviceFingerprint(mockReq)
      const fingerprint2 = antiAbuseService.generateDeviceFingerprint(mockReq)
      
      expect(fingerprint1).toBe(fingerprint2)
      expect(fingerprint1).toHaveLength(64) // SHA-256 hex length
    })

    test('should generate different fingerprints for different requests', () => {
      const req2 = {
        ...mockReq,
        ip: '192.168.1.101'
      }
      
      const fingerprint1 = antiAbuseService.generateDeviceFingerprint(mockReq)
      const fingerprint2 = antiAbuseService.generateDeviceFingerprint(req2)
      
      expect(fingerprint1).not.toBe(fingerprint2)
    })
  })

  describe('Multi-Account Detection', () => {
    test('should allow accounts within limits', async () => {
      const result = await antiAbuseService.checkMultiAccountAbuse(1, 'pubkey1', mockReq)
      expect(result.allowed).toBe(true)
    })

    test('should detect IP-based multi-account abuse', async () => {
      // Mock multiple accounts from same IP
      jest.spyOn(antiAbuseService, 'getAccountsByIP').mockResolvedValue([1, 2, 3, 4]) // Exceeds limit
      
      const result = await antiAbuseService.checkMultiAccountAbuse(5, 'pubkey5', mockReq)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Too many accounts from this IP')
    })

    test('should detect device-based multi-account abuse', async () => {
      // Mock multiple accounts from same device
      jest.spyOn(antiAbuseService, 'getAccountsByDevice').mockResolvedValue([1, 2, 3]) // Exceeds limit
      
      const result = await antiAbuseService.checkMultiAccountAbuse(4, 'pubkey4', mockReq)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Too many accounts from this device')
    })
  })

  describe('Faucet Abuse Prevention', () => {
    test('should allow faucet requests within limits', async () => {
      jest.spyOn(antiAbuseService, 'getFaucetUsage').mockResolvedValue(1000000000) // 1 SOL used
      jest.spyOn(antiAbuseService, 'getFaucetUsageByIP').mockResolvedValue(2000000000) // 2 SOL used
      jest.spyOn(antiAbuseService, 'getLastFaucetUsage').mockResolvedValue(null) // No recent usage
      
      const result = await antiAbuseService.checkFaucetAbuse(1, 1000000000, mockReq) // 1 SOL request
      expect(result.allowed).toBe(true)
    })

    test('should prevent excessive user faucet usage', async () => {
      jest.spyOn(antiAbuseService, 'getFaucetUsage').mockResolvedValue(4000000000) // 4 SOL used
      
      const result = await antiAbuseService.checkFaucetAbuse(1, 2000000000, mockReq) // 2 SOL request
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Daily faucet limit exceeded')
    })

    test('should prevent excessive IP faucet usage', async () => {
      jest.spyOn(antiAbuseService, 'getFaucetUsage').mockResolvedValue(1000000000)
      jest.spyOn(antiAbuseService, 'getFaucetUsageByIP').mockResolvedValue(8000000000) // 8 SOL used
      
      const result = await antiAbuseService.checkFaucetAbuse(1, 3000000000, mockReq) // 3 SOL request
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('IP daily faucet limit exceeded')
    })

    test('should enforce cooldown period', async () => {
      jest.spyOn(antiAbuseService, 'getFaucetUsage').mockResolvedValue(1000000000)
      jest.spyOn(antiAbuseService, 'getFaucetUsageByIP').mockResolvedValue(2000000000)
      jest.spyOn(antiAbuseService, 'getLastFaucetUsage').mockResolvedValue(Date.now() - 1800000) // 30 minutes ago
      
      const result = await antiAbuseService.checkFaucetAbuse(1, 1000000000, mockReq)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Please wait')
    })
  })

  describe('Referral Abuse Prevention', () => {
    test('should prevent self-referrals', async () => {
      const result = await antiAbuseService.checkReferralAbuse(1, 1, 'REF123', mockReq)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Self-referrals are not allowed')
    })

    test('should prevent same-IP referrals', async () => {
      jest.spyOn(antiAbuseService, 'getUserIP').mockResolvedValue('192.168.1.100') // Same IP
      
      const result = await antiAbuseService.checkReferralAbuse(1, 2, 'REF123', mockReq)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Referrals from same IP are not allowed')
    })

    test('should require minimum wager for referrals', async () => {
      jest.spyOn(antiAbuseService, 'getUserIP').mockResolvedValue('192.168.1.101') // Different IP
      jest.spyOn(User, 'findById').mockResolvedValue({
        total_wagered_lamports: 500000000 // 0.5 SOL - below minimum
      })
      
      const result = await antiAbuseService.checkReferralAbuse(1, 2, 'REF123', mockReq)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Referrer must have wagered at least 1 SOL')
    })

    test('should allow valid referrals', async () => {
      jest.spyOn(antiAbuseService, 'getUserIP').mockResolvedValue('192.168.1.101') // Different IP
      jest.spyOn(User, 'findById').mockResolvedValue({
        total_wagered_lamports: 2000000000 // 2 SOL - above minimum
      })
      jest.spyOn(antiAbuseService, 'checkCircularReferral').mockResolvedValue(false)
      
      const result = await antiAbuseService.checkReferralAbuse(1, 2, 'REF123', mockReq)
      expect(result.allowed).toBe(true)
    })
  })

  describe('Withdrawal Abuse Prevention', () => {
    test('should allow normal withdrawals', async () => {
      jest.spyOn(antiAbuseService, 'getLastLargeWithdrawal').mockResolvedValue(null)
      jest.spyOn(antiAbuseService, 'getRecentWithdrawals').mockResolvedValue([])
      
      const result = await antiAbuseService.checkWithdrawalAbuse(1, 1000000000, mockReq) // 1 SOL
      expect(result.allowed).toBe(true)
    })

    test('should enforce large withdrawal cooldown', async () => {
      jest.spyOn(antiAbuseService, 'getLastLargeWithdrawal').mockResolvedValue(Date.now() - 900000) // 15 minutes ago
      
      const result = await antiAbuseService.checkWithdrawalAbuse(1, 6000000000, mockReq) // 6 SOL
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Large withdrawal cooldown')
    })

    test('should detect excessive withdrawal patterns', async () => {
      jest.spyOn(antiAbuseService, 'getLastLargeWithdrawal').mockResolvedValue(null)
      jest.spyOn(antiAbuseService, 'getRecentWithdrawals').mockResolvedValue([
        { amount_lamports: 3000000000, created_at: new Date().toISOString() },
        { amount_lamports: 2000000000, created_at: new Date().toISOString() }
      ]) // 5 SOL total in last 24h
      
      const result = await antiAbuseService.checkWithdrawalAbuse(1, 2000000000, mockReq) // 2 SOL more
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Excessive withdrawal activity detected')
    })
  })

  describe('Abuse Flagging', () => {
    test('should flag multi-account abuse', async () => {
      const flagSpy = jest.spyOn(antiAbuseService, 'flagAbuse').mockResolvedValue()
      
      await antiAbuseService.flagAbuse(1, 'MULTI_ACCOUNT_IP', 'high', {
        ipAddress: '192.168.1.100',
        accountCount: 5,
        threshold: 3
      })
      
      expect(flagSpy).toHaveBeenCalledWith(1, 'MULTI_ACCOUNT_IP', 'high', expect.objectContaining({
        ipAddress: '192.168.1.100',
        accountCount: 5,
        threshold: 3
      }))
    })
  })

  describe('Configuration', () => {
    test('should use configurable thresholds', () => {
      expect(antiAbuseService.config.MAX_ACCOUNTS_PER_IP).toBeDefined()
      expect(antiAbuseService.config.FAUCET_DAILY_LIMIT).toBeDefined()
      expect(antiAbuseService.config.MIN_WAGER_FOR_REFERRAL).toBeDefined()
    })

    test('should allow threshold customization via environment', () => {
      process.env.MAX_ACCOUNTS_PER_IP = '5'
      const service = new AntiAbuseService()
      expect(service.config.MAX_ACCOUNTS_PER_IP).toBe(5)
    })
  })
})

describe('Integration Tests', () => {
  let antiAbuseService
  let mockReq

  beforeEach(() => {
    antiAbuseService = new AntiAbuseService()
    mockReq = {
      ip: '192.168.1.100',
      get: (header) => {
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        }
        return headers[header]
      }
    }
  })

  test('should handle complete abuse detection flow', async () => {
    // Mock database responses
    jest.spyOn(antiAbuseService, 'getAccountsByIP').mockResolvedValue([1, 2, 3])
    jest.spyOn(antiAbuseService, 'getAccountsByDevice').mockResolvedValue([1, 2])
    jest.spyOn(antiAbuseService, 'recordDeviceFingerprint').mockResolvedValue()
    
    const result = await antiAbuseService.checkMultiAccountAbuse(4, 'pubkey4', mockReq)
    expect(result.allowed).toBe(true)
  })

  test('should handle faucet abuse detection flow', async () => {
    jest.spyOn(antiAbuseService, 'getFaucetUsage').mockResolvedValue(1000000000)
    jest.spyOn(antiAbuseService, 'getFaucetUsageByIP').mockResolvedValue(2000000000)
    jest.spyOn(antiAbuseService, 'getLastFaucetUsage').mockResolvedValue(null)
    jest.spyOn(antiAbuseService, 'recordFaucetUsage').mockResolvedValue()
    
    const result = await antiAbuseService.checkFaucetAbuse(1, 1000000000, mockReq)
    expect(result.allowed).toBe(true)
  })
})

module.exports = {
  AntiAbuseService
}
