# Avail Explorer

An intuitive explorer interface for the Avail network, allowing interaction with the blockchain, visualization of statistics, and transaction management.

## Key Features

- **Network Statistics**: Real-time dashboard with Avail blockchain metrics
- **Transaction History**: View recent transactions with pagination support
- **Auto-Updates**: Data automatically refreshed at regular intervals
- **Wallet Connection**: Integration with Substrate wallets for network interaction
- **Blockchain Actions**:
  - Token transfers
  - Data submission to the network
- **Personal Transaction History**: Track your own transactions
- **Connectivity Status**: Visual indicator of network connection state

## Tech Stack

- **Next.js**: React framework for server-side rendering and static site generation
- **React Query**: Server state management and data caching
- **Zustand**: Simplified global state management
- **Tailwind CSS**: Utility-first CSS framework for rapid design
- **Zod**: TypeScript-first schema validation
- **Shadcn**: Reusable UI components
- **GraphQL**: Query language for APIs
- **avail-js-sdk**: Official SDK for Avail network interaction
- **@polkadot/api**: JavaScript library for Substrate networks
- **@polkadot/extension-dapp**: Browser extension integration for Substrate wallets

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Screenshots

### Transaction History

<img src="https://github.com/user/avail-explorer/raw/main/docs/images/transaction-history.png" width="1439" alt="Transaction History" />

### Recent Transactions

<img src="https://github.com/user/avail-explorer/raw/main/docs/images/recent-transactions.png" width="1439" alt="Recent Transactions" />

### Network Statistics

<img src="https://github.com/user/avail-explorer/raw/main/docs/images/network-statistics.png" width="1439" alt="Network Statistics" />

### Actions Panel

<img src="https://github.com/user/avail-explorer/raw/main/docs/images/actions-panel.png" width="1439" alt="Actions Panel" />
