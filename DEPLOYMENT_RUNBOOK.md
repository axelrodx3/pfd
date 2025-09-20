# 🚀 Solana Wallet Integration - Production Deployment Runbook

## 📋 Pre-Deployment Checklist

### ✅ **Critical Security Requirements**

- [ ] **Domain & HTTPS Setup**
  - [ ] Custom domain registered and configured
  - [ ] SSL/TLS certificate installed and valid
  - [ ] HTTPS redirect enforced
  - [ ] HSTS headers configured
  - [ ] Certificate auto-renewal configured

- [ ] **Security Headers**
  - [ ] Content Security Policy (CSP) configured
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Referrer-Policy: strict-origin-when-cross-origin
  - [ ] Permissions-Policy configured
  - [ ] X-Powered-By header removed

- [ ] **Environment Configuration**
  - [ ] Production environment variables set
  - [ ] JWT_SECRET configured (64+ characters)
  - [ ] TREASURY_PRIVATE_KEY secured (use KMS/HSM in production)
  - [ ] SOLANA_NETWORK set to mainnet-beta
  - [ ] Secure RPC endpoint configured
  - [ ] Rate limiting enabled

- [ ] **Backend Security**
  - [ ] Authentication system hardened
  - [ ] Nonce-based auth implemented
  - [ ] Signature verification using tweetnacl
  - [ ] Rate limiting on all endpoints
  - [ ] Input validation on all inputs
  - [ ] Transaction simulation enabled
  - [ ] Treasury key secured (never in source code)

- [ ] **Frontend Security**
  - [ ] No inline scripts/styles
  - [ ] CSP configured for wallet adapters
  - [ ] No eval() or new Function() usage
  - [ ] Wallet adapter auto-connect disabled
  - [ ] Minimal permissions requested
  - [ ] Clear user warnings displayed

- [ ] **Testing & Monitoring**
  - [ ] All tests passing
  - [ ] Security tests executed
  - [ ] E2E tests passing
  - [ ] Security monitoring enabled
  - [ ] Logging configured
  - [ ] Alert system configured

---

## 🔧 **Manual Setup Steps**

### **1. Domain & DNS Configuration**

#### **Option A: Using Cloudflare (Recommended)**

```bash
# 1. Register domain with Cloudflare
# 2. Add DNS records:
#    - A record: @ -> your-server-ip
#    - A record: www -> your-server-ip
#    - CNAME: api -> your-server-domain

# 3. Configure Cloudflare SSL/TLS:
#    - SSL/TLS encryption mode: "Full (strict)"
#    - Edge Certificates: "Always Use HTTPS" enabled
#    - HSTS: Enabled with max-age=31536000
#    - Minimum TLS Version: TLS 1.2
```

#### **Option B: Using Traditional DNS**

```bash
# 1. Add DNS records in your domain registrar:
#    - A record: @ -> your-server-ip
#    - A record: www -> your-server-ip
#    - CNAME: api -> your-server-domain

# 2. Install Let's Encrypt certificate:
sudo apt update
sudo apt install certbot nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot renew --dry-run  # Test auto-renewal
```

### **2. Server Configuration**

#### **Nginx Configuration (if using Nginx)**

```nginx
# /etc/nginx/sites-available/yourdomain.com
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.mainnet-beta.solana.com; frame-src 'none'; object-src 'none';" always;

    # Frontend
    location / {
        root /var/www/yourdomain.com/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **3. Environment Variables Setup**

#### **Production Environment File**

```bash
# Create production environment file
cat > .env.production << EOF
# Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com

# Solana Configuration
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Security
JWT_SECRET=$(openssl rand -hex 64)
JWT_EXPIRES_IN=7d

# Treasury Wallet (SECURE THIS!)
TREASURY_PRIVATE_KEY=your_secure_private_key_here

# Monitoring
LOG_DIR=/var/log/hilo-casino
ALERT_AUTH_FAILURES=5
ALERT_SUSPICIOUS_TX=3
ALERT_RATE_LIMIT=10

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
```

### **4. Treasury Key Management**

#### **Option A: AWS KMS (Recommended for Production)**

```bash
# 1. Create KMS key
aws kms create-key --description "HILO Casino Treasury Key"
aws kms create-alias --alias-name alias/hilo-casino-treasury --target-key-id <key-id>

# 2. Update server code to use KMS
# Replace direct key usage with KMS encryption/decryption
```

#### **Option B: Encrypted File (Development/Testing)**

```bash
# 1. Generate treasury key
node -e "
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const keypair = Keypair.generate();
console.log('Public Key:', keypair.publicKey.toString());
console.log('Private Key:', bs58.encode(keypair.secretKey));
"

# 2. Encrypt the private key
echo "your_private_key_here" | gpg --symmetric --armor > treasury_key.gpg

