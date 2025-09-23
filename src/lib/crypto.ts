import { Keypair, PublicKey } from '@solana/web3.js'
// Browser-compatible crypto functions
function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

function createCipheriv(algorithm: string, key: Buffer, iv: Uint8Array): any {
  // Simplified encryption for demo - in production, use proper crypto libraries
  return {
    update: (data: string, inputEncoding: string, outputEncoding: string) => {
      // Simple XOR encryption for demo
      const dataBuffer = Buffer.from(data, inputEncoding as BufferEncoding)
      const encrypted = new Uint8Array(dataBuffer.length)
      for (let i = 0; i < dataBuffer.length; i++) {
        encrypted[i] = dataBuffer[i] ^ key[i % key.length] ^ iv[i % iv.length]
      }
      return Buffer.from(encrypted).toString(outputEncoding as BufferEncoding)
    },
    final: (outputEncoding: string) => '',
    getAuthTag: () => Buffer.from('auth-tag-demo')
  }
}

function createDecipheriv(algorithm: string, key: Buffer, iv: Uint8Array): any {
  return {
    update: (data: string, inputEncoding: string, outputEncoding: string) => {
      // Simple XOR decryption for demo
      const dataBuffer = Buffer.from(data, inputEncoding as BufferEncoding)
      const decrypted = new Uint8Array(dataBuffer.length)
      for (let i = 0; i < dataBuffer.length; i++) {
        decrypted[i] = dataBuffer[i] ^ key[i % key.length] ^ iv[i % iv.length]
      }
      return Buffer.from(decrypted).toString(outputEncoding as BufferEncoding)
    },
    final: (outputEncoding: string) => '',
    setAuthTag: () => {}
  }
}

/**
 * Secure Key Management System
 * Handles encryption/decryption of game wallet keys
 */

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const TAG_LENGTH = 16 // 128 bits

// In production, this would be stored securely (e.g., AWS KMS, HashiCorp Vault)
// For demo purposes, we'll use a derived key from environment
function getMasterKey(): Buffer {
  // In browser environment, we can't access process.env directly
  // Use a consistent demo key for browser compatibility
  const masterKey = typeof process !== 'undefined' && process.env?.MASTER_ENCRYPTION_KEY 
    ? process.env.MASTER_ENCRYPTION_KEY 
    : 'demo-master-key-change-in-production'
  return Buffer.from(masterKey.padEnd(32, '0').slice(0, 32))
}

/**
 * Encrypt sensitive data (like private keys)
 */
export function encryptData(data: string): { encrypted: string; iv: string; tag: string } {
  try {
    const key = getMasterKey()
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    return {
      encrypted,
      iv: Buffer.from(iv).toString('hex'),
      tag: tag.toString('hex')
    }
  } catch (error) {
    throw new Error(`Encryption failed: ${error}`)
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: { encrypted: string; iv: string; tag: string }): string {
  try {
    const key = getMasterKey()
    
    // Validate input data
    if (!encryptedData.iv || !encryptedData.tag || !encryptedData.encrypted) {
      throw new Error('Missing required encryption data')
    }
    
    // Validate hex format for IV and tag
    if (!/^[0-9a-fA-F]+$/.test(encryptedData.iv)) {
      throw new Error(`Invalid IV format: expected hex string, got "${encryptedData.iv}"`)
    }
    if (!/^[0-9a-fA-F]+$/.test(encryptedData.tag)) {
      throw new Error(`Invalid tag format: expected hex string, got "${encryptedData.tag}"`)
    }
    if (!/^[0-9a-fA-F]+$/.test(encryptedData.encrypted)) {
      throw new Error(`Invalid encrypted data format: expected hex string, got "${encryptedData.encrypted.substring(0, 20)}..."`)
    }
    
    const iv = Buffer.from(encryptedData.iv, 'hex')
    const tag = Buffer.from(encryptedData.tag, 'hex')
    const encrypted = encryptedData.encrypted
    
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Decryption error details:', {
      error: errorMessage,
      iv: encryptedData?.iv,
      tag: encryptedData?.tag,
      encryptedLength: encryptedData?.encrypted?.length
    })
    throw new Error(`Decryption failed: ${errorMessage}`)
  }
}

/**
 * Generate a secure game wallet keypair
 */
