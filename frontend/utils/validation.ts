/**
 * Frontend Validation Error System
 * Provides comprehensive validation with user-friendly error messages
 */

import type { MortgageError, MortgageErrorContext } from '~/types/errors'
import { StructuredMortgageError, MortgageErrorSeverity, FRONTEND_ERROR_TYPES } from '~/types/errors'

export interface ValidationResult {
  isValid: boolean
  error?: MortgageError
  message?: string
}

export interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
  message?: string
}

export interface FieldValidation {
  [fieldName: string]: ValidationRule
}

export interface ValidationErrorContext extends MortgageErrorContext {
  fieldName?: string
  fieldValue?: any
  validationRule?: ValidationRule
}

/**
 * Validation error message templates
 */
export const VALIDATION_ERROR_MESSAGES = {
  required: (fieldName: string) => `${fieldName} is required`,
  min: (fieldName: string, min: number) => `${fieldName} must be at least ${min}`,
  max: (fieldName: string, max: number) => `${fieldName} must not exceed ${max}`,
  minLength: (fieldName: string, minLength: number) => `${fieldName} must be at least ${minLength} characters`,
  maxLength: (fieldName: string, maxLength: number) => `${fieldName} must not exceed ${maxLength} characters`,
  pattern: (fieldName: string) => `${fieldName} format is invalid`,
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  wallet: 'Please enter a valid wallet address',
  number: 'Please enter a valid number',
  positive: 'Value must be positive',
  nonZero: 'Value cannot be zero',
  integer: 'Value must be a whole number',
  address: 'Please enter a valid blockchain address',
  url: 'Please enter a valid URL',
  date: 'Please enter a valid date',
  time: 'Please enter a valid time',
  select: 'Please select an option',
  checkbox: 'You must check this box to continue',
  file: 'Please select a valid file',
  fileSize: (maxSize: string) => `File size must not exceed ${maxSize}`,
  fileType: (types: string[]) => `File must be one of: ${types.join(', ')}`
} as const

/**
 * Investment-specific validation rules
 */
export const INVESTMENT_VALIDATION_RULES: FieldValidation = {
  amount: {
    required: true,
    min: 100,
    max: 1000000,
    pattern: /^\d+(\.\d{1,6})?$/,
    message: 'Please enter a valid investment amount between 100 and 1,000,000 USDT'
  },
  walletAddress: {
    required: true,
    pattern: /^0x[a-fA-F0-9]{40}$/,
    message: 'Please enter a valid Ethereum wallet address'
  },
  agreeToTerms: {
    required: true,
    message: 'You must agree to the terms and conditions'
  }
}

/**
 * Wallet-specific validation rules
 */
export const WALLET_VALIDATION_RULES: FieldValidation = {
  connected: {
    required: true,
    custom: (value) => {
      if (!value) return 'Wallet connection is required'
      return null
    }
  },
  correctNetwork: {
    required: true,
    custom: (value) => {
      if (!value) return 'Please switch to the correct network'
      return null
    }
  },
  balance: {
    required: true,
    min: 0,
    custom: (value) => {
      if (value !== undefined && value < 0) return 'Invalid wallet balance'
      return null
    }
  }
}

/**
 * Withdrawal-specific validation rules
 */
export const WITHDRAWAL_VALIDATION_RULES: FieldValidation = {
  amount: {
    required: true,
    min: 0.000001,
    pattern: /^\d+(\.\d{1,6})?$/,
    message: 'Please enter a valid withdrawal amount'
  },
  recipient: {
    required: true,
    pattern: /^0x[a-fA-F0-9]{40}$/,
    message: 'Please enter a valid recipient address'
  },
  hasShares: {
    required: true,
    custom: (value) => {
      if (!value || value <= 0) return 'You have no shares available for withdrawal'
      return null
    }
  }
}

/**
 * Common validation patterns
 */
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s-()]+$/,
  wallet: /^0x[a-fA-F0-9]{40}$/,
  url: /^https?:\/\/.+/,
  positiveNumber: /^[+]?\d*\.?\d+$/,
  integer: /^[+-]?\d+$/,
  percentage: /^100$|^(\d{1,2})$/
} as const

/**
 * Main validation class
 */
