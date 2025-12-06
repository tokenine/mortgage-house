# Story 5.1: Create Mortgage Contract Deployment Interface

**Status:** ready-for-dev
**Epic:** 5 - Master Wallet Operator Controls
**Created:** 2025-12-06
**Author:** Scrum Master (Bob)

---

## 🎯 Story Foundation

As a system manager (Operations Omar),
I want to deploy new mortgage contracts through an intuitive interface,
So that I can efficiently onboard new properties and manage the investment pipeline.

## ✅ Acceptance Criteria

### AC1: Operator Deployment Interface
**Given** I am logged in as a master wallet operator
**When** I access the operator dashboard
**Then** I see a "Deploy New Mortgage" button with clear configuration options
**And** I can input property details: loan amount, USDT token address, and contract parameters
**And** I see real-time validation of deployment parameters and estimated gas costs
**And** I can review all configuration details before deployment confirmation

### AC2: Contract Deployment Execution
**Given** I confirm contract deployment
**When** the deployment process executes
**Then** a new MortgageContract is deployed with the specified parameters
**And** the contract is initialized with my master wallet as the OPERATOR_ROLE holder
**And** the contract emits `MortgageInitialized` event with all deployment details
**And** the contract appears in my operator dashboard with ACTIVE status
**And** I can immediately begin accepting investor funding

### AC3: Post-Deployment Management
**Given** deployment is successful
**When** I view the new contract
**Then** I can see the contract address, deployment transaction, and verification links
**And** I have full operator controls for loan withdrawal and repayment processing
**And** the contract is properly linked to the property documentation and underwriting records
**And** I can monitor funding progress and investor participation in real-time

### AC4: Deployment Validation and Error Handling
**Given** I input invalid deployment parameters
**When** I attempt to deploy
**Then** the interface shows specific error messages with correction guidance
**And** gas estimates update in real-time based on network conditions
**And** failed deployments are logged with detailed error information
**And** I can retry deployment with corrected parameters

---

## 🏗️ Developer Context Section

### 🔴 CRITICAL: Do Not Violate These Constraints

**SMART CONTRACT DEVELOPMENT:**
- MUST extend existing MortgageContract.sol from Epic 1 with constructor parameters [Source: 1-2-mortgage-contract-core.md]
- MUST use existing AccessControl pattern with OPERATOR_ROLE assignment [Source: 1-2-mortgage-contract-core.md]
- MUST emit `MortgageInitialized` event following established naming conventions [Source: 1-3-event-system.md]
- MUST follow Foundry deployment patterns established in Epic 1 [Source: 1-1-foundry-project-setup.md]

**FRONTEND INTEGRATION:**
- MUST extend existing useMortgageContract composable pattern [Source: 2-2-mortgage-contract-composable.md]
- MUST use structured error handling system from Epic 2 [Source: 2-3-structured-error-handling.md]
- MUST follow established real-time update patterns from Epic 3 [Source: 3-2-funding-progress.md]
- MUST maintain operator role validation using existing AccessControl patterns

### 📊 Technical Requirements

**Smart Contract Deployment Function to Implement:**

```solidity
// New deployment script needed in /contracts/script/
// DeployMortgageContract.s.sol
function deployMortgageContract(
    address borrower,
    uint256 loanAmount,
    address usdtToken,
    uint256 interestRate,
    uint256 loanTerm,
    string memory propertyDescription
) external returns (address deployedContract) {
    // Validate deployment parameters
    // Deploy new MortgageContract with constructor parameters
    // Assign OPERATOR_ROLE to deployer (master wallet)
    // Return deployed contract address
}
```

**MortgageContract Constructor Extension:**
```solidity
// Extend existing constructor in MortgageContract.sol
constructor(
    address borrower,
    uint256 loanAmount,
    address usdtToken,
    uint256 interestRate,
    uint256 loanTerm,
    string memory propertyDescription,
    address operator
) ERC20("Mortgage Shares", "MSH") {
    // Initialize with deployment parameters
    // Set OPERATOR_ROLE to operator address
    // Emit MortgageInitialized event
}
```

**Frontend Deployment Interface Components:**

```typescript
// Extend useMortgageContract.ts with deployment functions
const deployMortgageContract = async (params: MortgageDeploymentParams) => {
    // Validate deployment parameters
    // Estimate gas costs
    // Execute deployment transaction
    // Return deployed contract details
}

// New reactive state for deployment
const deploymentStatus = ref<DeploymentStatus>('idle')
const deployedContracts = ref<DeployedContract[]>([])
```

**Required Event Emission:**
- `MortgageInitialized(address indexed borrower, uint256 loanAmount, address indexed usdtToken, address indexed contractAddress, string propertyDescription)`

### 🎨 Architecture Compliance

