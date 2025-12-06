/**
 * Contract constants and configuration for Mortgage House
 */

// Contract configuration
export const MORTGAGE_CONFIG = {
  MIN_INVESTMENT: 1n * 10n ** 6, // 1 USDT minimum (matching contract)
  MAX_INVESTMENT: 1000000n * 10n ** 6, // 1M USDT maximum
  DECIMALS: 6, // USDT has 6 decimals
  APPROVAL_AMOUNT: BigInt(2) ** 256n - 1n // Maximum approval amount
}

// Contract stages
export enum FundingStage {
  NOT_STARTED = 0,
  FUNDING = 1,
  FUNDED = 2,
  ACTIVE = 3,
  REPAID = 4
}

// USDT Token addresses (mock - will be updated with real addresses)
const USDT_ADDRESSES = {
  1: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum Mainnet
  137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' // Polygon
} as const

// Mortgage Contract addresses (mock - will be updated with real addresses)
const MORTGAGE_ADDRESSES = {
  1: '0x1234567890123456789012345678901234567890', // Ethereum Mainnet (mock)
  137: '0x1234567890123456789012345678901234567890' // Polygon (mock)
} as const

// Get USDT token address for a chain
export const getUSDTTokenAddress = (chainId: number): string => {
  return USDT_ADDRESSES[chainId as keyof typeof USDT_ADDRESSES] || USDT_ADDRESSES[1]
}

// Get mortgage contract address for a chain
export const getMortgageContractAddress = (chainId: number): string => {
  return MORTGAGE_ADDRESSES[chainId as keyof typeof MORTGAGE_ADDRESSES] || MORTGAGE_ADDRESSES[1]
}

// Check if chain is supported
export const isSupportedChain = (chainId: number): boolean => {
  return chainId === 1 || chainId === 137 // Ethereum Mainnet or Polygon
}

// USDT ABI (minimal ABI for basic operations)
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }, { name: '_spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

// Mortgage Contract ABI
export const MORTGAGE_CONTRACT_ABI = [
  // Read functions
  {
    inputs: [],
    name: 'totalFunded',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalShares',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'investorCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'repaidPrincipal',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'repaidInterest',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Epic 4.1 distribution tracking
  {
    inputs: [],
    name: 'principalRepaid',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'interestPaid',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'shares',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'stage',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getCurrentStage',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getRemainingFunding',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getFundingProgress',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'investor', type: 'address' }],
    name: 'getOwnershipPercentage',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },

  // Write functions
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'invest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'bool', name: 'principal', type: 'bool' }, { internalType: 'bool', name: 'interest', type: 'bool' }],
    name: 'withdrawPayout',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  // Epic 4.1 enhanced withdrawal functions
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'withdrawPrincipal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'withdrawInterest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'principalAmount', type: 'uint256' }, { internalType: 'uint256', name: 'interestAmount', type: 'uint256' }],
    name: 'withdrawPayout',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'sharesAmount', type: 'uint256' }],
    name: 'transferShares',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'withdrawLoan',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'depositPrincipal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'depositInterest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },

  // Placeholder functions (will throw "Not implemented yet")
  {
    inputs: [{ internalType: 'address', name: 'investor', type: 'address' }],
    name: 'getEntitledPrincipal',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'investor', type: 'address' }],
    name: 'getEntitledInterest',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'investor', type: 'address' }],
    name: 'getWithdrawablePrincipal',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'investor', type: 'address' }],
    name: 'getWithdrawableInterest',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
]

// Validation functions
export const validateInvestmentAmount = (amount: bigint): { isValid: boolean; error?: string } => {
  if (amount < MORTGAGE_CONFIG.MIN_INVESTMENT) {
    return {
      isValid: false,
      error: `Minimum investment is ${formatUSDT(MORTGAGE_CONFIG.MIN_INVESTMENT)} USDT`
    }
  }

  if (amount > MORTGAGE_CONFIG.MAX_INVESTMENT) {
    return {
      isValid: false,
      error: `Maximum investment is ${formatUSDT(MORTGAGE_CONFIG.MAX_INVESTMENT)} USDT`
    }
  }

  return { isValid: true }
}