export class ValidationErrorHandler {
  /**
   * Validate a single field value against rules
   */
  static validateField(
    value: any,
    rules: ValidationRule,
    fieldName: string,
    context: ValidationErrorContext = {}
  ): ValidationResult {
    const errorContext: ValidationErrorContext = {
      ...context,
      fieldName,
      fieldValue: value,
      validationRule: rules
    }

    // Required validation
    if (rules.required && (value === null || value === undefined || value === '')) {
      const message = rules.message || VALIDATION_ERROR_MESSAGES.required(fieldName)
      return {
        isValid: false,
        error: new StructuredMortgageError(
          'FRONTEND',
          FRONTEND_ERROR_TYPES.FORM_VALIDATION_ERROR,
          message,
          'REQUIRED',
          MortgageErrorSeverity.MEDIUM,
          errorContext
        ),
        message
      }
    }

    // Skip other validations if field is empty and not required
    if (value === null || value === undefined || value === '') {
      return { isValid: true }
    }

    // String validations
    if (typeof value === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        const message = rules.message || VALIDATION_ERROR_MESSAGES.minLength(fieldName, rules.minLength)
        return {
          isValid: false,
          error: new StructuredMortgageError(
            'FRONTEND',
            FRONTEND_ERROR_TYPES.FORM_VALIDATION_ERROR,
            message,
            'MIN_LENGTH',
            MortgageErrorSeverity.MEDIUM,
            errorContext
          ),
          message
        }
      }

      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        const message = rules.message || VALIDATION_ERROR_MESSAGES.maxLength(fieldName, rules.maxLength)
        return {
          isValid: false,
          error: new StructuredMortgageError(
            'FRONTEND',
            FRONTEND_ERROR_TYPES.FORM_VALIDATION_ERROR,
            message,
            'MAX_LENGTH',
            MortgageErrorSeverity.MEDIUM,
            errorContext
          ),
          message
        }
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        const message = rules.message || VALIDATION_ERROR_MESSAGES.pattern(fieldName)
        return {
          isValid: false,
          error: new StructuredMortgageError(
            'FRONTEND',
            FRONTEND_ERROR_TYPES.FORM_VALIDATION_ERROR,
            message,
            'PATTERN',
            MortgageErrorSeverity.MEDIUM,
            errorContext
          ),
          message
        }
      }
    }

    // Number validations
    if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
      const numValue = typeof value === 'string' ? Number(value) : value

      if (rules.min !== undefined && numValue < rules.min) {
        const message = rules.message || VALIDATION_ERROR_MESSAGES.min(fieldName, rules.min)
        return {
          isValid: false,
          error: new StructuredMortgageError(
            'FRONTEND',
            FRONTEND_ERROR_TYPES.FORM_VALIDATION_ERROR,
            message,
            'MIN_VALUE',
            MortgageErrorSeverity.MEDIUM,
            errorContext
          ),
          message
        }
      }

      if (rules.max !== undefined && numValue > rules.max) {
        const message = rules.message || VALIDATION_ERROR_MESSAGES.max(fieldName, rules.max)
        return {
          isValid: false,
          error: new StructuredMortgageError(
            'FRONTEND',
            FRONTEND_ERROR_TYPES.FORM_VALIDATION_ERROR,
            message,
            'MAX_VALUE',
            MortgageErrorSeverity.MEDIUM,
            errorContext
          ),
          message
        }
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value)
      if (customError) {
        return {
          isValid: false,
          error: new StructuredMortgageError(
            'FRONTEND',
            FRONTEND_ERROR_TYPES.FORM_VALIDATION_ERROR,
            customError,
            'CUSTOM',
            MortgageErrorSeverity.MEDIUM,
            errorContext
          ),
          message: customError
        }
      }
    }

    return { isValid: true }
  }

  /**
   * Validate an object with multiple fields
   */
  static validateForm(
    data: Record<string, any>,
    validationRules: FieldValidation,
    context: ValidationErrorContext = {}
  ): { isValid: boolean; errors: Record<string, ValidationResult> } {
    const errors: Record<string, ValidationResult> = {}

    for (const [fieldName, rules] of Object.entries(validationRules)) {
      const result = this.validateField(data[fieldName], rules, fieldName, context)
      if (!result.isValid) {
        errors[fieldName] = result
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * Validate investment amount specifically
   */
  static validateInvestmentAmount(
    amount: string | number,
    availableBalance: number,
    minInvestment: number = 100,
    maxInvestment: number = 1000000
  ): ValidationResult {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return {
        isValid: false,
        error: new StructuredMortgageError(
          'FRONTEND',
          FRONTEND_ERROR_TYPES.INVALID_INPUT,
          'Please enter a valid investment amount',
          'INVALID_AMOUNT',
          MortgageErrorSeverity.MEDIUM,
          { amount: amount.toString() }
        ),
        message: 'Please enter a valid investment amount'
      }
    }

    if (numericAmount < minInvestment) {
      return {
        isValid: false,
        error: new StructuredMortgageError(
          'FRONTEND',
          FRONTEND_ERROR_TYPES.INVALID_INPUT,
          `Minimum investment amount is ${minInvestment} USDT`,
          'MIN_INVESTMENT',
          MortgageErrorSeverity.MEDIUM,
          { amount: amount.toString(), required: minInvestment.toString() }
        ),
        message: `Minimum investment amount is ${minInvestment} USDT`
      }
    }

    if (numericAmount > maxInvestment) {
      return {
        isValid: false,
        error: new StructuredMortgageError(
          'FRONTEND',
          FRONTEND_ERROR_TYPES.INVALID_INPUT,
          `Maximum investment amount is ${maxInvestment} USDT`,
          'MAX_INVESTMENT',
          MortgageErrorSeverity.MEDIUM,
          { amount: amount.toString(), max: maxInvestment.toString() }
        ),
        message: `Maximum investment amount is ${maxInvestment} USDT`
      }
    }

    if (numericAmount > availableBalance) {
      return {
        isValid: false,
        error: new StructuredMortgageError(
          'FRONTEND',
          FRONTEND_ERROR_TYPES.INVALID_INPUT,
          'Investment amount exceeds your available balance',
          'INSUFFICIENT_BALANCE',
          MortgageErrorSeverity.HIGH,
          { amount: amount.toString(), balance: availableBalance.toString() }
        ),
        message: 'Investment amount exceeds your available balance'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate wallet address
   */
  static validateWalletAddress(address: string): ValidationResult {
    if (!address) {
      return {
        isValid: false,
        error: new StructuredMortgageError(
          'FRONTEND',
          FRONTEND_ERROR_TYPES.WALLET_NOT_CONNECTED,
          'Wallet address is required',
          'WALLET_REQUIRED',
          MortgageErrorSeverity.HIGH
        ),
        message: 'Wallet address is required'
      }
    }

    if (!VALIDATION_PATTERNS.wallet.test(address)) {
      return {
        isValid: false,
        error: new StructuredMortgageError(
          'FRONTEND',
          FRONTEND_ERROR_TYPES.INVALID_INPUT,
          'Please enter a valid Ethereum wallet address',
          'INVALID_WALLET',
          MortgageErrorSeverity.MEDIUM,
          { address }
        ),
        message: 'Please enter a valid Ethereum wallet address'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate withdrawal amount
   */
  static validateWithdrawalAmount(
    amount: string | number,
    availableShares: number,
    availableBalance: number
  ): ValidationResult {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return {
        isValid: false,
        error: new StructuredMortgageError(
          'FRONTEND',
          FRONTEND_ERROR_TYPES.INVALID_INPUT,
          'Please enter a valid withdrawal amount',
          'INVALID_AMOUNT',
          MortgageErrorSeverity.MEDIUM
        ),
        message: 'Please enter a valid withdrawal amount'
      }
    }

    if (numericAmount > availableBalance) {
      return {
        isValid: false,
        error: new StructuredMortgageError(
          'FRONTEND',
          FRONTEND_ERROR_TYPES.INVALID_INPUT,
          'Withdrawal amount exceeds your available balance',
          'INSUFFICIENT_BALANCE',
          MortgageErrorSeverity.HIGH,
          { amount: amount.toString(), balance: availableBalance.toString() }
        ),
        message: 'Withdrawal amount exceeds your available balance'
      }
    }

    if (numericAmount > availableShares) {
      return {
        isValid: false,
        error: new StructuredMortgageError(
          'FRONTEND',
          FRONTEND_ERROR_TYPES.INVALID_INPUT,
          'Withdrawal amount exceeds your available shares',
          'INSUFFICIENT_SHARES',
          MortgageErrorSeverity.HIGH,
          { amount: amount.toString(), shares: availableShares.toString() }
        ),
        message: 'Withdrawal amount exceeds your available shares'
      }
    }

    return { isValid: true }
  }

  /**
   * Get real-time validation feedback
   */
  static getValidationFeedback(validationResult: ValidationResult): {
    type: 'success' | 'warning' | 'error'
    message: string
    icon: string
  } {
    if (!validationResult.isValid) {
      return {
        type: 'error',
        message: validationResult.message || 'Invalid input',
        icon: 'heroicons:exclamation-circle'
      }
    }

    return {
      type: 'success',
      message: 'Valid input',
      icon: 'heroicons:check-circle'
    }
  }
}

/**
 * Utility function for creating validation composable
 */
export function createValidator(rules: FieldValidation) {
  return {
    validate: (data: Record<string, any>, context?: ValidationErrorContext) => {
      return ValidationErrorHandler.validateForm(data, rules, context)
    },
    validateField: (fieldName: string, value: any, context?: ValidationErrorContext) => {
      const fieldRules = rules[fieldName]
      if (!fieldRules) return { isValid: true }
      return ValidationErrorHandler.validateField(value, fieldRules, fieldName, context)
    }
  }
}