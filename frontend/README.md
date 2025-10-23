# PalmPay Frontend

Simple React app for PalmPay palm recognition payment system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Configuration

Before using the app, update the following placeholders in the code:

### Customer.js
- `TOKEN_ADDRESS`: Replace with your ERC20 token contract address (line 6)
- `SPENDER_ADDRESS`: Replace with the spender address for allowance (line 7)
- `API_BASE_URL`: Update if your backend API is not on localhost:8000 (line 10)

### Store.js
- `API_BASE_URL`: Update if your backend API is not on localhost:8000 (line 4)

## Features

### Customer View
- **Register Palm**: Upload a palm image, signs with wallet, and registers to backend API
- **Set Allowance**: Approve ERC20 token spending allowance

### Store View
- **Charge Customer**: Enter USD amount and charge customer via backend API

## Requirements

- MetaMask or compatible Web3 wallet
- Node.js 14+
- Backend API running on localhost:8000 (or configured URL)
