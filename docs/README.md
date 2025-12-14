# mortage-house Documentation Suite

Complete documentation for the mortage-house blockchain-based fractional mortgage platform.

## 📚 Documentation Overview

```
┌──────────────────────────────────────────────────────────────┐
│          MORTAGE-HOUSE DOCUMENTATION STRUCTURE              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  START HERE                                                  │
│  └─ This README (navigation guide)                           │
│                                                              │
│  USER JOURNEY & DATA FLOW DOCUMENTS                          │
│  ├─ DEVELOPMENT-SETUP.md                                    │
│  │  └─ User Journey: Developer → Local Environment          │
│  ├─ DEPLOYMENT.md                                           │
│  │  └─ Data Flow: Code → Blockchain Networks               │
│  ├─ API-REFERENCE.md                                        │
│  │  └─ Data Flow: Frontend → Smart Contract → Blockchain   │
│  ├─ TESTING.md                                              │
│  │  └─ Data Flow: Code Changes → Test Pipeline             │
│  ├─ SECURITY.md                                             │
│  │  └─ Data Flow: User Input → Protected Execution         │
│  ├─ CONTRIBUTING.md                                         │
│  │  └─ User Journey: Developer → Code Review → Merge       │
│  ├─ TROUBLESHOOTING.md                                      │
│  │  └─ Diagnostic Flows for Common Issues                  │
│  └─ GLOSSARY.md                                             │
│     └─ Technical & Domain Terminology                       │
│                                                              │
│  EXISTING DOCUMENTATION                                      │
│  ├─ docs/architecture.md (System Design)                    │
│  ├─ docs/prd-mortage-house-*.md (Requirements)             │
│  ├─ contracts/DEVELOPMENT.md (Contract-specific)           │
│  └─ docs/sprint-artifacts/ (Implementation Tracking)       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### For Developers

**New to the project?**
1. Read [GLOSSARY.md](./GLOSSARY.md) - Understand the terminology
2. Follow [DEVELOPMENT-SETUP.md](./DEVELOPMENT-SETUP.md) - Set up your environment
3. Review [CONTRIBUTING.md](./CONTRIBUTING.md) - Code standards

**Making changes?**
1. Check [API-REFERENCE.md](./API-REFERENCE.md) - Understand contract & API
2. Review [TESTING.md](./TESTING.md) - Write tests for your changes
3. Read [SECURITY.md](./SECURITY.md) - Follow security best practices

### For Deployers

**Deploying to production?**
1. Review pre-deployment checklist in [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Follow deployment procedures for your network
3. Run post-deployment verification steps
4. Monitor using provided monitoring setup

### For Operators

**Running the platform?**
1. Check [SECURITY.md](./SECURITY.md) - Security procedures
2. Monitor metrics in [DEPLOYMENT.md](./DEPLOYMENT.md)
3. Use [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for issues

## 📖 Complete Documentation Guide

### 1. **DEVELOPMENT-SETUP.md**
Getting your local development environment ready.

**Includes:**
- Prerequisites and installation
- Smart contract setup (Foundry/Forge)
- Frontend setup (Next.js/Vite)
- Local testnet deployment
- Verification steps
- Common issues & solutions

**User Journey Diagram:**
```
Developer → Clone Repo → Install Dependencies → Configure .env
        → Run Tests → Start Dev Server → Local Deployment
```

**When to Use:**
- First time setting up project
- Onboarding new developers
- Setting up CI/CD environment

---

### 2. **DEPLOYMENT.md**
Deploying smart contracts and frontend to various networks.

**Includes:**
- Network configuration
- Testnet deployment (0xl3)
- Staging deployment
- Mainnet deployment (production)
- Contract verification
- Post-deployment verification
- Monitoring setup
- Rollback procedures
- Troubleshooting

**Data Flow Diagram:**
```
Smart Contract Code → Deployment Script → Blockchain Network
          ↓
Contract Verification → Frontend Config → Vercel/CDN
          ↓
Monitoring Setup → Real-time Tracking
```

**When to Use:**
- Deploying contract to new network
- Release preparation
- Maintenance & upgrades

---

### 3. **API-REFERENCE.md**
Complete API documentation for smart contract functions and frontend endpoints.

**Includes:**
- Smart contract function reference (8 core functions)
- Complete parameter & return documentation
- Frontend API endpoints
- Integration examples
- Error handling
- User journey from UI to blockchain

**Data Flow Diagram:**
```
User Interface → Frontend Validation → Web3 Library
        → Wallet Signing → RPC Broadcasting
        → Smart Contract Execution → Blockchain
        → Event Emitted → Frontend Updates
