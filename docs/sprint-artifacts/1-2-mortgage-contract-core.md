# Story 1.2: Implement MortgageContract Core Structure with AccessControl

Status: Ready for Review

## Story

As a system architect,
I want to create the foundational MortgageContract with role-based access control,
So that the platform can enforce proper authorization patterns for different user types.

## Acceptance Criteria

1. **Contract Inheritance**: MortgageContract.sol imports and inherits from OpenZeppelin AccessControl, ReentrancyGuard, and Pausable
2. **Role Definitions**: Defines three roles: DEFAULT_ADMIN_ROLE, OPERATOR_ROLE, INVESTOR_ROLE using bytes32 constants
3. **Constructor Setup**: Implements constructor that sets deployer as DEFAULT_ADMIN_ROLE and defines role constants
4. **Operator Modifier**: Includes `onlyOperator` modifier for master wallet operations
5. **Reentrancy Protection**: Includes `nonReentrant` modifier on all external functions
6. **Public Functions**: Implements public functions `invest()` and `withdraw()` with INVESTOR_ROLE requirement
7. **Operator Functions**: Implements operator functions `withdrawLoan()`, `depositPrincipal()`, `depositInterest()` with onlyOperator modifier
8. **Access Control Enforcement**: Role-based permissions are properly enforced with only admin able to grant/revoke OPERATOR_ROLE

## Tasks / Subtasks

- [x] Set up contract inheritance (AC: 1)
  - [x] Import OpenZeppelin AccessControl, ReentrancyGuard, Pausable
  - [x] Make MortgageContract inherit from all three contracts
  - [x] Verify compilation with inheritance
- [x] Define role constants (AC: 2)
  - [x] Create DEFAULT_ADMIN_ROLE constant using AccessControl.DEFAULT_ADMIN_ROLE
  - [x] Create OPERATOR_ROLE constant with unique bytes32 identifier
  - [x] Create INVESTOR_ROLE constant with unique bytes32 identifier
- [x] Implement constructor (AC: 3)
  - [x] Set deployer as DEFAULT_ADMIN_ROLE in constructor
  - [x] Initialize role constants
  - [x] Set up initial contract state
- [x] Create access modifiers (AC: 4, 5)
  - [x] Implement `onlyOperator` modifier checking OPERATOR_ROLE
  - [x] Apply `nonReentrant` modifier to all external functions
  - [x] Test modifier functionality
- [x] Implement public investor functions (AC: 6)
  - [x] Create `invest()` function with INVESTOR_ROLE requirement
  - [x] Create `withdraw()` function with INVESTOR_ROLE requirement
  - [x] Add function signatures and basic structure
- [x] Implement operator functions (AC: 7)
  - [x] Create `withdrawLoan()` function with onlyOperator modifier
  - [x] Create `depositPrincipal()` function with onlyOperator modifier
  - [x] Create `depositInterest()` function with onlyOperator modifier
- [x] Set up access control enforcement (AC: 8)
  - [x] Implement admin role management functions
  - [x] Test role-based permission enforcement
  - [x] Verify only admin can grant/revoke OPERATOR_ROLE

## Dev Notes

### Architecture Compliance
- **Access Control Pattern**: Must follow OpenZeppelin AccessControl patterns exactly as specified in Architecture
- **Role Definitions**: Three-tier role system (DEFAULT_ADMIN_ROLE, OPERATOR_ROLE, INVESTOR_ROLE) mandatory
- **Security Layers**: ReentrancyGuard and Pausable inheritance required for all external functions
- **Permission Model**: Operator functions restricted to OPERATOR_ROLE, public functions to INVESTOR_ROLE

### Role-Based Access Control Implementation
**Role Hierarchy:**
- **DEFAULT_ADMIN_ROLE**: Contract deployer, can manage all roles and contract settings
- **OPERATOR_ROLE**: Master wallet (borrower), can withdraw loans, process repayments, manage contract lifecycle
- **INVESTOR_ROLE**: Public role, can invest and withdraw from their positions

