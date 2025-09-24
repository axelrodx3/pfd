const helmet = require('helmet')

/**
 * Comprehensive security headers configuration for Solana wallet integration
 * Designed to prevent Phantom "unsafe site" warnings and ensure maximum security
 */

const securityConfig = {
  // Content Security Policy - Critical for Phantom safety
  contentSecurityPolicy: {
    directives: {
      // Default source - only allow same origin
      defaultSrc: ["'self'"],

      // Script sources - only allow trusted sources, no inline scripts
      scriptSrc: [
        "'self'",
        // Vite development server (remove in production)
        ...(process.env.NODE_ENV === 'development' ? ["'unsafe-eval'"] : []),
        // Remove unsafe-inline; rely on hashed/nonce-based scripts only
        // Trusted CDNs (use SRI in production)
        'https://unpkg.com',
        'https://cdn.jsdelivr.net',
      ],

      // Style sources
      styleSrc: [
        "'self'",
        // Avoid unsafe-inline; ensure styles are compiled/static
        'https://fonts.googleapis.com',
      ],

      // Font sources
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],

      // Image sources
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],

      // Connect sources for API calls and Solana RPC
      connectSrc: [
        "'self'",
        // Solana RPC endpoints
        'https://api.mainnet-beta.solana.com',
        'https://api.devnet.solana.com',
        'https://api.testnet.solana.com',
        // Custom RPC endpoints (configure via environment)
        ...(process.env.SOLANA_RPC_URL ? [process.env.SOLANA_RPC_URL] : []),
        // WebSocket connections for real-time updates
        'wss://api.mainnet-beta.solana.com',
        'wss://api.devnet.solana.com',
        'wss://api.testnet.solana.com',
      ],

      // Frame sources - deny all to prevent clickjacking
      frameSrc: ["'none'"],

      // Object sources - deny all
      objectSrc: ["'none'"],

      // Base URI - restrict to same origin
      baseUri: ["'self'"],

      // Form action - restrict to same origin
      formAction: ["'self'"],

      // Frame ancestors - deny all
      frameAncestors: ["'none'"],

      // Upgrade insecure requests in production
      upgradeInsecureRequests:
        process.env.NODE_ENV === 'production' ? [] : null,
    },
  },

  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disabled to allow wallet connections

  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: 'same-origin' },

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: 'same-origin' },

  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },

  // Expect CT (Certificate Transparency)
  expectCt: {
    maxAge: 86400,
    enforce: true,
    reportUri: process.env.CT_REPORT_URI || null,
  },

  // Feature Policy / Permissions Policy
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
    usb: [],
    bluetooth: [],
    accelerometer: [],
    gyroscope: [],
    magnetometer: [],
    ambientLightSensor: [],
    autoplay: [],
    encryptedMedia: [],
    fullscreen: ['self'],
    pictureInPicture: [],
    syncXhr: [],
    webShare: [],
    xrSpatialTracking: [],
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // IE No Open
  ieNoOpen: true,

  // No Sniff
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // XSS Filter
  xssFilter: true,
}

/**
 * Get security middleware configuration
 * @param {Object} options - Configuration options
 * @returns {Object} Helmet configuration
 */
function getSecurityConfig(options = {}) {
  const config = { ...securityConfig }

  // Override CSP for development
  if (options.development) {
    config.contentSecurityPolicy.directives.scriptSrc.push("'unsafe-eval'")
    config.contentSecurityPolicy.directives.connectSrc.push(
      'ws://localhost:*',
      'wss://localhost:*'
    )
  }

  // Add custom domains to CSP
  if (options.allowedDomains) {
    config.contentSecurityPolicy.directives.connectSrc.push(
      ...options.allowedDomains
    )
  }

  // Custom RPC URL
  if (options.rpcUrl) {
    config.contentSecurityPolicy.directives.connectSrc.push(options.rpcUrl)
  }

  return config
}

/**
 * Additional security middleware for Solana-specific security
 */
const solanaSecurityMiddleware = (req, res, next) => {
  // Add custom security headers
  res.setHeader('X-Solana-Wallet-Safe', 'true')
  res.setHeader('X-Wallet-Integration-Version', '1.0.0')

  // Prevent MIME type sniffing for wallet-related files
  if (req.url.includes('.wallet') || req.url.includes('.key')) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
  }

  // Add CORS headers for wallet connections
  res.setHeader(
    'Access-Control-Allow-Origin',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  )
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  next()
}

/**
 * Rate limiting configuration for wallet operations
 */
const rateLimitConfig = {
  // Nonce generation rate limit
  nonce: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 requests per window
    message: 'Too many nonce requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Signature verification rate limit
  signature: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 requests per window
    message: 'Too many signature verification attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Withdrawal requests rate limit
  withdrawal: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 withdrawals per hour
    message: 'Too many withdrawal requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },
}

module.exports = {
  getSecurityConfig,
  solanaSecurityMiddleware,
  rateLimitConfig,
  securityConfig,
}
