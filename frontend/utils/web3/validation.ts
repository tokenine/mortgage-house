/**
 * Validate Ethereum address
 */
export const validateAddress = (address: string): { isValid: boolean; error?: string; address?: `0x${string}` } => {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Address is required' }
  }

  if (!address.startsWith('0x')) {
    return { isValid: false, error: 'Address must start with 0x' }
  }

  if (address.length !== 42) {
    return { isValid: false, error: 'Address must be 42 characters long' }
  }

  // Check if it's a valid hexadecimal string
  const hexRegex = /^0x[a-fA-F0-9]{40}$/
  if (!hexRegex.test(address)) {
    return { isValid: false, error: 'Invalid hexadecimal format' }
  }

  return { isValid: true, address: address as `0x${string}` }
}

/**
 * Validate Ethereum amount
 */
export const validateAmount = (amount: string, maxAmount?: bigint): { isValid: boolean; error?: string; parsedAmount?: bigint } => {
  if (!amount || typeof amount !== 'string') {
    return { isValid: false, error: 'Amount is required' }
  }

  // Check if amount is a valid number
  const numAmount = parseFloat(amount)
  if (isNaN(numAmount) || numAmount <= 0) {
    return { isValid: false, error: 'Amount must be a positive number' }
  }

  // Check decimal places (max 18 for ETH)
  const decimalPlaces = amount.split('.')[1]?.length || 0
  if (decimalPlaces > 18) {
    return { isValid: false, error: 'Amount cannot have more than 18 decimal places' }
  }

  try {
    const parsedAmount = parseEtherAmount(amount)

    if (maxAmount && parsedAmount > maxAmount) {
      return { isValid: false, error: 'Amount exceeds maximum allowed' }
    }

    return { isValid: true, parsedAmount }
  } catch (error) {
    return { isValid: false, error: 'Invalid amount format' }
  }
}

// Parse ether string to wei
function parseEtherAmount(amount: string): bigint {
  const [whole, fraction = '0'] = amount.split('.')
  const scaledFraction = fraction.padEnd(18, '0').slice(0, 18)
  return BigInt(whole) * BigInt(10 ** 18) + BigInt(scaledFraction)
}

/**
 * Validate chain ID
 */
export const validateChainId = (chainId: number, supportedChains: number[]): { isValid: boolean; error?: string } => {
  if (!chainId || typeof chainId !== 'number') {
    return { isValid: false, error: 'Chain ID is required' }
  }

  if (!supportedChains.includes(chainId)) {
    return { isValid: false, error: 'Unsupported network' }
  }

  return { isValid: true }
}

/**
 * Validate transaction hash
 */
export const validateTransactionHash = (hash: string): { isValid: boolean; error?: string } => {
  if (!hash || typeof hash !== 'string') {
    return { isValid: false, error: 'Transaction hash is required' }
  }

  if (!hash.startsWith('0x')) {
    return { isValid: false, error: 'Transaction hash must start with 0x' }
  }

  if (hash.length !== 66) {
    return { isValid: false, error: 'Transaction hash must be 66 characters long' }
  }

  // Check if it's a valid hexadecimal string
  const hexRegex = /^0x[a-fA-F0-9]{64}$/
  if (!hexRegex.test(hash)) {
    return { isValid: false, error: 'Invalid hexadecimal format' }
  }

  return { isValid: true }
}

/**
 * Validate email address
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' }
  }

  return { isValid: true }
}

/**
 * Validate URL
 */
export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' }
  }

  try {
    new URL(url)
    return { isValid: true }
  } catch {
    return { isValid: false, error: 'Invalid URL format' }
  }
}

/**
 * Validate required field
 */
export const validateRequired = (value: any, fieldName: string): { isValid: boolean; error?: string } => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` }
  }
  return { isValid: true }
}

/**
 * Validate positive integer
 */
export const validatePositiveInteger = (value: any): { isValid: boolean; error?: string } => {
  const num = parseInt(value)
  if (isNaN(num) || num <= 0) {
    return { isValid: false, error: 'Must be a positive integer' }
  }
  return { isValid: true }
}

/**
 * Validate range
 */
export const validateRange = (value: number, min: number, max: number): { isValid: boolean; error?: string } => {
  if (value < min || value > max) {
    return { isValid: false, error: `Value must be between ${min} and ${max}` }
  }
  return { isValid: true }
}

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .trim()
    .slice(0, 1000) // Limit length
}

/**
 * Validate and sanitize form data
 */
export const validateFormData = (data: Record<string, any>, rules: Record<string, Function>): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}
  let isValid = true

  for (const [field, rule] of Object.entries(rules)) {
    const result = rule(data[field])
    if (!result.isValid) {
      errors[field] = result.error || 'Invalid input'
      isValid = false
    }
  }

  return { isValid, errors }
}