# 3. Update server to decrypt at runtime
```

### **5. Deployment Commands**

#### **Build and Deploy Frontend**

```bash
# Build production version
npm run build

# Deploy to server
rsync -avz --delete dist/ user@yourdomain.com:/var/www/yourdomain.com/
```

#### **Deploy Backend**

```bash
# Copy server files
rsync -avz --delete server/ user@yourdomain.com:/opt/hilo-casino/

# Install dependencies
ssh user@yourdomain.com "cd /opt/hilo-casino && npm install --production"

# Set up systemd service
sudo tee /etc/systemd/system/hilo-casino.service > /dev/null << EOF
[Unit]
Description=HILO Casino API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/hilo-casino
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/opt/hilo-casino/.env.production

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable hilo-casino
sudo systemctl start hilo-casino
sudo systemctl status hilo-casino
```

### **6. Security Verification**

#### **Run Security Checks**

```bash
# Run security checker
node tests/security-checker.js https://yourdomain.com

# Run all tests
npm test
npm run test:e2e

# Check SSL certificate
curl -I https://yourdomain.com
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

#### **Phantom Safety Verification**

```bash
# 1. Test wallet connection
# 2. Verify no "unsafe site" warnings
# 3. Check CSP compliance
# 4. Test transaction flow
# 5. Verify signature verification
```

---

## 🚨 **Critical Manual Tasks**

### **Tasks You Must Do Manually:**

1. **Domain Registration & DNS**
   - Register domain with trusted registrar
   - Configure DNS A/AAAA records
   - Set up CNAME for API subdomain

2. **SSL Certificate Installation**
   - Install Let's Encrypt or commercial certificate
   - Configure auto-renewal
   - Test certificate validity

3. **Treasury Key Security**
   - Generate secure treasury keypair
   - Store in KMS/HSM or encrypted storage
   - Never commit to source code
   - Set up key rotation schedule

4. **Server Hardening**
   - Configure firewall rules
   - Set up fail2ban
   - Configure log rotation
   - Set up monitoring alerts

5. **Phantom Integration Testing**
   - Test with real Phantom wallet
   - Verify no unsafe warnings
   - Test all wallet functions
   - Document any issues

---

## 📊 **Post-Deployment Monitoring**

### **Health Checks**

```bash
# API health check
curl https://yourdomain.com/api/health

# Frontend check
curl -I https://yourdomain.com

# Security check
node tests/security-checker.js https://yourdomain.com
```

### **Monitoring Setup**

```bash
# Set up log monitoring
tail -f /var/log/hilo-casino/security-*.log
tail -f /var/log/hilo-casino/alerts.log

# Set up uptime monitoring
# Use services like UptimeRobot, Pingdom, or DataDog
```

### **Alert Configuration**

```bash
# Configure alerts for:
# - Failed authentication attempts > 5
# - Suspicious transactions > 3
# - Rate limit violations > 10
# - Server downtime
# - SSL certificate expiration < 30 days
```

---

## 🆘 **Emergency Procedures**

### **If Phantom Shows "Unsafe Site" Warning:**

1. **Immediate Actions:**
   ```bash
   # Check CSP headers
   curl -I https://yourdomain.com
   
   # Verify HTTPS configuration
   openssl s_client -connect yourdomain.com:443
   
   # Check for mixed content
   node tests/security-checker.js https://yourdomain.com
   ```

2. **Common Fixes:**
   - Update CSP to allow wallet connections
   - Fix mixed content issues
   - Ensure HTTPS is properly configured
   - Remove any inline scripts/styles

3. **Contact Phantom Support:**
   - Email: support@phantom.app
   - Provide domain and issue description
   - Include security headers output

### **If Treasury Key is Compromised:**

1. **Immediate Actions:**
   - Generate new treasury keypair
   - Update environment variables
   - Restart server
   - Monitor for suspicious transactions

2. **Investigation:**
   - Check server logs
   - Review access logs
   - Audit recent transactions
   - Update security measures

---

## ✅ **Final Go-Live Checklist**

- [ ] Domain configured and resolving
- [ ] HTTPS working with valid certificate
- [ ] All security headers present
- [ ] CSP configured correctly
- [ ] Treasury key secured
- [ ] Rate limiting enabled
- [ ] Monitoring configured
- [ ] All tests passing
- [ ] Phantom integration tested
- [ ] No "unsafe site" warnings
- [ ] Backup procedures in place
- [ ] Emergency contacts configured
- [ ] Documentation updated
- [ ] Team trained on procedures

---

## 📞 **Support Contacts**

- **Phantom Support:** support@phantom.app
- **Solana Documentation:** https://docs.solana.com/
- **Security Issues:** security@yourdomain.com
- **Technical Support:** support@yourdomain.com

---

**🎉 Once all items are checked, your Solana wallet integration is ready for production!**
