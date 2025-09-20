# 🛡️ HILO Casino Security Guide

This document outlines the security measures, key management, and production deployment guidelines for the HILO Casino payment system.

## 🔐 Key Management

### Development Mode (Current)
```env
# ⚠️ DEVELOPMENT ONLY - NEVER USE IN PRODUCTION
TREASURY_PRIVATE_KEY=<base64-encoded-key>
```

**Security Warnings:**
- Private keys stored in environment variables
- No encryption or key rotation
- Suitable only for development and testing

### Production Mode (Required)

#### AWS KMS + Secrets Manager
```bash
# 1. Create KMS key
aws kms create-key \
  --description "HILO Casino Treasury Key" \
  --key-usage ENCRYPT_DECRYPT \
  --key-spec SYMMETRIC_DEFAULT

# 2. Create alias
aws kms create-alias \
  --alias-name alias/hilo-casino-treasury \
  --target-key-id <key-id>

# 3. Store encrypted private key
aws secretsmanager create-secret \
  --name "hilo-casino/treasury-key" \
  --description "Encrypted treasury private key" \
  --secret-string '{"encryptedPrivateKey":"<encrypted-key>"}'
```

#### GCP KMS + Secret Manager
```bash
# 1. Create KMS key ring
gcloud kms keyrings create hilo-casino \
  --location global

# 2. Create key
gcloud kms keys create treasury-key \
  --keyring hilo-casino \
  --location global \
  --purpose encryption

# 3. Store encrypted secret
gcloud secrets create treasury-private-key \
  --data-file=- <<< '{"encryptedPrivateKey":"<encrypted-key>"}'
```

#### HashiCorp Vault
```bash
# 1. Enable KV secrets engine
vault secrets enable -path=secret kv-v2

# 2. Store encrypted key
vault kv put secret/hilo-casino/treasury \
  encrypted_private_key="<encrypted-key>"
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure session management
- **Nonce-based Auth**: Prevents replay attacks
- **Rate Limiting**: Prevents brute force attacks
- **Admin Roles**: Role-based access control

### Input Validation
- **Address Validation**: Solana address format checking
- **Amount Validation**: Min/max bet limits
- **Type Checking**: All inputs validated
- **SQL Injection Prevention**: Parameterized queries

### Transaction Security
- **Atomic Operations**: Database transactions
- **Idempotency Keys**: Prevent duplicate transactions
- **Balance Checks**: Verify sufficient funds
- **Confirmation Requirements**: Wait for blockchain confirmations

### Audit & Monitoring
- **Complete Audit Trail**: All actions logged
- **Real-time Monitoring**: Service health checks
- **Alert System**: Failed transactions, high volumes
- **Fraud Detection**: Unusual patterns flagged

## 🚨 Security Checklist

### Before Production Deployment

#### Infrastructure
- [ ] PostgreSQL database with SSL
- [ ] Redis for session storage
- [ ] Load balancer with SSL termination
- [ ] CDN for static assets
- [ ] Backup and disaster recovery

#### Key Management
- [ ] KMS integration configured
- [ ] Key rotation policy implemented
- [ ] Secrets not in environment variables
- [ ] Access logging enabled

#### Network Security
- [ ] VPC with private subnets
- [ ] Security groups configured
- [ ] WAF rules implemented
- [ ] DDoS protection enabled

#### Application Security
- [ ] All dependencies updated
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation comprehensive

#### Monitoring & Alerting
- [ ] Log aggregation configured
- [ ] Metrics collection enabled
- [ ] Alert rules defined
- [ ] Incident response plan

## 🔧 Security Configuration

### Environment Variables
```env
# Production Security Settings
NODE_ENV=production
ALLOW_ONCHAIN=true
KMS_ENABLED=true
KMS_KEY_ID=alias/hilo-casino-treasury
TREASURY_KEY_SECRET_NAME=hilo-casino/treasury-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Database Security
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true

# JWT Security
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=1h

# Admin Configuration
ADMIN_PUBLIC_KEYS=<comma-separated-list>
```

### Security Headers
```javascript
// Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.devnet.solana.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))
```

## 🚨 Incident Response

### Security Incident Procedures

#### 1. Detection
- Monitor logs for suspicious activity
- Set up alerts for failed transactions
- Watch for unusual betting patterns
- Monitor treasury balance changes

#### 2. Response
```bash
# Immediate actions
1. Stop all on-chain transactions
2. Review recent transactions
3. Check for unauthorized access
4. Notify security team

# Investigation
1. Analyze audit logs
2. Check database integrity
3. Verify key security
4. Review access logs
```

#### 3. Recovery
```bash
# If keys compromised
1. Rotate all keys immediately
2. Update KMS configuration
3. Redeploy with new keys
4. Monitor for suspicious activity

# If database compromised
1. Restore from backup
2. Verify data integrity
3. Update all passwords
4. Review access controls
```

## 🔍 Security Testing

### Automated Security Tests
```bash
# Run security audit
npm audit

# Check for vulnerabilities
npm audit --audit-level moderate

# Test rate limiting
curl -X POST http://localhost:3001/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"publicKey":"test"}' \
  --max-time 1

# Test input validation
curl -X POST http://localhost:3001/api/games/play \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid" \
  -d '{"betAmount":"invalid","selectedSide":"invalid"}'
```

### Manual Security Testing
1. **Authentication Bypass**: Try accessing protected endpoints
2. **SQL Injection**: Test input fields with SQL commands
3. **XSS Testing**: Inject script tags in input fields
4. **CSRF Testing**: Test cross-site request forgery
5. **Rate Limiting**: Test with high request volumes

## 📊 Security Metrics

### Key Performance Indicators
- **Failed Authentication Rate**: < 1%
- **Transaction Success Rate**: > 99%
- **Response Time**: < 200ms
- **Uptime**: > 99.9%

### Security Metrics
- **Audit Log Coverage**: 100%
- **Vulnerability Scan**: Weekly
- **Penetration Testing**: Quarterly
- **Security Training**: Annually

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] All security tests passing
- [ ] KMS integration tested
- [ ] Database migrations complete
- [ ] SSL certificates valid
- [ ] Monitoring configured
- [ ] Backup procedures tested

### Deployment Steps
```bash
# 1. Deploy infrastructure
terraform apply

# 2. Configure secrets
aws secretsmanager update-secret \
  --secret-id hilo-casino/treasury-key \
  --secret-string '{"encryptedPrivateKey":"<encrypted>"}'

# 3. Deploy application
docker build -t hilo-casino .
docker run -d --env-file .env.production hilo-casino

# 4. Verify deployment
curl https://api.hilo-casino.com/health
```

### Post-deployment Verification
1. Test all API endpoints
2. Verify KMS integration
3. Check audit logging
4. Test withdrawal flow
5. Monitor error rates

## 📞 Security Contacts

### Internal Team
- **Security Lead**: security@hilo-casino.com
- **DevOps Team**: devops@hilo-casino.com
- **Emergency**: +1-555-SECURITY

### External Resources
- **Solana Security**: security@solana.com
- **AWS Support**: Enterprise support plan
- **Security Audit**: Third-party auditor

## 🔄 Security Updates

### Regular Updates
- **Dependencies**: Weekly
- **Security Patches**: Immediately
- **Key Rotation**: Quarterly
- **Security Review**: Annually

### Emergency Updates
- **Critical Vulnerabilities**: Within 24 hours
- **Security Incidents**: Immediate response
- **Regulatory Changes**: Within 30 days

---

**Remember**: Security is an ongoing process, not a one-time setup. Regular reviews, updates, and testing are essential for maintaining a secure system.
