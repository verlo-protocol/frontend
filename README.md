# Verlo Frontend

Clean, minimal frontend for the Verlo platform. Built with React + Vite + ethers.js.

## Features

- Connect MetaMask or Coinbase Wallet
- Auto-switch to Base Sepolia network
- Live KYC status from `KYCRegistry` contract
- Live token balance from `SecurityToken` contract
- Live platform stats from `DvPSettlement` contract
- Clean blue and white Apple-style UI
- Fully responsive

## Setup

```bash
cd verlo-frontend
npm install
npm run dev
```

Opens at `http://localhost:3000`.

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Follow the prompts. Done in 60 seconds.

## Contracts (Base Sepolia)

- KYCRegistry: `0xab634e36Fa5adc9eB60021d0f2dcC9299cC5c572`
- SecurityToken: `0xFEA2A98bb8b387Fd1C9509ccDf42476ABf037761`
- DvPSettlement: `0xBE857F0d91d1ff276EAc74e81E57f90D5F0511A2`
