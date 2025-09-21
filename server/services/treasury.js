/**
 * Treasury Management Service
 *
 * SAFETY: This service handles the house treasury wallet with production-ready
 * KMS integration and secure key management.
 *
 * ⚠️  NEVER commit private keys to the repository
 * ⚠️  Production must use KMS (AWS KMS, GCP KMS, or HashiCorp Vault)
 * ⚠️  Default to Devnet only - Mainnet requires explicit approval
 */

const {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
} = require('@solana/web3.js')
const bs58 = require('bs58')
const crypto = require('crypto')

// AWS SDK for KMS (only loaded if KMS is enabled)
let AWS
try {
  AWS = require('aws-sdk')
} catch (err) {
  console.log('AWS SDK not installed - KMS features disabled')
}

class TreasuryService {
  constructor() {
    this.connection = null
    this.treasuryKeypair = null
    this.network = process.env.SOLANA_NETWORK || 'devnet'
    this.rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    this.allowOnchain = process.env.ALLOW_ONCHAIN === 'true'
    this.kmsEnabled = process.env.KMS_ENABLED === 'true'
    this.kmsKeyId = process.env.KMS_KEY_ID
    this.treasurySecretName = process.env.TREASURY_KEY_SECRET_NAME

    this.initialize()
  }

  async initialize() {
    try {
      // Initialize Solana connection
      this.connection = new Connection(this.rpcUrl, 'confirmed')
      console.log(`🔗 Connected to Solana ${this.network} at ${this.rpcUrl}`)

      // Initialize treasury wallet
      await this.initializeTreasuryWallet()

      // Log safety warnings
      this.logSafetyWarnings()
    } catch (error) {
      console.error('❌ Failed to initialize treasury service:', error)
      throw error
    }
  }

  async initializeTreasuryWallet() {
    if (this.kmsEnabled && this.treasurySecretName) {
      // Production: Load from AWS Secrets Manager + KMS
      await this.loadTreasuryFromKMS()
    } else if (process.env.TREASURY_PRIVATE_KEY) {
      // Development: Load from environment variable
      await this.loadTreasuryFromEnv()
    } else {
      // Generate new wallet for development
      await this.generateNewTreasuryWallet()
    }
  }

  async loadTreasuryFromKMS() {
    console.log('🔐 Loading treasury wallet from AWS KMS...')

    try {
      const secretsManager = new AWS.SecretsManager({
        region: process.env.AWS_REGION || 'us-east-1',
      })

      // Get encrypted private key from Secrets Manager
      const secretData = await secretsManager
        .getSecretValue({
          SecretId: this.treasurySecretName,
        })
        .promise()

      const secret = JSON.parse(secretData.SecretString)
      const encryptedKey = secret.encryptedPrivateKey

      // Decrypt with KMS
      const kms = new AWS.KMS({
        region: process.env.AWS_REGION || 'us-east-1',
      })

      const decryptResult = await kms
        .decrypt({
          CiphertextBlob: Buffer.from(encryptedKey, 'base64'),
          KeyId: this.kmsKeyId,
        })
        .promise()

      const privateKey = decryptResult.Plaintext.toString()
      this.treasuryKeypair = Keypair.fromSecretKey(bs58.decode(privateKey))

      console.log(
        `✅ Treasury wallet loaded from KMS: ${this.treasuryKeypair.publicKey.toString()}`
      )
    } catch (error) {
      console.error('❌ Failed to load treasury from KMS:', error)
      throw new Error('Treasury KMS initialization failed')
    }
  }

