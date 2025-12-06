/**
 * Mortgage Error Type System
 * Provides structured error handling for mortgage-related operations
 * Follows architecture specification: {scope: 'CONTRACT'|'FRONTEND'|'NETWORK', type: string, code?: string, message: string}
 */

export type ErrorScope = 'CONTRACT' | 'FRONTEND' | 'NETWORK'

// Contract Error Types
export const CONTRACT_ERROR_TYPES = {
  INVALID_STAGE: 'INVALID_STAGE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INSUFFICIENT_SHARES: 'INSUFFICIENT_SHARES',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  CONTRACT_PAUSED: 'CONTRACT_PAUSED',
  REENTRANCY_DETECTED: 'REENTRANCY_DETECTED',
  MATH_OVERFLOW: 'MATH_OVERFLOW',
  INSUFFICIENT_ALLOWANCE: 'INSUFFICIENT_ALLOWANCE'
} as const

// Frontend Error Types
export const FRONTEND_ERROR_TYPES = {
  INVALID_INPUT: 'INVALID_INPUT',
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  WRONG_NETWORK: 'WRONG_NETWORK',
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  MISSING_PARAMETERS: 'MISSING_PARAMETERS',
  FORM_VALIDATION_ERROR: 'FORM_VALIDATION_ERROR',
  WALLET_CONNECTION_FAILED: 'WALLET_CONNECTION_FAILED',
  USER_REJECTED_TRANSACTION: 'USER_REJECTED_TRANSACTION',
  TRANSACTION_CANCELLED: 'TRANSACTION_CANCELLED',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const

// Network Error Types
export const NETWORK_ERROR_TYPES = {
  NETWORK_CONNECTION_ERROR: 'NETWORK_CONNECTION_ERROR',
  RPC_TIMEOUT: 'RPC_TIMEOUT',
  NODE_UNAVAILABLE: 'NODE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NETWORK_SWITCH_REQUIRED: 'NETWORK_SWITCH_REQUIRED',
  GAS_PRICE_ERROR: 'GAS_PRICE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RPC_ERROR: 'RPC_ERROR',
  FETCHING_CONTRACT_DATA_FAILED: 'FETCHING_CONTRACT_DATA_FAILED',
  INVALID_CONTRACT_DATA: 'INVALID_CONTRACT_DATA'
} as const

export type ContractErrorType = typeof CONTRACT_ERROR_TYPES[keyof typeof CONTRACT_ERROR_TYPES]
export type FrontendErrorType = typeof FRONTEND_ERROR_TYPES[keyof typeof FRONTEND_ERROR_TYPES]
export type NetworkErrorType = typeof NETWORK_ERROR_TYPES[keyof typeof NETWORK_ERROR_TYPES]
export type ErrorType = ContractErrorType | FrontendErrorType | NetworkErrorType

export interface MortgageError {
  scope: ErrorScope
  type: ErrorType
  code?: string
  message: string
}

export enum MortgageErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface MortgageErrorContext {
  contractAddress?: string;
  functionName?: string;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  gasLimit?: string;
  amount?: string;
  userAddress?: string;
  chainId?: number;
  timestamp?: number;
  action?: string;
  currentChain?: number;
  balance?: string;
  required?: string;
  allowance?: string;
}

export class StructuredMortgageError implements MortgageError {
  public readonly scope: ErrorScope
  public readonly type: ErrorType
  public readonly code?: string
  public readonly message: string
  public readonly severity: MortgageErrorSeverity
  public readonly context: MortgageErrorContext
  public readonly timestamp: number
  public readonly recoverable: boolean

  constructor(
    scope: ErrorScope,
    type: ErrorType,
    message: string,
    code?: string,
    severity: MortgageErrorSeverity = MortgageErrorSeverity.MEDIUM,
    context: MortgageErrorContext = {},
    recoverable: boolean = true
  ) {
    this.scope = scope
    this.type = type
    this.code = code
    this.message = message
    this.severity = severity
    this.context = context
    this.timestamp = Date.now()
    this.recoverable = recoverable
  }

  /**
   * Create a user-friendly error message
   */
  getUserMessage(): string {
    // Return the main message which should already be user-friendly
    return this.message
  }

  /**
   * Check if error suggests retry
   */
  shouldRetry(): boolean {
    if (!this.recoverable) return false

    const retryableTypes = [
      NETWORK_ERROR_TYPES.NETWORK_CONNECTION_ERROR,
      NETWORK_ERROR_TYPES.RPC_TIMEOUT,
      NETWORK_ERROR_TYPES.NODE_UNAVAILABLE,
      NETWORK_ERROR_TYPES.RATE_LIMIT_EXCEEDED,
      NETWORK_ERROR_TYPES.GAS_PRICE_ERROR
    ]

    return retryableTypes.includes(this.type as NetworkErrorType)
  }

  /**
   * Get suggested action for user
   */
  getSuggestedAction(): string | null {
    switch (this.type) {
      case FRONTEND_ERROR_TYPES.WALLET_NOT_CONNECTED:
        return 'Connect your wallet using the wallet connect button'

      case FRONTEND_ERROR_TYPES.WRONG_NETWORK:
        return 'Switch network in your wallet to Ethereum Mainnet'

      case CONTRACT_ERROR_TYPES.INSUFFICIENT_ALLOWANCE:
        return 'Click "Approve" to allow the contract to spend your USDT'

      case CONTRACT_ERROR_TYPES.INVALID_AMOUNT:
        return 'Please enter a valid investment amount'

      case NETWORK_ERROR_TYPES.GAS_PRICE_ERROR:
        return 'Try again in a few moments when network is less congested'

      case NETWORK_ERROR_TYPES.RATE_LIMIT_EXCEEDED:
        return 'Please wait a few minutes before trying again'

      default:
        return null
    }
  }

  /**
   * Convert to plain object for logging or API responses
   */
  toJSON() {
    return {
      scope: this.scope,
      type: this.type,
      code: this.code,
      message: this.message,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
      shouldRetry: this.shouldRetry(),
      suggestedAction: this.getSuggestedAction()
    }
  }

  /**
   * Create from generic error
   */
  static fromError(error: any, context: MortgageErrorContext = {}): StructuredMortgageError {
    // If it's already a StructuredMortgageError, return as is
    if (error instanceof StructuredMortgageError) {
      return error
    }

    // Handle MetaMask errors
    if (error.code === 4001) {
      return new StructuredMortgageError(
        'FRONTEND',
        FRONTEND_ERROR_TYPES.USER_REJECTED_TRANSACTION,
        'Transaction was cancelled in your wallet',
        error.code?.toString(),
        MortgageErrorSeverity.LOW,
        context
      )
    }

    if (error.code === -32603) {
      return new StructuredMortgageError(
        'NETWORK',
        NETWORK_ERROR_TYPES.RPC_ERROR,
        'Network request failed. Please try again.',
        error.code?.toString(),
        MortgageErrorSeverity.HIGH,
        context
      )
    }

    // Handle network errors
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return new StructuredMortgageError(
        'NETWORK',
        NETWORK_ERROR_TYPES.NETWORK_CONNECTION_ERROR,
        'Network connection error. Please check your internet connection and try again',
        error.code?.toString(),
        MortgageErrorSeverity.MEDIUM,
        context
      )
    }

    // Handle timeout errors
    if (error.message?.includes('timeout')) {
      return new StructuredMortgageError(
        'NETWORK',
        NETWORK_ERROR_TYPES.RPC_TIMEOUT,
        'Request timed out. Please try again.',
        error.code?.toString(),
        MortgageErrorSeverity.MEDIUM,
        context
      )
    }

    // Handle contract revert errors
    if (error.message?.includes('revert')) {
      return new StructuredMortgageError(
        'CONTRACT',
        CONTRACT_ERROR_TYPES.INVALID_AMOUNT,
        'Transaction failed. Please check your input and try again.',
        error.code?.toString(),
        MortgageErrorSeverity.HIGH,
        context
      )
    }

    // Handle insufficient funds
    if (error.message?.includes('insufficient funds') || error.message?.includes('transfer amount exceeds balance')) {
      return new StructuredMortgageError(
        'CONTRACT',
        CONTRACT_ERROR_TYPES.INSUFFICIENT_FUNDS,
        'You do not have enough USDT tokens for this transaction.',
        error.code?.toString(),
        MortgageErrorSeverity.MEDIUM,
        context
      )
    }

    // Handle insufficient allowance
    if (error.message?.includes('insufficient allowance')) {
      return new StructuredMortgageError(
        'CONTRACT',
        CONTRACT_ERROR_TYPES.INSUFFICIENT_ALLOWANCE,
        'Please approve USDT spending first before continuing.',
        error.code?.toString(),
        MortgageErrorSeverity.MEDIUM,
        context
      )
    }

    // Default fallback
    return new StructuredMortgageError(
      'FRONTEND',
      FRONTEND_ERROR_TYPES.VALIDATION_ERROR,
      error.message || 'An unexpected error occurred. Please try again.',
      error.code?.toString(),
      MortgageErrorSeverity.MEDIUM,
      context
    )
  }
}

