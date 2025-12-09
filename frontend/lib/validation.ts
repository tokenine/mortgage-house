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