  async loadTreasuryFromEnv() {
    console.log(
      '⚠️  Loading treasury wallet from environment variable (DEV ONLY)'
    )

    try {
      const privateKey = process.env.TREASURY_PRIVATE_KEY
      
      if (!privateKey) {
        throw new Error('TREASURY_PRIVATE_KEY environment variable is not set')
      }

      // Validate private key format
      if (typeof privateKey !== 'string' || privateKey.length < 64) {
        throw new Error('TREASURY_PRIVATE_KEY format is invalid')
      }

      // Decode and validate the secret key
      let decodedKey
      try {
        decodedKey = bs58.decode(privateKey)
      } catch (error) {
        throw new Error(`Failed to decode private key: ${error.message}`)
      }

      // Validate secret key length (should be 64 bytes for Ed25519)
      if (decodedKey.length !== 64) {
        throw new Error(`Invalid secret key length: expected 64 bytes, got ${decodedKey.length}`)
      }

      this.treasuryKeypair = Keypair.fromSecretKey(decodedKey)

      console.log(
        `✅ Treasury wallet loaded from env: ${this.treasuryKeypair.publicKey.toString()}`
      )

      // Log warning about environment variable usage
      console.log(
        '⚠️  WARNING: Using TREASURY_PRIVATE_KEY from environment variable'
      )
      console.log('⚠️  This is NOT secure for production! Use KMS instead.')
    } catch (error) {
      console.error('❌ Failed to load treasury from environment:', error)
      throw new Error(`Invalid treasury private key in environment: ${error.message}`)
    }
  }

  async generateNewTreasuryWallet() {
    console.log('🔑 Generating new treasury wallet...')

    this.treasuryKeypair = Keypair.generate()

    console.log(
      `✅ New treasury wallet generated: ${this.treasuryKeypair.publicKey.toString()}`
    )
    console.log(
      `🔑 Private key (SAVE THIS): ${bs58.encode(this.treasuryKeypair.secretKey)}`
    )
    console.log('⚠️  WARNING: This is a new wallet with no SOL balance!')
    console.log('⚠️  Fund it with: solana airdrop 10 <PUBLIC_KEY>')
  }

  logSafetyWarnings() {
    console.log('\n🛡️  TREASURY SAFETY WARNINGS:')
    console.log(`   Network: ${this.network}`)
    console.log(`   Allow Onchain: ${this.allowOnchain}`)
    console.log(`   KMS Enabled: ${this.kmsEnabled}`)

    if (this.network === 'mainnet-beta') {
      console.log('🚨 WARNING: MAINNET MODE ENABLED - REAL SOL TRANSACTIONS!')
    }

    if (!this.allowOnchain) {
      console.log('🔒 On-chain transactions disabled (ALLOW_ONCHAIN=false)')
    }

    if (!this.kmsEnabled && this.network === 'mainnet-beta') {
      console.log('🚨 CRITICAL: Mainnet without KMS is extremely dangerous!')
    }
  }

  // Get treasury balance
  async getBalance() {
    try {
      // Validate treasury keypair is initialized
      if (!this.treasuryKeypair || !this.treasuryKeypair.publicKey) {
        throw new Error('Treasury wallet not properly initialized')
      }

      // Validate connection is available
      if (!this.connection) {
        throw new Error('Solana connection not available')
      }

      const balance = await this.connection.getBalance(
        this.treasuryKeypair.publicKey
      )
      
      console.log(`Treasury balance fetched: ${balance / 1e9} SOL`)
      
      return {
        lamports: balance,
        sol: balance / 1e9,
        address: this.treasuryKeypair.publicKey.toString(),
        network: this.network
      }
    } catch (error) {
      console.error('Error fetching treasury balance:', error)
      
      // Provide more specific error information
      if (error.message.includes('Invalid public key')) {
        throw new Error('Invalid treasury wallet public key')
      } else if (error.message.includes('fetch')) {
        throw new Error('Network error while fetching treasury balance')
      } else {
        throw new Error(`Treasury balance fetch failed: ${error.message}`)
      }
    }
  }