// Format USDT amount
export const formatUSDT = (amount: bigint): string => {
  const value = Number(amount) / 10 ** MORTGAGE_CONFIG.DECIMALS
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Parse USDT amount
export const parseUSDT = (amount: string): bigint => {
  const numericValue = parseFloat(amount.replace(/[^0-9.]/g, ''))
  if (isNaN(numericValue)) {
    throw new Error('Invalid USDT amount')
  }
  return BigInt(Math.floor(numericValue * 10 ** MORTGAGE_CONFIG.DECIMALS))
}

// Transaction options
export const DEFAULT_GAS_LIMIT = {
  APPROVE: 50000n,
  INVEST: 200000n,
  WITHDRAW: 150000n,
  TRANSFER: 100000n
}

export const DEFAULT_GAS_PRICE = {
  SLOW: 20n * 10n ** 9, // 20 gwei
  STANDARD: 30n * 10n ** 9, // 30 gwei
  FAST: 40n * 10n ** 9 // 40 gwei
}

// Event signatures
export const EVENTS = {
  INVESTED: 'Invested(address investor, uint256 amount, uint256 shares)',
  WITHDRAWN: 'Withdrawn(address investor, uint256 principalAmount, uint256 interestAmount)',
  STAGE_CHANGED: 'StageChanged(uint8 oldStage, uint8 newStage)',
  APPROVAL: 'Approval(address owner, address spender, uint256 value)',
  TRANSFER: 'Transfer(address from, address to, uint256 value)',
  // Epic 4.1 distribution events
  PRINCIPAL_DEPOSITED: 'PrincipalDeposited(address from, uint256 amount, uint256 totalPrincipal, uint256 perShareAmount)',
  INTEREST_DEPOSITED: 'InterestDeposited(address from, uint256 amount, uint256 totalInterest, uint256 perShareAmount)',
  PAYOUT_WITHDRAWN: 'PayoutWithdrawn(address to, uint256 principalAmount, uint256 interestAmount)'
}

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet',
  WRONG_CHAIN: 'Please switch to a supported network (Ethereum Mainnet or Polygon)',
  INSUFFICIENT_FUNDS: 'Insufficient funds for this transaction',
  INSUFFICIENT_ALLOWANCE: 'Please approve USDT first',
  INVESTMENT_FAILED: 'Investment failed. Please try again.',
  WITHDRAWAL_FAILED: 'Withdrawal failed. Please try again.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.'
}

// Helper functions
export const calculateShares = (amount: bigint, totalInvested: bigint, totalShares: bigint): bigint => {
  if (totalInvested === 0n) return amount
  return (amount * totalShares) / totalInvested
}

export const calculateEntitlements = (
  shares: bigint,
  totalShares: bigint,
  totalRepaidPrincipal: bigint,
  totalRepaidInterest: bigint
): { principal: bigint; interest: bigint } => {
  if (totalShares === 0n) {
    return { principal: 0n, interest: 0n }
  }

  const principalShare = (shares * totalRepaidPrincipal) / totalShares
  const interestShare = (shares * totalRepaidInterest) / totalShares

  return { principal: principalShare, interest: interestShare }
}

export const getStageName = (stage: FundingStage): string => {
  const stageNames = {
    [FundingStage.NOT_STARTED]: 'Not Started',
    [FundingStage.FUNDING]: 'Funding',
    [FundingStage.FUNDED]: 'Funded',
    [FundingStage.ACTIVE]: 'Active',
    [FundingStage.REPAID]: 'Repaid'
  }

  return stageNames[stage] || 'Unknown'
}

export const canInvest = (stage: FundingStage): boolean => {
  return stage === FundingStage.FUNDING
}

export const canWithdraw = (stage: FundingStage): boolean => {
  return stage === FundingStage.ACTIVE || stage === FundingStage.REPAID
}