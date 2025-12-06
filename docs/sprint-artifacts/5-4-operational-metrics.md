# Story 5.4: Implement Operational Metrics and Monitoring

**Status:** ready-for-dev
**Epic:** 5 - Master Wallet Operator Controls
**Created:** 2025-12-06
**Author:** Scrum Master (Bob)

---

## 🎯 Story Foundation

As a system manager,
I want comprehensive operational metrics and real-time monitoring,
So that I can oversee the entire mortgage portfolio and optimize operations.

## ✅ Acceptance Criteria

### AC1: Portfolio-Level Metrics Dashboard
**Given** I am logged in as an operator
**When** I view the operator dashboard
**Then** I see portfolio-level metrics: total funded volume, active contracts, repayment status, investor count
**And** I can view individual contract metrics: funding progress, repayment history, investor distributions
**And** I see real-time alerts for important events (funding complete, repayments due, contract milestones)
**And** I can export operational reports for compliance and business analysis

### AC2: Contract Analytics and Insights
**Given** I need detailed information about a specific contract
**When** I access contract analytics
**Then** I see comprehensive breakdowns: investor participation, payment schedules, distribution calculations
**And** I can view all historical events with complete audit trail
**And** I have access to performance metrics and compliance indicators
**And** I can generate custom reports for different stakeholders

### AC3: Real-time Monitoring and Alerts
**Given** there are multiple contracts in various stages
**When** I monitor the overall portfolio
**Then** I can identify trends and patterns across the portfolio
**And** I receive proactive alerts for potential issues or opportunities
**And** I have tools for portfolio optimization and risk management
**And** I can easily scale operations without additional administrative overhead

### AC4: Reporting and Export Capabilities
**Given** I need to provide operational insights to stakeholders
**When** I generate reports
**Then** I can export comprehensive operational data in multiple formats (CSV, JSON, PDF)
**And** reports include portfolio performance, contract lifecycle metrics, and compliance indicators
**And** custom date ranges and filters are available for targeted analysis
**And** automated reports can be scheduled for regular stakeholder updates

---

## 🏗️ Developer Context Section

### 🔴 CRITICAL: Do Not Violate These Constraints

**SMART CONTRACT DEVELOPMENT:**
- MUST leverage existing event system from Epic 1 for metrics data [Source: 1-3-event-system.md]
- MUST integrate with contract deployment data from Epic 5.1 [Source: 5-1-deployment-interface.md]
- MUST use loan operation data from Epic 5.2 for performance metrics [Source: 5-2-loan-operations.md]
- MUST incorporate stage transition data from Epic 5.3 [Source: 5-3-stage-management.md]

**FRONTEND INTEGRATION:**
- MUST extend existing useMortgageContract composable with metrics functions [Source: 2-2-mortgage-contract-composable.md]
- MUST use structured error handling system from Epic 2 [Source: 2-3-structured-error-handling.md]
- MUST maintain real-time state synchronization from Epic 3 [Source: 3-2-funding-progress.md]
- MUST integrate with portfolio dashboard patterns from Epic 4.2 [Source: 4-2-portfolio-dashboard.md]

### 📊 Technical Requirements

**Smart Contract Event Analysis Functions:**

```solidity
// Extend MortgageContract.sol with additional view functions for metrics

function getPortfolioMetrics() external view returns (
    uint256 totalFunded,
    uint256 totalInvestors,
    uint256 activeContracts,
    uint256 totalPrincipalRepaid,
    uint256 totalInterestPaid,
    uint256 totalValueLocked
) {
    // Calculate portfolio-wide metrics from contract state
    // Efficient queries using existing state variables
    // Return structured data for frontend consumption
}

function getContractAnalytics() external view returns (
    uint256 fundingProgress,
    uint256 investorCount,
    uint256 averageInvestment,
    uint256 totalDistributed,
    uint256 repaymentRate,
    uint256 timeToCompletion
) {
    // Calculate per-contract analytics
    // Include historical performance metrics
    // Provide investment and return calculations
}

function getInvestorBreakdown() external view returns (
    address[] memory investors,
    uint256[] memory shares,
    uint256[] memory percentages,
    uint256[] memory withdrawableAmounts
) {
    // Return detailed investor participation data
    // Calculate ownership percentages
    // Include withdrawable amount calculations
}
```