  // Send SOL from treasury
  async sendSOL(recipientAddress, amountSOL, memo = null) {
    if (!this.allowOnchain) {
      throw new Error(
        'On-chain transactions are disabled (ALLOW_ONCHAIN=false)'
      )
    }

    if (this.network === 'mainnet-beta') {
      throw new Error(
        'Mainnet transactions require explicit approval - contact admin'
      )
    }

    try {
      const recipientPubkey = new PublicKey(recipientAddress)
      const amountLamports = Math.floor(amountSOL * 1e9)

      // Check treasury balance
      const treasuryBalance = await this.connection.getBalance(
        this.treasuryKeypair.publicKey
      )
      const feeEstimate = 5000 // Estimated transaction fee

      if (treasuryBalance < amountLamports + feeEstimate) {
        throw new Error(
          `Insufficient treasury balance. Required: ${(amountLamports + feeEstimate) / 1e9} SOL, Available: ${treasuryBalance / 1e9} SOL`
        )
      }

      // Create transaction
      const transaction = new Transaction()

      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: this.treasuryKeypair.publicKey,
          toPubkey: recipientPubkey,
          lamports: amountLamports,
        })
      )

      // Add memo if provided
      if (memo) {
        transaction.add(
          new TransactionInstruction({
            keys: [],
            programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysKcWfC85B2q2'),
            data: Buffer.from(memo, 'utf8'),
          })
        )
      }

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash
      transaction.feePayer = this.treasuryKeypair.publicKey

      // Sign and send transaction
      transaction.sign(this.treasuryKeypair)

      const signature = await this.connection.sendRawTransaction(
        transaction.serialize()
      )

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        'confirmed'
      )

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        )
      }

      return {
        signature,
        amount: amountSOL,
        recipient: recipientAddress,
        network: this.network,
      }
    } catch (error) {
      console.error('Error sending SOL:', error)
      throw error
    }
  }

  // Create deposit address for user (optional feature)
  async createDepositAddress(userId, memo = null) {
    // For simplicity, we'll use the treasury address with a memo
    // In production, you might want to use Program Derived Addresses (PDAs)
    const depositMemo = memo || `deposit_${userId}_${Date.now()}`

    return {
      address: this.treasuryKeypair.publicKey.toString(),
      memo: depositMemo,
      instructions: `Send SOL to the address above with memo: ${depositMemo}`,
    }
  }

  // Verify transaction signature
  async verifyTransaction(signature) {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
      })

      if (!transaction) {
        return { valid: false, reason: 'Transaction not found' }
      }

      return {
        valid: true,
        transaction,
        confirmations: transaction.meta?.confirmations || 0,
        slot: transaction.slot,
        blockhash: transaction.transaction.message.recentBlockhash,
      }
    } catch (error) {
      console.error('Error verifying transaction:', error)
      return { valid: false, reason: error.message }
    }
  }

  // Get transaction details
  async getTransactionDetails(signature) {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
      })

      if (!transaction) {
        return null
      }

      // Parse transfer instructions
      const transfers = []
      const instructions = transaction.transaction.message.instructions

      for (const instruction of instructions) {
        if (instruction.programId.equals(SystemProgram.programId)) {
          // This is a system program instruction (likely a transfer)
          const data = instruction.data
          if (data.length === 4 && data[0] === 2) {
            // Transfer instruction
            transfers.push({
              from: transaction.transaction.message.accountKeys[
                instruction.accounts[0]
              ].toString(),
              to: transaction.transaction.message.accountKeys[
                instruction.accounts[1]
              ].toString(),
              amount: instruction.data.readUInt32LE(1), // This is simplified - real parsing is more complex
            })
          }
        }
      }

      return {
        signature,
        slot: transaction.slot,
        blockhash: transaction.transaction.message.recentBlockhash,
        confirmations: transaction.meta?.confirmations || 0,
        transfers,
        memo: transaction.transaction.message.instructions
          .find(
            ix =>
              ix.programId.toString() === 'MemoSq4gqABAXKb96qnH8TysKcWfC85B2q2'
          )
          ?.data?.toString('utf8'),
      }
    } catch (error) {
      console.error('Error getting transaction details:', error)
      return null
    }
  }

  // Safety check before mainnet operations
  checkMainnetSafety() {
    if (this.network === 'mainnet-beta' && !this.kmsEnabled) {
      throw new Error('CRITICAL: Mainnet operations require KMS to be enabled')
    }

    if (this.network === 'mainnet-beta' && !this.allowOnchain) {
      throw new Error('Mainnet operations require ALLOW_ONCHAIN=true')
    }
  }

  // Get treasury status
  getStatus() {
    return {
      network: this.network,
      allowOnchain: this.allowOnchain,
      kmsEnabled: this.kmsEnabled,
      treasuryAddress: this.treasuryKeypair?.publicKey?.toString(),
      rpcUrl: this.rpcUrl,
    }
  }
}

module.exports = TreasuryService
