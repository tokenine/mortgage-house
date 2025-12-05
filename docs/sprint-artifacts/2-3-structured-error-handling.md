# Story 2.3: Create Structured Error Handling System

Status: ready-for-dev

## Story

As a user experience designer,
I want consistent, helpful error messages for all blockchain operations,
So that users understand what went wrong and how to resolve issues.

## Acceptance Criteria

1. **Structured Error Format**: All errors follow the structured format: `{scope: 'CONTRACT'|'FRONTEND'|'NETWORK', type: string, code?: string, message: string}`
2. **Contract Error Translation**: Contract errors are translated from technical messages to user-friendly explanations
3. **Network Error Handling**: Network errors include retry suggestions and connection status indicators
4. **Frontend Validation Errors**: Frontend validation errors provide specific guidance for correction
5. **Error Logging**: All errors are logged for debugging while showing simplified messages to users
6. **User-Friendly Messages**: Error messages are clear, actionable, and non-technical
7. **Recovery Actions**: Appropriate recovery actions are suggested for each error type
8. **Visual Distinction**: Error state is visually distinct from success states with consistent styling
9. **Support Contact**: Support contact information is available for unresolved issues

## Tasks / Subtasks

- [ ] Define structured error types (AC: 1)
  - [ ] Create MortgageError interface with required fields
  - [ ] Define error scope categories (CONTRACT, FRONTEND, NETWORK)
  - [ ] Create error type classification system
  - [ ] Set up error code mapping system
- [ ] Implement contract error translation (AC: 2)
  - [ ] Create contract error mapping dictionary
  - [ ] Translate revert reasons to user-friendly messages
  - [ ] Handle common contract errors (insufficient funds, unauthorized, etc.)
  - [ ] Create context-aware error messages
- [ ] Add network error handling (AC: 3)
  - [ ] Detect network connection issues
  - [ ] Provide retry mechanisms for transient failures
  - [ ] Show connection status indicators
  - [ ] Handle network switching scenarios
- [ ] Create frontend validation errors (AC: 4)
  - [ ] Implement form validation error messages
  - [ ] Provide specific correction guidance
  - [ ] Create input validation helpers
  - [ ] Show real-time validation feedback
- [ ] Set up error logging system (AC: 5)
  - [ ] Create error logging service
  - [ ] Log technical details for debugging
  - [ ] Implement error categorization
  - [ ] Set up error analytics tracking
- [ ] Design user-friendly error messages (AC: 6, 7)
  - [ ] Write clear, non-technical error descriptions
  - [ ] Include actionable recovery steps
  - [ ] Create error message templates
  - [ ] Test message clarity with user scenarios
- [ ] Implement visual error state (AC: 8)
  - [ ] Create error display components
  - [ ] Design consistent error styling
  - [ ] Add error icons and visual indicators
  - [ ] Implement error state animations
- [ ] Add support contact information (AC: 9)
  - [ ] Create help contact component
  - [ ] Include support email/chat links
  - [ ] Provide FAQ links for common issues
  - [ ] Create error reporting mechanism

## Dev Notes

### Architecture Compliance
- **Error Schema**: Must follow structured MortgageError type exactly as specified in Architecture
- **Integration**: Must integrate with useMortgageContract composable from Story 2.2
- **User Experience**: Zero blockchain knowledge required - errors must be self-explanatory
- **Visual Design**: Must use consistent error patterns from Nuxt UI design system

### MortgageError Type (From Architecture)
```typescript
interface MortgageError {
  scope: 'CONTRACT' | 'FRONTEND' | 'NETWORK';
  type: string;     // e.g., 'INVALID_STAGE', 'UNAUTHORIZED', 'INSUFFICIENT_SHARES'
  code?: string;    // optional: 'ERR_001', RPC codes, etc.
  message: string;  // human-readable explanation
}
```

### Error Classification System
**CONTRACT Scope Errors:**
- `INVALID_STAGE`: Operation not allowed in current stage
- `UNAUTHORIZED`: User lacks required permissions
- `INSUFFICIENT_FUNDS`: Not enough tokens for operation
- `INSUFFICIENT_SHARES`: Not enough shares for withdrawal
- `INVALID_AMOUNT`: Amount is zero or exceeds limits
- `CONTRACT_PAUSED`: Contract is currently paused
- `REENTRANCY_DETECTED`: Reentrancy protection triggered
- `MATH_OVERFLOW`: Arithmetic overflow/underflow

**FRONTEND Scope Errors:**
- `INVALID_INPUT`: User input validation failed
- `WALLET_NOT_CONNECTED`: Wallet connection required
- `WRONG_NETWORK`: Wrong blockchain network
- `TRANSACTION_REJECTED`: User rejected transaction
- `MISSING_PARAMETERS`: Required parameters missing
- `FORM_VALIDATION_ERROR`: Form validation failed