export function generateGameWallet(): {
  keypair: Keypair
  encryptedSecret: { encrypted: string; iv: string; tag: string }
} {
  try {
    // Generate a new keypair
    const keypair = Keypair.generate()
    
    // Validate the generated keypair
    if (!keypair.publicKey || !keypair.secretKey) {
      throw new Error('Generated keypair is invalid')
    }
    
    // Validate secret key length (should be 64 bytes for Ed25519)
    if (keypair.secretKey.length !== 64) {
      throw new Error(`Invalid secret key length: expected 64 bytes, got ${keypair.secretKey.length}`)
    }
    
    // Convert secret key to hex string for encryption
    const secretKeyHex = Buffer.from(keypair.secretKey).toString('hex')
    
    // Validate hex string length (64 bytes = 128 hex characters)
    if (secretKeyHex.length !== 128) {
      throw new Error(`Invalid hex string length: expected 128 characters, got ${secretKeyHex.length}`)
    }
    
    // Encrypt the secret key
    const encryptedSecret = encryptData(secretKeyHex)
    
    console.log(`✅ Generated new game wallet: ${keypair.publicKey.toString()}`)
    
    return {
      keypair,
      encryptedSecret
    }
  } catch (error) {
    console.error('Failed to generate game wallet:', error)
    throw new Error(`Game wallet generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Restore a keypair from encrypted secret
 */
export function restoreGameWallet(encryptedSecret: { encrypted: string; iv: string; tag: string }): Keypair {
  try {
    console.log('Attempting to restore game wallet with encrypted data:', {
      hasEncrypted: !!encryptedSecret.encrypted,
      hasIV: !!encryptedSecret.iv,
      hasTag: !!encryptedSecret.tag,
      encryptedLength: encryptedSecret.encrypted?.length,
      ivLength: encryptedSecret.iv?.length,
      tagLength: encryptedSecret.tag?.length
    })
    
    // Try to migrate the data if needed
    let migratedData = encryptedSecret
    try {
      migratedData = migrateEncryptedData(encryptedSecret)
      console.log('Data migration successful')
    } catch (migrationError) {
      const errorMessage = migrationError instanceof Error ? migrationError.message : 'Unknown error'
      console.log('No migration needed or migration failed, using original data:', errorMessage)
    }
    
    const secretKeyHex = decryptData(migratedData)
    console.log('Decrypted secret key hex length:', secretKeyHex?.length)
    
    // Validate the hex string
    if (!secretKeyHex || typeof secretKeyHex !== 'string') {
      throw new Error('Invalid secret key data: decryption returned invalid result')
    }
    
    // Remove any whitespace and validate hex format
    const cleanHex = secretKeyHex.replace(/\s/g, '')
    console.log('Clean hex string length:', cleanHex.length, 'First 20 chars:', cleanHex.substring(0, 20))
    
    if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
      console.error('Invalid hex format detected. Clean hex:', cleanHex.substring(0, 50))
      throw new Error(`Secret key is not valid hex format. Got: "${cleanHex.substring(0, 20)}..."`)
    }
    
    // Validate length (64 bytes = 128 hex characters)
    if (cleanHex.length !== 128) {
      throw new Error(`Invalid secret key length: expected 128 hex characters (64 bytes), got ${cleanHex.length}`)
    }
    
    const secretKey = Buffer.from(cleanHex, 'hex')
    console.log('Secret key buffer length:', secretKey.length)
    
    // Validate buffer length
    if (secretKey.length !== 64) {
      throw new Error(`Invalid secret key buffer length: expected 64 bytes, got ${secretKey.length}`)
    }
    
    // Create and validate the keypair
    const keypair = Keypair.fromSecretKey(secretKey)
    console.log('Keypair created successfully, public key:', keypair.publicKey.toString())
    
    // Verify the keypair is valid by checking public key
    if (!keypair.publicKey) {
      throw new Error('Generated keypair has invalid public key')
    }
    
    return keypair
  } catch (error) {
    console.error('Failed to restore game wallet:', error)
    throw new Error(`Game wallet restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Migrate old encrypted data format to new format
 */
export function migrateEncryptedData(encryptedData: any): { encrypted: string; iv: string; tag: string } {
  try {
    // Check if it's already in the correct format
    if (encryptedData.encrypted && encryptedData.iv && encryptedData.tag) {
      // Check if IV is in the old comma-separated format
      if (encryptedData.iv.includes(',')) {
        console.log('Migrating IV from comma-separated to hex format')
        // Convert comma-separated string back to Buffer then to hex
        const ivArray = encryptedData.iv.split(',').map((x: string) => parseInt(x.trim(), 10))
        const ivBuffer = Buffer.from(ivArray)
        return {
          encrypted: encryptedData.encrypted,
          iv: ivBuffer.toString('hex'),
          tag: encryptedData.tag
        }
      }
      
      // Check if IV is already in hex format
      if (/^[0-9a-fA-F]+$/.test(encryptedData.iv)) {
        return encryptedData
      }
    }
    
    throw new Error('Invalid encrypted data format for migration')
  } catch (error) {
    console.error('Migration failed:', error)
    throw new Error(`Failed to migrate encrypted data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate wallet address format
 */
export function isValidWalletAddress(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

/**
 * Generate a unique user ID based on wallet address
 */
export function generateUserId(walletAddress: string): string {
  // Create a deterministic hash of the wallet address
  // In production, you might want to use a proper hashing function
  return `user_${Buffer.from(walletAddress).toString('base64').slice(0, 16)}`
}

/**
 * Hash sensitive data for storage
 */
export function hashData(data: string): string {
  // In production, use a proper cryptographic hash like SHA-256
  return Buffer.from(data).toString('base64')
}