```

**When to Use:**
- Building frontend features
- Integrating with smart contract
- Understanding function requirements

---

### 4. **TESTING.md**
Comprehensive testing strategy and execution guide.

**Includes:**
- Unit test examples (Foundry)
- Integration test examples
- Frontend test setup (Vitest)
- E2E test setup (Playwright)
- Gas optimization benchmarks
- Test coverage targets
- Running full test suite

**Testing Pipeline Diagram:**
```
Code Change → Unit Tests → Integration Tests
        → Gas Report → Security Checks
        → Frontend Tests → All Passing ✓
```

**When to Use:**
- Writing new features
- Fixing bugs
- Before submitting PR
- Performance optimization

---

### 5. **SECURITY.md**
Security architecture, best practices, and operational procedures.

**Includes:**
- Smart contract security (Access control, Reentrancy, etc.)
- Frontend security (Input validation, CSP, XSS prevention)
- Wallet & key management
- Transaction security
- Compliance considerations
- Audit checklist
- Incident response procedures

**Security Layers Diagram:**
```
User Browser → Frontend Layer → Web3 Layer
        → Smart Contract Layer → Blockchain Level
```

**When to Use:**
- Code review for security issues
- Before production deployment
- Security incident response
- Audit preparation

---

### 6. **CONTRIBUTING.md**
Guidelines for contributing code and documentation.

**Includes:**
- Code standards (Solidity, TypeScript)
- Git commit conventions
- PR submission process
- Code review guidelines
- Testing requirements
- Documentation requirements
- Performance considerations

**Contribution Workflow Diagram:**
```
Fork & Clone → Create Branch → Make Changes
        → Test Locally → Commit & Push
        → Create PR → Code Review → Approve → Merge
```

**When to Use:**
- Before making first contribution
- When submitting PR
- Code review as maintainer

---

### 7. **TROUBLESHOOTING.md**
Common issues and diagnostic procedures.

**Includes:**
- Smart contract troubleshooting
- Frontend troubleshooting
- Environment configuration issues
- Network issues
- Data flow diagnosis
- Debugging tools
- Getting help resources

**Diagnostic Flowchart:**
```
Issue Occurs → Identify Category
        → Check Specific Section
        → Follow Diagnostic Steps
        → Apply Solution
```

**When to Use:**
- Debugging development issues
- Build failures
- Deployment problems
- Runtime errors

---

### 8. **GLOSSARY.md**
Terminology and definitions.

**Includes:**
- Project-specific terms (Mortgage Bond, Fractional Investment, etc.)
- Blockchain terms (Smart Contract, Gas, Transaction, etc.)
- Technical architecture terms
- Financial terms
- Legal/compliance terms
- Development terms
- Common abbreviations

**When to Use:**
- Learning project concepts
- Understanding technical jargon
- Onboarding new team members

---

## 🔄 Data Flow Summary

### Investment Journey

```
┌─────────────────────────────────────────────────────────┐
│         COMPLETE INVESTMENT DATA FLOW                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 1. User Input (Frontend)                               │
│    └─ User enters investment amount                    │
│                                                         │
│ 2. Frontend Validation                                 │
│    └─ Check amount format & range                      │
│       (see: API-REFERENCE.md)                          │
│                                                         │
│ 3. Wallet Connection                                   │
│    └─ Web3Modal connects to MetaMask/WalletConnect    │
│       (see: SECURITY.md)                               │
│                                                         │
│ 4. USDT Approval                                       │
│    └─ User approves USDT transfer                      │
│       User signs transaction in wallet                 │
│       Broadcast to blockchain                          │
│                                                         │
│ 5. Investment Transaction                              │
│    └─ Frontend calls contract.invest()                 │
│       User signs transaction                           │
│       Broadcast to RPC (0xl3 Network)                  │
│                                                         │
│ 6. Smart Contract Execution                            │
│    └─ Contract receives transaction                    │
│       Validates: funding active, amount valid, cap OK  │
│       Transfers USDT to contract                       │
│       Updates investor shares                          │
│       Emits Invested(user, amount) event              │
│       (see: API-REFERENCE.md for details)             │
│                                                         │
│ 7. Blockchain Confirmation                             │
│    └─ Validators include transaction in block         │
│       Block propagates across network                  │
│       Transaction finality reached (12+ confirmations) │
│                                                         │
│ 8. Event Listener                                      │
│    └─ Frontend listens for Invested event             │
│       Catches emitted event                            │
│       Updates UI with confirmation                     │
│                                                         │
│ 9. Portfolio Update                                    │
│    └─ Refresh investor portfolio                       │
│       Show shares owned                                │
│       Show pending rewards                             │
│       (see: API-REFERENCE.md for getInvestorInfo())   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 📊 Documentation Matrix

