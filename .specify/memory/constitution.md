<!--
Sync Impact Report - Constitution v1.1.1

VERSION CHANGE: 1.1.0 → 1.1.1
BUMP RATIONALE: PATCH bump — editorial refresh to update Last Amended date; no semantic changes to principles or governance.

MODIFIED PRINCIPLES: None
ADDED SECTIONS: None
REMOVED SECTIONS: None

TEMPLATES REQUIRING UPDATES:
  ✅ plan-template.md - Constitution Check remains aligned
  ✅ spec-template.md - Prioritization and independent testing remain aligned
  ✅ tasks-template.md - User story grouping unchanged
  ✅ agent-file-template.md - No agent-specific references conflict

FOLLOW-UP TODOS: None
-->

# Mortgage-House Constitution

## Core Principles

### I. Security-First (NON-NEGOTIABLE)

Smart contract security is paramount. All financial logic MUST be implemented with:
- OpenZeppelin battle-tested libraries for access control, reentrancy protection, and standard token interactions
- Comprehensive unit test coverage (minimum 90%) before deployment
- Gas optimization analysis to prevent denial-of-service attack vectors
- Input validation and bounds checking on all public/external functions
- Clear separation between operator controls and investor functions

**Rationale**: Financial smart contracts managing real user funds require the highest security standards. A single vulnerability can result in permanent loss of funds with no recovery mechanism on-chain.

### II. Test-First Development (NON-NEGOTIABLE)

Test-driven development is mandatory for all smart contract and critical frontend code:
- Tests MUST be written first and MUST fail before implementation begins
- Red-Green-Refactor cycle strictly enforced: Write failing test → Implement minimum code to pass → Refactor
- Contract tests using Foundry framework with comprehensive edge case coverage
- Integration tests for Web3 wallet interactions and transaction flows
- User acceptance tests matching specification scenarios

**Rationale**: The immutable nature of deployed smart contracts means bugs cannot be patched post-deployment. TDD ensures correctness before deployment and provides regression protection.

### III. Transparency & Auditability

All platform operations MUST be completely transparent and auditable:
- Every state change emits events with complete context (addresses, amounts, timestamps)
- Real-time contract state readable through view functions with no hidden state
- Complete transaction history verifiable on-chain through event logs
- Frontend displays all pending transactions with clear status updates
- Mathematical calculations (pro-rata distributions) MUST be provably correct and reproducible

**Rationale**: Trust in the platform depends on investors being able to verify all operations independently. Transparency eliminates disputes and builds confidence in automated distributions.

### IV. User Story Independence

Features MUST be implemented as independently testable user stories:
- Each user story represents a complete vertical slice of functionality
- Stories prioritized (P1, P2, P3...) with P1 deliverable as minimum viable product
- Stories can be developed, tested, and deployed independently
- Tasks organized by user story to enable parallel development
- Each story MUST have explicit acceptance criteria and independent test scenarios

**Rationale**: Independent user stories enable incremental delivery, reduce risk, allow early user feedback, and support parallel team workflows.

### V. Gas Optimization

Transaction costs directly impact platform adoption and user experience:
- Target maximum 0.01 ETH per user operation (invest, withdraw)
- Minimize storage writes; prefer memory operations where possible
- Batch operations where feasible to amortize gas costs
- Use efficient data structures (mappings over arrays for lookups)
- Measure and document gas costs for all public functions

**Rationale**: High gas costs create barriers to entry (contradicting the 1 USDT minimum investment goal) and reduce overall platform competitiveness. Efficient contracts are accessible contracts.

### VI. Simplicity & Clarity

Code MUST prioritize readability and maintainability over cleverness:
- Clear, descriptive names for all functions, variables, events, and modifiers
- Explicit is better than implicit; avoid magic numbers and unclear abstractions
- One contract per property model keeps scope isolated and comprehensible
- Start simple and add complexity only when justified by concrete requirements (YAGNI)
- Comments explain *why* decisions were made, not *what* code does (code should be self-documenting)

**Rationale**: Smart contracts are financial instruments requiring multi-stakeholder understanding (developers, auditors, users, regulators). Clarity reduces bugs, eases audits, and enables confident evolution.

