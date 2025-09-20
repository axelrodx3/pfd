const { User, AuditLog } = require('./database')

/**
 * Enhanced User Profile System
 * Manages user identity, XP, badges, streaks, and social features
 */

class UserProfileService {
  constructor() {
    this.badgeDefinitions = {
      FIRST_DEPOSIT: { name: 'First Deposit', description: 'Made your first deposit', xp: 100 },
      HIGH_ROLLER: { name: 'High Roller', description: 'Wagered over 100 SOL total', xp: 500 },
      LUCKY_STREAK: { name: 'Lucky Streak', description: 'Won 10 games in a row', xp: 300 },
      REFERRAL_MASTER: { name: 'Referral Master', description: 'Referred 10 friends', xp: 200 },
      DAILY_PLAYER: { name: 'Daily Player', description: 'Played for 7 consecutive days', xp: 150 },
      BIG_WIN: { name: 'Big Win', description: 'Won over 50 SOL in a single game', xp: 1000 },
      FAITHFUL: { name: 'Faithful', description: 'Played for 30 consecutive days', xp: 1000 },
      VIP: { name: 'VIP', description: 'Reached VIP status', xp: 2000 }
    }
    
    this.xpLevels = [
      { level: 1, xpRequired: 0, name: 'Newcomer' },
      { level: 2, xpRequired: 500, name: 'Rookie' },
      { level: 3, xpRequired: 1500, name: 'Player' },
      { level: 4, xpRequired: 3500, name: 'Experienced' },
      { level: 5, xpRequired: 7000, name: 'Veteran' },
      { level: 6, xpRequired: 12000, name: 'Expert' },
      { level: 7, xpRequired: 20000, name: 'Master' },
      { level: 8, xpRequired: 35000, name: 'Legend' },
      { level: 9, xpRequired: 60000, name: 'Champion' },
      { level: 10, xpRequired: 100000, name: 'VIP' }
    ]
  }

  // Create or update user profile
  async createOrUpdateProfile(userId, publicKey, username = null, avatarUrl = null) {
    try {
      let user = await User.findById(userId)
      
      if (!user) {
        // Create new user profile
        user = await User.createOrGet(publicKey, username)
      }

      // Update profile data
      const profileData = {
        username: username || user.username || this.generateUsername(publicKey),
        avatar_url: avatarUrl || user.avatar_url,
        xp: user.xp || 0,
        level: user.level || 1,
        badges: user.badges ? JSON.parse(user.badges) : [],
        streaks: user.streaks ? JSON.parse(user.streaks) : {
          daily: 0,
          wins: 0,
          losses: 0
        },
        referral_code: user.referral_code || this.generateReferralCode(publicKey),
        referred_by: user.referred_by || null,
        total_wagered: user.total_wagered || 0,
        total_won: user.total_won || 0,
        games_played: user.games_played || 0,
        last_active: new Date().toISOString()
      }

      // Update user in database
      await User.updateProfile(userId, profileData)
      
      return profileData
    } catch (error) {
      console.error('Error creating/updating profile:', error)
      throw error
    }
  }

  // Add XP and check for level up
  async addXP(userId, amount, reason) {
    try {
      const user = await User.findById(userId)
      if (!user) throw new Error('User not found')

      const newXP = (user.xp || 0) + amount
      const newLevel = this.calculateLevel(newXP)
      const leveledUp = newLevel > (user.level || 1)

      await User.updateXP(userId, newXP, newLevel)

      // Check for badge unlocks
      const newBadges = await this.checkBadgeUnlocks(userId, user, newXP, newLevel)

      // Log XP gain
      await AuditLog.logTransaction(userId, 'XP_GAIN', amount, null, {
        reason,
        newXP,
        newLevel,
        leveledUp,
        newBadges
      })

      return {
        xp: newXP,
        level: newLevel,
        leveledUp,
        newBadges,
        levelName: this.getLevelName(newLevel)
      }
    } catch (error) {
      console.error('Error adding XP:', error)
      throw error
    }
  }

  // Check for badge unlocks
  async checkBadgeUnlocks(userId, user, newXP, newLevel) {
    const currentBadges = user.badges ? JSON.parse(user.badges) : []
    const newBadges = []

    // Check each badge definition
    for (const [badgeKey, badgeDef] of Object.entries(this.badgeDefinitions)) {
      if (currentBadges.includes(badgeKey)) continue

      let shouldUnlock = false

      switch (badgeKey) {
        case 'FIRST_DEPOSIT':
          shouldUnlock = (user.total_deposits || 0) > 0
          break
        case 'HIGH_ROLLER':
          shouldUnlock = (user.total_wagered || 0) > 100 * 1e9 // 100 SOL
          break
        case 'LUCKY_STREAK':
          shouldUnlock = (user.streaks?.wins || 0) >= 10
          break
        case 'REFERRAL_MASTER':
          shouldUnlock = (user.referrals_count || 0) >= 10
          break
        case 'DAILY_PLAYER':
          shouldUnlock = (user.streaks?.daily || 0) >= 7
          break
        case 'BIG_WIN':
          shouldUnlock = (user.biggest_win || 0) > 50 * 1e9 // 50 SOL
          break
        case 'FAITHFUL':
          shouldUnlock = (user.streaks?.daily || 0) >= 30
          break
        case 'VIP':
          shouldUnlock = newLevel >= 10
          break
      }

      if (shouldUnlock) {
        newBadges.push(badgeKey)
        currentBadges.push(badgeKey)
        
        // Award XP for badge unlock
        await this.addXP(userId, badgeDef.xp, `Badge unlocked: ${badgeDef.name}`)
      }
    }

    if (newBadges.length > 0) {
      await User.updateBadges(userId, currentBadges)
    }

    return newBadges
  }

