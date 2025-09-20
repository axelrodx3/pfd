# 🎲 HILO Casino - Full Payment System Demo

This guide demonstrates the complete payment system implementation with real Solana integration, deposit monitoring, and automated payouts.

## 🚀 Quick Start Demo

### 1. Prerequisites

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Install Node.js dependencies
cd server
npm install

cd ..
npm install
```

### 2. Create Development Wallet

**Linux/Mac:**
```bash
chmod +x scripts/create-dev-wallet.sh
./scripts/create-dev-wallet.sh
```

**Windows:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\create-dev-wallet.ps1
```

### 3. Configure Environment

Create `server/.env`:
```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Treasury Wallet (from script output)
TREASURY_PRIVATE_KEY=<base64-encoded-key>

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Payment System Settings
ALLOW_ONCHAIN=false
AUTO_WITHDRAW_LIMIT_LAMPORTS=100000000
MIN_BET_LAMPORTS=1000000
MAX_BET_LAMPORTS=10000000000
HOUSE_EDGE=0.02

# Admin Configuration
ADMIN_PUBLIC_KEYS=<your-wallet-public-key>
```

### 4. Start the System

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 5. Test the Complete Flow

#### Step 1: Connect Wallet
1. Open `http://localhost:3000`
2. Click "Connect Wallet" in top-right
3. Select your wallet (Phantom, Solflare, etc.)
4. Sign the authentication message

#### Step 2: Simulate Deposit
```bash
# Get your wallet's public key from the UI, then:
curl -X POST http://localhost:3001/api/deposits/simulate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"amount": 1.0}'
```

#### Step 3: Play Games
1. Go to `/game` page
2. Place a bet (e.g., 0.1 SOL on "High")
3. Watch the provably fair outcome
4. See your balance update

#### Step 4: Request Withdrawal
```bash
curl -X POST http://localhost:3001/api/withdrawals/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "destAddress": "<your-wallet-address>",
    "amount": 0.5
  }'
```

#### Step 5: Admin Approval (if needed)
```bash
# Check payout queue
curl -H "Authorization: Bearer <admin-jwt-token>" \
  http://localhost:3001/api/admin/payouts/queue

# Approve payout
curl -X POST http://localhost:3001/api/admin/payouts/1/approve \
  -H "Authorization: Bearer <admin-jwt-token>"
```

## 🔧 API Endpoints

### User Endpoints
- `GET /api/user/balance` - Get user balance
- `POST /api/deposits/create-intent` - Create deposit address
- `POST /api/deposits/simulate` - Simulate deposit (dev only)
- `GET /api/deposits` - Get user deposits
- `POST /api/games/play` - Play dice game
- `GET /api/games/stats` - Get game statistics
- `GET /api/games/history` - Get game history
- `POST /api/withdrawals/request` - Request withdrawal
- `GET /api/withdrawals/:id` - Get withdrawal status

### Admin Endpoints
- `GET /api/admin/payouts/queue` - Get payout queue
- `POST /api/admin/payouts/:id/approve` - Approve payout
- `POST /api/admin/payouts/:id/reject` - Reject payout
- `GET /api/admin/house/stats` - Get house statistics
- `POST /api/admin/house/edge` - Update house edge

## 🛡️ Security Features

### Production Safety
- **KMS Integration**: AWS KMS + Secrets Manager for key management
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Input Validation**: All inputs validated and sanitized
- **Audit Logging**: Complete audit trail of all actions
- **Idempotency**: Prevents duplicate transactions

### Development Safety
- **Devnet Only**: Default to Solana Devnet
- **Simulation Mode**: Test without real SOL
- **Environment Warnings**: Clear warnings about dev keys
- **Auto-approval Limits**: Small withdrawals auto-approved

## 📊 Monitoring & Observability

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Database Queries
```sql
-- Check user balances
SELECT public_key, balance_lamports/1e9 as balance_sol FROM users;

-- Check recent deposits
SELECT * FROM deposits ORDER BY created_at DESC LIMIT 10;

-- Check payout queue
SELECT * FROM payout_jobs WHERE status = 'pending';

-- Check house statistics
SELECT 
  COUNT(*) as total_games,
  SUM(house_fee_lamports)/1e9 as total_fees_sol
FROM game_plays;
```

## 🚨 Safety Warnings

### ⚠️ Development Mode
- Uses SQLite database (not production-ready)
- Private keys in environment variables
- Devnet only (no real SOL)
- Simulation mode enabled

### 🚨 Production Requirements
- PostgreSQL database with connection pooling
- AWS KMS for key management
- Proper monitoring and alerting
- Rate limiting and fraud detection
- Backup and disaster recovery

## 🔄 Full Demo Script

```bash
#!/bin/bash

echo "🎲 HILO Casino Payment System Demo"
echo "=================================="

# 1. Start services
echo "1. Starting services..."
cd server && npm run dev &
SERVER_PID=$!
cd ..

npm run dev &
FRONTEND_PID=$!

# Wait for services to start
sleep 10

# 2. Create test wallet
echo "2. Creating test wallet..."
./scripts/create-dev-wallet.sh

# 3. Get wallet info
PUBLIC_KEY=$(solana-keygen pubkey wallets/house-wallet.json)
echo "Test wallet: $PUBLIC_KEY"

# 4. Authenticate
echo "3. Authenticating..."
# (Manual step - use the UI to connect wallet)

# 5. Simulate deposit
echo "4. Simulating deposit..."
# (Use the API or UI to simulate deposit)

# 6. Play games
echo "5. Playing games..."
# (Use the UI to place bets)

# 7. Request withdrawal
echo "6. Requesting withdrawal..."
# (Use the API or UI to request withdrawal)

# 8. Check status
echo "7. Checking system status..."
curl http://localhost:3001/api/health

echo "Demo complete! Check the UI at http://localhost:3000"
```

## 📈 Performance Metrics

### Expected Performance
- **Deposit Detection**: < 30 seconds
- **Game Processing**: < 1 second
- **Payout Processing**: < 60 seconds
- **Database Queries**: < 100ms

### Monitoring Alerts
- High payout queue backlog
- Failed transaction rate > 5%
- Treasury balance below threshold
- Unusual betting patterns

## 🎯 Resume Highlights

This implementation demonstrates:
- **Real Solana Integration**: Actual blockchain transactions
- **Production Architecture**: KMS, audit logging, monitoring
- **Security Best Practices**: Rate limiting, input validation
- **Scalable Design**: Queue-based processing, database transactions
- **Complete Payment Flow**: Deposit → Play → Withdraw
- **Admin Controls**: Approval workflows, house management
- **Comprehensive Testing**: Unit, integration, and E2E tests

Perfect for demonstrating full-stack blockchain development skills!
