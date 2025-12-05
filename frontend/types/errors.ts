/**
 * Mortgage Error Type System
 * Provides structured error handling for mortgage-related operations
 */

export enum MortgageErrorCode {
  // Wallet Connection Errors
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_CONNECTION_FAILED = 'WALLET_CONNECTION_FAILED',
  WRONG_CHAIN = 'WRONG_CHAIN',

  // Contract Errors
  CONTRACT_NOT_FOUND = 'CONTRACT_NOT_FOUND',
  CONTRACT_INTERACTION_FAILED = 'CONTRACT_INTERACTION_FAILED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INSUFFICIENT_ALLOWANCE = 'INSUFFICIENT_ALLOWANCE',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',

  // Investment Errors
  INVESTMENT_AMOUNT_TOO_LOW = 'INVESTMENT_AMOUNT_TOO_LOW',
  INVESTMENT_AMOUNT_TOO_HIGH = 'INVESTMENT_AMOUNT_TOO_HIGH',
  INVESTMENT_FAILED = 'INVESTMENT_FAILED',
  SHARE_ALLOCATION_FAILED = 'SHARE_ALLOCATION_FAILED',

  // Data Fetching Errors
  FETCHING_CONTRACT_DATA_FAILED = 'FETCHING_CONTRACT_DATA_FAILED',
  INVALID_CONTRACT_DATA = 'INVALID_CONTRACT_DATA',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  RPC_ERROR = 'RPC_ERROR',

  // User Interface Errors
  USER_REJECTED_TRANSACTION = 'USER_REJECTED_TRANSACTION',
  TRANSACTION_CANCELLED = 'TRANSACTION_CANCELLED',

  // Generic Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
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

export class MortgageError extends Error {
  public readonly code: MortgageErrorCode
  public readonly severity: MortgageErrorSeverity
  public readonly context: MortgageErrorContext
  public readonly timestamp: number
  public readonly recoverable: boolean

  constructor(
    code: MortgageErrorCode,
    message: string,
    severity: MortgageErrorSeverity = MortgageErrorSeverity.MEDIUM,
    context: MortgageErrorContext = {},
    recoverable: boolean = true
  ) {
    super(message)
    this.name = 'MortgageError'
    this.code = code
    this.severity = severity
    this.context = context
    this.timestamp = Date.now()
    this.recoverable = recoverable

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MortgageError)
    }
  }

  /**
   * Create a user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case MortgageErrorCode.WALLET_NOT_CONNECTED:
        return 'Please connect your wallet to continue'

      case MortgageErrorCode.WRONG_CHAIN:
        return 'Please switch to the correct network (Ethereum Mainnet)'

      case MortgageErrorCode.INSUFFICIENT_FUNDS:
        return 'You don\'t have enough funds to complete this transaction'

      case MortgageErrorCode.INSUFFICIENT_ALLOWANCE:
        return 'Please approve the contract to spend your USDT tokens first'

      case MortgageErrorCode.INVESTMENT_AMOUNT_TOO_LOW:
        return 'Minimum investment amount is 100 USDT'

      case MortgageErrorCode.INVESTMENT_AMOUNT_TOO_HIGH:
        return 'Investment amount exceeds the maximum allowed'

      case MortgageErrorCode.USER_REJECTED_TRANSACTION:
        return 'Transaction was cancelled in your wallet'

      case MortgageErrorCode.NETWORK_ERROR:
        return 'Network connection error. Please check your internet connection and try again'

      case MortgageErrorCode.TRANSACTION_FAILED:
        return 'Transaction failed. Please try again or contact support if the problem persists'

      default:
        return this.message
    }
  }

  /**
   * Check if error suggests retry
   */
  shouldRetry(): boolean {
    if (!this.recoverable) return false

    const retryableCodes = [
      MortgageErrorCode.NETWORK_ERROR,
      MortgageErrorCode.NETWORK_TIMEOUT,
      MortgageErrorCode.RPC_ERROR,
      MortgageErrorCode.RATE_LIMIT_EXCEEDED,
      MortgageErrorCode.GAS_ESTIMATION_FAILED
    ]

    return retryableCodes.includes(this.code)
  }

  /**
   * Get suggested action for user
   */
  getSuggestedAction(): string | null {
    switch (this.code) {
      case MortgageErrorCode.WALLET_NOT_CONNECTED:
        return 'Connect your wallet using the wallet connect button'

      case MortgageErrorCode.WRONG_CHAIN:
        return 'Switch network in your wallet to Ethereum Mainnet'

      case MortgageErrorCode.INSUFFICIENT_ALLOWANCE:
        return 'Click "Approve" to allow the contract to spend your USDT'

      case MortgageErrorCode.INVESTMENT_AMOUNT_TOO_LOW:
        return 'Increase your investment amount to at least 100 USDT'

      case MortgageErrorCode.GAS_ESTIMATION_FAILED:
        return 'Try again in a few moments when network is less congested'

      case MortgageErrorCode.RATE_LIMIT_EXCEEDED:
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
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.getUserMessage(),
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
      shouldRetry: this.shouldRetry(),
      suggestedAction: this.getSuggestedAction(),
      stack: this.stack
    }
  }

  /**
   * Create from generic error
   */
  static fromError(error: any, context: MortgageErrorContext = {}): MortgageError {
    // If it's already a MortgageError, return as is
    if (error instanceof MortgageError) {
      return error
    }

    // Handle MetaMask errors
    if (error.code === 4001) {
      return new MortgageError(
        MortgageErrorCode.USER_REJECTED_TRANSACTION,
        'User rejected the transaction',
        MortgageErrorSeverity.LOW,
        context
      )
    }

    if (error.code === -32603) {
      return new MortgageError(
        MortgageErrorCode.RPC_ERROR,
        'Internal JSON-RPC error',
        MortgageErrorSeverity.HIGH,
        context
      )
    }

    // Handle network errors
    if (error.message?.includes('network')) {
      return new MortgageError(
        MortgageErrorCode.NETWORK_ERROR,
        'Network connection error',
        MortgageErrorSeverity.MEDIUM,
        context
      )
    }

    // Handle contract revert errors
    if (error.message?.includes('revert')) {
      return new MortgageError(
        MortgageErrorCode.CONTRACT_INTERACTION_FAILED,
        'Contract execution reverted',
        MortgageErrorSeverity.HIGH,
        context
      )
    }

    // Default fallback
    return new MortgageError(
      MortgageErrorCode.UNKNOWN_ERROR,
      error.message || 'An unknown error occurred',
      MortgageErrorSeverity.MEDIUM,
      context
    )
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
  ): Promise<[T | null, MortgageError | null]> {
    try {
      const result = await asyncFn()
      return [result, null]
    } catch (error) {
      const mortgageError = MortgageError.fromError(error, context)
      return [null, mortgageError]
    }
  }

  /**
   * Log error for debugging
   */
  static log(error: MortgageError, extra?: Record<string, any>): void {
    console.error('MortgageError:', {
      ...error.toJSON(),
      ...extra
    })
  }

  /**
   * Check if error should be reported to monitoring service
   */
  static shouldReport(error: MortgageError): boolean {
    return error.severity === MortgageErrorSeverity.CRITICAL ||
           error.severity === MortgageErrorSeverity.HIGH
  }
}