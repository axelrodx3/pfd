import { walletMappingManager } from './walletMapping'

/**
 * Admin Setup Utility
 * Creates an admin user for testing purposes
 */

// Admin wallet address (you can change this to your own wallet address for testing)
const ADMIN_WALLET_ADDRESS = '11111111111111111111111111111112' // System Program ID as placeholder

export function setupAdminUser() {
  try {
    // Check if admin already exists
    let adminProfile = walletMappingManager.getProfile(ADMIN_WALLET_ADDRESS)
    
    if (!adminProfile) {
      // Create admin profile
      adminProfile = walletMappingManager.createOrUpdateProfile({
        connectedWalletAddress: ADMIN_WALLET_ADDRESS,
        username: 'Admin',
        joinDate: Date.now(),
        xp: 999999,
        badges: ['admin', 'founder'],
        currentStreak: 999,
        longestStreak: 999,
        totalWins: 999,
        totalLosses: 0,
        totalWagered: 999999,
        vipTier: 'Diamond',
        isAdmin: true
      })
      
      console.log('✅ Admin user created successfully')
    } else {
      // Ensure admin privileges
      if (!adminProfile.isAdmin) {
        adminProfile.isAdmin = true
        walletMappingManager.updateProfileStats(ADMIN_WALLET_ADDRESS, { isAdmin: true })
        console.log('✅ Admin privileges granted')
      }
    }
    
    return adminProfile
  } catch (error) {
    console.error('❌ Failed to setup admin user:', error)
    return null
  }
}

// Auto-setup admin on module load
if (typeof window !== 'undefined') {
  setupAdminUser()
}
