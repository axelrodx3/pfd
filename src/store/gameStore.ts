import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateServerSeed, generateClientSeed, generateMockHash, rollDice, getDiceResult } from '../lib/utils'

export interface GameState {
  // Wallet
  isConnected: boolean
  walletAddress: string
  balance: number
  
  // Game state
  currentBet: number
  selectedSide: 'high' | 'low' | null
  isRolling: boolean
  lastRoll: number | null
  lastResult: 'high' | 'low' | null
  lastWin: boolean | null
  
  // Provably fair
  serverSeed: string
  clientSeed: string
  nonce: number
  
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
  }>
  
  // Leaderboard data
  leaderboard: Array<{
    id: string
    username: string
    totalWins: number
    totalWagered: number
    winRate: number
    avatar: string
  }>
}

export interface GameActions {
  // Wallet actions
  connectWallet: () => void
  disconnectWallet: () => void
  updateBalance: (amount: number) => void
  
  // Game actions
  setBet: (amount: number) => void
  selectSide: (side: 'high' | 'low') => void
  rollDice: () => Promise<void>
  resetGame: () => void
  
  // Provably fair actions
  generateNewSeeds: () => void
  verifyRoll: (hash: string) => boolean
  
  // History actions
  addToHistory: (game: Omit<GameState['gameHistory'][0], 'id'>) => void
  clearHistory: () => void
  
  // Leaderboard actions
  updateLeaderboard: () => void
}

const initialState: GameState = {
  // Wallet
  isConnected: false,
  walletAddress: '',
  balance: 1000, // Starting balance
  
  // Game state
  currentBet: 10,
  selectedSide: null,
  isRolling: false,
  lastRoll: null,
  lastResult: null,
  lastWin: null,
  
  // Provably fair
  serverSeed: generateServerSeed(),
  clientSeed: generateClientSeed(),
  nonce: 0,
  
  // Game history
  gameHistory: [],
  
  // Leaderboard data
  leaderboard: [],
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
      
      // Game actions
      setBet: (amount: number) => {
        set({ currentBet: Math.max(1, Math.min(amount, get().balance)) })
      },
      
      selectSide: (side: 'high' | 'low') => {
        set({ selectedSide: side })
      },
      
      rollDice: async () => {
        const state = get()
        if (state.isRolling || !state.selectedSide || state.currentBet > state.balance) {
          return
        }
        
        set({ isRolling: true })
        
        // Simulate dice roll delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const roll = rollDice()
        const result = getDiceResult(roll)
        const won = state.selectedSide === result
        
        // Generate hash for provably fair
        const hash = generateMockHash(state.serverSeed, state.clientSeed, state.nonce)
        
        // Update game state
        set((prevState) => ({
          lastRoll: roll,
          lastResult: result,
          lastWin: won,
          isRolling: false,
          nonce: prevState.nonce + 1,
          balance: won ? prevState.balance + prevState.currentBet : prevState.balance - prevState.currentBet,
        }))
        
        // Add to history
        get().addToHistory({
          timestamp: new Date(),
          bet: state.currentBet,
          side: state.selectedSide,
          roll,
          result,
          won,
          hash,
        })
        
        // Reset selection for next game
        set({ selectedSide: null })
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
      
      // Leaderboard actions
      updateLeaderboard: () => {
        // Generate mock leaderboard data
        const mockPlayers = [
          { username: 'DiceMaster99', totalWins: 127, totalWagered: 15420, winRate: 0.68, avatar: '🎲' },
          { username: 'HighRoller', totalWins: 98, totalWagered: 12850, winRate: 0.62, avatar: '💰' },
          { username: 'LuckyStrike', totalWins: 156, totalWagered: 18900, winRate: 0.71, avatar: '🍀' },
          { username: 'GoldenBet', totalWins: 89, totalWagered: 11200, winRate: 0.58, avatar: '⭐' },
          { username: 'DiceKing', totalWins: 203, totalWagered: 25600, winRate: 0.74, avatar: '👑' },
          { username: 'BetHigh', totalWins: 76, totalWagered: 9800, winRate: 0.55, avatar: '📈' },
          { username: 'WinStreak', totalWins: 134, totalWagered: 16750, winRate: 0.66, avatar: '🔥' },
          { username: 'CasinoPro', totalWins: 91, totalWagered: 11300, winRate: 0.59, avatar: '🎯' },
        ]
        
        set({
          leaderboard: mockPlayers.map((player, index) => ({
            ...player,
            id: `player-${index + 1}`,
          })),
        })
      },
    }),
    {
      name: 'hilo-game-storage',
      partialize: (state) => ({
        balance: state.balance,
        gameHistory: state.gameHistory,
        serverSeed: state.serverSeed,
        clientSeed: state.clientSeed,
        nonce: state.nonce,
      }),
    }
  )
)