**File Structure Requirements:**
```
/contracts/script/DeployMortgageContract.s.sol (new)
  - Foundry script for contract deployment
  - Parameter validation and gas estimation
  - Operator role assignment automation

/contracts/src/MortgageContract.sol (extend existing)
  - Add constructor parameters for deployment configuration
  - Maintain existing AccessControl and event patterns

/frontend/components/operator/ (new)
  - DeploymentForm.vue - parameter input and validation
  - DeploymentProgress.vue - deployment status and progress
  - ContractList.vue - deployed contracts management

/frontend/composables/useMortgageContract.ts (extend existing)
  - Add deployment functions and reactive state
  - Integrate with existing error handling patterns

/frontend/pages/operator/ (new)
  - index.vue - main operator dashboard
  - deploy.vue - deployment interface
  - contracts.vue - contract management
```

**Naming Conventions:**
- Functions: camelCase with descriptive names (`deployMortgageContract`, `validateDeploymentParams`)
- Events: Past tense with indexed parameters (`MortgageInitialized`)
- Components: PascalCase with clear purpose (`DeploymentForm`, `ContractList`)
- Variables: descriptive with clear ownership (`deploymentStatus`, `deployedContracts`)

**Gas Optimization Requirements:**
- Target <0.01 ETH for contract deployment [Source: docs/architecture.md#Core Architectural Decisions]
- Use efficient constructor parameter ordering to reduce gas costs
- Batch deployment operations where multiple contracts needed
- Provide gas estimation before deployment confirmation

### 📚 Library & Framework Requirements

**Smart Contract Libraries:**
- Foundry scripting framework (already established) [Source: 1-1-foundry-project-setup.md]
- OpenZeppelin v5+ AccessControl (already integrated) [Source: 1-2-mortgage-contract-core.md]
- Existing MortgageContract base with all patterns from Epic 1

**Frontend Libraries:**
- Viem for contract deployment interactions (already integrated) [Source: 2-2-mortgage-contract-composable.md]
- Nuxt 3 with established composables pattern (already set up) [Source: 2-1-nuxt-web3-setup.md]
- MUI components for form interfaces (established patterns)

**Testing Requirements:**
- Foundry testing for deployment scripts (established in Epic 1) [Source: 1-4-foundry-test-suite.md]
- Frontend testing for deployment interface and error handling
- Integration testing for end-to-end deployment flow

### 🧪 Testing Requirements

**Smart Contract Tests Must Include:**
1. **Deployment Parameter Validation**
   - Test valid parameter sets deploy successfully
   - Test invalid parameters are rejected with clear errors
   - Test edge cases: zero amounts, invalid addresses, extreme values

2. **Operator Role Assignment**
   - Test deployer receives OPERATOR_ROLE automatically
   - Test role assignment is immutable after deployment
   - Test operator permissions work correctly

3. **Contract Initialization**
   - Test all constructor parameters set correctly
   - Test MortgageInitialized event emission
   - Test initial contract state is correct

**Frontend Tests Must Include:**
1. **Form Validation**
   - Test real-time parameter validation
   - Test error messages are clear and actionable
   - Test gas estimation updates with parameter changes

2. **Deployment Flow**
   - Test complete deployment from form to contract creation
   - Test progress indicators during deployment
   - Test success and error state handling

3. **Error Handling**
   - Test network error handling during deployment
   - Test insufficient gas handling
   - Test transaction failure recovery

### 🔍 Previous Story Intelligence

**Epic 4 Learnings (Portfolio Management):**
- Real-time state synchronization patterns established [Source: 4-2-portfolio-dashboard.md]
- Operator interface design patterns from portfolio management [Source: 4-3-withdrawal-processing.md]
- Transaction tracking patterns for audit trails [Source: 4-4-transaction-tracking.md]

**Epic 3 Learnings (Investment Flow):**
- Real-time event monitoring and state updates [Source: 3-2-funding-progress.md]
- Gas optimization and estimation patterns [Source: 3-3-gas-optimization.md]
- Form validation and error handling patterns [Source: 3-1-investment-function.md]

**Epic 2 Learnings (Web3 Integration):**
- useMortgageContract composable extension patterns [Source: 2-2-mortgage-contract-composable.md]
- Structured error handling for blockchain operations [Source: 2-3-structured-error-handling.md]
- Wallet connection and transaction patterns [Source: 2-1-nuxt-web3-setup.md]

**Epic 1 Learnings (Smart Contract Foundation):**
- AccessControl pattern with OPERATOR_ROLE [Source: 1-2-mortgage-contract-core.md]
- Event emission naming conventions [Source: 1-3-event-system.md]
- Foundry deployment and testing patterns [Source: 1-4-foundry-test-suite.md]

### 📋 Git Intelligence Summary

**Recent Commit Patterns:**
- Deployment scripts follow parameter validation → deployment → event emission pattern
- Frontend forms use real-time validation with reactive error states
- Operator interfaces consistently use role-based access control
- Gas estimation provided before transaction execution

**File Creation Patterns:**
- New smart contract scripts follow Foundry .s.sol convention
- Frontend operator components organized in dedicated /operator/ directory
- Composable extensions maintain existing API patterns
- Integration tests cover complete user flows

### 🌐 Latest Technical Information

**Foundry Script Requirements:**
- Use `forge script` for deployment automation
- Support configurable deployment parameters
- Include gas estimation and optimization
- Provide deployment verification and logging

**Viem Integration:**
- Extend existing Viem client for contract deployment
- Use contract deployment factories for typed deployment
- Maintain type safety for all deployment parameters
- Follow established transaction patterns

**Nuxt 3 Operator Dashboard:**
- Create dedicated operator routes and pages
- Use existing composable patterns for contract interactions
- Implement role-based access control at frontend level
- Apply established UI patterns from portfolio dashboard

### 📖 Project Context Reference

**Architecture Alignment:**
- **Smart Contract Infrastructure**: Extend Epic 1 foundation with deployment capabilities [Source: docs/architecture.md#Smart Contract Architecture]
- **Frontend Architecture**: Use established operator interface patterns [Source: docs/architecture.md#Frontend Architecture]
- **Access Control**: Maintain OPERATOR_ROLE pattern from Epic 1 [Source: docs/architecture.md#Access Control Pattern]
- **Event System**: Follow required event naming for audit trail [Source: docs/architecture.md#Required Event Names]

**Epic Integration:**
- **Foundation**: Builds on Epic 1 AccessControl and event systems
- **Enables**: Epic 5.2 loan withdrawal and repayment processing
- **Supports**: Epic 5.3 stage management system
- **Critical for**: Complete operator workflow and contract lifecycle management

**Business Value:**
- **Operational Efficiency**: Streamlined contract deployment reduces onboarding time
- **Scalability**: Supports multiple property deployments without technical friction
- **Compliance**: Complete audit trail for all contract deployments
- **Risk Management**: Parameter validation prevents deployment errors

**Deployment Workflow:**
- **Parameter Input**: Operator enters loan details and property information
- **Validation**: Real-time validation ensures parameters are correct
- **Gas Estimation**: Transparent cost information before deployment
- **Deployment**: Automated contract creation with operator role assignment
- **Verification**: Links to block explorer and contract verification

### 🔗 References

- [Architecture: Smart Contract Requirements](docs/architecture.md#Smart Contract Architecture)
- [Architecture: Access Control Pattern](docs/architecture.md#Access Control Pattern)
- [Epic 1: Smart Contract Foundation](1-2-mortgage-contract-core.md)
- [Epic 2: Web3 Integration](2-2-mortgage-contract-composable.md)
- [Epic 4: Operator Interface Patterns](4-3-withdrawal-processing.md)

---

## 🎯 Dev Agent Execution Instructions

### Step 1: Create Deployment Script
1. **Create DeployMortgageContract.s.sol** in /contracts/script/
2. **Implement parameter validation** for loan amounts, addresses, and terms
3. **Add gas estimation** and optimization features
4. **Include operator role assignment** in deployment process

### Step 2: Extend Smart Contract Constructor
1. **Modify MortgageContract.sol** constructor to accept deployment parameters
2. **Add parameter validation** at contract level
3. **Implement OPERATOR_ROLE assignment** for deploying address
4. **Emit MortgageInitialized event** with all deployment details

### Step 3: Create Frontend Deployment Interface
1. **Create operator components** in /frontend/components/operator/
2. **Extend useMortgageContract composable** with deployment functions
3. **Implement real-time validation** and gas estimation
4. **Add deployment progress tracking** and error handling

### Step 4: Comprehensive Testing
1. **Smart contract tests** for deployment validation and role assignment
2. **Frontend tests** for form validation and deployment flow
3. **Integration tests** for end-to-end deployment process
4. **Gas optimization verification** for deployment efficiency

### Step 5: Documentation and Integration
1. **Create deployment documentation** for operators
2. **Add contract management interface** for deployed contracts
3. **Integrate with existing portfolio system** for complete view
4. **Provide deployment monitoring** and status tracking

### ✅ Success Criteria
- [ ] Deployment script validates all parameters correctly
- [ ] Smart contract constructor accepts deployment configuration
- [ ] Operator role assigned automatically on deployment
- [ ] Frontend interface provides real-time validation
- [ ] Gas estimation accurate and transparent
- [ ] Complete deployment flow tested end-to-end
- [ ] Error handling comprehensive and user-friendly

---

## 🚨 Critical Warning: Do Not Skip These Requirements

1. **MUST extend existing AccessControl pattern** from Epic 1
2. **MUST emit MortgageInitialized event** following established naming
3. **MUST use structured error handling** from Epic 2 patterns
4. **MUST validate all deployment parameters** before execution
5. **MUST provide gas estimation** before deployment confirmation
6. **MUST assign OPERATOR_ROLE** to deploying wallet automatically
7. **MUST include comprehensive testing** for deployment scenarios

---

## Dev Agent Record

### Context Reference
<!-- Implementation context will be tracked here -->

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250901)

### Debug Log References

### Completion Notes List
- Complete deployment interface story ready for development
- All technical constraints and patterns identified
- Previous epic intelligence integrated for consistency

### File List (Expected)
- `/contracts/script/DeployMortgageContract.s.sol` (new)
- `/contracts/src/MortgageContract.sol` (extend existing)
- `/frontend/components/operator/DeploymentForm.vue` (new)
- `/frontend/components/operator/ContractList.vue` (new)
- `/frontend/composables/useMortgageContract.ts` (extend existing)
- Test coverage reports and deployment verification

**Status:** ready-for-dev