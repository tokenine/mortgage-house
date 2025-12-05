# Story 2.1: Initialize Nuxt 3 Project with Web3 Modal Integration

Status: ready-for-dev

## Story

As a frontend developer,
I want to set up a Nuxt 3 project with Nuxt Web3 Modal and Viem integration,
So that users can connect their crypto wallets securely and efficiently.

## Acceptance Criteria

1. **Project Initialization**: Nuxt 3 project initialized at `/frontend` directory with proper structure
2. **Nuxt Web3 Modal Integration**: Nuxt Web3 Modal installed and configured for wallet connections (MetaMask, WalletConnect, etc.)
3. **Viem Integration**: Viem installed for type-safe blockchain interactions with proper TypeScript configuration
4. **TypeScript Configuration**: TypeScript strict mode enabled with proper types for Web3 operations
5. **Project Structure**: Follows established file structure with `/composables`, `/utils`, `/pages` directories
6. **Development Server**: Nuxt application starts successfully on localhost:3000 with Web3 Modal properly initialized
7. **Web3 Modal Initialization**: Web3 Modal is properly initialized and ready for wallet connections
8. **TypeScript Compilation**: TypeScript compilation succeeds without errors for Web3 integrations

## Tasks / Subtasks

- [ ] Initialize Nuxt 3 project (AC: 1)
  - [ ] Run `npx nuxi init mortage-house-frontend` in project root
  - [ ] Navigate to `/frontend` directory and install dependencies
  - [ ] Verify proper Nuxt 3 project structure creation
  - [ ] Test basic Nuxt application functionality
- [ ] Install Nuxt Web3 Modal (AC: 2)
  - [ ] Install `@nuxt/web3modal` package
  - [ ] Configure Web3 Modal in nuxt.config.ts
  - [ ] Set up wallet provider configuration (MetaMask, WalletConnect, etc.)
  - [ ] Test Web3 Modal initialization
- [ ] Install and configure Viem (AC: 3, 4)
  - [ ] Install `viem` package for blockchain interactions
  - [ ] Configure TypeScript with strict mode
  - [ ] Set up proper type definitions for Web3 operations
  - [ ] Create basic blockchain connection types
- [ ] Configure project structure (AC: 5)
  - [ ] Create `/composables` directory for Vue composables
  - [ ] Create `/utils` directory for utility functions
  - [ ] Create `/pages` directory for file-based routing
  - [ ] Verify Nuxt auto-imports functionality
- [ ] Test development server (AC: 6)
  - [ ] Run `npm run dev` to start development server
  - [ ] Verify application loads on localhost:3000
  - [ ] Test hot module replacement (HMR) functionality
  - [ ] Verify no console errors on startup
- [ ] Verify Web3 Modal integration (AC: 7)
  - [ ] Test Web3 Modal initialization on app startup
  - [ ] Verify wallet provider configuration
  - [ ] Test basic wallet connection flow
  - [ ] Confirm Web3 Modal is ready for use
- [ ] Test TypeScript compilation (AC: 8)
  - [ ] Run TypeScript compilation check
  - [ ] Verify no TypeScript errors for Web3 integrations
  - [ ] Test type safety for Viem operations
  - [ ] Confirm auto-imports work with TypeScript

## Dev Notes

### Architecture Compliance
- **Frontend Architecture**: Must use Nuxt 3 + Vite for SSR/SPA hybrid capabilities as specified in Architecture
- **Web3 Integration**: Nuxt Web3 Modal + Viem is the mandated blockchain integration pattern
- **TypeScript**: Strict TypeScript configuration required for type-safe blockchain interactions
- **File Structure**: Must follow Nuxt conventions with auto-imports for components and composables

### Technology Stack Requirements
**Core Technologies:**
- **Nuxt 3**: Vue 3 framework with SSR/SPA capabilities
- **Nuxt Web3 Modal**: Wallet connection management
- **Viem**: Type-safe Ethereum library
- **TypeScript**: Strict mode for type safety
- **Vite**: Build tool and dev server

**Nuxt Configuration (nuxt.config.ts):**
```typescript
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxt/web3modal'
  ],
  web3modal: {
    projectId: process.env.WALLETCONNECT_PROJECT_ID,
    themeMode: 'light',
    defaultChainId: 1, // Ethereum Mainnet
    chains: [1, 137], // Ethereum, Polygon
    appName: 'Mortage House',
    appDescription: 'Fractional mortgage investment platform',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    appIcon: 'https://your-app-icon.png'
  },
  typescript: {
    strict: true,
    typeCheck: true
  },
  css: ['~/assets/css/main.css']
})
```

### Project Structure Requirements
**Mandatory Directory Structure:**
```
frontend/
  ├── composables/
  │   ├── useWeb3.ts          # Web3 connection management
  │   ├── useMortgageContract.ts # Contract interactions (Story 2.2)
  │   └── useWallet.ts        # Wallet state management
  ├── pages/
  │   ├── index.vue           # Main dashboard/investment page
  │   ├── portfolio.vue       # User portfolio page
  │   └── admin.vue           # Operator controls page
  ├── utils/
  │   ├── web3/
  │   │   ├── format.ts       # Blockchain data formatting
  │   │   └── validation.ts   # Web3 input validation
  │   └── mortgage/
  │       ├── math.ts         # Mortgage calculations
  │       └── constants.ts    # Contract constants
  ├── components/
  │   ├── wallet/
  │   │   ├── WalletButton.vue
  │   │   └── NetworkDisplay.vue
  │   └── ui/                 # Reusable UI components
  ├── assets/
  │   └── css/
  │       └── main.css
  ├── plugins/
  │   └── web3.client.ts      # Web3 initialization
  └── middleware/
      └── auth.ts             # Authentication middleware
```

