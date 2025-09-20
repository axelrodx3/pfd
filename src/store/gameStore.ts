import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateServerSeed, generateClientSeed, generateMockHash, rollDice, getDiceResult } from '../lib/utils'

export interface GameState {
  // Wallet & Balance
  isConnected: boolean
  walletAddress: string
  balance: number
  hiloTokens: number
  lastFaucetClaim: number | null
  
  // Game state
  currentBet: number
  selectedSide: 'high' | 'low' | null
  isRolling: boolean
  lastRoll: number | null
  lastResult: 'high' | 'low' | null
  lastWin: boolean | null
  
  // Streaks & Stats
  currentWinStreak: number
  currentLossStreak: number
  maxWinStreak: number
  maxLossStreak: number
  totalWagered: number
  totalWon: number
  totalGames: number
  
  // Auto-roll
  autoRollEnabled: boolean
  autoRollCount: number
  autoRollMax: number
  autoRollStopOnWin: boolean
  autoRollStopOnLoss: boolean
  
  // Provably fair
  serverSeed: string
  clientSeed: string
  nonce: number
  houseEdge: number
  
  // User progression
  xp: number
  level: number
  vipTier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
  dailyChallenges: Array<{
    id: string
    title: string
    description: string
    reward: number
    completed: boolean
    progress: number
    maxProgress: number
  }>
  
  // Settings
  soundEnabled: boolean
  selectedDiceSkin: 'classic' | 'neon' | 'gold'
  muted: boolean
  
  // Game history
  gameHistory: Array<{
    id: string
    timestamp: Date
    bet: number
    side: 'high' | 'low'
    roll: number
    result: 'high' | 'low'
    won: boolean
    hash: string
    multiplier: number
  }>
  
  // Live feed
  recentWins: Array<{
    id: string
    username: string
    amount: number
    game: string
    timestamp: Date
    avatar: string
  }>
  
  // Leaderboard data
  leaderboard: Array<{
    id: string
    username: string
    totalWins: number
    totalWagered: number
    winRate: number
    avatar: string
    vipTier: string
    level: number
  }>
  
  // Prize pools
  weeklyPrizePool: number
  monthlyPrizePool: number
}

export interface GameActions {
  // Wallet actions
  connectWallet: () => void
  disconnectWallet: () => void
  updateBalance: (amount: number) => void
  claimFaucet: () => void
  
  // Game actions
  setBet: (amount: number) => void
  selectSide: (side: 'high' | 'low') => void
  rollDice: () => Promise<void>
  resetGame: () => void
  
  // Auto-roll actions
  toggleAutoRoll: () => void
  setAutoRollSettings: (settings: Partial<Pick<GameState, 'autoRollMax' | 'autoRollStopOnWin' | 'autoRollStopOnLoss'>>) => void
  
  // Streak actions
  updateStreaks: (won: boolean) => void
  
  // Progression actions
  addXP: (amount: number) => void
  updateVIPTier: () => void
  completeChallenge: (challengeId: string) => void
  spinDailyWheel: () => void
  
  // Settings actions
  toggleSound: () => void
  setDiceSkin: (skin: 'classic' | 'neon' | 'gold') => void
  toggleMute: () => void
  
  // Provably fair actions
  generateNewSeeds: () => void
  verifyRoll: (hash: string) => boolean
  
  // History actions
  addToHistory: (game: Omit<GameState['gameHistory'][0], 'id'>) => void
  clearHistory: () => void
  exportHistory: () => string
  addToLiveFeed: (win: Omit<GameState['recentWins'][0], 'id'>) => void
  
  // Leaderboard actions
  updateLeaderboard: () => void
  updatePrizePools: () => void
}

