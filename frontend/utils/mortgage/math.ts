/**
 * Mortgage calculation utilities
 */

/**
 * Calculate monthly mortgage payment
 * @param principal Loan amount in wei (bigint)
 * @param annualRate Annual interest rate in basis points (e.g., 500 = 5%)
 * @param termMonths Loan term in months
 * @returns Monthly payment amount in wei (bigint)
 */
export const calculateMonthlyPayment = (
  principal: bigint,
  annualRate: number,
  termMonths: number
): bigint => {
  if (principal === 0n || termMonths === 0) return 0n

  // Convert annual rate from basis points to decimal
  const monthlyRateDecimal = annualRate / 10000 / 12

  // If interest rate is 0, return principal divided by months
  if (monthlyRateDecimal === 0) {
    return principal / BigInt(termMonths)
  }

  // Calculate monthly payment using the formula:
  // P = (r * A) / (1 - (1 + r)^-n)
  // Where:
  // P = Monthly payment
  // r = Monthly interest rate
  // A = Loan amount
  // n = Number of months

  const r = monthlyRateDecimal
  const A = Number(principal) / 1e18 // Convert to ether for calculation
  const n = termMonths

  // Calculate monthly payment in ether
  const monthlyPaymentEther = (r * A) / (1 - Math.pow(1 + r, -n))

  // Convert back to wei
  return BigInt(Math.floor(monthlyPaymentEther * 1e18))
}

/**
 * Calculate total interest over loan term
 * @param principal Loan amount in wei
 * @param annualRate Annual interest rate in basis points
 * @param termMonths Loan term in months
 * @returns Total interest in wei
 */
export const calculateTotalInterest = (
  principal: bigint,
  annualRate: number,
  termMonths: number
): bigint => {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths)
  const totalPaid = monthlyPayment * BigInt(termMonths)
  return totalPaid - principal
}

/**
 * Calculate APR (Annual Percentage Rate)
 * @param nominalRate Nominal annual rate in basis points
 * @param fees Total fees in wei
 * @param principal Loan amount in wei
 * @param termMonths Loan term in months
 * @returns APR in basis points
 */
export const calculateAPR = (
  nominalRate: number,
  fees: bigint,
  principal: bigint,
  termMonths: number
): number => {
  if (principal === 0n) return 0

  // Calculate effective interest including fees
  const totalCost = Number(fees) / 1e18
  const principalAmount = Number(principal) / 1e18
  const years = termMonths / 12

  const effectiveRate = (totalCost / principalAmount) / years
  const nominalRateDecimal = nominalRate / 10000

  // Convert to basis points
  return Math.round((effectiveRate + nominalRateDecimal) * 10000)
}

/**
 * Calculate loan-to-value ratio (LTV)
 * @param loanAmount Loan amount in wei
 * @param propertyValue Property value in wei
 * @returns LTV ratio in basis points (e.g., 8000 = 80%)
 */
export const calculateLTV = (
  loanAmount: bigint,
  propertyValue: bigint
): number => {
  if (propertyValue === 0n) return 0

  const ltvDecimal = Number(loanAmount) / Number(propertyValue)
  return Math.round(ltvDecimal * 10000) // Convert to basis points
}

/**
 * Calculate debt-to-income ratio (DTI)
 * @param monthlyDebtPayments Total monthly debt payments in wei
 * @param monthlyIncome Monthly income in wei
 * @returns DTI ratio in basis points
 */
export const calculateDTI = (
  monthlyDebtPayments: bigint,
  monthlyIncome: bigint
): number => {
  if (monthlyIncome === 0n) return 0

  const dtiDecimal = Number(monthlyDebtPayments) / Number(monthlyIncome)
  return Math.round(dtiDecimal * 10000) // Convert to basis points
}

/**
 * Calculate remaining balance after payments
 * @param principal Original loan amount in wei
 * @param annualRate Annual interest rate in basis points
 * @param termMonths Total loan term in months
 * @param paymentsMade Number of payments made
 * @returns Remaining balance in wei
 */
export const calculateRemainingBalance = (
  principal: bigint,
  annualRate: number,
  termMonths: number,
  paymentsMade: number
): bigint => {
  if (principal === 0n || paymentsMade >= termMonths) return 0n

  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths)
  const monthlyRateDecimal = annualRate / 10000 / 12

  if (monthlyRateDecimal === 0) {
    return principal - (monthlyPayment * BigInt(paymentsMade))
  }

  // Calculate remaining balance using amortization formula
  const r = monthlyRateDecimal
  const P = Number(principal) / 1e18
  const M = Number(monthlyPayment) / 1e18
  const n = termMonths
  const t = paymentsMade

  const remainingBalance = P * Math.pow(1 + r, t) - (M / r) * (Math.pow(1 + r, t) - 1)

  return BigInt(Math.max(0, Math.floor(remainingBalance * 1e18)))
}

