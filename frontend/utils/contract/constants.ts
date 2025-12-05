/**
 * Contract constants and configuration for Mortgage House
 */

// Contract configuration
export const MORTGAGE_CONFIG = {
  MIN_INVESTMENT: 100n * 10n ** 6, // 100 USDT minimum
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

// Mortgage Contract ABI (mock - will be updated with actual ABI)
export const MORTGAGE_CONTRACT_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'totalInvested',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'fundingStage',
    outputs: [{ name: '', type: 'uint8' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'totalShares',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: 'investor', type: 'address' }],
    name: 'investorShares',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'invest',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [],
    name: 'withdrawPayout',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'mortgageDetails',
    outputs: [
      { name: 'propertyValue', type: 'uint256' },
      { name: 'loanAmount', type: 'uint256' },
      { name: 'interestRate', type: 'uint256' },
      { name: 'loanTerm', type: 'uint256' },
      { name: 'fundingTarget', type: 'uint256' },
      { name: 'fundingDeadline', type: 'uint256' }
    ],
    payable: false,
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
  TRANSFER: 'Transfer(address from, address to, uint256 value)'
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