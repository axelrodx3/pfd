# 🎛️ HILO Casino Admin Runbook

This guide provides step-by-step procedures for managing the HILO Casino payment system, including withdrawal approvals, treasury management, and system monitoring.

## 🚀 Quick Start

### 1. Access Admin Panel
```bash
# Set admin public key in environment
export ADMIN_PUBLIC_KEYS="<your-wallet-public-key>"

# Start server with admin access
cd server
npm run dev
```

### 2. Authenticate as Admin
1. Connect your wallet to the frontend
2. Ensure your public key is in `ADMIN_PUBLIC_KEYS`
3. Access admin endpoints with your JWT token

## 💰 Treasury Management

### Check Treasury Balance
```bash
curl -H "Authorization: Bearer <admin-jwt-token>" \
  http://localhost:3001/api/wallet/treasury-balance
```

**Response:**
```json
{
  "lamports": 1000000000,
  "sol": 1.0,
  "address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

### Fund Treasury (Development)
```bash
# Get treasury address
TREASURY_ADDR=$(curl -s -H "Authorization: Bearer <admin-jwt-token>" \
  http://localhost:3001/api/wallet/treasury-balance | jq -r '.address')

# Airdrop SOL to treasury
solana airdrop 10 $TREASURY_ADDR
```

### Monitor Treasury Activity
```sql
-- Check recent treasury transactions
SELECT 
  type,
  amount_lamports/1e9 as amount_sol,
  balance_after_lamports/1e9 as balance_after_sol,
  created_at
FROM treasury_ledger 
ORDER BY created_at DESC 
LIMIT 20;
```

## 💸 Withdrawal Management

### View Pending Withdrawals
```bash
curl -H "Authorization: Bearer <admin-jwt-token>" \
  http://localhost:3001/api/admin/payouts/queue
```

**Response:**
```json
{
  "total_jobs": 5,
  "pending": 2,
  "processing": 1,
  "completed": 2,
  "failed": 0,
  "pending_approval": 0
}
```

### Get Detailed Withdrawal List
```sql
-- Get pending withdrawals with user details
SELECT 
  w.id,
  u.public_key,
  u.username,
  w.dest_address,
  w.amount_lamports/1e9 as amount_sol,
  w.status,
  w.created_at
FROM withdrawals w
JOIN users u ON w.user_id = u.id
WHERE w.status = 'pending'
ORDER BY w.created_at ASC;
```

### Approve Withdrawal
```bash
# Approve withdrawal by job ID
curl -X POST \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  http://localhost:3001/api/admin/payouts/1/approve
```

### Reject Withdrawal
```bash
# Reject withdrawal with reason
curl -X POST \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Suspicious activity detected"}' \
  http://localhost:3001/api/admin/payouts/1/reject
```

### Manual Withdrawal Processing
```bash
# For emergency manual processing
curl -X POST \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "<user-wallet-address>",
    "amount": 1.5
  }' \
  http://localhost:3001/api/wallet/withdraw
```

## 🎲 Game Management

### View House Statistics
```bash
curl -H "Authorization: Bearer <admin-jwt-token>" \
  http://localhost:3001/api/admin/house/stats
```

**Response:**
```json
{
  "totalGames": 1250,
  "totalWagered": 45.5,
  "totalPaidOut": 42.3,
  "totalHouseFees": 3.2,
  "avgHouseFee": 0.00256,
  "netProfit": 3.2
}
```

### Update House Edge
```bash
# Set house edge to 2.5%
curl -X POST \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"houseEdge": 0.025}' \
  http://localhost:3001/api/admin/house/edge
```

### View Recent Game Activity
```sql
-- Recent high-value games
SELECT 
  gp.id,
  u.public_key,
  gp.bet_amount_lamports/1e9 as bet_sol,
  gp.outcome,
  gp.won,
  gp.payout_lamports/1e9 as payout_sol,
  gp.house_fee_lamports/1e9 as fee_sol,
  gp.created_at
FROM game_plays gp
JOIN users u ON gp.user_id = u.id
WHERE gp.bet_amount_lamports > 1000000000  -- > 1 SOL
ORDER BY gp.created_at DESC
LIMIT 20;
```

## 📊 System Monitoring

### Health Check
```bash
curl http://localhost:3001/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "network": "devnet",
  "treasuryAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "services": {
    "treasury": true,
    "depositMonitor": true,
    "gameService": true,
    "payoutService": true
  }
}
```

### Database Health
```sql
-- Check database integrity
PRAGMA integrity_check;