### Web3 Modal Configuration
**Wallet Providers:**
- **MetaMask**: Primary browser wallet
- **WalletConnect**: Mobile wallet support
- **Coinbase Wallet**: Popular exchange wallet
- **Injected Wallets**: Generic browser wallet support

**Chain Configuration:**
- **Ethereum Mainnet**: Chain ID 1 (primary deployment)
- **Polygon**: Chain ID 137 (L2 for testing/gas efficiency)
- **Optimism**: Chain ID 10 (future L2 support)

### Viem Integration Requirements
**Viem Client Setup:**
```typescript
// composables/useWeb3.ts
import { createConfig, http } from 'viem'
import { mainnet, polygon } from 'viem/chains'
import { connectorsForWallets } from '@rainbow-me/rainbowkit/dist/connectorsForWallets'

export const config = createConfig({
  chains: [mainnet, polygon],
  connectors: connectorsForWallets(
    wallets,
    { appName: 'Mortage House', projectId: 'your-project-id' }
  ),
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http()
  }
})
```

### TypeScript Configuration
**tsconfig.json Requirements:**
- **Strict Mode**: Enabled for maximum type safety
- **Viem Types**: Properly configured for blockchain types
- **Auto-imports**: Nuxt auto-imports for composables and components
- **Path Mapping**: Clean import paths for utilities

**Type Safety Requirements:**
- Contract interaction types from ABIs
- Wallet connection state typing
- Error type definitions for Web3 operations
- Network and chain type definitions

### Environment Configuration
**Required Environment Variables:**
```env
# WalletConnect Project ID
WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# App Configuration
APP_URL=http://localhost:3000
NODE_ENV=development

# Blockchain Network Configuration
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-infura-key
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/your-infura-key
```

### Development Workflow
**Local Development:**
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Access application: `http://localhost:3000`
4. Test wallet connections via Web3 Modal

**Build Process:**
1. TypeScript compilation: `npm run type-check`
2. Build application: `npm run build`
3. Preview build: `npm run preview`

### Integration with Epic 1
- **Contract ABI**: Will use ABI generated from Foundry project
- **Contract Address**: Will integrate with deployed MortgageContract
- **Type Safety**: Contract types from ABI generation
- **Testing**: Will test against local deployment

### Performance Considerations
- **Bundle Size**: Optimize Web3 libraries for production
- **Lazy Loading**: Load Web3 components only when needed
- **Tree Shaking**: Ensure unused Web3 libraries are removed
- **Caching**: Implement proper caching strategies

### Security Requirements
- **Environment Variables**: Secure RPC endpoints and project IDs
- **Origin Validation**: Proper app URL configuration
- **Network Validation**: Ensure correct network connections
- **Input Sanitization**: Validate all Web3 inputs

### Testing Strategy
**Unit Testing:**
- Composable functionality testing
- Web3 connection flow testing
- Type validation testing

**Integration Testing:**
- End-to-end wallet connection flows
- Contract interaction testing
- Network switching testing

**Development Testing:**
- Multiple wallet provider testing
- Browser compatibility testing
- Mobile wallet connection testing

### Error Handling Preparation
- **Connection Errors**: Clear messaging for wallet connection failures
- **Network Errors**: Proper network switching guidance
- **Type Errors**: TypeScript compilation error handling
- **Runtime Errors**: Graceful error recovery for Web3 operations

### Future Integration Points
- **Story 2.2**: useMortgageContract composable integration
- **Story 2.3**: Error handling system integration
- **Epic 3**: Investment flow functionality
- **Epic 4**: Portfolio management features

### Project Context Reference

**Architecture Alignment:**
- Frontend Stack: Nuxt 3 + Vite + TypeScript [Source: docs/architecture.md#Selected Starter: Custom Foundry + Nuxt 3 Monorepo]
- Web3 Integration: Nuxt Web3 Modal + Viem [Source: docs/architecture.md#Frontend Architecture]
- File Structure: Nuxt Convention [Source: docs/architecture.md#File Organization for Nuxt 3]

**Epic Integration:**
- Foundation for Epic 2: User Authentication & Wallet Integration
- Prerequisite for all frontend stories (2.2, 2.3)
- Enables wallet connectivity for investor and operator interfaces
- Supports real-time contract state synchronization

**Development Path:**
- Enables Story 2.2: MortgageContract composable implementation
- Supports Story 2.3: Structured error handling
- Foundation for Epic 3: Investment flow frontend
- Enables Epic 4: Portfolio management dashboard

### References

- [Architecture: Nuxt 3 Selection](docs/architecture.md#Selected Starter: Custom Foundry + Nuxt 3 Monorepo)
- [Architecture: Web3 Integration](docs/architecture.md#Frontend Architecture)
- [Architecture: File Organization](docs/architecture.md#File Organization for Nuxt 3)
- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Nuxt Web3 Modal Documentation](https://web3modal.com/docs/nuxt)
- [Viem Documentation](https://viem.sh)
- [Previous Epic: Epic 1 Foundation](docs/sprint-artifacts/1-4-foundry-test-suite.md)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20251101)

### Debug Log References

### Completion Notes List

### File List