**Frontend Metrics Composable:**

```typescript
// Create new composable: /frontend/composables/useOperationalMetrics.ts
export function useOperationalMetrics() {
    const portfolioMetrics = ref<PortfolioMetrics>()
    const contractAnalytics = ref<ContractAnalytics[]>([])
    const alertSettings = ref<AlertSettings>()
    const reportFilters = ref<ReportFilters>()

    // Portfolio-wide metrics calculation
    const calculatePortfolioMetrics = async () => {
        const contracts = await getAllDeployedContracts()
        const metrics = await Promise.all(
            contracts.map(contract => getContractMetrics(contract.address))
        )

        portfolioMetrics.value = {
            totalFunded: metrics.reduce((sum, m) => sum + m.fundedAmount, 0),
            activeContracts: metrics.filter(m => m.stage === 'ACTIVE').length,
            totalInvestors: new Set(metrics.flatMap(m => m.investors)).size,
            totalPrincipalRepaid: metrics.reduce((sum, m) => sum + m.principalRepaid, 0),
            totalInterestPaid: metrics.reduce((sum, m) => sum + m.interestPaid, 0),
            averageROI: calculateAverageROI(metrics),
            portfolioHealth: calculatePortfolioHealth(metrics)
        }
    }

    // Real-time event monitoring for alerts
    const monitorEvents = () => {
        useMortgageContract().watchEvents((event) => {
            if (isSignificantEvent(event)) {
                triggerAlert(createAlert(event))
                updateMetrics()
            }
        })
    }

    // Report generation
    const generateReport = async (filters: ReportFilters) => {
        const data = await fetchReportData(filters)
        return formatReport(data, filters.format)
    }

    return {
        portfolioMetrics: readonly(portfolioMetrics),
        contractAnalytics: readonly(contractAnalytics),
        calculatePortfolioMetrics,
        generateReport,
        monitorEvents
    }
}
```

**Metrics Dashboard Components:**

```vue
<!-- /frontend/components/operator/MetricsDashboard.vue -->
<template>
    <div class="metrics-dashboard">
        <!-- Portfolio Overview Cards -->
        <MetricsGrid :metrics="portfolioMetrics" />

        <!-- Real-time Alerts Panel -->
        <AlertsPanel :alerts="activeAlerts" @dismiss="dismissAlert" />

        <!-- Contract Analytics Table -->
        <ContractAnalyticsTable
            :contracts="contractAnalytics"
            @view-details="showContractDetails"
        />

        <!-- Charts and Visualizations -->
        <MetricsCharts :data="chartData" />

        <!-- Report Generation Controls -->
        <ReportControls @generate-report="generateReport" />
    </div>
</template>

<!-- /frontend/components/operator/ContractAnalytics.vue -->
<template>
    <div class="contract-analytics">
        <ContractHeader :contract="contract" />

        <!-- Performance Metrics -->
        <PerformanceMetrics :metrics="contract.performance" />

        <!-- Investor Participation Chart -->
        <InvestorChart :investors="contract.investors" />

        <!-- Repayment Schedule -->
        <RepaymentSchedule :schedule="contract.repaymentSchedule" />

        <!-- Event Timeline -->
        <EventTimeline :events="contract.events" />
    </div>
</template>
```

**Alert System Implementation:**

