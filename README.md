# ZefyrSwap - DEX Aggregator on Base Network

![License](https://img.shields.io/badge/license-MIT-blue)
![Base](https://img.shields.io/badge/chain-Base-0052FF)
![Status](https://img.shields.io/badge/status-live-success)

**Best swap rates on Base - Aggregating 5 DEXes for optimal pricing** 🚀

---

## 🌐 Live Application

- **Frontend**: [https://app.zefyrswap.com](https://app.zefyrswap.com)
- **API**: [https://api.zefyrswap.com](https://api.zefyrswap.com)
- **Documentation**: [https://zefyrswap.gitbook.io/doc](https://zefyrswap.gitbook.io/doc)

---

## 📖 Overview

ZefyrSwap is a decentralized exchange aggregator built for the Base network that intelligently routes trades across five major DEXes to guarantee users the best possible swap rates. By analyzing both direct and multi-hop routes in real-time, ZefyrSwap ensures optimal pricing while minimizing gas costs and slippage.

### Supported DEXes

- **Uniswap V3** - Industry-leading concentrated liquidity
- **PancakeSwap V3** - Multi-chain DEX with deep liquidity
- **Aerodrome** - Base-native liquidity hub
- **SushiSwap V3** - Established DeFi protocol
- **Maverick V2** - Advanced dynamic liquidity (bins-based)

---

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌────────────────┐
│   Frontend  │─────▶│   API/Backend │─────▶│ Smart Contracts│
│  (React.js) │      │  (Node.js/TS) │      │   (Solidity)   │
└─────────────┘      └──────────────┘      └────────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  5 DEX       │
                     │  Adapters    │
                     └──────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   Uniswap V3         PancakeSwap V3      Aerodrome
   SushiSwap V3         Maverick V2
```

---

## ✨ Key Features

### 🎯 Intelligent Routing

- Single-hop and multi-hop route comparison
- Automatic detection of better rates through intermediate tokens (WETH, USDC)
- Mixed-DEX routing (e.g., Aerodrome → Maverick → Uniswap in one transaction)

### ⚡ Performance Optimized

- Multicall3 batching for 10x faster quote fetching
- WebSocket connectivity for lower latency
- Parallel adapter queries for sub-500ms response times
- Smart caching strategies

### 🔐 Security First

- Non-custodial architecture
- Slippage protection built-in
- All contracts verified on BaseScan
- Forked from audited Odos V2 architecture

### 💎 Maverick V2 Integration

- First aggregator with full Maverick V2 support
- Bins-based liquidity model integration
- Optimized fee conversion and routing

---

## 📦 Repository Structure

```
zefyrswap/
├── backend/              # API & aggregation logic
│   ├── src/
│   │   ├── adapters/     # DEX integrations
│   │   ├── services/     # Core aggregation
│   │   └── routes/       # API endpoints
│   └── README.md
│
├── frontend/             # React.js application
│   ├── src/
│   │   └── components/   # UI components
│   └── README.md
│
└── contracts/            # Smart contracts (private)
    └── README.md         # Contract documentation

```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure your RPC URL in .env
npm run build
npm start
```

**API will be available at:** `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Configure API URL in .env
npm start
```

**Frontend will be available at:** `http://localhost:3000`

---

## 🔗 Smart Contracts

ZefyrSwap uses a forked and enhanced version of the Odos V2 architecture.

### Deployed Addresses (Base Mainnet)

| Contract   | Address                                      | BaseScan                                                                        |
| ---------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| **Router** | `0x42091B64e249c7528227E016f889Fd2F75E6CB21` | [View](https://basescan.org/address/0x42091B64e249c7528227E016f889Fd2F75E6CB21) |

**For detailed contract documentation:** [Smart Contracts Guide](https://zefyrswap.gitbook.io/doc/overview/smart-contracts)

### Contract Architecture

**Router (Entry Point)**

- Validates swap parameters
- Handles native ETH wrapping/unwrapping
- Provides slippage protection
- Delegates execution to Executor

**Executor (Routing Engine)**

- Decodes optimized bytecode paths
- Executes swaps across multiple DEXes
- Supports single-hop and multi-hop routes
- Handles 5 different DEX protocols with unified interface

---

## 📚 Documentation

### API Documentation

Complete API reference with examples: [API Documentation](https://zefyrswap.gitbook.io/doc/api-endpoints/overview)

**Quick Example:**

```bash
curl -X POST https://api.zefyrswap.com/api/quote \
  -H "Content-Type: application/json" \
  -d '{
    "tokenIn": "0x4200000000000000000000000000000000000006",
    "tokenOut": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "amountIn": "1000000000000000000",
    "slippage": 0.5
  }'
```

### Integration Guide

Step-by-step integration instructions: [Integration Guide](https://zefyrswap.gitbook.io/doc)

### Architecture Deep Dive

Technical architecture details: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## 🛠️ Tech Stack

| Layer               | Technology                        |
| ------------------- | --------------------------------- |
| **Smart Contracts** | Solidity 0.8.8                    |
| **Backend**         | Node.js, TypeScript, Express      |
| **Frontend**        | React.js, Ethers.js, Reown AppKit |
| **Network**         | Base (Chain ID: 8453)             |
| **Deployment**      | PM2, Nginx, Let's Encrypt         |

---

## 🎨 Frontend Features

- **Modern UI/UX**: Glassmorphism effects, smooth animations, gradient designs
- **Wallet Integration**: MetaMask support with Reown AppKit
- **Real-time Updates**: Live balance and rate updates
- **Slippage Control**: Preset and custom slippage options
- **Rate Comparison**: Visual comparison across all DEXes
- **Responsive Design**: Mobile-first, works on all devices

**See:** [frontend/README.md](./frontend/README.md) for detailed features

---

## ⚙️ Backend Highlights

### Core Components

**Adapters**

- Individual DEX integration logic
- Parallel query execution
- Multicall3 optimization

**Quote Services**

- `SingleHopQuote`: Direct swap comparisons
- `MultiHopQuote`: 2-hop routing via intermediates
- `QuoteComparator`: Best route selection

**PathEncoder**

- Optimized bytecode generation
- Mixed-DEX route encoding
- Gas-efficient format

**Utilities**

- `Multicall`: Batched RPC calls (10x performance)
- `TokenHelper`: DEX ID mapping and token sorting
- `PriceCalculator`: Price impact and formatting

**See:** [backend/README.md](./backend/README.md) for technical details

---

## 🔬 Technical Innovations

### 1. Mixed-DEX Multi-Hop Routing

Supports routing through different DEXes in a single transaction:

```
USDC → (Aerodrome) → WETH → (Maverick V2) → USDbC
```

### 2. Maverick V2 Full Integration

- Complete bins-based liquidity support
- Optimized fee conversion (18-decimal to hundredths-of-a-bip)
- `tokenA/tokenB` architecture handling
- Custom callback implementation

### 3. Adaptive Route Selection

Smart algorithm that chooses between single-hop and multi-hop based on:

- Liquidity depth analysis
- Gas cost estimation
- Price impact calculation

### 4. Multicall Optimization

Reduces RPC calls from 15-20 to 2-3 per quote request, enabling sub-500ms response times.

---

## 📊 Performance Metrics

| Metric               | Value                      |
| -------------------- | -------------------------- |
| **Quote Speed**      | < 500ms average            |
| **Uptime**           | 99.9%                      |
| **Supported Routes** | 1000+ token pairs          |
| **DEXes Monitored**  | 5 protocols                |
| **Gas Savings**      | Up to 40% vs. direct swaps |

---

## 🌟 Why Base Network?

- **Low Fees**: Transactions typically < $0.01
- **Fast Finality**: Quick confirmation times
- **Growing Ecosystem**: Increasing DEX diversity
- **Ethereum Security**: Inherits L1 security
- **Developer Friendly**: EVM-compatible tooling

---

## 🤝 Contributing

We welcome contributions!

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Odos Protocol** - Router/Executor architecture inspiration
- **Base Network** - Foundation for fast, low-cost DeFi
- **DEX Partners** - Uniswap, PancakeSwap, Aerodrome, SushiSwap, Maverick

---

## 📧 Contact & Community

- **Website**: [zefyrswap.com](https://zefyrswap.com)
- **Twitter**: [@zefyrswap](https://twitter.com/zefyrswap)
- **Discord**: [Join our community](https://discord.gg/zefyrswap)
- **Email**: zefyrswap@gmail.com
- **Documentation**: [zefyrswap.gitbook.io](https://zefyrswap.gitbook.io/doc)

---

## 🗺️ Roadmap

### ✅ Completed

- [x] 5 DEX integrations
- [x] Multi-hop routing
- [x] Maverick V2 support
- [x] Production deployment
- [x] API documentation

### 🚧 In Progress

- [ ] More Network integration
- [ ] Additional DEX integrations
- [ ] Advanced analytics dashboard

### 🔮 Planned

- [ ] Limit orders
- [ ] TWAP execution
- [ ] Cross-chain aggregation

---

## ⚠️ Disclaimer

ZefyrSwap is provided "as is" without warranty. Users are responsible for:

- Understanding DeFi risks
- Setting appropriate slippage
- Reviewing transactions before signing
- Managing their own private keys

Always DYOR (Do Your Own Research) before trading.

---

**Built with ❤️ for the Base ecosystem**

_ZefyrSwap - Where liquidity meets intelligence_ ⚡