/**
 * Contract error translation mapping dictionary
 * Maps technical contract errors to user-friendly messages
 */
export const CONTRACT_ERROR_MAP: Record<string, Omit<MortgageError, 'code'>> = {
  // Investment errors
  'ERC20: transfer amount exceeds balance': {
    scope: 'CONTRACT',
    type: CONTRACT_ERROR_TYPES.INSUFFICIENT_FUNDS,
    message: 'You do not have enough USDT tokens for this investment.'
  },
  'ERC20: insufficient allowance': {
    scope: 'CONTRACT',
    type: CONTRACT_ERROR_TYPES.INSUFFICIENT_ALLOWANCE,
    message: 'Please approve USDT spending first before investing.'
  },
  'ERC20: transfer amount must be greater than zero': {
    scope: 'CONTRACT',
    type: CONTRACT_ERROR_TYPES.INVALID_AMOUNT,
    message: 'Investment amount must be greater than zero.'
  },

  // Stage-based errors
  'Contract not in funding stage': {
    scope: 'CONTRACT',
    type: CONTRACT_ERROR_TYPES.INVALID_STAGE,
    message: 'This investment opportunity is no longer available.'
  },
  'Invalid stage for operation': {
    scope: 'CONTRACT',
    type: CONTRACT_ERROR_TYPES.INVALID_STAGE,
    message: 'This operation is not available in the current stage.'
  },

  // Permission errors
  'Caller is not operator': {
    scope: 'CONTRACT',
    type: CONTRACT_ERROR_TYPES.UNAUTHORIZED,
    message: 'Only authorized operators can perform this action.'
  },
  'Ownable: caller is not the owner': {
    scope: 'CONTRACT',
    type: CONTRACT_ERROR_TYPES.UNAUTHORIZED,
    message: 'Only the contract owner can perform this action.'
  },

  // Share errors
  'Insufficient shares': {
    scope: 'CONTRACT',
    type: CONTRACT_ERROR_TYPES.INSUFFICIENT_SHARES,
    message: 'You do not have enough shares for this withdrawal.'
  },
  'Transfer amount exceeds balance': {
    scope: 'CONTRACT',
    type: CONTRACT_ERROR_TYPES.INSUFFICIENT_SHARES,
    message: 'You do not have enough shares to transfer.'
  },

  // Amount validation errors
  'Amount must be greater than zero': {
    scope: 'CONTRACT',
    type: CONTRACT_ERROR_TYPES.INVALID_AMOUNT,
    message: 'Amount must be greater than zero.'
  },
  'Amount exceeds maximum': {
    scope: 'CONTRACT',
    type: CONTRACT_ERROR_TYPES.INVALID_AMOUNT,
    message: 'Amount exceeds the maximum allowed limit.'
  },

  // Contract state errors
  'Contract is paused': {
    scope: 'CONTRACT',
    type: CONTRACT_ERROR_TYPES.CONTRACT_PAUSED,
    message: 'Contract is currently paused. Please try again later.'
  },
  'ReentrancyGuard: reentrant call': {
    scope: 'CONTRACT',
    type: CONTRACT_ERROR_TYPES.REENTRANCY_DETECTED,
    message: 'Security alert: Reentrancy detected. Transaction rejected.'
  },

  // Math errors
  'Math: overflow': {
    scope: 'CONTRACT',
    type: CONTRACT_ERROR_TYPES.MATH_OVERFLOW,
    message: 'Calculation overflow detected. Please use a smaller amount.'
  },
  'Math: underflow': {
    scope: 'CONTRACT',
    type: CONTRACT_ERROR_TYPES.MATH_OVERFLOW,
    message: 'Calculation error detected. Please check your inputs.'
  }
}