const initialState: GameState = {
  // Wallet & Balance
  isConnected: false,
  walletAddress: '',
  balance: 1000, // Starting balance
  hiloTokens: 10000, // Starting HILO tokens
  lastFaucetClaim: null,
  
  // Game state
  currentBet: 10,
  selectedSide: null,
  isRolling: false,
  lastRoll: null,
  lastResult: null,
  lastWin: null,
  
  // Streaks & Stats
  currentWinStreak: 0,
  currentLossStreak: 0,
  maxWinStreak: 0,
  maxLossStreak: 0,
  totalWagered: 0,
  totalWon: 0,
  totalGames: 0,
  
  // Auto-roll
  autoRollEnabled: false,
  autoRollCount: 0,
  autoRollMax: 10,
  autoRollStopOnWin: false,
  autoRollStopOnLoss: false,
  
  // Provably fair
  serverSeed: generateServerSeed(),
  clientSeed: generateClientSeed(),
  nonce: 0,
  houseEdge: 0.02, // 2% house edge (49% player win chance)
  
  // User progression
  xp: 0,
  level: 1,
  vipTier: 'Bronze',
  dailyChallenges: [
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
  ],
  
  // Settings
  soundEnabled: true,
  selectedDiceSkin: 'classic',
  muted: false,
  
  // Game history
  gameHistory: [],
  
  // Live feed
  recentWins: [],
  
  // Leaderboard data
  leaderboard: [],
  
  // Prize pools
  weeklyPrizePool: 50000,
  monthlyPrizePool: 200000,
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Wallet actions
      connectWallet: () => {
        const mockAddress = '0x' + Math.random().toString(16).substr(2, 40)
        set({
          isConnected: true,
          walletAddress: mockAddress,
        })
      },
      
      disconnectWallet: () => {
        set({
          isConnected: false,
          walletAddress: '',
        })
      },
      
      updateBalance: (amount: number) => {
        set((state) => ({
          balance: Math.max(0, state.balance + amount),
        }))
      },
      
      claimFaucet: () => {
        const state = get()
        const now = Date.now()
        const twentyFourHours = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        
        // Check if 24 hours have passed since last claim
        if (state.lastFaucetClaim && (now - state.lastFaucetClaim) < twentyFourHours) {
          const timeLeft = twentyFourHours - (now - state.lastFaucetClaim)
          const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000))
          throw new Error(`Faucet cooldown: ${hoursLeft} hours remaining`)
        }
        
        const faucetAmount = 1000
        set((state) => ({
          hiloTokens: state.hiloTokens + faucetAmount,
          lastFaucetClaim: now,
        }))
      },
      
      // Game actions
      setBet: (amount: number) => {
        set({ currentBet: Math.max(1, Math.min(amount, get().hiloTokens)) })
      },
      
      selectSide: (side: 'high' | 'low') => {
        set({ selectedSide: side })
      },
      
      rollDice: async () => {
        const state = get()
        if (state.isRolling || !state.selectedSide || state.currentBet > state.hiloTokens) {
          return
        }
        
        set({ isRolling: true })
        
        // Generate the roll result immediately (for 3D dice target)
        const roll = Math.floor(Math.random() * 6) + 1
        const result = getDiceResult(roll)
        
        // Player wins if their selected side matches the dice result
        // House edge is built into the 1.98x multiplier (instead of 2x)
        const won = state.selectedSide === result
        
        // Set the roll result immediately for 3D dice
        set((prevState) => ({
          lastRoll: roll,
          lastResult: result,
          lastWin: won,
        }))
        
        // Wait for 3D dice animation to complete (2.6 seconds total: 1.8s roll + 0.8s suspense)
        await new Promise(resolve => setTimeout(resolve, 2600))
        
        const multiplier = won ? 1.98 : 0 // 1.98x multiplier (accounts for house edge)
        
        // Generate hash for provably fair
        const hash = generateMockHash(state.serverSeed, state.clientSeed, state.nonce)
        
        // Update streaks
        get().updateStreaks(won)
        
        // Calculate winnings
        const winnings = won ? state.currentBet * multiplier : 0
        const netChange = winnings - state.currentBet
        
        // Update game state
        set((prevState) => ({
          isRolling: false,
          nonce: prevState.nonce + 1,
          hiloTokens: prevState.hiloTokens + netChange,
          totalWagered: prevState.totalWagered + state.currentBet,
          totalWon: prevState.totalWon + winnings,
          totalGames: prevState.totalGames + 1,
          autoRollCount: prevState.autoRollEnabled ? prevState.autoRollCount + 1 : 0,
        }))
        
        // Add XP
        get().addXP(won ? 10 : 5)
        
        // Add to history
        get().addToHistory({
          timestamp: new Date(),
          bet: state.currentBet,
          side: state.selectedSide,
          roll,
          result,
          won,
          hash,
          multiplier,
        })
        
        // Add to live feed if won
        if (won && winnings > 100) {
          get().addToLiveFeed({
            username: 'You',
            amount: winnings,
            game: 'Dice High/Low',
            timestamp: new Date(),
            avatar: '🎲',
          })
        }
        
        // Update challenges
        // Update challenges if needed
        // get().updateChallenges(won, state.currentBet)
        
        // Reset selection for next game
        set({ selectedSide: null })
        
        // Auto-roll logic
        if (state.autoRollEnabled && state.autoRollCount < state.autoRollMax) {
          const shouldContinue = 
            (!state.autoRollStopOnWin || !won) &&
            (!state.autoRollStopOnLoss || won)
          
          if (shouldContinue) {
            set({ autoRollCount: state.autoRollCount + 1 })
            setTimeout(() => get().rollDice(), 1000)
          } else {
            set({ autoRollEnabled: false, autoRollCount: 0 })
          }
        }
      },
      
      resetGame: () => {
        set({
          selectedSide: null,
          isRolling: false,
          lastRoll: null,
          lastResult: null,
          lastWin: null,
        })
      },
      
      // Auto-roll actions
      toggleAutoRoll: () => {
        set((state) => ({
          autoRollEnabled: !state.autoRollEnabled,
          autoRollCount: !state.autoRollEnabled ? 0 : state.autoRollCount, // Only reset when turning ON
        }))
      },
      
      setAutoRollSettings: (settings) => {
        set(settings)
      },
      
      // Streak actions
      updateStreaks: (won: boolean) => {
        set((state) => {
          if (won) {
            return {
              currentWinStreak: state.currentWinStreak + 1,
              currentLossStreak: 0,
              maxWinStreak: Math.max(state.maxWinStreak, state.currentWinStreak + 1),
            }
          } else {
            return {
              currentWinStreak: 0,
              currentLossStreak: state.currentLossStreak + 1,
              maxLossStreak: Math.max(state.maxLossStreak, state.currentLossStreak + 1),
            }
          }
        })
      },
      
      // Progression actions
      addXP: (amount: number) => {
        set((state) => {
          const newXP = state.xp + amount
          const newLevel = Math.floor(newXP / 1000) + 1
          return {
            xp: newXP,
            level: newLevel,
          }
        })
        get().updateVIPTier()
      },
      
      updateVIPTier: () => {
        const state = get()
        let newTier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond' = 'Bronze'
        
        if (state.totalWagered >= 100000) newTier = 'Diamond'
        else if (state.totalWagered >= 50000) newTier = 'Gold'
        else if (state.totalWagered >= 10000) newTier = 'Silver'
        
        set({ vipTier: newTier })
      },
      
      completeChallenge: (challengeId: string) => {
        set((state) => ({
          dailyChallenges: state.dailyChallenges.map(challenge =>
            challenge.id === challengeId
              ? { ...challenge, completed: true }
              : challenge
          ),
          hiloTokens: state.hiloTokens + (state.dailyChallenges.find(c => c.id === challengeId)?.reward || 0),
        }))
      },
      
      spinDailyWheel: () => {
        const rewards = [50, 100, 250, 500, 1000, 2000]
        const reward = rewards[Math.floor(Math.random() * rewards.length)]
        set((state) => ({
          hiloTokens: state.hiloTokens + reward,
        }))
      },
      
      updateChallenges: (won: boolean, betAmount: number) => {
        set((state) => ({
          dailyChallenges: state.dailyChallenges.map(challenge => {
            if (challenge.completed) return challenge
            
            let newProgress = challenge.progress
            if (challenge.id === 'win-3-highs' && won) {
              newProgress = Math.min(challenge.progress + 1, challenge.maxProgress)
            } else if (challenge.id === 'streak-5' && won) {
              newProgress = Math.min(state.currentWinStreak, challenge.maxProgress)
            } else if (challenge.id === 'wager-1000') {
              newProgress = Math.min(challenge.progress + betAmount, challenge.maxProgress)
            }
            
            return {
              ...challenge,
              progress: newProgress,
              completed: newProgress >= challenge.maxProgress,
            }
          }),
        }))
      },
      
      // Settings actions
      toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }))
      },
      
      setDiceSkin: (skin: 'classic' | 'neon' | 'gold') => {
        set({ selectedDiceSkin: skin })
      },
      
      toggleMute: () => {
        set((state) => ({ muted: !state.muted }))
      },
      
      // Provably fair actions
      generateNewSeeds: () => {
        set({
          serverSeed: generateServerSeed(),
          clientSeed: generateClientSeed(),
          nonce: 0,
        })
      },
      
      verifyRoll: (hash: string) => {
        const state = get()
        const expectedHash = generateMockHash(state.serverSeed, state.clientSeed, state.nonce - 1)
        return hash === expectedHash
      },
      
      // History actions
      addToHistory: (game) => {
        const newGame = {
          ...game,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        }
        set((state) => ({
          gameHistory: [newGame, ...state.gameHistory].slice(0, 50), // Keep last 50 games
        }))
      },
      
      clearHistory: () => {
        set({ gameHistory: [] })
      },
      
      exportHistory: () => {
        const state = get()
        const csvContent = [
          ['Date', 'Bet Amount', 'Side', 'Roll', 'Result', 'Won', 'Winnings', 'Hash'],
          ...state.gameHistory.map(game => [
            new Date(game.timestamp).toISOString(),
            game.bet.toString(),
            game.side,
            game.roll.toString(),
            game.result,
            game.won ? 'Yes' : 'No',
            (game.bet * game.multiplier).toString(),
            game.hash
          ])
        ].map(row => row.join(',')).join('\n')
        return csvContent
      },
      
      addToLiveFeed: (win) => {
        const newWin = {
          ...win,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        }
        set((state) => ({
          recentWins: [newWin, ...state.recentWins].slice(0, 20), // Keep last 20 wins
        }))
      },
      
      // Leaderboard actions
      updateLeaderboard: () => {
        // Generate mock leaderboard data
        const mockPlayers = [
          { username: 'DiceMaster99', totalWins: 127, totalWagered: 15420, winRate: 0.68, avatar: '🎲', vipTier: 'Diamond', level: 15 },
          { username: 'HighRoller', totalWins: 98, totalWagered: 12850, winRate: 0.62, avatar: '💰', vipTier: 'Gold', level: 12 },
          { username: 'LuckyStrike', totalWins: 156, totalWagered: 18900, winRate: 0.71, avatar: '🍀', vipTier: 'Diamond', level: 18 },
          { username: 'GoldenBet', totalWins: 89, totalWagered: 11200, winRate: 0.58, avatar: '⭐', vipTier: 'Silver', level: 9 },
          { username: 'DiceKing', totalWins: 203, totalWagered: 25600, winRate: 0.74, avatar: '👑', vipTier: 'Diamond', level: 20 },
          { username: 'BetHigh', totalWins: 76, totalWagered: 9800, winRate: 0.55, avatar: '📈', vipTier: 'Silver', level: 8 },
          { username: 'WinStreak', totalWins: 134, totalWagered: 16750, winRate: 0.66, avatar: '🔥', vipTier: 'Gold', level: 13 },
          { username: 'CasinoPro', totalWins: 91, totalWagered: 11300, winRate: 0.59, avatar: '🎯', vipTier: 'Silver', level: 10 },
        ]
        
        set({
          leaderboard: mockPlayers.map((player, index) => ({
            ...player,
            id: `player-${index + 1}`,
          })),
        })
      },
      
      updatePrizePools: () => {
        set((state) => ({
          weeklyPrizePool: state.weeklyPrizePool + Math.floor(Math.random() * 1000),
          monthlyPrizePool: state.monthlyPrizePool + Math.floor(Math.random() * 5000),
        }))
      },
    }),
    {
      name: 'hilo-game-storage',
      partialize: (state) => ({
        hiloTokens: state.hiloTokens,
        balance: state.balance,
        gameHistory: state.gameHistory,
        serverSeed: state.serverSeed,
        clientSeed: state.clientSeed,
        nonce: state.nonce,
        xp: state.xp,
        level: state.level,
        vipTier: state.vipTier,
        dailyChallenges: state.dailyChallenges,
        soundEnabled: state.soundEnabled,
        selectedDiceSkin: state.selectedDiceSkin,
        muted: state.muted,
        lastFaucetClaim: state.lastFaucetClaim,
      }),
    }
  )
)
