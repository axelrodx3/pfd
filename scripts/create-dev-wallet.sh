#!/bin/bash

# Create Development Wallet Script
# Generates a new Solana keypair for development and funds it on Devnet

set -e

echo "🔑 Creating development wallet..."

# Create wallet directory if it doesn't exist
mkdir -p wallets

# Generate new keypair
echo "Generating new Solana keypair..."
solana-keygen new --outfile wallets/house-wallet.json --no-bip39-passphrase

# Get the public key
PUBLIC_KEY=$(solana-keygen pubkey wallets/house-wallet.json)
echo "✅ Wallet created: $PUBLIC_KEY"

# Set to devnet
echo "Setting Solana CLI to devnet..."
solana config set --url https://api.devnet.solana.com

# Check if we need to fund the wallet
echo "Checking wallet balance..."
BALANCE=$(solana balance $PUBLIC_KEY 2>/dev/null || echo "0 SOL")

if [[ "$BALANCE" == "0 SOL" ]]; then
    echo "💰 Funding wallet with 10 SOL from devnet faucet..."
    solana airdrop 10 $PUBLIC_KEY
    
    # Wait a moment for the airdrop to process
    sleep 5
    
    # Check balance again
    BALANCE=$(solana balance $PUBLIC_KEY)
    echo "✅ Wallet funded: $BALANCE"
else
    echo "✅ Wallet already has balance: $BALANCE"
fi

# Display wallet info
echo ""
echo "🎯 Development Wallet Information:"
echo "   Public Key: $PUBLIC_KEY"
echo "   Balance: $BALANCE"
echo "   Network: Devnet"
echo "   Keyfile: wallets/house-wallet.json"
echo ""
echo "📝 Add this to your .env file:"
echo "   TREASURY_PRIVATE_KEY=\$(cat wallets/house-wallet.json | jq -r '.secretKey | @base64')"
echo ""
echo "⚠️  WARNING: This is a development wallet only!"
echo "   Never use this key in production!"
echo "   Keep the keyfile secure and never commit it to version control!"