/**
 * Calculate investment share percentage
 * @param investedAmount Amount invested by user in wei
 * @param totalInvested Total amount invested by all users in wei
 * @returns Share percentage in basis points
 */
export const calculateInvestmentShare = (
  investedAmount: bigint,
  totalInvested: bigint
): number => {
  if (totalInvested === 0n) return 0

  const shareDecimal = Number(investedAmount) / Number(totalInvested)
  return Math.round(shareDecimal * 10000) // Convert to basis points
}

/**
 * Calculate pro-rata distribution amount
 * @param totalAmount Total amount to distribute in wei
 * @param userShare User's share in basis points
 * @returns User's distribution amount in wei
 */
export const calculateProRataDistribution = (
  totalAmount: bigint,
  userShare: number
): bigint => {
  return (totalAmount * BigInt(userShare)) / BigInt(10000)
}

/**
 * Calculate yield on investment
 * @param investmentAmount Original investment in wei
 * @param returnsAmount Total returns received in wei
 * @returns Yield in basis points
 */
export const calculateYield = (
  investmentAmount: bigint,
  returnsAmount: bigint
): number => {
  if (investmentAmount === 0n) return 0

  const yieldDecimal = Number(returnsAmount - investmentAmount) / Number(investmentAmount)
  return Math.round(yieldDecimal * 10000) // Convert to basis points
}

/**
 * Format basis points as percentage
 * @param basisPoints Value in basis points
 * @param decimals Number of decimal places to display
 * @returns Formatted percentage string
 */
export const formatBasisPoints = (
  basisPoints: number,
  decimals: number = 2
): string => {
  const percentage = basisPoints / 100
  return `${percentage.toFixed(decimals)}%`
}

/**
 * Calculate compound interest
 * @param principal Initial amount in wei
 * @param annualRate Annual interest rate in basis points
 * @param years Number of years
 * @param compoundFrequency Compounding frequency per year
 * @returns Future value in wei
 */
export const calculateCompoundInterest = (
  principal: bigint,
  annualRate: number,
  years: number,
  compoundFrequency: number = 1
): bigint => {
  if (principal === 0n || years === 0) return principal

  const rateDecimal = annualRate / 10000
  const n = compoundFrequency
  const t = years

  // Compound interest formula: A = P(1 + r/n)^(nt)
  const multiplier = Math.pow(1 + rateDecimal / n, n * t)
  const futureValue = Number(principal) * multiplier

  return BigInt(Math.floor(futureValue))
}

/**
 * Calculate present value using discount rate
 * @param futureValue Future value in wei
 * @param discountRate Annual discount rate in basis points
 * @param years Number of years
 * @returns Present value in wei
 */
export const calculatePresentValue = (
  futureValue: bigint,
  discountRate: number,
  years: number
): bigint => {
  if (futureValue === 0n || years === 0) return futureValue

  const rateDecimal = discountRate / 10000

  // Present value formula: PV = FV / (1 + r)^t
  const divisor = Math.pow(1 + rateDecimal, years)
  const presentValue = Number(futureValue) / divisor

  return BigInt(Math.floor(presentValue))
}

/**
 * Calculate internal rate of return (IRR) approximation
 * @param cashFlows Array of cash flows in wei (negative for outflows, positive for inflows)
 * @returns IRR in basis points
 */
export const calculateIRR = (cashFlows: bigint[]): number => {
  if (cashFlows.length === 0) return 0

  // Simple IRR calculation using Newton-Raphson method
  let rate = 0.1 // Start with 10% as guess
  const maxIterations = 100
  const tolerance = 0.0001

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0
    let derivativeNPV = 0

    for (let j = 0; j < cashFlows.length; j++) {
      const cashFlow = Number(cashFlows[j])
      const denominator = Math.pow(1 + rate, j)
      npv += cashFlow / denominator
      derivativeNPV -= (j * cashFlow) / Math.pow(1 + rate, j + 1)
    }

    const newRate = rate - npv / derivativeNPV

    if (Math.abs(newRate - rate) < tolerance) {
      return Math.round(newRate * 10000) // Convert to basis points
    }

    rate = newRate
  }

  return Math.round(rate * 10000) // Return best estimate
}