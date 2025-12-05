/**
 * Contract type definitions for Mortgage House application
 */

// Contract Stages (from Architecture document)
export enum ContractStage {
  INITIALIZED = 0,
  FUNDING = 1,
  ACTIVE = 2,
  COMPLETED = 3,
  DEFAULTED = 4
}

// Contract Statistics Interface
export interface ContractStats {
  totalFunded: bigint;
  repaidPrincipal: bigint;
  repaidInterest: bigint;
  totalShares: bigint;
  investorCount: number;
  stage: ContractStage;
  fundingTarget?: bigint;
  fundingProgress?: number; // percentage (0-100)
  interestRate?: number; // basis points
  termMonths?: number;
  createdAt?: number;
  loanAmount?: bigint;
}

// Investor Position Interface
export interface InvestorPosition {
  shares: bigint;
  entitledPrincipal: bigint;
  entitledInterest: bigint;
  withdrawablePrincipal: bigint;
  withdrawableInterest: bigint;
  ownershipPercentage: number;
  totalInvested: bigint;
  totalWithdrawn: bigint;
  totalEarned: bigint;
}

// Contract State Interface
export interface ContractState {
  contract: any; // Will be typed when Viem is integrated
  stage: ContractStage;
  stats: ContractStats;
  investorPosition: InvestorPosition;
  lastError: any; // MortgageError type from errors.ts
  isConnected: boolean;
  isConnecting: boolean;
  isLoading: boolean;
  contractAddress: `0x${string}` | null;
}

// Transaction Options
export interface TransactionOptions {
  gasLimit?: bigint;
  gasPrice?: bigint;
  value?: bigint;
  from?: `0x${string}`;
}

// Gas Estimate Result
export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  ethCost: string;
  usdCost: string;
  formattedGasLimit: string;
  formattedGasPrice: string;
}

// Transaction Result
export interface TransactionResult {
  hash: `0x${string}`;
  blockNumber?: number;
  blockHash?: `0x${string}`;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  status?: number;
  timestamp?: number;
  confirmations?: number;
}

// Event Types
export interface InvestedEvent {
  investor: `0x${string}`;
  amount: bigint;
  shares: bigint;
  timestamp: number;
}

export interface LoanWithdrawnEvent {
  borrower: `0x${string}`;
  amount: bigint;
  timestamp: number;
}

export interface PrincipalDepositedEvent {
  from: `0x${string}`;
  amount: bigint;
  timestamp: number;
}

export interface InterestDepositedEvent {
  from: `0x${string}`;
  amount: bigint;
  timestamp: number;
}

export interface PayoutWithdrawnEvent {
  investor: `0x${string}`;
  principalAmount: bigint;
  interestAmount: bigint;
  timestamp: number;
}

export interface StageChangedEvent {
  oldStage: ContractStage;
  newStage: ContractStage;
  actor: `0x${string}`;
  timestamp: number;
}

// Marketplace Types
export interface SellOrder {
  id: bigint;
  seller: `0x${string}`;
  shares: bigint;
  pricePerShare: bigint;
  totalPrice: bigint;
  expiresAt: number;
  isActive: boolean;
  createdAt: number;
}

export interface CreateSellOrderParams {
  shares: bigint;
  pricePerShare: bigint;
  expiresAt?: number;
}

export interface BuyOrderParams {
  orderId: bigint;
  maxPrice?: bigint;
}

// Contract Function Parameters
export interface InvestParams {
  amount: bigint;
}

export interface WithdrawPayoutParams {
  principal?: boolean;
  interest?: boolean;
}

export interface DepositParams {
  amount: bigint;
}

export interface TransferSharesParams {
  to: `0x${string}`;
  shares: bigint;
}

// Contract Function Signatures
export interface ContractFunctions {
  // Investment functions
  invest(amount: bigint): Promise<TransactionResult>;
  withdrawPayout(params?: WithdrawPayoutParams): Promise<TransactionResult>;
  withdrawLoan(amount: bigint): Promise<TransactionResult>;
  depositPrincipal(amount: bigint): Promise<TransactionResult>;
  depositInterest(amount: bigint): Promise<TransactionResult>;
  transferShares(to: `0x${string}`, shares: bigint): Promise<TransactionResult>;