  // Update user streaks
  async updateStreaks(userId, type, increment = true) {
    try {
      const user = await User.findById(userId)
      if (!user) throw new Error('User not found')

      const streaks = user.streaks ? JSON.parse(user.streaks) : {
        daily: 0,
        wins: 0,
        losses: 0
      }

      if (increment) {
        streaks[type] = (streaks[type] || 0) + 1
      } else {
        streaks[type] = 0 // Reset streak
      }

      await User.updateStreaks(userId, streaks)

      // Check for streak-based badges
      await this.checkBadgeUnlocks(userId, user, user.xp || 0, user.level || 1)

      return streaks
    } catch (error) {
      console.error('Error updating streaks:', error)
      throw error
    }
  }

  // Process referral
  async processReferral(referrerUserId, referredUserId, referralCode) {
    try {
      // Validate referral code
      const referrer = await User.findByReferralCode(referralCode)
      if (!referrer || referrer.id === referredUserId) {
        throw new Error('Invalid referral code')
      }

      // Check if user was already referred
      const referred = await User.findById(referredUserId)
      if (referred.referred_by) {
        throw new Error('User already has a referrer')
      }

      // Process referral
      await User.setReferrer(referredUserId, referrer.id)
      await User.incrementReferrals(referrer.id)

      // Award XP to both users
      await this.addXP(referrer.id, 50, 'Referral bonus')
      await this.addXP(referredUserId, 25, 'Referred by friend')

      // Log referral
      await AuditLog.logTransaction(referrer.id, 'REFERRAL_BONUS', 50, null, {
        referredUserId,
        referralCode
      })

      return { success: true, referrerUsername: referrer.username }
    } catch (error) {
      console.error('Error processing referral:', error)
      throw error
    }
  }

  // Get user profile
  async getProfile(userId) {
    try {
      const user = await User.findById(userId)
      if (!user) throw new Error('User not found')

      const badges = user.badges ? JSON.parse(user.badges) : []
      const streaks = user.streaks ? JSON.parse(user.streaks) : {}

      return {
        id: user.id,
        publicKey: user.public_key,
        username: user.username,
        avatarUrl: user.avatar_url,
        xp: user.xp || 0,
        level: user.level || 1,
        levelName: this.getLevelName(user.level || 1),
        badges: badges.map(badgeKey => ({
          key: badgeKey,
          ...this.badgeDefinitions[badgeKey]
        })),
        streaks,
        referralCode: user.referral_code,
        referredBy: user.referred_by,
        totalWagered: (user.total_wagered || 0) / 1e9,
        totalWon: (user.total_won || 0) / 1e9,
        gamesPlayed: user.games_played || 0,
        lastActive: user.last_active,
        createdAt: user.created_at
      }
    } catch (error) {
      console.error('Error getting profile:', error)
      throw error
    }
  }

  // Get leaderboard
  async getLeaderboard(type = 'balance', limit = 50) {
    try {
      let query
      switch (type) {
        case 'balance':
          query = 'ORDER BY balance_lamports DESC'
          break
        case 'xp':
          query = 'ORDER BY xp DESC'
          break
        case 'wins':
          query = 'ORDER BY total_won DESC'
          break
        case 'streaks':
          query = 'ORDER BY JSON_EXTRACT(streaks, "$.wins") DESC'
          break
        case 'referrals':
          query = 'ORDER BY referrals_count DESC'
          break
        default:
          query = 'ORDER BY balance_lamports DESC'
      }

      const users = await User.getLeaderboard(query, limit)
      return users.map(user => ({
        id: user.id,
        username: user.username,
        avatarUrl: user.avatar_url,
        level: user.level || 1,
        levelName: this.getLevelName(user.level || 1),
        value: this.getLeaderboardValue(user, type),
        publicKey: user.public_key
      }))
    } catch (error) {
      console.error('Error getting leaderboard:', error)
      return []
    }
  }

  // Helper methods
  calculateLevel(xp) {
    for (let i = this.xpLevels.length - 1; i >= 0; i--) {
      if (xp >= this.xpLevels[i].xpRequired) {
        return this.xpLevels[i].level
      }
    }
    return 1
  }

  getLevelName(level) {
    const levelData = this.xpLevels.find(l => l.level === level)
    return levelData ? levelData.name : 'Unknown'
  }

  generateUsername(publicKey) {
    return `Player${publicKey.slice(0, 6)}`
  }

  generateReferralCode(publicKey) {
    return publicKey.slice(0, 8).toUpperCase()
  }

  getLeaderboardValue(user, type) {
    switch (type) {
      case 'balance':
        return (user.balance_lamports || 0) / 1e9
      case 'xp':
        return user.xp || 0
      case 'wins':
        return (user.total_won || 0) / 1e9
      case 'streaks':
        const streaks = user.streaks ? JSON.parse(user.streaks) : {}
        return streaks.wins || 0
      case 'referrals':
        return user.referrals_count || 0
      default:
        return 0
    }
  }
}

module.exports = UserProfileService
