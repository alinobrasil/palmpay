# PalmPay Deployment Guide

## Prerequisites (REQUIRED before deploying)

### 1. Install dependencies:
```bash
cd hardhat
npm install
```

### 2. Set up environment variables:
```bash
cp .env.example .env
```

**Edit `.env` with your actual values:**
- `SEPOLIA_PRIVATE_KEY` - Your deployment wallet's private key (without 0x prefix)
- `SEPOLIA_RPC_URL` - Your Alchemy or Infura RPC URL with API key
  - Example: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

### 3. Configure backend verifier address:

**Edit `ignition/parameters.json`:**

Replace the `backendVerifier` placeholder (`0x0000...`) with your actual backend wallet address:

```json
{
  "PalmPayModule": {
    "paymentToken": "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9",
    "backendVerifier": "0xYourBackendWalletAddress"  // ← REPLACE THIS
  }
}
```

**What is the backend verifier?**
- A wallet address that your backend server will use
- Only this address can call `recordCharge()` to authorize payments
- Generate a new wallet specifically for backend operations
- Keep its private key secure on your backend server

**Payment Token Addresses:**
- Sepolia (testnet): `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9` (already set)
- Mainnet: `0x6c3ea9036406852006290770BEdFcAbA0e23A0e8`

## Deployment Steps

**Default network is Sepolia**, so you can simply run:

```bash
npx hardhat ignition deploy ignition/modules/PalmPay.ts
```

Or explicitly specify network:
```bash
npx hardhat ignition deploy ignition/modules/PalmPay.ts --network sepolia
```

With custom parameters:
```bash
npx hardhat ignition deploy ignition/modules/PalmPay.ts --parameters ignition/parameters.json
```

## After Deployment

1. **Save the contract address** - Ignition will output the deployed address
2. **Update backend** with contract address
3. **Update frontend** with contract address

## Important Notes

- Default network is **Sepolia testnet**
- Never commit `.env` file to git
- Use a separate wallet for backend verifier
- Contract addresses go in `ignition/parameters.json`, NOT in `.env`