  // Marketplace functions
  createSellOrder(params: CreateSellOrderParams): Promise<TransactionResult>;
  cancelSellOrder(orderId: bigint): Promise<TransactionResult>;
  buySellOrder(params: BuyOrderParams): Promise<TransactionResult>;

  // View functions
  getStage(): Promise<ContractStage>;
  getTotalFunded(): Promise<bigint>;
  getRepaidPrincipal(): Promise<bigint>;
  getRepaidInterest(): Promise<bigint>;
  getTotalShares(): Promise<bigint>;
  getInvestorCount(): Promise<number>;
  getShares(investor: `0x${string}`): Promise<bigint>;
  getEntitledPrincipal(investor: `0x${string}`): Promise<bigint>;
  getEntitledInterest(investor: `0x${string}`): Promise<bigint>;
  getWithdrawablePrincipal(investor: `0x${string}`): Promise<bigint>;
  getWithdrawableInterest(investor: `0x${string}`): Promise<bigint>;

  // Gas estimation
  estimateGas(functionName: string, ...args: any[]): Promise<GasEstimate>;
}

// Contract Event Listeners
export interface ContractEventListeners {
  onInvested(callback: (event: InvestedEvent) => void): void;
  onLoanWithdrawn(callback: (event: LoanWithdrawnEvent) => void): void;
  onPrincipalDeposited(callback: (event: PrincipalDepositedEvent) => void): void;
  onInterestDeposited(callback: (event: InterestDepositedEvent) => void): void;
  onPayoutWithdrawn(callback: (event: PayoutWithdrawnEvent) => void): void;
  onStageChanged(callback: (event: StageChangedEvent) => void): void;
  onSellOrderCreated(callback: (order: SellOrder) => void): void;
  onSellOrderCancelled(callback: (orderId: bigint) => void): void;
  onSellOrderBought(callback: (orderId: bigint, buyer: `0x${string}`) => void): void;
}

// Composable Return Type (matching the architecture specification)
export interface UseMortgageContractReturn {
  // State
  contract: any;
  stage: ContractStage;
  stats: ContractStats;
  investorPosition: InvestorPosition;
  lastError: any;
  isConnected: boolean;
  isConnecting: boolean;
  isLoading: boolean;

  // Core Functions
  invest: (amount: bigint) => Promise<TransactionResult | null>;
  withdrawPayout: (params?: WithdrawPayoutParams) => Promise<TransactionResult | null>;
  withdrawLoan: (amount: bigint) => Promise<TransactionResult | null>;
  depositPrincipal: (amount: bigint) => Promise<TransactionResult | null>;
  depositInterest: (amount: bigint) => Promise<TransactionResult | null>;
  transferShares: (params: TransferSharesParams) => Promise<TransactionResult | null>;
  refreshState: () => Promise<void>;

  // Marketplace Functions
  createSellOrder: (params: CreateSellOrderParams) => Promise<TransactionResult | null>;
  cancelSellOrder: (orderId: bigint) => Promise<TransactionResult | null>;
  buySellOrder: (params: BuyOrderParams) => Promise<TransactionResult | null>;

  // Utility Functions
  getGasEstimate: (functionName: string, ...args: any[]) => Promise<GasEstimate | null>;
  formatAmount: (amount: bigint, decimals?: number) => string;
  formatPercentage: (value: number) => string;
  formatDate: (timestamp: number) => string;

  // Event Management
  setupEventListeners: () => void;
  removeEventListeners: () => void;
}

// Network Configuration
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Contract Configuration
export interface ContractConfig {
  address: `0x${string}`;
  abi: any[];
  network: NetworkConfig;
}

// Validation Helpers
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
}

// Contract Validation Rules
export interface ContractValidationRules {
  minInvestment: bigint;
  maxInvestment: bigint;
  allowedStages: ContractStage[];
  requireWhitelist: boolean;
  whitelist?: `0x${string}`[];
}