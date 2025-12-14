export interface MortgageProject {
  id: string
  name: string
  location: string
  image: string
  apy: number
  fundingCap: number
  raised: number
  maturity: string
  investors: number
  loanAmount?: number
  interestRate?: number
  loanTerm?: number
  propertyValue?: number
  loanToValue?: number
  riskRating?: string
  borrowerType?: string
  description?: string
  onChain?: ProjectOnChainMetadata
}

export interface ProjectsData {
  projects: MortgageProject[]
}

export interface ProjectOnChainMetadata {
  mortgageBondAddress: string
  paymentTokenAddress: string
  chainId?: number
  decimals?: number
  isFundingActive?: boolean
}