### VII. Real Blockchain Integration

Frontend MUST interact with actual smart contracts, never mock blockchain operations:
- All data MUST be fetched from smart contracts using Wagmi's `useReadContract` or `useReadContracts`
- All state-changing operations MUST use `useWriteContract` with proper transaction confirmation via `useWaitForTransactionReceipt`
- ERC20 token operations MUST check allowance and approve before transfers
- Event listening MUST be implemented for real-time state updates using Wagmi's `useWatchContractEvent`
- User feedback MUST reflect actual transaction states (pending, confirming, success, error) via toast notifications
- Loading states MUST be displayed during blockchain operations
- Console logs and alerts are NOT acceptable replacements for real blockchain interactions

**Rationale**: Mock implementations create false confidence and hide integration issues until production. Real blockchain integration from day one ensures the application works correctly with actual on-chain state, gas costs, and transaction timing. This principle emerged from production implementation where mock patterns were identified and systematically replaced with real Web3 interactions.

## Security & Compliance Requirements

**Smart Contract Audit**: All contracts MUST undergo external security audit before mainnet deployment.

**Access Control**:
- Master wallet operator role for privileged operations (loan withdrawal, stage transitions)
- Investor functions (invest, withdraw) accessible to any address
- Emergency pause mechanism to halt operations if vulnerability discovered

**Legal Compliance**:
- Hybrid model: off-chain legal frameworks govern property ownership and borrower agreements
- On-chain execution provides transparency and automation within legal boundaries
- Platform does NOT provide KYC/underwriting (out of scope for MVP; handled off-chain)

**Data Privacy**:
- Blockchain transparency means all transactions are public
- No personally identifiable information stored on-chain
- Investor addresses pseudonymous but transaction amounts visible

## Development Workflow

**Branch Strategy**: Feature branches named `###-feature-name` with corresponding spec directories.

**Specification Process**:
1. Feature specification created in `/specs/###-feature-name/spec.md` with prioritized user stories
2. Implementation plan in `/specs/###-feature-name/plan.md` establishes technical approach
3. Constitution check MUST pass before research phase begins
4. Tasks generated in `/specs/###-feature-name/tasks.md` organized by user story

**Test-First Workflow**:
1. Write contract/integration tests matching acceptance criteria (tests MUST fail)
2. Implement minimum code to pass tests
3. Refactor for clarity, gas optimization, and code quality
4. Verify all tests pass and coverage targets met
5. Document gas costs and any security considerations

**Code Review Requirements**:
- All pull requests MUST pass constitution compliance check
- Smart contract changes require security-focused review
- Gas optimization analysis included in PR description
- Test coverage reports attached; no decrease in coverage percentage allowed

**Quality Gates**:
- Unit tests: 90%+ coverage for smart contracts, 80%+ for frontend
- Integration tests: All critical user flows tested end-to-end
- Gas benchmarks: All operations within target thresholds
- Security checklist: Access control, reentrancy, input validation verified

## Governance

**Constitution Authority**: This constitution supersedes all other development practices and guidelines. When conflicts arise, constitution principles take precedence.

**Amendment Process**:
- Amendments require documentation of rationale and impact analysis
- Version numbering follows semantic versioning (MAJOR.MINOR.PATCH):
  - **MAJOR**: Backward-incompatible governance changes, principle removals/redefinitions
  - **MINOR**: New principles added, material expansion of existing principles
  - **PATCH**: Clarifications, wording improvements, typo fixes
- Template updates MUST be synchronized with constitution changes
- Sync Impact Report prepended to constitution documenting all changes

**Compliance Review**:
- All specifications checked against constitution before implementation
- Pull requests include explicit constitution compliance verification
- Quarterly review of constitution relevance and effectiveness
- Complexity exceptions MUST be explicitly justified and documented

**Living Document**: This constitution evolves with the project. Amendments are expected and encouraged when better practices emerge or project context changes.

**Version**: 1.1.1 | **Ratified**: 2025-12-14 | **Last Amended**: 2025-12-15
