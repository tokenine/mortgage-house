export interface ValidationRule<T = any> {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: T) => string | undefined
  message?: string
}

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export function validateField<T = string>(
  value: T,
  rules: ValidationRule<T>
): ValidationResult {
  // Required validation
  if (rules.required && (!value || value === "")) {
    return {
      isValid: false,
      error: rules.message || "This field is required",
    }
  }

  // Skip other validations if value is empty and not required
  if (!value && value !== 0) {
    return { isValid: true }
  }

  // String validations
  if (typeof value === "string") {
    // Min length
    if (rules.min && value.length < rules.min) {
      return {
        isValid: false,
        error: rules.message || `Must be at least ${rules.min} characters`,
      }
    }

    // Max length
    if (rules.max && value.length > rules.max) {
      return {
        isValid: false,
        error: rules.message || `Must be at most ${rules.max} characters`,
      }
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return {
        isValid: false,
        error: rules.message || "Invalid format",
      }
    }
  }

  // Number validations
  if (typeof value === "number") {
    // Min value
    if (rules.min !== undefined && value < rules.min) {
      return {
        isValid: false,
        error: rules.message || `Must be at least ${rules.min}`,
      }
    }

    // Max value
    if (rules.max !== undefined && value > rules.max) {
      return {
        isValid: false,
        error: rules.message || `Must be at most ${rules.max}`,
      }
    }
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value)
    if (customError) {
      return {
        isValid: false,
        error: customError,
      }
    }
  }

  return { isValid: true }
}

// Common validation rules
export const validationRules = {
  required: { required: true },
  positiveNumber: {
    custom: (value: string | number) => {
      const num = typeof value === "string" ? parseFloat(value) : value
      if (isNaN(num) || num <= 0) {
        return "Must be a positive number"
      }
    },
  },
  usdtAmount: {
    custom: (value: string) => {
      const num = parseFloat(value)
      if (isNaN(num) || num <= 0) {
        return "Must be a valid amount"
      }
      if (num > 1000000) {
        return "Amount exceeds maximum limit"
      }
    },
  },
  sharesAmount: {
    custom: (value: string) => {
      const num = parseFloat(value)
      if (isNaN(num) || num <= 0) {
        return "Must be a valid number of shares"
      }
      if (num % 1 !== 0) {
        return "Shares must be whole numbers"
      }
    },
  },
  ethereumAddress: {
    pattern: /^0x[a-fA-F0-9]{40}$/,
    message: "Must be a valid Ethereum address",
  },
}

/**
 * Validates investment amount according to spec rules:
 * - Minimum: 1 USDT
 * - Maximum: remaining funding capacity
 * - No negative or zero values
 */
export function validateInvestmentAmount(
  amount: string | number,
  fundingCap: number,
  totalRaised: number,
  userBalance: bigint
): ValidationResult {
  // Check if amount is provided
  if (!amount || amount === "") {
    return { isValid: false, error: "Investment amount is required" }
  }

  // Convert to number for validation
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount

  // Check if amount is a valid number
  if (isNaN(numAmount)) {
    return { isValid: false, error: "Investment amount must be a valid number" }
  }

  // Check minimum amount (1 USDT)
  if (numAmount < 1) {
    return { isValid: false, error: "Minimum investment is 1 USDT" }
  }

  // Check if exceeds remaining funding
  const remaining = fundingCap - totalRaised
  if (numAmount > remaining) {
    return {
      isValid: false,
      error: `Investment amount exceeds remaining funding capacity (${remaining} USDT remaining)`,
    }
  }

  // Check if user has sufficient balance (assuming USDT with 6 decimals)
  const amountInSmallestUnit = BigInt(Math.floor(numAmount * 1e6))
  if (amountInSmallestUnit > userBalance) {
    return { isValid: false, error: "Insufficient wallet balance for this investment" }
  }

  return { isValid: true }
}

/**
 * Formats error message for display to user
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Parse contract revert errors
    if (error.message.includes("Funding Cap reached")) {
      return "Investment exceeds remaining funding capacity. Please reduce your investment amount."
    }
    if (error.message.includes("Funding closed")) {
      return "Funding period has ended for this project."
    }
    if (error.message.includes("TransferFrom failed")) {
      return "Insufficient wallet balance or token approval required."
    }
    return error.message
  }
  return String(error)
}

/**
 * Calculates maximum investable amount
 */
export function getMaxInvestableAmount(
  fundingCap: number,
  totalRaised: number,
  userBalance: bigint
): number {
  const remaining = fundingCap - totalRaised

  // Convert user balance from smallest unit (6 decimals) to USDT
  const userBalanceUSDT = Number(userBalance) / 1e6

  // Return the smaller of remaining capacity or user balance
  return Math.min(remaining, userBalanceUSDT)
}