```typescript
// /frontend/utils/alertSystem.ts
export class AlertSystem {
    private alerts: Alert[] = []
    private thresholds: AlertThresholds

    constructor() {
        this.thresholds = getDefaultThresholds()
        this.startMonitoring()
    }

    private startMonitoring() {
        // Monitor contract events for alert conditions
        setInterval(() => this.checkAlertConditions(), 30000) // 30 seconds
    }

    checkAlertConditions() {
        // Check funding completion alerts
        // Check repayment due alerts
        // Check unusual activity alerts
        // Check portfolio health alerts
    }

    triggerAlert(alert: Alert) {
        this.alerts.push(alert)
        this.notifyOperators(alert)
        this.logAlert(alert)
    }

    getActiveAlerts(): Alert[] {
        return this.alerts.filter(alert => !alert.dismissed)
    }
}
```

### 🎨 Architecture Compliance

**File Structure Requirements:**
```
/frontend/composables/ (new)
  - useOperationalMetrics.ts - metrics calculation and management
  - useAlertSystem.ts - real-time alert monitoring

/frontend/components/operator/ (new)
  - MetricsDashboard.vue - main metrics overview
  - ContractAnalytics.vue - detailed contract analytics
  - MetricsGrid.vue - portfolio metrics cards
  - AlertsPanel.vue - real-time alerts display
  - MetricsCharts.vue - data visualization components

/frontend/utils/ (new)
  - alertSystem.ts - alert monitoring and notification
  - reportGenerator.ts - report creation and export
  - metricsCalculations.ts - metric calculation utilities

/frontend/pages/operator/ (extend existing)
  - metrics.vue - comprehensive metrics dashboard
  - analytics.vue - detailed analytics interface
  - reports.vue - report generation and history

/contracts/src/MortgageContract.sol (extend existing)
  - Add metrics view functions
  - Maintain existing event system for data source
  - Ensure gas-efficient query patterns

/contracts/test/OperationalMetrics.t.sol (new)
  - Test metrics calculation accuracy
  - Test gas efficiency of query functions
  - Test data integrity and consistency
```

**Naming Conventions:**
- Functions: camelCase with clear purpose (`calculatePortfolioMetrics`, `generateReport`)
- Components: PascalCase with specific purpose (`MetricsDashboard`, `AlertsPanel`)
- Variables: descriptive with clear ownership (`portfolioMetrics`, `alertSettings`)
- Files: kebab-case for components, camelCase for utilities

