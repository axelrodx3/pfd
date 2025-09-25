/**
 * Mock API layer for HILO Casino
 * Simulates backend API calls for game results, balance updates, etc.
 */

export interface GameResult {
  roll: number
  result: 'high' | 'low'
  won: boolean
  multiplier: number
  hash: string
  timestamp: Date
}

export interface LiveFeedEntry {
  id: string
  username: string
  amount: number
  game: string
  timestamp: Date
  avatar: string
}

export interface LeaderboardEntry {
  id: string
  username: string
  totalWins: number
  totalWagered: number
  winRate: number
  avatar: string
  vipTier: string
  level: number
}

export interface PrizePool {
  weekly: number
  monthly: number
}

export interface DailyChallenge {
  id: string
  title: string
  description: string
  reward: number
  completed: boolean
  progress: number
  maxProgress: number
}

/**
 * Mock API class for simulating backend calls
 */
export class MockAPI {
  private static instance: MockAPI
  private liveFeedInterval: NodeJS.Timeout | null = null

  static getInstance(): MockAPI {
    if (!MockAPI.instance) {
      MockAPI.instance = new MockAPI()
    }
    return MockAPI.instance
  }

  /**
   * Simulate dice roll with house edge
   */
  async rollDice(
    clientSeed: string,
    serverSeed: string,
    nonce: number,
    selectedSide: 'high' | 'low',
    houseEdge: number = 0.02
  ): Promise<GameResult> {
    // Simulate network delay
    await new Promise(resolve =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    )

    // Generate provably fair result
    const hash = this.generateHash(serverSeed, clientSeed, nonce)
    const roll = this.hashToRoll(hash)
    const result = roll > 3 ? 'high' : 'low'

    // Player wins if their selected side matches the dice result
    // House edge is built into the 1.98x multiplier (instead of 2x)
    const won = selectedSide === result
    const multiplier = won ? 1.98 : 0 // 1.98x multiplier (accounts for house edge)

    return {
      roll,
      result,
      won,
      multiplier,
      hash,
      timestamp: new Date(),
    }
  }

