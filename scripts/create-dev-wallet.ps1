# Create Development Wallet Script (Windows PowerShell)
# Generates a new Solana keypair for development and funds it on Devnet

Write-Host "🔑 Creating development wallet..." -ForegroundColor Green

# Create wallet directory if it doesn't exist
if (!(Test-Path "wallets")) {
    New-Item -ItemType Directory -Path "wallets"
    Write-Host "Created wallets directory" -ForegroundColor Yellow
}

# Generate new keypair
Write-Host "Generating new Solana keypair..." -ForegroundColor Yellow
solana-keygen new --outfile wallets/house-wallet.json --no-bip39-passphrase

# Get the public key
$PUBLIC_KEY = solana-keygen pubkey wallets/house-wallet.json
Write-Host "✅ Wallet created: $PUBLIC_KEY" -ForegroundColor Green

# Set to devnet
Write-Host "Setting Solana CLI to devnet..." -ForegroundColor Yellow
solana config set --url https://api.devnet.solana.com

# Check if we need to fund the wallet
Write-Host "Checking wallet balance..." -ForegroundColor Yellow
try {
    $BALANCE = solana balance $PUBLIC_KEY 2>$null
} catch {
    $BALANCE = "0 SOL"
}

if ($BALANCE -eq "0 SOL") {
    Write-Host "💰 Funding wallet with 10 SOL from devnet faucet..." -ForegroundColor Yellow
    solana airdrop 10 $PUBLIC_KEY
    
    # Wait a moment for the airdrop to process
    Start-Sleep -Seconds 5
    
    # Check balance again
    $BALANCE = solana balance $PUBLIC_KEY
    Write-Host "✅ Wallet funded: $BALANCE" -ForegroundColor Green
} else {
    Write-Host "✅ Wallet already has balance: $BALANCE" -ForegroundColor Green
}

# Display wallet info
Write-Host ""
Write-Host "🎯 Development Wallet Information:" -ForegroundColor Cyan
Write-Host "   Public Key: $PUBLIC_KEY" -ForegroundColor White
Write-Host "   Balance: $BALANCE" -ForegroundColor White
Write-Host "   Network: Devnet" -ForegroundColor White
Write-Host "   Keyfile: wallets/house-wallet.json" -ForegroundColor White
Write-Host ""
Write-Host "📝 Add this to your .env file:" -ForegroundColor Yellow
Write-Host "   TREASURY_PRIVATE_KEY=<base64-encoded-secret-key>" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  WARNING: This is a development wallet only!" -ForegroundColor Red
Write-Host "   Never use this key in production!" -ForegroundColor Red
Write-Host "   Keep the keyfile secure and never commit it to version control!" -ForegroundColor Red
