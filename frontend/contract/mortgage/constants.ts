/**
 * Mortgage Contract Constants and Configuration
 */

export const MORTGAGE_CHAINS = {
  MAINNET: 1,
  POLYGON: 137,
  SEPOLIA: 11155111
} as const

export const MORTGAGE_CONTRACT_ADDRESSES = {
  [MORTGAGE_CHAINS.MAINNET]: '0x...', // TODO: Add actual mainnet contract address
  [MORTGAGE_CHAINS.POLYGON]: '0x...', // TODO: Add actual polygon contract address
  [MORTGAGE_CHAINS.SEPOLIA]: '0x...' // TODO: Add actual sepolia contract address
} as const

export const USDT_TOKEN_ADDRESSES = {
  [MORTGAGE_CHAINS.MAINNET]: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT on Ethereum
  [MORTGAGE_CHAINS.POLYGON]: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT on Polygon
  [MORTGAGE_CHAINS.SEPOLIA]: '0x...' // TODO: Add USDT on Sepolia
} as const

export const MORTGAGE_CONFIG = {
  // Investment thresholds (in USDT, with 6 decimals)
  MIN_INVESTMENT: 100n * 10n**6n, // 100 USDT
  MAX_INVESTMENT: 10000n * 10n**6n, // 10,000 USDT

  // Funding stages
  FUNDING_STAGES: {
    INITIAL: 0,
    UNDERWRITING: 1,
    FUNDING: 2,
    ACTIVE: 3,
    COMPLETED: 4
  } as const,

  // Gas limits for different operations
  GAS_LIMITS: {
    INVEST: 300000n,
    APPROVE: 100000n,
    WITHDRAW: 250000n,
    UPDATE_STATUS: 150000n
  } as const,

  // Price feeds
  PRICE_FEEDS: {
    ETH_USD: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // Chainlink ETH/USD feed
    USDT_USD: '0x3E7d1eAB13ad0104d2750B8867b8904772907f10' // Chainlink USDT/USD feed
  } as const
}

// ERC20 ABI (minimal for USDT operations)
export const ERC20_ABI = [
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'spender', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' }
    ],
    name: 'Approval',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' }
    ],
    name: 'Transfer',
    type: 'event'
  }
] as const

// Mortgage Contract ABI
export const MORTGAGE_CONTRACT_ABI = [
  // Read functions
  {
    inputs: [],
    name: 'getTotalInvested',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getFundingStage',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getTotalShares',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'investor', type: 'address' }],
    name: 'getInvestorShares',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'investor', type: 'address' }],
    name: 'getInvestmentDetails',
    outputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'shares', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getMortgageDetails',
    outputs: [
      { name: 'propertyValue', type: 'uint256' },
      { name: 'loanAmount', type: 'uint256' },
      { name: 'interestRate', type: 'uint256' },
      { name: 'loanTerm', type: 'uint256' },
      { name: 'fundingTarget', type: 'uint256' },
      { name: 'fundingDeadline', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'usdtToken',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },

  // Write functions
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'invest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'approveUSDT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'investor', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'shares', type: 'uint256' }
    ],
    name: 'Invested',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'oldStage', type: 'uint8' },
      { indexed: false, name: 'newStage', type: 'uint8' }
    ],
    name: 'FundingStageChanged',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'investor', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ],
    name: 'Withdrawn',
    type: 'event'
  }
] as const

// Helper function to get contract address for current chain
export function getMortgageContractAddress(chainId: number): string {
  return MORTGAGE_CONTRACT_ADDRESSES[chainId as keyof typeof MORTGAGE_CONTRACT_ADDRESSES] || ''
}

// Helper function to get USDT address for current chain
export function getUSDTTokenAddress(chainId: number): string {
  return USDT_TOKEN_ADDRESSES[chainId as keyof typeof USDT_TOKEN_ADDRESSES] || ''
}

// Helper function to check if chain is supported
export function isSupportedChain(chainId: number): boolean {
  return Object.values(MORTGAGE_CHAINS).includes(chainId as typeof MORTGAGE_CHAINS[keyof typeof MORTGAGE_CHAINS])
}

// Helper function to format USDT amount (6 decimals)
export function formatUSDT(amount: bigint | number): string {
  const value = typeof amount === 'number' ? BigInt(amount) : amount
  return (Number(value) / 1_000_000).toFixed(6)
}

// Helper function to parse USDT amount (6 decimals)
export function parseUSDT(amount: string): bigint {
  return BigInt(Math.floor(parseFloat(amount) * 1_000_000))
}

// Helper function to validate investment amount
export function validateInvestmentAmount(amount: bigint): { valid: boolean; error?: string } {
  if (amount < MORTGAGE_CONFIG.MIN_INVESTMENT) {
    return {
      valid: false,
      error: `Minimum investment is ${formatUSDT(MORTGAGE_CONFIG.MIN_INVESTMENT)} USDT`
    }
  }

  if (amount > MORTGAGE_CONFIG.MAX_INVESTMENT) {
    return {
      valid: false,
      error: `Maximum investment is ${formatUSDT(MORTGAGE_CONFIG.MAX_INVESTMENT)} USDT`
    }
  }

  return { valid: true }
}