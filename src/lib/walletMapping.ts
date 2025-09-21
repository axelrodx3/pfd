import { PublicKey, Keypair } from '@solana/web3.js'
import { encryptData, decryptData, generateGameWallet, restoreGameWallet, generateUserId, isValidWalletAddress } from './crypto'

/**
 * Wallet Mapping Interface
 * Defines the structure for mapping connected wallets to game wallets
 */
export interface WalletMapping {
  id: string
  connectedWalletAddress: string
  gameWalletAddress: string
  encryptedSecretKey: {
    encrypted: string
    iv: string
    tag: string
  }
  createdAt: number
  lastAccessed: number
  isActive: boolean
  isFrozen: boolean
  withdrawalThrottleUntil?: number
}

/**
 * User Profile Interface
 */
export interface UserProfile {
  id: string
  connectedWalletAddress: string
  username: string
  profilePicture?: string
  profilePictureType?: 'upload' | 'nft' | 'default'
  joinDate: number
  xp: number
  badges: string[]
  currentStreak: number
  longestStreak: number
  totalWins: number
  totalLosses: number
  totalWagered: number
  vipTier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
  isAdmin: boolean
}

/**
 * Secure Wallet Mapping Manager
 * Handles the persistent mapping between connected wallets and game wallets
 */
export class WalletMappingManager {
  private static instance: WalletMappingManager
  private mappings: Map<string, WalletMapping> = new Map()
  private profiles: Map<string, UserProfile> = new Map()
  private readonly STORAGE_KEY = 'hilo_wallet_mappings'
  private readonly PROFILES_KEY = 'hilo_user_profiles'

  private constructor() {
    this.loadFromStorage()
  }

  static getInstance(): WalletMappingManager {
    if (!WalletMappingManager.instance) {
      WalletMappingManager.instance = new WalletMappingManager()
    }
    return WalletMappingManager.instance
  }

  /**
   * Get or create a game wallet for a connected wallet
   */
  async getOrCreateGameWallet(connectedWalletAddress: string): Promise<{
    gameWallet: Keypair
    mapping: WalletMapping
    isNew: boolean
  }> {
    if (!isValidWalletAddress(connectedWalletAddress)) {
      throw new Error('Invalid wallet address')
    }

    // Check if mapping already exists
    const existingMapping = this.mappings.get(connectedWalletAddress)
    if (existingMapping && existingMapping.isActive) {
      try {
        // Try to restore the existing game wallet
        const gameWallet = restoreGameWallet(existingMapping.encryptedSecretKey)
        
        // Update last accessed time
        existingMapping.lastAccessed = Date.now()
        this.saveToStorage()
        
        return {
          gameWallet,
          mapping: existingMapping,
          isNew: false
        }
      } catch (error) {
        console.error('Failed to restore existing game wallet, creating new one:', error.message)
        
        // Clear the corrupted mapping
        this.mappings.delete(connectedWalletAddress)
        this.saveToStorage()
        
        // Fall through to create a new wallet
      }
    }

    // Create new mapping
    const { keypair, encryptedSecret } = generateGameWallet()
    const userId = generateUserId(connectedWalletAddress)
    
    const newMapping: WalletMapping = {
      id: userId,
      connectedWalletAddress,
      gameWalletAddress: keypair.publicKey.toString(),
      encryptedSecretKey: encryptedSecret,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      isActive: true,
      isFrozen: false
    }

    this.mappings.set(connectedWalletAddress, newMapping)
    this.saveToStorage()

    return {
      gameWallet: keypair,
      mapping: newMapping,
      isNew: true
    }
  }

  /**
   * Get wallet mapping by connected wallet address
   */
  getMapping(connectedWalletAddress: string): WalletMapping | null {
    return this.mappings.get(connectedWalletAddress) || null
  }

  /**
   * Freeze a game wallet (admin function)
   */
  freezeWallet(connectedWalletAddress: string): boolean {
    const mapping = this.mappings.get(connectedWalletAddress)
    if (mapping) {
      mapping.isFrozen = true
      this.saveToStorage()
      return true
    }
    return false
  }

