const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const bs58 = require('bs58');
const { getSecurityConfig, solanaSecurityMiddleware, rateLimitConfig } = require('./security');
const authManager = require('./auth');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware with comprehensive CSP
const securityConfig = getSecurityConfig({
  development: process.env.NODE_ENV === 'development',
  rpcUrl: SOLANA_RPC_URL
});

app.use(helmet(securityConfig));
app.use(solanaSecurityMiddleware);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '1mb' })); // Reduced limit for security

// Rate limiting middleware
app.use('/api/auth/nonce', rateLimit(rateLimitConfig.nonce));
app.use('/api/auth/verify-signature', rateLimit(rateLimitConfig.signature));
app.use('/api/wallet/withdraw', rateLimit(rateLimitConfig.withdrawal));
app.use('/api/', rateLimit(rateLimitConfig.general));

// Solana connection
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

// Website wallet (treasury)
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;
let treasuryKeypair;

if (TREASURY_PRIVATE_KEY) {
  try {
    treasuryKeypair = Keypair.fromSecretKey(bs58.decode(TREASURY_PRIVATE_KEY));
    console.log('Treasury wallet loaded:', treasuryKeypair.publicKey.toString());
  } catch (error) {
    console.error('Failed to load treasury wallet:', error.message);
    console.log('Generating new treasury wallet...');
    treasuryKeypair = Keypair.generate();
    console.log('New treasury wallet:', treasuryKeypair.publicKey.toString());
    console.log('Private key (save this):', bs58.encode(treasuryKeypair.secretKey));
  }
} else {
  console.log('No treasury private key provided. Generating new wallet...');
  treasuryKeypair = Keypair.generate();
  console.log('New treasury wallet:', treasuryKeypair.publicKey.toString());
  console.log('Private key (save this):', bs58.encode(treasuryKeypair.secretKey));
}

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Get client IP helper
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '127.0.0.1';
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const user = authManager.verifyJWT(token);
    authManager.updateSessionActivity(user.publicKey);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Generate nonce endpoint
app.post('/api/auth/nonce', (req, res) => {
  try {
    const { publicKey } = req.body;
    const clientIP = getClientIP(req);
    
    if (!publicKey) {
      return res.status(400).json({ message: 'Public key required' });
    }

    const nonceData = authManager.generateNonce(publicKey, clientIP);
    
    res.json({ 
      nonce: nonceData.nonce,
      message: nonceData.message,
      expiresIn: nonceData.expires
    });
  } catch (error) {
    console.error('Error generating nonce:', error);
    res.status(400).json({ message: error.message });
  }
});

// Verify signature endpoint
app.post('/api/auth/verify-signature', async (req, res) => {
  try {
    const { publicKey, message, signature, nonce } = req.body;
    const clientIP = getClientIP(req);
    
    if (!publicKey || !message || !signature || !nonce) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = authManager.verifySignature(nonce, publicKey, signature, message, clientIP);

    res.json({ 
      token: result.token,
      message: 'Authentication successful',
      publicKey: result.publicKey,
      expiresIn: result.expiresIn
    });
  } catch (error) {
    console.error('Error verifying signature:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get wallet balance endpoint
app.get('/api/wallet/balance/:publicKey', authenticateToken, async (req, res) => {
  try {
    const { publicKey } = req.params;
    
    if (req.user.publicKey !== publicKey) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const balance = await connection.getBalance(new PublicKey(publicKey));
    const solBalance = balance / 1e9; // Convert lamports to SOL

    res.json({ 
      balance: solBalance,
      lamports: balance
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get treasury balance endpoint
app.get('/api/wallet/treasury-balance', authenticateToken, async (req, res) => {
  try {
    const balance = await connection.getBalance(treasuryKeypair.publicKey);
    const solBalance = balance / 1e9;

    res.json({ 
      balance: solBalance,
      lamports: balance,
      address: treasuryKeypair.publicKey.toString()
    });
  } catch (error) {
    console.error('Error fetching treasury balance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Withdraw from treasury endpoint
app.post('/api/wallet/withdraw', authenticateToken, async (req, res) => {
  try {
    const { recipient, amount } = req.body;
    
    if (!recipient || !amount) {
      return res.status(400).json({ message: 'Recipient and amount required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    // Validate recipient address
    let recipientPubkey;
    try {
      recipientPubkey = new PublicKey(recipient);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid recipient address' });
    }

    // Check treasury balance
    const treasuryBalance = await connection.getBalance(treasuryKeypair.publicKey);
    const requiredLamports = Math.floor(amount * 1e9);
    
    if (treasuryBalance < requiredLamports) {
      return res.status(400).json({ message: 'Insufficient treasury balance' });
    }

    // Create and send transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasuryKeypair.publicKey,
        toPubkey: recipientPubkey,
        lamports: requiredLamports,
      })
    );

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [treasuryKeypair],
      { commitment: 'confirmed' }
    );

    res.json({ 
      signature,
      message: 'Withdrawal successful',
      amount,
      recipient
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ message: 'Withdrawal failed: ' + error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    network: SOLANA_NETWORK,
    treasuryAddress: treasuryKeypair.publicKey.toString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Solana Wallet API server running on port ${PORT}`);
  console.log(`🌐 Network: ${SOLANA_NETWORK}`);
  console.log(`💰 Treasury wallet: ${treasuryKeypair.publicKey.toString()}`);
  console.log(`🔐 JWT secret: ${JWT_SECRET.substring(0, 8)}...`);
});

module.exports = app;