| Document | Audience | Purpose | Key Diagram |
|----------|----------|---------|------------|
| DEVELOPMENT-SETUP | Developers | Environment setup | User journey |
| DEPLOYMENT | DevOps/Deployers | Release management | Data flow |
| API-REFERENCE | Frontend/Integration | Function reference | TX flow |
| TESTING | QA/Developers | Test strategy | Test pipeline |
| SECURITY | Architects/Security | Risk mitigation | Security layers |
| CONTRIBUTING | Contributors | Code standards | PR workflow |
| TROUBLESHOOTING | All | Issue diagnosis | Diagnostic flows |
| GLOSSARY | Onboarding/Reference | Terminology | None (definitions) |

## 🎯 Use Case Navigation

### "I'm new to the project"
1. GLOSSARY.md - Understand terminology
2. DEVELOPMENT-SETUP.md - Get environment ready
3. API-REFERENCE.md - Understand what the code does
4. CONTRIBUTING.md - Learn code standards

### "I'm implementing a feature"
1. API-REFERENCE.md - What functions are available?
2. DEVELOPMENT-SETUP.md - How to test locally?
3. TESTING.md - How to write tests?
4. SECURITY.md - Security considerations?
5. CONTRIBUTING.md - Code standards?

### "I'm deploying to production"
1. DEPLOYMENT.md - Deployment procedures
2. SECURITY.md - Pre-deployment checklist
3. TESTING.md - Run full test suite
4. TROUBLESHOOTING.md - What could go wrong?

### "Something is broken"
1. TROUBLESHOOTING.md - Find your issue
2. DEVELOPMENT-SETUP.md - Verify setup
3. TESTING.md - Run tests
4. SECURITY.md - Check security implications
5. Contact team if unresolved

### "I need to review code"
1. CONTRIBUTING.md - Code standards
2. SECURITY.md - Security checklist
3. TESTING.md - Test coverage
4. API-REFERENCE.md - Function correctness

## 🔗 Cross-References

Each document contains:
- **Internal links** to related documentation sections
- **Code examples** for concrete understanding
- **Diagrams** showing data flow and user journeys
- **Quick navigation** back to main areas

## 📝 Documentation Maintenance

### Version Control
- All docs are version controlled in Git
- Changes tracked with commit history
- Breaking changes flagged in PRs

### Updates Required When
- New smart contract functions added → Update API-REFERENCE.md
- New deployment network → Update DEPLOYMENT.md
- New security concerns → Update SECURITY.md
- API changes → Update API-REFERENCE.md & SECURITY.md
- Build process changes → Update DEVELOPMENT-SETUP.md
- Test patterns change → Update TESTING.md

### Keeping Docs Current
- Review docs in code review (if changes affect them)
- Update date stamps when modified
- Link to version if applicable

---

## 📞 Getting Help

| Question | Where to Look | Fallback |
|----------|--------------|----------|
| How do I set up? | DEVELOPMENT-SETUP.md | TROUBLESHOOTING.md |
| What API is available? | API-REFERENCE.md | GLOSSARY.md |
| How do I deploy? | DEPLOYMENT.md | TROUBLESHOOTING.md |
| What's this term? | GLOSSARY.md | n/a |
| How do I contribute? | CONTRIBUTING.md | n/a |
| Something's broken | TROUBLESHOOTING.md | DEVELOPMENT-SETUP.md |
| Is this secure? | SECURITY.md | CONTRIBUTING.md |
| How are tests written? | TESTING.md | API-REFERENCE.md |

## 📄 Documentation Files

All documentation files are located in `/docs/`:

```
docs/
├── README.md (this file)
├── DEVELOPMENT-SETUP.md (⭐ Start here if setting up)
├── DEPLOYMENT.md (⭐ Start here if deploying)
├── API-REFERENCE.md (⭐ Start here if building features)
├── TESTING.md
├── SECURITY.md
├── CONTRIBUTING.md
├── TROUBLESHOOTING.md
├── GLOSSARY.md
├── architecture.md (Existing: System design)
├── prd-mortage-house-*.md (Existing: Requirements)
└── sprint-artifacts/ (Existing: Sprint tracking)
```

## 🏆 Documentation Best Practices

Each documentation file includes:
- ✅ Clear title and purpose
- ✅ Table of contents (for longer docs)
- ✅ User journey or data flow diagrams (ASCII art)
- ✅ Step-by-step procedures
- ✅ Code examples
- ✅ Troubleshooting section
- ✅ Links to related documents
- ✅ Last updated date
- ✅ Version number

## 🔐 Security & Compliance

- All sensitive information uses placeholders (0x..., YOUR_KEY)
- Environment variables never committed
- Security concerns directed to security@tokenine.com
- Code examples follow security best practices
- Audit checklist included in security doc

---

**Last Updated:** December 14, 2025  
**Version:** 1.0  
**Maintainers:** tokenine Development Team

For questions about documentation, open an issue on GitHub or contact the team.