**Role Management Functions:**
```solidity
function grantOperatorRole(address operator) external onlyRole(DEFAULT_ADMIN_ROLE)
function revokeOperatorRole(address operator) external onlyRole(DEFAULT_ADMIN_ROLE)
```

### Security Requirements
- **Reentrancy Protection**: All external functions must use `nonReentrant` modifier
- **Pausable Pattern**: Contract supports emergency pause functionality
- **Input Validation**: All parameters must be validated before state changes
- **Role Validation**: Function access must be validated against role permissions

### Function Signatures (Per Architecture)
**Public Functions (INVESTOR_ROLE):**
```solidity
function invest(uint256 amount) external nonReentrant onlyRole(INVESTOR_ROLE)
function withdraw(uint256 shares) external nonReentrant onlyRole(INVESTOR_ROLE)
```

**Operator Functions (onlyOperator):**
```solidity
function withdrawLoan(uint256 amount) external nonReentrant onlyOperator
function depositPrincipal(uint256 amount) external nonReentrant onlyOperator
function depositInterest(uint256 amount) external nonReentrant onlyOperator
```

### Smart Contract State Variables
```solidity
// Access Control Roles
bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");

// Contract State (for future implementation)
address public immutable borrower;
uint256 public immutable loanAmount;
address public immutable asset;
```

### Gas Optimization Considerations
- **Immutable Variables**: Use `immutable` for contract deployment constants
- **Role Constants**: Pre-compute role hashes to save gas
- **Function Modifiers**: Efficient role checking with minimal gas overhead
- **State Packing**: Consider struct packing for future state variables

### OpenZeppelin Integration Details
- **Version**: Using OpenZeppelin contracts v5.5.0 (installed in Story 1.1)
- **Imports**: Must import from `@openzeppelin/contracts/access/AccessControl.sol`
- **Pattern**: Follow OpenZeppelin best practices for role-based access control

### Error Handling Requirements
- **AccessControl Errors**: Handle missing roles and unauthorized access
- **Reentrancy Errors**: Use ReentrancyGuard for protection
- **Pausable Errors**: Handle when contract is paused
- **Custom Errors**: Consider using custom errors for gas efficiency

### Testing Strategy Preparation
- **Role Testing**: Test all role assignments and permissions
- **Modifier Testing**: Verify onlyOperator and nonReentrant modifiers work correctly
- **Access Control Testing**: Test unauthorized access attempts fail
- **Gas Testing**: Verify function gas costs remain reasonable

### Previous Story Intelligence
- **Foundry Setup**: Story 1.1 established Foundry project with OpenZeppelin v5.5.0
- **Project Structure**: Located in `/contracts/src/MortgageContract.sol`
- **Compilation**: Contract compiles successfully with zero errors
- **Configuration**: Foundry.toml configured with optimizer (200 runs) for gas efficiency

### Integration Requirements
- **Story 1.3 Dependency**: Event system will build on this foundation
- **Story 1.4 Dependency**: Test suite will verify AccessControl functionality
- **Future Stories**: All subsequent contract stories depend on this AccessControl foundation

### Event System Preparation
- **Role Management Events**: Consider events for role changes
- **Access Events**: Log important access control changes
- **Security Events**: Track important security-related actions

### Security Best Practices
- **Least Privilege**: Grant minimum necessary permissions for each role
- **Role Separation**: Clear separation between investor and operator capabilities
- **Audit Trail**: All role changes should emit events for transparency
- **Emergency Controls**: Pausable functionality for emergency situations