  /**
   * Unfreeze a game wallet (admin function)
   */
  unfreezeWallet(connectedWalletAddress: string): boolean {
    const mapping = this.mappings.get(connectedWalletAddress)
    if (mapping) {
      mapping.isFrozen = false
      this.saveToStorage()
      return true
    }
    return false
  }

  /**
   * Set withdrawal throttle (admin function)
   */
  setWithdrawalThrottle(connectedWalletAddress: string, throttleUntil: number): boolean {
    const mapping = this.mappings.get(connectedWalletAddress)
    if (mapping) {
      mapping.withdrawalThrottleUntil = throttleUntil
      this.saveToStorage()
      return true
    }
    return false
  }

  /**
   * Check if withdrawal is allowed
   */
  isWithdrawalAllowed(connectedWalletAddress: string): {
    allowed: boolean
    reason?: string
    throttleUntil?: number
  } {
    const mapping = this.mappings.get(connectedWalletAddress)
    if (!mapping) {
      return { allowed: false, reason: 'Wallet mapping not found' }
    }

    if (mapping.isFrozen) {
      return { allowed: false, reason: 'Wallet is frozen by admin' }
    }

    if (mapping.withdrawalThrottleUntil && mapping.withdrawalThrottleUntil > Date.now()) {
      return { 
        allowed: false, 
        reason: 'Withdrawal throttled by admin',
        throttleUntil: mapping.withdrawalThrottleUntil
      }
    }

    return { allowed: true }
  }