  /**
   * Generate mock hash for provably fair verification
   */
  private generateHash(
    serverSeed: string,
    clientSeed: string,
    nonce: number
  ): string {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`
    return btoa(combined)
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 64)
  }

  /**
   * Convert hash to dice roll (1-6)
   */
  private hashToRoll(hash: string): number {
    let sum = 0
    for (let i = 0; i < hash.length; i++) {
      sum += hash.charCodeAt(i)
    }
    return (sum % 6) + 1
  }

  /**
   * Get mock leaderboard data
   */
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    await new Promise(resolve => setTimeout(resolve, 300))

    const mockPlayers = [
      {
        username: 'DiceMaster99',
        totalWins: 127,
        totalWagered: 15420,
        winRate: 0.68,
        avatar: '🎲',
        vipTier: 'Diamond',
        level: 15,
      },
      {
        username: 'HighRoller',
        totalWins: 98,
        totalWagered: 12850,
        winRate: 0.62,
        avatar: '💰',
        vipTier: 'Gold',
        level: 12,
      },
      {
        username: 'LuckyStrike',
        totalWins: 156,
        totalWagered: 18900,
        winRate: 0.71,
        avatar: '🍀',
        vipTier: 'Diamond',
        level: 18,
      },
      {
        username: 'GoldenBet',
        totalWins: 89,
        totalWagered: 11200,
        winRate: 0.58,
        avatar: '⭐',
        vipTier: 'Silver',
        level: 9,
      },
      {
        username: 'DiceKing',
        totalWins: 203,
        totalWagered: 25600,
        winRate: 0.74,
        avatar: '👑',
        vipTier: 'Diamond',
        level: 20,
      },
      {
        username: 'BetHigh',
        totalWins: 76,
        totalWagered: 9800,
        winRate: 0.55,
        avatar: '📈',
        vipTier: 'Silver',
        level: 8,
      },
      {
        username: 'WinStreak',
        totalWins: 134,
        totalWagered: 16750,
        winRate: 0.66,
        avatar: '🔥',
        vipTier: 'Gold',
        level: 13,
      },
      {
        username: 'CasinoPro',
        totalWins: 91,
        totalWagered: 11300,
        winRate: 0.59,
        avatar: '🎯',
        vipTier: 'Silver',
        level: 10,
      },
    ]

    return mockPlayers.map((player, index) => ({
      ...player,
      id: `player-${index + 1}`,
    }))
  }

  /**
   * Get mock prize pool data
   */
  async getPrizePools(): Promise<PrizePool> {
    await new Promise(resolve => setTimeout(resolve, 200))

    return {
      weekly: 50000 + Math.floor(Math.random() * 10000),
      monthly: 200000 + Math.floor(Math.random() * 50000),
    }
  }

  /**
   * Get mock daily challenges
   */
  async getDailyChallenges(): Promise<DailyChallenge[]> {
    await new Promise(resolve => setTimeout(resolve, 150))

    return [
      {
        id: 'win-3-highs',
        title: 'High Roller',
        description: 'Win 3 high bets today',
        reward: 100,
        completed: false,
        progress: 0,
        maxProgress: 3,
      },
      {
        id: 'streak-5',
        title: 'Hot Streak',
        description: 'Get a 5-game win streak',
        reward: 250,
        completed: false,
        progress: 0,
        maxProgress: 5,
      },
      {
        id: 'wager-1000',
        title: 'Big Spender',
        description: 'Wager 1000 HILO tokens',
        reward: 500,
        completed: false,
        progress: 0,
        maxProgress: 1000,
      },
    ]
  }

  /**
   * Start live feed simulation
   */
  startLiveFeed(callback: (entry: LiveFeedEntry) => void): void {
    if (this.liveFeedInterval) {
      clearInterval(this.liveFeedInterval)
    }

    const usernames = [
      'DiceMaster99',
      'HighRoller',
      'LuckyStrike',
      'GoldenBet',
      'DiceKing',
      'BetHigh',
      'WinStreak',
      'CasinoPro',
      'RollerX',
      'DiceQueen',
      'LuckyDice',
      'HighBet',
      'CasinoKing',
      'DiceLord',
      'BetMaster',
    ]

    const avatars = ['🎲', '💰', '🍀', '⭐', '👑', '📈', '🔥', '🎯', '💎', '🎪']
    const games = ['Dice High/Low', 'Dice Roll', 'Lucky Dice', 'High/Low Bet']

    this.liveFeedInterval = setInterval(
      () => {
        const username = usernames[Math.floor(Math.random() * usernames.length)]
        const amount = Math.floor(Math.random() * 5000) + 100
        const game = games[Math.floor(Math.random() * games.length)]
        const avatar = avatars[Math.floor(Math.random() * avatars.length)]

        callback({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          username,
          amount,
          game,
          timestamp: new Date(),
          avatar,
        })
      },
      3000 + Math.random() * 5000
    ) // Random interval between 3-8 seconds
  }

  /**
   * Stop live feed simulation
   */
  stopLiveFeed(): void {
    if (this.liveFeedInterval) {
      clearInterval(this.liveFeedInterval)
      this.liveFeedInterval = null
    }
  }

  /**
   * Simulate faucet claim
   */
  async claimFaucet(): Promise<{
    success: boolean
    amount: number
    message: string
  }> {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const amount = 1000
    return {
      success: true,
      amount,
      message: `Successfully claimed ${amount} HILO tokens!`,
    }
  }

  /**
   * Simulate daily wheel spin
   */
  async spinDailyWheel(): Promise<{ reward: number; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 2000))

    const rewards = [50, 100, 250, 500, 1000, 2000]
    const reward = rewards[Math.floor(Math.random() * rewards.length)]

    return {
      reward,
      message: `Congratulations! You won ${reward} HILO tokens!`,
    }
  }

  /**
   * Verify roll hash
   */
  verifyRoll(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    hash: string
  ): boolean {
    const expectedHash = this.generateHash(serverSeed, clientSeed, nonce)
    return hash === expectedHash
  }

  /**
   * Get house edge explanation
   */
  getHouseEdgeInfo(): {
    houseEdge: number
    playerWinChance: number
    explanation: string
  } {
    const houseEdge = 0.02
    const playerWinChance = 0.5 - houseEdge / 2

    return {
      houseEdge,
      playerWinChance,
      explanation: `The house edge is ${(houseEdge * 100).toFixed(1)}%, meaning players have a ${(playerWinChance * 100).toFixed(1)}% chance of winning each roll. This ensures the casino remains profitable while still providing fair gameplay.`,
    }
  }
}

// Export singleton instance
export const mockAPI = MockAPI.getInstance()

// Community API (real server)
export const communityApi = {
  async searchUsers(query: string, limit = 20) {
    const res = await fetch(`/api/community/search?q=${encodeURIComponent(query)}&limit=${limit}`, { credentials: 'include' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`)
    }
    return res.json()
  },
  async listFriends() {
    const res = await fetch('/api/community/friends', { credentials: 'include' })
    if (!res.ok) throw new Error('Friends fetch failed')
    return res.json()
  },
  async listFriendsWithPresence() {
    const res = await fetch('/api/community/presence/friends', { credentials: 'include' })
    if (!res.ok) throw new Error('Friends presence fetch failed')
    return res.json()
  },
  async requestFriend(targetUserId: number) {
    const res = await fetch('/api/community/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ targetUserId })
    })
    if (!res.ok) throw new Error('Friend request failed')
    return res.json()
  },
  async respondFriend(requestId: number, action: 'accept' | 'decline') {
    const res = await fetch('/api/community/friends/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ requestId, action })
    })
    if (!res.ok) throw new Error('Friend respond failed')
    return res.json()
  },
  async unfriend(targetUserId: number) {
    const res = await fetch('/api/community/friends/unfriend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ targetUserId })
    })
    if (!res.ok) throw new Error('Unfriend failed')
    return res.json()
  },
  async listBlocks() {
    const res = await fetch('/api/community/blocks', { credentials: 'include' })
    if (!res.ok) throw new Error('Blocks fetch failed')
    return res.json()
  },
  async block(targetUserId: number) {
    const res = await fetch('/api/community/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ targetUserId })
    })
    if (!res.ok) throw new Error('Block failed')
    return res.json()
  },
  async unblock(targetUserId: number) {
    const res = await fetch('/api/community/unblock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ targetUserId })
    })
    if (!res.ok) throw new Error('Unblock failed')
    return res.json()
  },
  async getMessages(channel: 'global' | 'dm', targetUserId?: number, afterId?: number, limit = 50) {
    const params = new URLSearchParams()
    params.set('channel', channel)
    if (channel === 'dm' && typeof targetUserId === 'number') params.set('targetUserId', String(targetUserId))
    if (afterId) params.set('afterId', String(afterId))
    params.set('limit', String(limit))
    const res = await fetch(`/api/community/messages?${params.toString()}`, { credentials: 'include' })
    if (!res.ok) throw new Error('Fetch messages failed')
    return res.json()
  },
  async postMessage(channel: 'global' | 'dm', content: string, targetUserId?: number) {
    const res = await fetch('/api/community/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ channel, content, targetUserId })
    })
    if (!res.ok) throw new Error('Post message failed')
    return res.json()
  }
}