**Gas Optimization Requirements:**
- Target <0.01 ETH for metrics queries [Source: docs/architecture.md#Core Architectural Decisions]
- Use efficient data structures for metric calculations
- Minimize gas costs for portfolio-wide queries
- Cache frequently accessed metrics data

### 📚 Library & Framework Requirements

**Frontend Libraries:**
- Chart.js or similar for data visualization
- Vue composition API for reactive metrics state
- Export libraries (CSV, JSON, PDF generation)
- Real-time event monitoring with WebSocket connections

**Data Processing:**
- Efficient aggregation of contract event data
- Real-time metric calculations and updates
- Historical data analysis and trend detection
- Alert threshold configuration and monitoring

**Performance Optimization:**
- Lazy loading for large datasets
- Virtual scrolling for contract lists
- Efficient data fetching and caching
- Background processing for complex calculations

### 🧪 Testing Requirements

**Smart Contract Tests Must Include:**
1. **Metrics Calculation Accuracy**
   - Test all view functions return correct data
   - Test gas efficiency of queries
   - Test edge cases and boundary conditions
   - Test data consistency across multiple queries

2. **Data Integrity Verification**
   - Test metrics reflect actual contract state
   - Test historical data accuracy
   - Test calculations match expected formulas
   - Test cross-contract metric aggregation

**Frontend Tests Must Include:**
1. **Metrics Dashboard Functionality**
   - Test real-time metric updates
   - Test chart rendering and interactivity
   - Test filtering and sorting capabilities
   - Test responsive design for mobile devices

2. **Alert System Testing**
   - Test alert condition detection
   - Test notification delivery
   - Test alert dismissal and management
   - Test threshold configuration

3. **Report Generation Testing**
   - Test report data accuracy
   - Test export functionality for all formats
   - Test custom filtering and date ranges
   - Test automated report scheduling

### 🔍 Previous Story Intelligence

**Epic 5.3 Learnings (Stage Management):**
- Stage transition event data for lifecycle metrics [Source: 5-3-stage-management.md]
- Contract state tracking for performance analysis [Source: 5-3-stage-management.md]
- Real-time update patterns for dashboard synchronization [Source: 5-3-stage-management.md]

**Epic 5.2 Learnings (Loan Operations):**
- Loan operation event data for financial metrics [Source: 5-2-loan-operations.md]
- Repayment tracking for portfolio performance [Source: 5-2-loan-operations.md]
- Real-time state changes for alert triggers [Source: 5-2-loan-operations.md]

**Epic 5.1 Learnings (Contract Deployment):**
- Contract deployment metadata for portfolio tracking [Source: 5-1-deployment-interface.md]
- Parameter validation for compliance metrics [Source: 5-1-deployment-interface.md]
- Operator activity tracking for audit trails [Source: 5-1-deployment-interface.md]

**Epic 4 Learnings (Portfolio Management):**
- Portfolio dashboard patterns for metrics display [Source: 4-2-portfolio-dashboard.md]
- Real-time state synchronization techniques [Source: 4-1-pro-rata-distribution.md]
- Transaction tracking for historical analysis [Source: 4-4-transaction-tracking.md]

### 📋 Git Intelligence Summary

**Recent Commit Patterns:**
- Metrics follow event aggregation → calculation → visualization pattern
- Real-time updates use existing event listening infrastructure
- Alert system provides proactive operational insights
- Report generation uses portfolio-wide data aggregation

**File Creation Patterns:**
- New metrics components follow established operator interface patterns
- Composables maintain existing API consistency and naming
- Test files cover complete metrics lifecycle and accuracy
- Integration with existing portfolio and contract management systems

### 🌐 Latest Technical Information

**Event-Driven Metrics:**
- Use existing event system from Epic 1 as primary data source
- Aggregate events across multiple contracts for portfolio metrics
- Real-time metric updates triggered by contract events
- Historical analysis based on complete event history

**Real-time Monitoring:**
- Extend existing WebSocket connections from Epic 3
- Maintain <3 second latency for metric updates
- Handle concurrent metric calculations safely
- Provide configurable alert thresholds

**Data Visualization:**
- Follow established dashboard patterns from Epic 4.2
- Use responsive design for mobile operator access
- Provide interactive charts and drill-down capabilities
- Maintain consistent UI patterns with existing operator interfaces

### 📖 Project Context Reference

**Architecture Alignment:**
- **Event-Driven Architecture**: Leverage existing event system for metrics [Source: docs/architecture.md#Event System Requirements]
- **Real-time Requirements**: Maintain existing synchronization patterns [Source: docs/architecture.md#Real-time Requirements]
- **Dashboard Architecture**: Use established operator interface patterns [Source: docs/architecture.md#Frontend Architecture]
- **Performance Requirements**: Ensure <3 second page loads and <1 second metric updates [Source: docs/architecture.md#Core Architectural Decisions]

**Epic Integration:**
- **Foundation**: Builds on all previous Epic 5 stories for complete data
- **Enables**: Comprehensive operational oversight and business intelligence
- **Supports**: Data-driven decision making for portfolio optimization
- **Critical for**: Complete operator platform and business analytics

**Business Value:**
- **Operational Intelligence**: Real-time insights into portfolio performance
- **Risk Management**: Early detection of potential issues and opportunities
- **Compliance Reporting**: Automated generation of required reports
- **Business Optimization**: Data-driven decisions for portfolio growth

**Metrics Workflow:**
- **Data Collection**: Aggregate events from all contracts in real-time
- **Calculation**: Compute portfolio-wide and per-contract metrics
- **Visualization**: Present insights through interactive dashboards
- **Alerting**: Proactively notify operators of significant events

### 🔗 References

- [Architecture: Event System Requirements](docs/architecture.md#Event System Requirements)
- [Epic 5.1: Contract Deployment](5-1-deployment-interface.md)
- [Epic 5.2: Loan Operations](5-2-loan-operations.md)
- [Epic 5.3: Stage Management](5-3-stage-management.md)
- [Epic 4.2: Portfolio Dashboard](4-2-portfolio-dashboard.md)
- [Epic 3.2: Real-time Updates](3-2-funding-progress.md)

---

## 🎯 Dev Agent Execution Instructions

### Step 1: Implement Metrics Collection
1. **Create useOperationalMetrics composable** for data aggregation
2. **Add metrics view functions** to MortgageContract.sol for efficient queries
3. **Implement event aggregation** across all deployed contracts
4. **Calculate portfolio-wide metrics** and performance indicators

### Step 2: Create Dashboard Interface
1. **Build MetricsDashboard component** with portfolio overview
2. **Create ContractAnalytics component** for detailed contract insights
3. **Implement data visualization** with charts and graphs
4. **Add responsive design** for mobile operator access

### Step 3: Implement Alert System
1. **Create AlertSystem utility** for monitoring and notifications
2. **Define alert thresholds** for different operational events
3. **Implement real-time alerting** based on contract events
4. **Add alert management** interface for operators

### Step 4: Report Generation
1. **Create report generation utilities** for multiple export formats
2. **Implement custom filtering** and date range selection
3. **Add automated report scheduling** capabilities
4. **Ensure report accuracy** with comprehensive testing

### Step 5: Real-time Integration
1. **Extend existing event monitoring** from previous epics
2. **Trigger automatic metric updates** on contract events
3. **Maintain <3 second latency** for all metric updates
4. **Handle concurrent operations** safely without conflicts

### Step 6: Comprehensive Testing
1. **Smart contract tests** for metrics calculation accuracy
2. **Frontend tests** for dashboard functionality and responsiveness
3. **Integration tests** for complete metrics workflow
4. **Performance tests** for real-time updates and large datasets

### ✅ Success Criteria
- [ ] All portfolio metrics calculated accurately and efficiently
- [ ] Real-time dashboard updates work seamlessly
- [ ] Alert system detects and notifies significant events
- [ ] Report generation works for all formats and filters
- [ ] Mobile-responsive design implemented
- [ ] Performance targets met (<3 second loads, <1 second updates)
- [ ] Integration with existing operator systems complete

---

## 🚨 Critical Warning: Do Not Skip These Requirements

1. **MUST leverage existing event system** from Epic 1 for all metrics data
2. **MUST integrate with all Epic 5 stories** for complete operational view
3. **MUST maintain real-time updates** with <3 second latency target
4. **MUST provide comprehensive reporting** for compliance and business needs
5. **MUST include alert system** for proactive operational management
6. **MUST optimize gas usage** for metrics queries and data retrieval
7. **MUST include comprehensive testing** for accuracy and performance

---

## Dev Agent Record

### Context Reference
<!-- Implementation context will be tracked here -->

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250901)

### Debug Log References

### Completion Notes List
- Complete operational metrics story ready for development
- Integrated with all previous Epic 5 stories for comprehensive data
- All technical constraints and patterns identified from previous epics

### File List (Expected)
- `/frontend/composables/useOperationalMetrics.ts` (new)
- `/frontend/components/operator/MetricsDashboard.vue` (new)
- `/frontend/components/operator/ContractAnalytics.vue` (new)
- `/frontend/utils/alertSystem.ts` (new)
- `/frontend/utils/reportGenerator.ts` (new)
- `/contracts/src/MortgageContract.sol` (extend existing with metrics functions)
- `/contracts/test/OperationalMetrics.t.sol` (new)
- Test coverage reports and performance verification

**Status:** ready-for-dev