### Code Structure Requirements
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract MortgageContract is AccessControl, ReentrancyGuard, Pausable {
    // Role constants
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");

    // Constructor
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // Modifiers
    modifier onlyOperator() {
        require(hasRole(OPERATOR_ROLE, msg.sender), "Caller is not operator");
        _;
    }

    // Functions will be implemented in subsequent stories
}
```

### Project Context Reference

**Architecture Alignment:**
- Access Control Pattern: Three-tier role system [Source: docs/architecture.md#Access Control Pattern]
- Security Requirements: OpenZeppelin libraries mandatory [Source: docs/architecture.md#Smart Contract Architecture]
- Gas Optimization: Target <0.01 ETH per operation [Source: docs/architecture.md#Core Architectural Decisions]

**Epic Integration:**
- Foundation for Epic 1: Platform Foundation & Smart Contract Infrastructure
- Prerequisite for Story 1.3: Event System Implementation
- Enables secure investor and operator interactions
- Supports role-based permission enforcement

**Development Path:**
- Enables Story 1.3: Event System for Complete Audit Trail
- Supports Story 1.4: Foundry Test Suite with AccessControl testing
- Foundation for Epic 2: User Authentication & Wallet Integration

### References

- [Architecture: Access Control Pattern](docs/architecture.md#Access Control Pattern)
- [Architecture: Smart Contract Security](docs/architecture.md#Smart Contract Architecture)
- [Architecture: AI-Agent Conflict Prevention](docs/architecture.md#-ai-agent-conflict-prevention--development-conventions)
- [OpenZeppelin AccessControl Documentation](https://docs.openzeppelin.com/contracts/5.x/api/access#AccessControl)
- [OpenZeppelin ReentrancyGuard Documentation](https://docs.openzeppelin.com/contracts/5.x/api/security#ReentrancyGuard)
- [Previous Story: 1.1 Foundry Project Setup](1-1-foundry-project-setup.md)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20251101)

### Debug Log References

### Completion Notes List

**Implementation Summary:**
- Successfully implemented MortgageContract with complete AccessControl infrastructure
- Upgraded Solidity to 0.8.20 for OpenZeppelin v5.5.0 compatibility
- Created comprehensive role-based access control with three-tier system
- Implemented all required security patterns (ReentrancyGuard, Pausable)
- All acceptance criteria met:
  - AC1: ✓ MortgageContract inherits from AccessControl, ReentrancyGuard, Pausable
  - AC2: ✓ Defines DEFAULT_ADMIN_ROLE, OPERATOR_ROLE, INVESTOR_ROLE constants
  - AC3: ✓ Constructor sets deployer as DEFAULT_ADMIN_ROLE with proper initialization
  - AC4: ✓ onlyOperator modifier implemented and properly applied
  - AC5: ✓ nonReentrant modifier applied to all external functions
  - AC6: ✓ invest() and withdraw() functions implemented with INVESTOR_ROLE requirement
  - AC7: ✓ withdrawLoan(), depositPrincipal(), depositInterest() functions with onlyOperator modifier
  - AC8: ✓ Role-based permissions properly enforced with admin-only role management

**Test Coverage:**
- Created comprehensive test suite with 14 test cases
- All tests passing (100% success rate)
- Tests cover all role assignments, permissions, and modifier functionality
- Includes security tests for unauthorized access attempts

### File List

**Modified Files:**
- `contracts/src/MortgageContract.sol` - Complete AccessControl implementation with all required functions
- `contracts/foundry.toml` - Updated Solidity version to 0.8.20 for OpenZeppelin compatibility

**New Files:**
- `contracts/test/MortgageContract.t.sol` - Comprehensive test suite with 14 test cases covering all AccessControl functionality

**Libraries Used:**
- OpenZeppelin AccessControl v5.5.0
- OpenZeppelin ReentrancyGuard v5.5.0
- OpenZeppelin Pausable v5.5.0

## Change Log

**2025-12-05** - AccessControl Implementation Completed
- Implemented complete role-based access control system
- Upgraded to Solidity 0.8.20 for OpenZeppelin v5.5.0 compatibility
- Created comprehensive test suite with 14 test cases
- All acceptance criteria met, story ready for review