**NETWORK Scope Errors:**
- `NETWORK_CONNECTION_ERROR`: Internet connectivity issues
- `RPC_TIMEOUT`: RPC request timed out
- `NODE_UNAVAILABLE`: Network node unavailable
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `NETWORK_SWITCH_REQUIRED`: Network switching required
- `GAS_PRICE_ERROR`: Gas price estimation failed

### Error Translation System
**Contract Error Mapping:**
```typescript
const contractErrorMap: Record<string, Omit<MortgageError, 'code'>> = {
  // Investment errors
  'ERC20: transfer amount exceeds balance': {
    scope: 'CONTRACT',
    type: 'INSUFFICIENT_FUNDS',
    message: 'You do not have enough USDT tokens for this investment.'
  },
  'ERC20: insufficient allowance': {
    scope: 'CONTRACT',
    type: 'INSUFFICIENT_ALLOWANCE',
    message: 'Please approve USDT spending first before investing.'
  },

  // Stage-based errors
  'Contract not in funding stage': {
    scope: 'CONTRACT',
    type: 'INVALID_STAGE',
    message: 'This investment opportunity is no longer available.'
  },

  // Permission errors
  'Caller is not operator': {
    scope: 'CONTRACT',
    type: 'UNAUTHORIZED',
    message: 'Only authorized operators can perform this action.'
  },

  // Share errors
  'Insufficient shares': {
    scope: 'CONTRACT',
    type: 'INSUFFICIENT_SHARES',
    message: 'You do not have enough shares for this withdrawal.'
  }
};
```

### Error Handling Composable
**useErrorHandler Composable:**
```typescript
export const useErrorHandler = () => {
  const errors = ref<MortgageError[]>([]);
  const currentError = ref<MortgageError | null>(null);

  const handleError = (error: any, context?: string) => {
    const mortgageError = parseError(error, context);
    currentError.value = mortgageError;
    errors.value.push(mortgageError);

    // Log technical details for debugging
    logError(error, mortgageError);

    // Track error analytics
    trackError(mortgageError);
  };

  const clearError = () => {
    currentError.value = null;
  };

  const clearAllErrors = () => {
    errors.value = [];
    currentError.value = null;
  };

  return {
    currentError: readonly(currentError),
    errors: readonly(errors),
    handleError,
    clearError,
    clearAllErrors
  };
};
```

### Error Display Components
**ErrorAlert Component:**
```vue
<template>
  <div v-if="error" class="error-alert" :class="errorScopeClass">
    <div class="error-icon">
      <Icon name="heroicons:exclamation-triangle" />
    </div>

    <div class="error-content">
      <h3 class="error-title">{{ errorTitle }}</h3>
      <p class="error-message">{{ error.message }}</p>

      <div v-if="recoveryActions.length" class="error-actions">
        <UButton
          v-for="action in recoveryActions"
          :key="action.label"
          :variant="action.primary ? 'solid' : 'outline'"
          size="sm"
          @click="action.handler"
        >
          {{ action.label }}
        </UButton>
      </div>

      <div class="error-support">
        <span class="support-text">Need help?</span>
        <ULink to="/support" class="support-link">Contact Support</ULink>
      </div>
    </div>

    <UButton
      icon="heroicons:x-mark"
      variant="ghost"
      size="sm"
      class="error-close"
      @click="$emit('close')"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  error: MortgageError;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const errorTitle = computed(() => {
  return titles[props.error.type] || 'Something went wrong';
});

const errorScopeClass = computed(() => {
  return `error-${props.error.scope.toLowerCase()}`;
});

const recoveryActions = computed(() => {
  return getRecoveryActions(props.error);
});
</script>
```

### Network Error Recovery
**Network Error Handler:**
```typescript
const handleNetworkError = (error: any) => {
  if (error.code === 'NETWORK_ERROR') {
    return {
      scope: 'NETWORK' as const,
      type: 'NETWORK_CONNECTION_ERROR',
      message: 'Network connection lost. Please check your internet connection.',
      code: error.code
    };
  }

  if (error.code === 'TIMEOUT') {
    return {
      scope: 'NETWORK' as const,
      type: 'RPC_TIMEOUT',
      message: 'Request timed out. Please try again.',
      code: error.code
    };
  }

  // Auto-retry logic for transient errors
  if (isTransientError(error)) {
    return {
      scope: 'NETWORK' as const,
      type: 'TRANSIENT_ERROR',
      message: 'Temporary network issue. Retrying...',
      code: error.code,
      retry: true
    };
  }

  return null;
};
```

