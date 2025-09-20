const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nacl = require('tweetnacl');
const { PublicKey } = require('@solana/web3.js');

/**
 * Hardened authentication system for Solana wallet integration
 * Implements secure nonce generation, signature verification, and session management
 */

class AuthenticationManager {
  constructor(options = {}) {
    this.jwtSecret = options.jwtSecret || crypto.randomBytes(64).toString('hex');
    this.jwtExpiresIn = options.jwtExpiresIn || '7d';
    this.nonceExpiresIn = options.nonceExpiresIn || 5 * 60 * 1000; // 5 minutes
    this.maxAttempts = options.maxAttempts || 3;
    this.rateLimitWindow = options.rateLimitWindow || 15 * 60 * 1000; // 15 minutes
    
    // In-memory storage (use Redis in production)
    this.nonces = new Map();
    this.userSessions = new Map();
    this.failedAttempts = new Map();
    this.usedNonces = new Set();
  }

  /**
   * Generate a cryptographically secure nonce
   * @param {string} publicKey - User's public key
   * @param {string} ip - Client IP address
   * @returns {Object} Nonce data
   */
  generateNonce(publicKey, ip) {
    // Validate public key
    try {
      new PublicKey(publicKey);
    } catch (error) {
      throw new Error('Invalid public key format');
    }

    // Check rate limiting
    if (this.failedAttempts.has(ip)) {
      const attempts = this.failedAttempts.get(ip);
      if (attempts.count >= this.maxAttempts && Date.now() - attempts.firstAttempt < this.rateLimitWindow) {
        throw new Error('Too many failed attempts. Please try again later.');
      }
    }

    // Generate cryptographically secure nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const expires = timestamp + this.nonceExpiresIn;

    // Create message for signing
    const message = `Please sign this message to authenticate with HILO Casino.

Nonce: ${nonce}
Timestamp: ${timestamp}
Public Key: ${publicKey}

This signature proves ownership of your wallet and cannot be used to access your funds.`;

    // Store nonce with metadata
    this.nonces.set(nonce, {
      publicKey,
      ip,
      timestamp,
      expires,
      message,
      attempts: 0
    });

    // Cleanup expired nonces
    this.cleanupExpiredNonces();

    return {
      nonce,
      message,
      expires: expires - Date.now()
    };
  }

  /**
   * Verify signature and authenticate user
   * @param {string} nonce - The nonce
   * @param {string} publicKey - User's public key
   * @param {string} signature - Base64 encoded signature
   * @param {string} message - Original message
   * @param {string} ip - Client IP address
   * @returns {Object} Authentication result
   */
  verifySignature(nonce, publicKey, signature, message, ip) {
    // Validate inputs
    if (!nonce || !publicKey || !signature || !message) {
      throw new Error('Missing required authentication parameters');
    }

    // Check if nonce exists and is valid
    const nonceData = this.nonces.get(nonce);
    if (!nonceData) {
      throw new Error('Invalid or expired nonce');
    }

    // Check expiration
    if (Date.now() > nonceData.expires) {
      this.nonces.delete(nonce);
      throw new Error('Nonce expired');
    }

    // Check IP address
    if (nonceData.ip !== ip) {
      throw new Error('IP address mismatch');
    }

    // Check public key
    if (nonceData.publicKey !== publicKey) {
      throw new Error('Public key mismatch');
    }

    // Check if nonce was already used
    if (this.usedNonces.has(nonce)) {
      throw new Error('Nonce already used');
    }

    // Increment attempts
    nonceData.attempts++;
    if (nonceData.attempts > 3) {
      this.nonces.delete(nonce);
      this.recordFailedAttempt(ip);
      throw new Error('Too many verification attempts');
    }

    try {
      // Verify signature using nacl
      const publicKeyObj = new PublicKey(publicKey);
      const signatureBytes = Buffer.from(signature, 'base64');
      const messageBytes = new TextEncoder().encode(message);

      // Verify signature
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyObj.toBytes()
      );

      if (!isValid) {
        this.recordFailedAttempt(ip);
        throw new Error('Invalid signature');
      }

      // Mark nonce as used
      this.usedNonces.add(nonce);
      this.nonces.delete(nonce);

      // Clear failed attempts for this IP
      this.failedAttempts.delete(ip);

      // Generate JWT token
      const token = this.generateJWT(publicKey);

      // Store user session
      this.userSessions.set(publicKey, {
        token,
        lastActivity: Date.now(),
        ip
      });

      return {
        success: true,
        token,
        publicKey,
        expiresIn: this.jwtExpiresIn
      };

    } catch (error) {
      this.recordFailedAttempt(ip);
      throw new Error(`Signature verification failed: ${error.message}`);
    }
  }

  /**
   * Generate JWT token
   * @param {string} publicKey - User's public key
   * @returns {string} JWT token
   */
  generateJWT(publicKey) {
    const payload = {
      publicKey,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      iss: 'hilo-casino',
      aud: 'wallet-auth'
    };

    return jwt.sign(payload, this.jwtSecret, { algorithm: 'HS256' });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token
   */
  verifyJWT(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, { 
        algorithms: ['HS256'],
        issuer: 'hilo-casino',
        audience: 'wallet-auth'
      });

      // Check if session exists
      const session = this.userSessions.get(decoded.publicKey);
      if (!session || session.token !== token) {
        throw new Error('Invalid session');
      }

      return decoded;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Record failed authentication attempt
   * @param {string} ip - Client IP address
   */
  recordFailedAttempt(ip) {
    const now = Date.now();
    const attempts = this.failedAttempts.get(ip) || { count: 0, firstAttempt: now };
    
    if (now - attempts.firstAttempt > this.rateLimitWindow) {
      // Reset if outside window
      attempts.count = 1;
      attempts.firstAttempt = now;
    } else {
      attempts.count++;
    }

    this.failedAttempts.set(ip, attempts);
  }

  /**
   * Cleanup expired nonces
   */
  cleanupExpiredNonces() {
    const now = Date.now();
    for (const [nonce, data] of this.nonces.entries()) {
      if (now > data.expires) {
        this.nonces.delete(nonce);
      }
    }
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const sessionExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    for (const [publicKey, session] of this.userSessions.entries()) {
      if (now - session.lastActivity > sessionExpiry) {
        this.userSessions.delete(publicKey);
      }
    }
  }

  /**
   * Logout user
   * @param {string} publicKey - User's public key
   */
  logout(publicKey) {
    this.userSessions.delete(publicKey);
  }

  /**
   * Get session info
   * @param {string} publicKey - User's public key
   * @returns {Object|null} Session info
   */
  getSession(publicKey) {
    return this.userSessions.get(publicKey) || null;
  }

  /**
   * Update session activity
   * @param {string} publicKey - User's public key
   */
  updateSessionActivity(publicKey) {
    const session = this.userSessions.get(publicKey);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  /**
   * Get authentication statistics
   * @returns {Object} Stats
   */
  getStats() {
    return {
      activeSessions: this.userSessions.size,
      pendingNonces: this.nonces.size,
      usedNonces: this.usedNonces.size,
      failedAttempts: this.failedAttempts.size
    };
  }
}

// Export singleton instance
const authManager = new AuthenticationManager({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

// Cleanup interval (run every 5 minutes)
setInterval(() => {
  authManager.cleanupExpiredNonces();
  authManager.cleanupExpiredSessions();
}, 5 * 60 * 1000);

module.exports = authManager;
