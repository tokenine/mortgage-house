// Contract addresses (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  MORTGAGE_CONTRACT: '' as `0x${string}`, // Will be set after deployment

  // Network specific addresses
  1: { // Ethereum Mainnet
    MORTGAGE_CONTRACT: '' as `0x${string}`
  },
  137: { // Polygon
    MORTGAGE_CONTRACT: '' as `0x${string}`
  }
} as const

// Chain IDs
export const CHAIN_IDS = {
  ETHEREUM: 1,
  POLYGON: 137,
  SEPOLIA: 11155111,
  MUMBAI: 80001
} as const

// RPC URLs (these should be configured in environment variables)
export const RPC_URLS = {
  [CHAIN_IDS.ETHEREUM]: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
  [CHAIN_IDS.POLYGON]: process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
  [CHAIN_IDS.SEPOLIA]: process.env.SEPOLIA_RPC_URL || 'https://sepolia.llamarpc.com',
  [CHAIN_IDS.MUMBAI]: process.env.MUMBAI_RPC_URL || 'https://mumbai.llamarpc.com'
}

// Block explorers
export const BLOCK_EXPLORERS = {
  [CHAIN_IDS.ETHEREUM]: 'https://etherscan.io',
  [CHAIN_IDS.POLYGON]: 'https://polygonscan.com',
  [CHAIN_IDS.SEPOLIA]: 'https://sepolia.etherscan.io',
  [CHAIN_IDS.MUMBAI]: 'https://mumbai.polygonscan.com'
}

// Contract constants
export const CONTRACT_CONSTANTS = {
  // Mortgage contract constants
  MIN_INVESTMENT: parseEther('0.01'), // 0.01 ETH minimum investment
  MAX_INVESTMENT: parseEther('1000'), // 1000 ETH maximum investment

  // Stages
  STAGES: {
    INITIALIZED: 0,
    FUNDING: 1,
    ACTIVE: 2,
    COMPLETED: 3,
    DEFAULTED: 4
  } as const,

  // Interest rates (in basis points)
  INTEREST_RATE_PRECISION: 10000, // 4 decimal places

  // Time periods (in seconds)
  SECONDS_PER_DAY: 86400,
  SECONDS_PER_MONTH: 2592000, // 30 days
  SECONDS_PER_YEAR: 31536000
}

// Gas limits for transactions
export const GAS_LIMITS = {
  INVEST: 200000,
  WITHDRAW: 150000,
  APPROVE: 100000,
  DEFAULT: 100000
}

// Token decimals
export const TOKEN_DECIMALS = 18

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INSUFFICIENT_FUNDS: 'Insufficient funds for this transaction',
  INSUFFICIENT_ALLOWANCE: 'Insufficient allowance. Please approve the contract first.',
  NETWORK_NOT_SUPPORTED: 'This network is not supported',
  TRANSACTION_FAILED: 'Transaction failed',
  USER_REJECTED: 'User rejected the transaction',
  INVALID_AMOUNT: 'Invalid amount',
  INVALID_ADDRESS: 'Invalid address',
  CONTRACT_NOT_FOUND: 'Contract not found on this network',
  GAS_LIMIT_EXCEEDED: 'Gas limit exceeded',
  TIMEOUT: 'Transaction timed out',
  UNKNOWN_ERROR: 'An unknown error occurred'
}

// Success messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  TRANSACTION_SENT: 'Transaction sent successfully',
  TRANSACTION_CONFIRMED: 'Transaction confirmed',
  INVESTMENT_SUCCESS: 'Investment successful',
  WITHDRAWAL_SUCCESS: 'Withdrawal successful'
}

// Loading messages
export const LOADING_MESSAGES = {
  CONNECTING_WALLET: 'Connecting wallet...',
  PROCESSING_TRANSACTION: 'Processing transaction...',
  WAITING_CONFIRMATION: 'Waiting for confirmation...',
  LOADING_DATA: 'Loading data...'
}

// Application metadata
export const APP_METADATA = {
  NAME: 'Mortage House',
  DESCRIPTION: 'Fractional mortgage investment platform',
  VERSION: '1.0.0',
  URL: process.env.APP_URL || 'http://localhost:3000',
  ICON: '/icon.png'
}

// Supported wallets
export const SUPPORTED_WALLETS = {
  METAMASK: {
    name: 'MetaMask',
    id: 'metamask',
    icon: '/wallets/metamask.png'
  },
  WALLET_CONNECT: {
    name: 'WalletConnect',
    id: 'walletconnect',
    icon: '/wallets/walletconnect.png'
  },
  COINBASE: {
    name: 'Coinbase Wallet',
    id: 'coinbase',
    icon: '/wallets/coinbase.png'
  }
} as const

// Default chains to show in wallet
export const DEFAULT_CHAINS = [
  {
    id: CHAIN_IDS.ETHEREUM,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrl: RPC_URLS[CHAIN_IDS.ETHEREUM],
    blockExplorer: BLOCK_EXPLORERS[CHAIN_IDS.ETHEREUM]
  },
  {
    id: CHAIN_IDS.POLYGON,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: RPC_URLS[CHAIN_IDS.POLYGON],
    blockExplorer: BLOCK_EXPLORERS[CHAIN_IDS.POLYGON]
  }
]

// Environment variables validation
export const getRequiredEnvVars = () => {
  const required = ['WALLETCONNECT_PROJECT_ID']
  const missing: string[] = []

  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  return missing
}

// Parse utility
function parseEther(value: string): bigint {
  // This is a simplified version. In production, use viem's parseEther
  const [whole, fraction = '0'] = value.split('.')
  const scaledFraction = fraction.padEnd(18, '0').slice(0, 18)
  return BigInt(whole) * BigInt(10 ** 18) + BigInt(scaledFraction)
}