-- Check table sizes
SELECT 
  name,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=m.name) as row_count
FROM sqlite_master m
WHERE type='table';
```

### Service Status
```bash
# Check deposit monitor status
curl -H "Authorization: Bearer <admin-jwt-token>" \
  http://localhost:3001/api/admin/deposit-monitor/status

# Check payout service status
curl -H "Authorization: Bearer <admin-jwt-token>" \
  http://localhost:3001/api/admin/payout-service/status
```

## 🚨 Emergency Procedures

### System Outage
1. **Stop all services**
   ```bash
   # Stop payout processing
   curl -X POST -H "Authorization: Bearer <admin-jwt-token>" \
     http://localhost:3001/api/admin/payout-service/stop
   
   # Stop deposit monitoring
   curl -X POST -H "Authorization: Bearer <admin-jwt-token>" \
     http://localhost:3001/api/admin/deposit-monitor/stop
   ```

2. **Check system status**
   ```bash
   curl http://localhost:3001/api/health
   ```

3. **Review logs**
   ```bash
   tail -f server/logs/application.log
   ```

### Suspected Security Breach
1. **Immediately disable on-chain transactions**
   ```bash
   # Update environment
   export ALLOW_ONCHAIN=false
   
   # Restart services
   pm2 restart hilo-casino
   ```

2. **Review audit logs**
   ```sql
   -- Check recent admin actions
   SELECT * FROM audit_log 
   WHERE action LIKE '%admin%' 
   ORDER BY created_at DESC 
   LIMIT 50;
   ```

3. **Check for unauthorized withdrawals**
   ```sql
   -- Check recent withdrawals
   SELECT * FROM withdrawals 
   WHERE created_at > datetime('now', '-1 hour')
   ORDER BY created_at DESC;
   ```

### Database Corruption
1. **Stop all services**
2. **Restore from backup**
   ```bash
   cp backup/hilo_casino.db data/hilo_casino.db
   ```
3. **Verify integrity**
   ```sql
   PRAGMA integrity_check;
   ```
4. **Restart services**

## 🔧 Maintenance Tasks

### Daily Tasks
- [ ] Check treasury balance
- [ ] Review pending withdrawals
- [ ] Monitor error rates
- [ ] Check deposit confirmations

### Weekly Tasks
- [ ] Review house statistics
- [ ] Check payout queue health
- [ ] Update security patches
- [ ] Backup database

### Monthly Tasks
- [ ] Rotate JWT secrets
- [ ] Review audit logs
- [ ] Update dependencies
- [ ] Security assessment

## 📈 Performance Optimization

### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_signature ON deposits(signature);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_game_plays_user_id ON game_plays(user_id);
CREATE INDEX IF NOT EXISTS idx_game_plays_created_at ON game_plays(created_at);
```

### Service Optimization
```bash
# Increase payout processing frequency
curl -X POST \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"intervalMs": 15000}' \
  http://localhost:3001/api/admin/payout-service/interval
```

## 🚀 Deployment Procedures

### Production Deployment
1. **Pre-deployment checks**
   ```bash
   # Run tests
   npm test
   
   # Security audit
   npm audit
   
   # Check environment
   env | grep -E "(SOLANA|TREASURY|KMS)"
   ```

2. **Deploy services**
   ```bash
   # Deploy backend
   pm2 deploy production
   
   # Deploy frontend
   npm run build
   rsync -av dist/ production-server:/var/www/hilo-casino/
   ```

3. **Verify deployment**
   ```bash
   curl https://api.hilo-casino.com/health
   ```

### Rollback Procedures
1. **Stop services**
   ```bash
   pm2 stop hilo-casino
   ```

2. **Restore previous version**
   ```bash
   pm2 deploy production --revert
   ```

3. **Restart services**
   ```bash
   pm2 start hilo-casino
   ```

## 📞 Support Contacts

### Internal Team
- **DevOps**: devops@hilo-casino.com
- **Security**: security@hilo-casino.com
- **Emergency**: +1-555-ADMIN-HELP

### External Resources
- **Solana Support**: https://solana.com/developers
- **AWS Support**: Enterprise support plan
- **Database Support**: PostgreSQL documentation

---

**Remember**: Always test procedures in development before applying to production. Keep this runbook updated as the system evolves.
