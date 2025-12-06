import { vi, ref } from 'vitest'

// Mock Vue composables
vi.mock('@wagmi/vue', () => ({
  useAccount: () => ({
    address: ref('0x1234567890123456789012345678901234567890'),
    isConnected: ref(true),
    chain: ref({ id: 1, name: 'Ethereum' }),
    chainId: ref(1)
  }),
  useReadContract: vi.fn(),
  useWriteContract: () => ({
    writeContractAsync: vi.fn(),
    isPending: ref(false),
    error: ref(null)
  }),
  useWaitForTransactionReceipt: vi.fn(),
  useSwitchChain: vi.fn(),
  useBalance: () => ({
    data: ref({ value: 1000000000n }), // 1000 USDT
    error: ref(null),
    refetch: vi.fn()
  })
}))

// Mock viem
vi.mock('viem', () => ({
  parseEther: (value: string) => BigInt(parseFloat(value) * 1e18),
  formatEther: (value: bigint) => (Number(value) / 1e18).toString(),
  zeroAddress: '0x0000000000000000000000000000000000000000'
}))

// Mock structured error
vi.mock('~/types/errors', () => ({
  StructuredMortgageError: class {
    constructor(
      public category: string,
      public code: string,
      public message: string,
      public userMessage?: string,
      public severity?: any,
      public context?: any
    ) {}
  },
  MortgageErrorHandler: class {},
  MortgageErrorSeverity: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH'
  }
}))

// Mock constants
vi.mock('~/utils/contract/constants', () => ({
  MORTGAGE_CONFIG: {
    MIN_INVESTMENT: 100n * 10n ** 6n,
    MAX_INVESTMENT: 10000n * 10n ** 6n,
    DECIMALS: 6,
    APPROVAL_AMOUNT: BigInt(2) ** 256n - 1n,
    GAS_LIMITS: {
      INVEST: 300000n,
      APPROVE: 100000n,
      WITHDRAW: 250000n,
      UPDATE_STATUS: 150000n
    },
    PRICE_FEEDS: {
      ETH_USD: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      USDT_USD: '0x3E7d1eAB13ad0104d2750B8867b8904772907f10'
    }
  },
  FundingStage: {
    NOT_STARTED: 0,
    FUNDING: 1,
    FUNDED: 2,
    ACTIVE: 3,
    REPAID: 4
  },
  MORTGAGE_CONTRACT_ABI: [],
  ERC20_ABI: [],
  formatUSDT: (amount: bigint) => (Number(amount) / 1e6).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }),
  parseUSDT: (amount: string) => {
    const numericValue = parseFloat(amount.replace(/[^0-9.]/g, ''))
    return BigInt(Math.floor(numericValue * 1e6))
  },
  validateInvestmentAmount: (amount: bigint) => {
    if (amount < 100n * 10n ** 6n) {
      return {
        valid: false,
        error: 'Minimum investment is 100 USDT'
      }
    }
    return { valid: true }
  },
  DEFAULT_GAS_LIMIT: {
    APPROVE: 50000n,
    INVEST: 200000n,
    WITHDRAW: 150000n,
    TRANSFER: 100000n
  },
  DEFAULT_GAS_PRICE: {
    SLOW: 20n * 10n ** 9n,
    STANDARD: 30n * 10n ** 9n,
    FAST: 40n * 10n ** 9n
  }
}))

// Mock error handler
vi.mock('~/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn()
  })
}))