### Frontend Validation Errors
**Form Validation Error Messages:**
```typescript
const validationErrorMap = {
  investmentAmount: {
    required: 'Please enter an investment amount',
    min: 'Minimum investment is 1 USDT',
    max: 'Investment amount exceeds available funding',
    invalid: 'Please enter a valid amount'
  },

  walletConnection: {
    required: 'Please connect your wallet to continue',
    wrongNetwork: 'Please switch to the correct network',
    locked: 'Please unlock your wallet'
  },

  withdrawalAmount: {
    required: 'Please enter a withdrawal amount',
    exceedsBalance: 'Withdrawal amount exceeds available balance',
    insufficientShares: 'Insufficient shares for withdrawal'
  }
};
```

### Recovery Action System
**Recovery Actions Configuration:**
```typescript
const recoveryActions = {
  'INSUFFICIENT_FUNDS': [
    {
      label: 'Buy USDT',
      primary: true,
      handler: () => navigateTo('/buy-usdt')
    },
    {
      label: 'Check Balance',
      primary: false,
      handler: () => checkBalance()
    }
  ],

  'WRONG_NETWORK': [
    {
      label: 'Switch Network',
      primary: true,
      handler: () => switchNetwork()
    },
    {
      label: 'Network Guide',
      primary: false,
      handler: () => navigateTo('/network-guide')
    }
  ],

  'NETWORK_CONNECTION_ERROR': [
    {
      label: 'Retry',
      primary: true,
      handler: () => retryLastAction()
    },
    {
      label: 'Check Connection',
      primary: false,
      handler: () => testConnection()
    }
  ]
};
```

### Error Logging and Analytics
**Error Logging Service:**
```typescript
class ErrorLogger {
  private logs: ErrorLog[] = [];

  log(error: any, mortgageError: MortgageError, context?: string) {
    const logEntry: ErrorLog = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      mortgageError,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.logs.push(logEntry);

    // Send to analytics service
    this.sendToAnalytics(logEntry);

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Mortgage Error');
      console.error('Technical Error:', error);
      console.error('User Error:', mortgageError);
      console.log('Context:', context);
      console.groupEnd();
    }
  }

  private async sendToAnalytics(log: ErrorLog) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
      });
    } catch (e) {
      // Silently fail analytics to avoid error loops
    }
  }
}
```

### Integration with Previous Stories
- **Story 2.2**: Integrates with useMortgageContract composable for consistent error handling
- **Story 2.1**: Uses Web3 Modal connection state for network-related errors
- **Story 1.3**: Maps contract events to potential error scenarios
- **Story 1.2**: Handles AccessControl permission errors appropriately

### Testing Requirements
- **Error Classification**: Test all error types and scopes
- **Message Clarity**: User testing for message comprehension
- **Recovery Actions**: Test all recovery action flows
- **Visual Consistency**: Design testing for error components

### Performance Considerations
- **Error Caching**: Cache repeated errors to avoid duplicate handling
- **Debouncing**: Debounce error display to prevent spam
- **Memory Management**: Clear old errors to prevent memory leaks
- **Analytics Throttling**: Throttle error analytics to reduce overhead

### Accessibility Requirements
- **Screen Reader Support**: Proper ARIA labels for error messages
- **Keyboard Navigation**: Error dismissible via keyboard
- **Color Contrast**: Error states meet WCAG contrast requirements
- **Focus Management**: Focus shifts to error when displayed

### Project Context Reference

**Architecture Alignment:**
- Error Format: Structured MortgageError type [Source: docs/architecture.md#Error Message Format]
- User Experience: Zero blockchain knowledge required [Source: docs/architecture.md#Non-Functional Requirements]
- Visual Design: Consistent error patterns [Source: docs/architecture.md#Frontend Architecture]

**Epic Integration:**
- Completes Epic 2: User Authentication & Wallet Integration
- Essential for Epic 3: Investment flow user experience
- Critical for Epic 4: Portfolio management reliability
- Foundation for Epic 5: Operator error handling

**Development Path:**
- Integrates with Story 2.2: MortgageContract composable
- Depends on Story 2.1: Web3 Modal connection state
- Enhances Epic 3: Investment error recovery
- Supports Epic 4: Portfolio error clarity

### References

- [Architecture: Error Message Format](docs/architecture.md#Error Message Format)
- [Architecture: Frontend Architecture](docs/architecture.md#Frontend Architecture)
- [Previous Story: 2.2 MortgageContract Composable](2-2-mortgage-contract-composable.md)
- [Previous Story: 2.1 Nuxt Web3 Setup](2-1-nuxt-web3-setup.md)
- [Nuxt UI Error Components Documentation](https://ui.nuxt.com/components/alert)
- [Vue 3 Error Handling Best Practices](https://vuejs.org/guide/scaling-up/error-handling.html)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20251101)

### Debug Log References

### Completion Notes List

### File List