/**
 * Error handler utility class
 */
export class MortgageErrorHandler {
  /**
   * Handle async function with try-catch and convert errors
   */
  static async handleAsync<T>(
    asyncFn: () => Promise<T>,
    context: MortgageErrorContext = {}
  ): Promise<[T | null, StructuredMortgageError | null]> {
    try {
      const result = await asyncFn()
      return [result, null]
    } catch (error) {
      const mortgageError = StructuredMortgageError.fromError(error, context)
      return [null, mortgageError]
    }
  }

  /**
   * Log error for debugging
   */
  static log(error: StructuredMortgageError, extra?: Record<string, any>): void {
    console.error('MortgageError:', {
      ...error.toJSON(),
      ...extra
    })
  }

  /**
   * Check if error should be reported to monitoring service
   */
  static shouldReport(error: StructuredMortgageError): boolean {
    return error.severity === MortgageErrorSeverity.CRITICAL ||
           error.severity === MortgageErrorSeverity.HIGH
  }

  /**
   * Translate contract error message to user-friendly format
   */
  static translateContractError(errorMessage: string): Omit<MortgageError, 'code'> | null {
    // Check for exact matches first
    if (CONTRACT_ERROR_MAP[errorMessage]) {
      return CONTRACT_ERROR_MAP[errorMessage]
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(CONTRACT_ERROR_MAP)) {
      if (errorMessage.includes(key)) {
        return value
      }
    }

    // Fallback to generic contract error
    return {
      scope: 'CONTRACT',
      type: CONTRACT_ERROR_TYPES.INVALID_AMOUNT,
      message: 'Transaction failed. Please check your inputs and try again.'
    }
  }

  /**
   * Create structured error from contract error message
   */
  static fromContractError(
    errorMessage: string,
    code?: string,
    context: MortgageErrorContext = {}
  ): StructuredMortgageError {
    const translated = this.translateContractError(errorMessage)

    if (translated) {
      return new StructuredMortgageError(
        translated.scope,
        translated.type,
        translated.message,
        code,
        MortgageErrorSeverity.HIGH,
        context
      )
    }

    // Fallback
    return new StructuredMortgageError(
      'CONTRACT',
      CONTRACT_ERROR_TYPES.INVALID_AMOUNT,
      errorMessage,
      code,
      MortgageErrorSeverity.HIGH,
      context
    )
  }
}

// Create type alias for backward compatibility
export type MortgageError = StructuredMortgageError