  /**
   * Reset a user's game wallet (admin function)
   */
  async resetGameWallet(connectedWalletAddress: string): Promise<{
    success: boolean
    newGameWallet?: Keypair
    error?: string
  }> {
    try {
      const mapping = this.mappings.get(connectedWalletAddress)
      if (!mapping) {
        return { success: false, error: 'Wallet mapping not found' }
      }

      // Generate new game wallet
      const { keypair, encryptedSecret } = generateGameWallet()
      
      // Update mapping
      mapping.gameWalletAddress = keypair.publicKey.toString()
      mapping.encryptedSecretKey = encryptedSecret
      mapping.lastAccessed = Date.now()
      
      this.saveToStorage()

      return {
        success: true,
        newGameWallet: keypair
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get all mappings (admin function)
   */
  getAllMappings(): WalletMapping[] {
    return Array.from(this.mappings.values())
  }

  /**
   * Load mappings from storage
   */
  private loadFromStorage(): void {
    try {
      // Load wallet mappings
      const storedMappings = localStorage.getItem(this.STORAGE_KEY)
      if (storedMappings) {
        const parsedMappings = JSON.parse(storedMappings)
        this.mappings = new Map(parsedMappings)
      }

      // Load user profiles
      const storedProfiles = localStorage.getItem(this.PROFILES_KEY)
      if (storedProfiles) {
        const parsedProfiles = JSON.parse(storedProfiles)
        this.profiles = new Map(parsedProfiles)
      }
    } catch (error) {
      console.error('Failed to load wallet mappings from storage:', error)
    }
  }

  /**
   * Save mappings to storage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.mappings.entries())))
      localStorage.setItem(this.PROFILES_KEY, JSON.stringify(Array.from(this.profiles.entries())))
    } catch (error) {
      console.error('Failed to save wallet mappings to storage:', error)
    }
  }

  // User Profile Methods

  /**
   * Create or update user profile
   */
  createOrUpdateProfile(profile: Partial<UserProfile> & { connectedWalletAddress: string }): UserProfile {
    const userId = generateUserId(profile.connectedWalletAddress)
    const existing = this.profiles.get(profile.connectedWalletAddress)
    
    const userProfile: UserProfile = {
      id: userId,
      connectedWalletAddress: profile.connectedWalletAddress,
      username: profile.username || `Player${userId.slice(-6)}`,
      profilePicture: profile.profilePicture,
      profilePictureType: profile.profilePictureType || 'default',
      joinDate: existing?.joinDate || Date.now(),
      xp: profile.xp || 0,
      badges: profile.badges || [],
      currentStreak: profile.currentStreak || 0,
      longestStreak: profile.longestStreak || 0,
      totalWins: profile.totalWins || 0,
      totalLosses: profile.totalLosses || 0,
      totalWagered: profile.totalWagered || 0,
      vipTier: profile.vipTier || 'Bronze',
      isAdmin: profile.isAdmin || false
    }

    this.profiles.set(profile.connectedWalletAddress, userProfile)
    this.saveToStorage()
    
    return userProfile
  }

  /**
   * Get user profile
   */
  getProfile(connectedWalletAddress: string): UserProfile | null {
    return this.profiles.get(connectedWalletAddress) || null
  }

  /**
   * Check if username is unique
   */
  isUsernameUnique(username: string): boolean {
    for (const profile of this.profiles.values()) {
      if (profile.username.toLowerCase() === username.toLowerCase()) {
        return false
      }
    }
    return true
  }

  /**
   * Update profile stats
   */
  updateProfileStats(connectedWalletAddress: string, updates: Partial<UserProfile>): boolean {
    const profile = this.profiles.get(connectedWalletAddress)
    if (profile) {
      Object.assign(profile, updates)
      this.saveToStorage()
      return true
    }
    return false
  }

  /**
   * Get all profiles (admin function)
   */
  getAllProfiles(): UserProfile[] {
    return Array.from(this.profiles.values())
  }

  /**
   * Find and update the "god" user to maximum level (admin function)
   */
  updateGodUserToMaxLevel(): { success: boolean; message: string } {
    try {
      // Find the "god" user
      const godProfile = Array.from(this.profiles.values()).find(profile => 
        profile.username.toLowerCase() === 'god'
      );

      if (!godProfile) {
        return { 
          success: false, 
          message: 'No user with username "god" found. Please create the user first.' 
        };
      }

      // Calculate maximum level (level 100 = 99,000 XP)
      const maxLevelXP = 99000;
      const maxLevel = Math.floor(maxLevelXP / 1000) + 1;

      // Update the profile with maximum level stats
      const success = this.updateProfileStats(godProfile.connectedWalletAddress, {
        xp: maxLevelXP,
        vipTier: 'Diamond',
        totalWagered: 100000, // Diamond tier requirement
        totalWins: 1000,
        totalLosses: 100,
        longestStreak: 50,
        currentStreak: 10,
        isAdmin: true
      });

      if (success) {
        return { 
          success: true, 
          message: `Successfully updated "god" user to level ${maxLevel} with Diamond VIP tier and admin privileges.` 
        };
      } else {
        return { 
          success: false, 
          message: 'Failed to update "god" user profile.' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error updating god user: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Create the "god" user if it doesn't exist (admin function)
   */
  createGodUser(): { success: boolean; message: string } {
    try {
      // Check if "god" user already exists
      const existingGod = Array.from(this.profiles.values()).find(profile => 
        profile.username.toLowerCase() === 'god'
      );

      if (existingGod) {
        return { 
          success: false, 
          message: 'User "god" already exists. Use updateGodUserToMaxLevel() to update their level.' 
        };
      }

      // Create a special wallet address for the god user
      const godWalletAddress = '11111111111111111111111111111112'; // Special system address
      
      // Create the god user with maximum stats
      const maxLevelXP = 99000;
      const godProfile = this.createOrUpdateProfile({
        connectedWalletAddress: godWalletAddress,
        username: 'god',
        xp: maxLevelXP,
        vipTier: 'Diamond',
        totalWagered: 100000,
        totalWins: 1000,
        totalLosses: 100,
        longestStreak: 50,
        currentStreak: 10,
        isAdmin: true
      });

      return { 
        success: true, 
        message: `Successfully created "god" user with level ${Math.floor(maxLevelXP / 1000) + 1} and admin privileges.` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Error creating god user: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

// Export singleton instance
export const walletMappingManager = WalletMappingManager.getInstance()
