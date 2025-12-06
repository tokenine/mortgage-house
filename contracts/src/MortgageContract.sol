// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MortgageContract is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant MINIMUM_INVESTMENT = 1 * 10**6; // 1 USDT (6 decimals)

    // Roles
    bytes32 public constant MASTER_WALLET_ROLE = keccak256("MASTER_WALLET_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");

    // Contract state
    uint256 public loanAmount;
    uint256 public propertyValue;
    uint256 public interestRate;
    uint256 public loanTerm;
    uint256 public fundingDeadline;
    uint256 public createdAt;
    IERC20 public usdtToken;

    // Investment tracking
    uint256 public totalFunded;
    uint256 public totalShares;
    uint256 public investorCount;
    mapping(address => uint256) public shares;

    // Funding stages
    enum Stage { NOT_STARTED, FUNDING, FUNDED, ACTIVE, REPAID }
    Stage public stage;

    // Repayment tracking
    uint256 public repaidPrincipal;
    uint256 public repaidInterest;

    // Pro-rata distribution tracking
    uint256 public principalRepaid;
    uint256 public interestPaid;
    mapping(address => uint256) public withdrawnPrincipal;
    mapping(address => uint256) public withdrawnInterest;

    // Loan operations tracking
    uint256 public loanWithdrawn;
    uint256 public totalRepaid;

    // Stage management tracking
    mapping(Stage => uint256) public stageTimestamps;
    mapping(Stage => string) public stageReasons;
    address public lastStageChangedBy;
    uint256 public lastStageChangeTime;

    // Events
    event Invested(address indexed investor, uint256 amount, uint256 shares);
    event StageChanged(
        uint8 indexed oldStage,
        uint8 indexed newStage,
        address indexed changedBy,
        string reason
    );
    event Withdrawn(address indexed investor, uint256 principalAmount, uint256 interestAmount);

    // Distribution events
    event PrincipalDeposited(address indexed from, uint256 amount, uint256 totalPrincipal, uint256 perShareAmount);
    event InterestDeposited(address indexed from, uint256 amount, uint256 totalInterest, uint256 perShareAmount);
    event PayoutWithdrawn(address indexed to, uint256 principalAmount, uint256 interestAmount);

    // Contract metadata
    string public propertyDescription;
    address public borrower;

    // Add MortgageInitialized event to existing events
    event MortgageInitialized(
        address indexed borrower,
        uint256 loanAmount,
        address indexed usdtToken,
        address indexed contractAddress,
        string propertyDescription
    );

    // Loan operations events
    event LoanWithdrawn(
        address indexed borrower,
        uint256 amount,
        address indexed operator,
        uint256 timestamp
    );

    constructor(
        address _borrower,
        uint256 _loanAmount,
        address _usdtToken,
        uint256 _interestRate,
        uint256 _loanTerm,
        string memory _propertyDescription,
        address _operator
    ) {
        require(_borrower != address(0), "Invalid borrower address");
        require(_borrower != msg.sender, "Borrower cannot be deployer");
        require(_usdtToken != address(0), "Invalid USDT token address");
        require(_loanAmount > 0, "Invalid loan amount");
        require(_interestRate > 0, "Invalid interest rate");
        require(_loanTerm > 0, "Invalid loan term");
        require(_operator != address(0), "Invalid operator address");

        // Setup default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Grant operator role to specified operator
        _grantRole(OPERATOR_ROLE, _operator);

        // Set contract parameters
        borrower = _borrower;
        loanAmount = _loanAmount;
        propertyValue = _loanAmount; // Default property value to loan amount
        interestRate = _interestRate;
        loanTerm = _loanTerm;
        propertyDescription = _propertyDescription;
        usdtToken = IERC20(_usdtToken);
        createdAt = block.timestamp;

        // Set initial stage to NOT_STARTED (will be set to FUNDING when ready)
        stage = Stage.NOT_STARTED;

        // Emit initialization event
        emit MortgageInitialized(
            _borrower,
            _loanAmount,
            _usdtToken,
            address(this),
            _propertyDescription
        );
    }

    function initialize(
        uint256 _propertyValue,
        uint256 _loanAmount,
        uint256 _interestRate,
        uint256 _loanTerm,
        uint256 _fundingDeadline,
        address _usdtToken,
        bytes32[] memory _roles,
        address[] memory _roleAddresses
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_usdtToken != address(0), "Invalid USDT token address");
        require(_roles.length == _roleAddresses.length, "Arrays length mismatch");

        // Set contract parameters
        propertyValue = _propertyValue;
        loanAmount = _loanAmount;
        interestRate = _interestRate;
        loanTerm = _loanTerm;
        fundingDeadline = _fundingDeadline;
        usdtToken = IERC20(_usdtToken);
        createdAt = block.timestamp;

        // Grant roles
        for (uint256 i = 0; i < _roles.length; i++) {
            _grantRole(_roles[i], _roleAddresses[i]);
        }

        // Set initial stage
        stage = Stage.FUNDING;
    }

    /**
     * @dev Invest USDT in exchange for shares (1 USDT = 1 share)
     * @param amount Amount of USDT to invest (6 decimals)
     */
    function invest(uint256 amount) external nonReentrant onlyRole(INVESTOR_ROLE) {
        // Validate investment amount
        require(amount >= MINIMUM_INVESTMENT, "Minimum investment is 1 USDT");
        require(amount <= getRemainingFunding(), "Exceeds funding capacity");
        require(stage == Stage.FUNDING, "Investment not allowed in current stage");

        // Check if this is a new investor
        bool isNewInvestor = shares[msg.sender] == 0;

        // Transfer USDT from investor to contract
        usdtToken.safeTransferFrom(msg.sender, address(this), amount);

        // Issue shares (1 USDT = 1 share)
        shares[msg.sender] += amount;
        totalShares += amount;
        totalFunded += amount;

        // Update investor count if new
        if (isNewInvestor) {
            investorCount++;
        }

        // Check if funding is complete
        if (totalFunded >= loanAmount) {
            stage = Stage.FUNDED;
            stageTimestamps[Stage.FUNDED] = block.timestamp;
            stageReasons[Stage.FUNDED] = "Funding target reached";
            lastStageChangedBy = msg.sender;
            lastStageChangeTime = block.timestamp;
            emit StageChanged(uint8(Stage.FUNDING), uint8(Stage.FUNDED), msg.sender, "Funding target reached");
        }

        // Emit investment event
        emit Invested(msg.sender, amount, amount);
    }

    /**
     * @dev Get remaining funding amount needed
     * @return Remaining amount needed to reach loan target
     */
    function getRemainingFunding() public view returns (uint256) {
        if (totalFunded >= loanAmount) return 0;
        return loanAmount - totalFunded;
    }

    /**
     * @dev Get funding progress as a percentage (basis points, 10000 = 100%)
     * @return Progress percentage in basis points
     */
    function getFundingProgress() public view returns (uint256) {
        if (loanAmount == 0) return 0;
        return (totalFunded * 10000) / loanAmount;
    }

    /**
     * @dev Get investor's ownership percentage (basis points, 10000 = 100%)
     * @param investor Address of the investor
     * @return Ownership percentage in basis points
     */
    function getOwnershipPercentage(address investor) public view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares[investor] * 10000) / totalShares;
    }

    /**
     * @dev Get current stage as uint8
     * @return Current stage number
     */
    function getCurrentStage() external view returns (uint8) {
        return uint8(stage);
    }

    // View functions for compatibility
    function stage() external view returns (uint8) {
        return uint8(stage);
    }

    /**
     * @dev Withdraw entitled principal amount
     * @param amount Amount of principal to withdraw
     */
    function withdrawPrincipal(uint256 amount) external nonReentrant onlyRole(INVESTOR_ROLE) {
        require(amount > 0, "Amount must be greater than zero");
        require(shares[msg.sender] > 0, "No shares owned");

        uint256 withdrawable = getWithdrawablePrincipal(msg.sender);
        require(amount <= withdrawable, "Insufficient withdrawable principal");
        require(usdtToken.balanceOf(address(this)) >= amount, "Insufficient contract balance");

        // Update withdrawn tracking
        withdrawnPrincipal[msg.sender] += amount;

        // Transfer USDT to investor
        usdtToken.safeTransfer(msg.sender, amount);

        // Emit withdrawal event
        emit PayoutWithdrawn(msg.sender, amount, 0);
        emit Withdrawn(msg.sender, amount, 0);
    }

    /**
     * @dev Withdraw entitled interest amount
     * @param amount Amount of interest to withdraw
     */
    function withdrawInterest(uint256 amount) external nonReentrant onlyRole(INVESTOR_ROLE) {
        require(amount > 0, "Amount must be greater than zero");
        require(shares[msg.sender] > 0, "No shares owned");

        uint256 withdrawable = getWithdrawableInterest(msg.sender);
        require(amount <= withdrawable, "Insufficient withdrawable interest");
        require(usdtToken.balanceOf(address(this)) >= amount, "Insufficient contract balance");

        // Update withdrawn tracking
        withdrawnInterest[msg.sender] += amount;

        // Transfer USDT to investor
        usdtToken.safeTransfer(msg.sender, amount);

        // Emit withdrawal event
        emit PayoutWithdrawn(msg.sender, 0, amount);
        emit Withdrawn(msg.sender, 0, amount);
    }

    /**
     * @dev Withdraw both principal and interest amounts
     * @param principalAmount Amount of principal to withdraw
     * @param interestAmount Amount of interest to withdraw
     */
    function withdrawPayout(uint256 principalAmount, uint256 interestAmount) external nonReentrant onlyRole(INVESTOR_ROLE) {
        require(shares[msg.sender] > 0, "No shares owned");
        require(principalAmount > 0 || interestAmount > 0, "No amount to withdraw");

        uint256 withdrawablePrincipal = getWithdrawablePrincipal(msg.sender);
        uint256 withdrawableInterest = getWithdrawableInterest(msg.sender);

        require(principalAmount <= withdrawablePrincipal, "Insufficient withdrawable principal");
        require(interestAmount <= withdrawableInterest, "Insufficient withdrawable interest");

        uint256 totalAmount = principalAmount + interestAmount;
        require(usdtToken.balanceOf(address(this)) >= totalAmount, "Insufficient contract balance");

        // Update withdrawn tracking
        if (principalAmount > 0) {
            withdrawnPrincipal[msg.sender] += principalAmount;
        }
        if (interestAmount > 0) {
            withdrawnInterest[msg.sender] += interestAmount;
        }

        // Transfer total USDT to investor
        usdtToken.safeTransfer(msg.sender, totalAmount);

        // Emit withdrawal events
        emit PayoutWithdrawn(msg.sender, principalAmount, interestAmount);
        emit Withdrawn(msg.sender, principalAmount, interestAmount);
    }

    /**
     * @dev Legacy function for backward compatibility - withdraw all available amounts
     * @param principal Whether to withdraw principal
     * @param interest Whether to withdraw interest
     */
    function withdrawPayout(bool principal, bool interest) external nonReentrant onlyRole(INVESTOR_ROLE) {
        require(principal || interest, "Must specify at least one withdrawal type");

        uint256 principalAmount = 0;
        uint256 interestAmount = 0;

        if (principal) {
            principalAmount = getWithdrawablePrincipal(msg.sender);
        }
        if (interest) {
            interestAmount = getWithdrawableInterest(msg.sender);
        }

        require(principalAmount > 0 || interestAmount > 0, "No withdrawable amounts");

        uint256 totalAmount = principalAmount + interestAmount;
        require(usdtToken.balanceOf(address(this)) >= totalAmount, "Insufficient contract balance");

        // Update withdrawn tracking
        if (principalAmount > 0) {
            withdrawnPrincipal[msg.sender] += principalAmount;
        }
        if (interestAmount > 0) {
            withdrawnInterest[msg.sender] += interestAmount;
        }

        // Transfer total USDT to investor
        usdtToken.safeTransfer(msg.sender, totalAmount);

        // Emit withdrawal events
        emit PayoutWithdrawn(msg.sender, principalAmount, interestAmount);
        emit Withdrawn(msg.sender, principalAmount, interestAmount);
    }

    /**
     * @dev Start the funding phase (move from NOT_STARTED to FUNDING)
     */
    function startFunding() external onlyRole(OPERATOR_ROLE) {
        require(stage == Stage.NOT_STARTED, "Contract already started");
        require(createdAt > 0, "Contract not initialized");

        // Set funding deadline to 90 days from now
        fundingDeadline = block.timestamp + 90 days;

        // Set stage to FUNDING
        stage = Stage.FUNDING;
        stageTimestamps[Stage.FUNDING] = block.timestamp;
        stageReasons[Stage.FUNDING] = "Funding phase started by operator";
        lastStageChangedBy = msg.sender;
        lastStageChangeTime = block.timestamp;
        emit StageChanged(uint8(Stage.NOT_STARTED), uint8(Stage.FUNDING), msg.sender, "Funding phase started by operator");
    }

    /**
     * @dev Withdraw loan funds to borrower after funding is complete
     * @param amount Amount of USDT to withdraw to borrower
     */
    function withdrawLoan(uint256 amount) external onlyRole(OPERATOR_ROLE) nonReentrant {
        require(stage == Stage.FUNDED, "Loan withdrawal only allowed after funding complete");
        require(amount > 0, "Amount must be greater than zero");
        require(amount <= totalFunded - loanWithdrawn, "Insufficient available funds");
        require(loanWithdrawn + amount <= loanAmount, "Withdrawal exceeds loan amount");
        require(usdtToken.balanceOf(address(this)) >= amount, "Insufficient contract balance");

        // Update loan withdrawal tracking
        loanWithdrawn += amount;

        // Transfer USDT to borrower
        usdtToken.safeTransfer(borrower, amount);

        // Update total repaid tracking (this counts as disbursement)
        totalRepaid += amount;

        // Check if all loan funds have been withdrawn, transition to ACTIVE stage
        if (loanWithdrawn >= loanAmount) {
            stage = Stage.ACTIVE;
            stageTimestamps[Stage.ACTIVE] = block.timestamp;
            stageReasons[Stage.ACTIVE] = "Loan fully withdrawn to borrower";
            lastStageChangedBy = msg.sender;
            lastStageChangeTime = block.timestamp;
            emit StageChanged(uint8(Stage.FUNDED), uint8(Stage.ACTIVE), msg.sender, "Loan fully withdrawn to borrower");
        }

        // Emit loan withdrawal event
        emit LoanWithdrawn(borrower, amount, msg.sender, block.timestamp);
    }

    /**
     * @dev Deposit principal repayment from borrower and distribute to investors
     * @param amount Amount of principal repaid (6 decimals)
     */
    function depositPrincipal(uint256 amount) external onlyRole(OPERATOR_ROLE) nonReentrant {
        require(amount > 0, "Amount must be greater than zero");
        require(totalShares > 0, "No investors to distribute to");
        require(stage == Stage.ACTIVE || stage == Stage.REPAID, "Invalid stage for principal deposit");

        // Update total principal repaid
        principalRepaid += amount;
        totalRepaid += amount;

        // Calculate per-share amount (pro-rata distribution)
        uint256 perShareAmount = (amount * 1e6) / totalShares; // Maintain precision

        // Transfer USDT from operator to contract
        usdtToken.safeTransferFrom(msg.sender, address(this), amount);

        // Check if loan is fully repaid (principal + interest)
        if (isLoanFullyRepaid()) {
            stage = Stage.REPAID;
            stageTimestamps[Stage.REPAID] = block.timestamp;
            stageReasons[Stage.REPAID] = "Loan fully repaid by borrower";
            lastStageChangedBy = msg.sender;
            lastStageChangeTime = block.timestamp;
            emit StageChanged(uint8(Stage.ACTIVE), uint8(Stage.REPAID), msg.sender, "Loan fully repaid by borrower");
        }

        // Emit distribution event
        emit PrincipalDeposited(msg.sender, amount, principalRepaid, perShareAmount);
    }

    /**
     * @dev Deposit interest payment from borrower and distribute to investors
     * @param amount Amount of interest paid (6 decimals)
     */
    function depositInterest(uint256 amount) external onlyRole(OPERATOR_ROLE) nonReentrant {
        require(amount > 0, "Amount must be greater than zero");
        require(totalShares > 0, "No investors to distribute to");
        require(stage == Stage.ACTIVE || stage == Stage.REPAID, "Invalid stage for interest deposit");

        // Update total interest paid
        interestPaid += amount;
        totalRepaid += amount;

        // Calculate per-share amount (pro-rata distribution)
        uint256 perShareAmount = (amount * 1e6) / totalShares; // Maintain precision

        // Transfer USDT from operator to contract
        usdtToken.safeTransferFrom(msg.sender, address(this), amount);

        // Check if loan is fully repaid (principal + interest)
        if (isLoanFullyRepaid()) {
            stage = Stage.REPAID;
            stageTimestamps[Stage.REPAID] = block.timestamp;
            stageReasons[Stage.REPAID] = "Loan fully repaid by borrower";
            lastStageChangedBy = msg.sender;
            lastStageChangeTime = block.timestamp;
            emit StageChanged(uint8(Stage.ACTIVE), uint8(Stage.REPAID), msg.sender, "Loan fully repaid by borrower");
        }

        // Emit distribution event
        emit InterestDeposited(msg.sender, amount, interestPaid, perShareAmount);
    }

    function transferShares(address to, uint256 sharesAmount) external {
        revert("Not implemented yet");
    }

    /**
     * @dev Get investor's total entitled principal amount
     * @param investor Address of the investor
     * @return Total entitled principal amount
     */
    function getEntitledPrincipal(address investor) public view returns (uint256) {
        if (totalShares == 0 || shares[investor] == 0) return 0;
        return (principalRepaid * shares[investor]) / totalShares;
    }

    /**
     * @dev Get investor's total entitled interest amount
     * @param investor Address of the investor
     * @return Total entitled interest amount
     */
    function getEntitledInterest(address investor) public view returns (uint256) {
        if (totalShares == 0 || shares[investor] == 0) return 0;
        return (interestPaid * shares[investor]) / totalShares;
    }

    /**
     * @dev Get investor's withdrawable principal amount
     * @param investor Address of the investor
     * @return Withdrawable principal amount
     */
    function getWithdrawablePrincipal(address investor) public view returns (uint256) {
        uint256 entitled = getEntitledPrincipal(investor);
        uint256 alreadyWithdrawn = withdrawnPrincipal[investor];

        // Prevent underflow in case of calculation errors
        if (entitled <= alreadyWithdrawn) return 0;
        return entitled - alreadyWithdrawn;
    }

    /**
     * @dev Get investor's withdrawable interest amount
     * @param investor Address of the investor
     * @return Withdrawable interest amount
     */
    function getWithdrawableInterest(address investor) public view returns (uint256) {
        uint256 entitled = getEntitledInterest(investor);
        uint256 alreadyWithdrawn = withdrawnInterest[investor];

        // Prevent underflow in case of calculation errors
        if (entitled <= alreadyWithdrawn) return 0;
        return entitled - alreadyWithdrawn;
    }

    /**
     * @dev Check if the loan is fully repaid
     * @return True if loan principal is fully repaid
     */
    function isLoanFullyRepaid() public view returns (bool) {
        return principalRepaid >= loanAmount;
    }

    /**
     * @dev Get remaining loan amount to be repaid
     * @return Remaining principal amount
     */
    function getRemainingPrincipal() public view returns (uint256) {
        if (principalRepaid >= loanAmount) return 0;
        return loanAmount - principalRepaid;
    }

    /**
     * @dev Get available loan amount for withdrawal
     * @return Available amount for withdrawal
     */
    function getAvailableForWithdrawal() public view returns (uint256) {
        if (stage != Stage.FUNDED) return 0;
        return totalFunded - loanWithdrawn;
    }

    // ========================================
    // STAGE MANAGEMENT FUNCTIONS
    // ========================================

    /**
     * @dev Set contract stage with proper validation and tracking
     * @param newStage The new stage to transition to
     * @param reason Human-readable reason for the stage change
     */
    function setStage(Stage newStage, string calldata reason) external onlyRole(OPERATOR_ROLE) nonReentrant {
        require(newStage != stage, "Already in this stage");
        require(validateStageTransition(stage, newStage), "Invalid stage transition");
        require(bytes(reason).length > 0, "Reason cannot be empty");

        Stage oldStage = stage;

        // Update stage and tracking
        stage = newStage;
        stageTimestamps[newStage] = block.timestamp;
        stageReasons[newStage] = reason;
        lastStageChangedBy = msg.sender;
        lastStageChangeTime = block.timestamp;

        emit StageChanged(uint8(oldStage), uint8(newStage), msg.sender, reason);
    }

    /**
     * @dev Validate if a stage transition is allowed
     * @param from Current stage
     * @param to Target stage
     * @return True if transition is valid
     */
    function validateStageTransition(Stage from, Stage to) public view returns (bool) {
        // FUNDING stage transitions
        if (from == Stage.NOT_STARTED && to == Stage.FUNDING) {
            return true;
        }

        if (from == Stage.FUNDING && to == Stage.FUNDED) {
            return totalFunded >= loanAmount;
        }

        // ACTIVE stage transitions
        if (from == Stage.FUNDED && to == Stage.ACTIVE) {
            return loanWithdrawn >= loanAmount && totalFunded >= loanAmount;
        }

        // REPAID stage transitions
        if (from == Stage.ACTIVE && to == Stage.REPAID) {
            return principalRepaid >= loanAmount;
        }

        // Allow manual override for operators in special cases
        if (from == Stage.FUNDED && to == Stage.REPAID) {
            return true; // Emergency close
        }

        return false;
    }

    /**
     * @dev Get available stage transitions from current stage
     * @return Array of allowed next stages
     */
    function getAvailableTransitions() external view returns (Stage[] memory) {
        Stage[] memory transitions = new Stage[](5);
        uint256 count = 0;

        // Check all possible transitions
        Stage[5] memory possibleStages = [Stage.FUNDING, Stage.FUNDED, Stage.ACTIVE, Stage.REPAID, Stage.NOT_STARTED];

        for (uint256 i = 0; i < possibleStages.length; i++) {
            if (validateStageTransition(stage, possibleStages[i])) {
                transitions[count] = possibleStages[i];
                count++;
            }
        }

        // Resize array to actual count
        assembly {
            mstore(transitions, count)
        }

        return transitions;
    }

    /**
     * @dev Get stage duration for a specific stage
     * @param stageToCheck Stage to check duration for
     * @return Duration in seconds, 0 if stage never reached
     */
    function getStageDuration(Stage stageToCheck) external view returns (uint256) {
        uint256 startTime = stageTimestamps[stageToCheck];
        if (startTime == 0) return 0;

        if (stageToCheck == stage) {
            // Still in this stage
            return block.timestamp - startTime;
        } else {
            // Stage completed, calculate until next stage timestamp
            Stage nextStage = getNextStage(stageToCheck);
            if (nextStage == stageToCheck) return 0; // No next stage found

            uint256 nextStartTime = stageTimestamps[nextStage];
            return nextStartTime > startTime ? nextStartTime - startTime : 0;
        }
    }

    /**
     * @dev Get the next stage in the lifecycle
     * @param currentStage Current stage
     * @return Next stage or same if no next stage found
     */
    function getNextStage(Stage currentStage) internal pure returns (Stage) {
        if (currentStage == Stage.NOT_STARTED) return Stage.FUNDING;
        if (currentStage == Stage.FUNDING) return Stage.FUNDED;
        if (currentStage == Stage.FUNDED) return Stage.ACTIVE;
        if (currentStage == Stage.ACTIVE) return Stage.REPAID;
        return currentStage; // REPAID is final stage
    }

    // ========================================
    // STAGE-BASED MODIFIERS
    // ========================================

    /**
     * @dev Restrict function execution to specific stage
     * @param requiredStage The required stage to execute function
     */
    modifier onlyInStage(Stage requiredStage) {
        require(stage == requiredStage, "Invalid contract stage");
        _;
    }

    /**
     * @dev Restrict function execution when stage transition is allowed
     * @param newStage The target stage for transition
     */
    modifier stageTransitionAllowed(Stage newStage) {
        require(validateStageTransition(stage, newStage), "Invalid stage transition");
        _;
    }

    /**
     * @dev Restrict function execution to funding-related stages
     */
    modifier onlyInFundingStages() {
        require(stage == Stage.FUNDING || stage == Stage.FUNDED, "Not in funding stage");
        _;
    }

    /**
     * @dev Restrict function execution to active loan stages
     */
    modifier onlyInActiveStages() {
        require(stage == Stage.ACTIVE || stage == Stage.REPAID, "Not in active stage");
        _;
    }

    // ========================================
    // OPERATIONAL METRICS FUNCTIONS (EPIC 5.4)
    // ========================================

    /**
     * @dev Get portfolio-wide metrics for operational monitoring
     * @return totalFunded Total amount funded across all contracts (for single contract context)
     * @return totalInvestors Number of investors in this contract
     * @return activeContracts Always returns 1 for single contract, but included for interface consistency
     * @return totalPrincipalRepaid Total principal amount repaid
     * @return totalInterestPaid Total interest amount paid
     * @return totalValueLocked Total value locked in this contract
     */
    function getPortfolioMetrics() external view returns (
        uint256 totalFunded,
        uint256 totalInvestors,
        uint256 activeContracts,
        uint256 totalPrincipalRepaid,
        uint256 totalInterestPaid,
        uint256 totalValueLocked
    ) {
        return (
            totalFunded,
            investorCount,
            stage == Stage.ACTIVE || stage == Stage.REPAID ? 1 : 0, // Active if past funding stage
            principalRepaid,
            interestPaid,
            totalFunded - (principalRepaid + interestPaid) // Value still locked
        );
    }

    /**
     * @dev Get comprehensive contract analytics
     * @return fundingProgress Funding progress percentage (basis points)
     * @return investorCount Current number of investors
     * @return averageInvestment Average investment per investor (in USDT)
     * @return totalDistributed Total amount distributed to investors
     * @return repaymentRate Repayment rate as percentage (basis points)
     * @return timeToCompletion Estimated time to completion in seconds
     */
    function getContractAnalytics() external view returns (
        uint256 fundingProgress,
        uint256 investorCount,
        uint256 averageInvestment,
        uint256 totalDistributed,
        uint256 repaymentRate,
        uint256 timeToCompletion
    ) {
        // Calculate funding progress
        fundingProgress = loanAmount > 0 ? (totalFunded * 10000) / loanAmount : 0; // Basis points
        fundingProgress = fundingProgress > 10000 ? 10000 : fundingProgress; // Cap at 100%

        // Calculate average investment
        averageInvestment = investorCount > 0 ? totalFunded / investorCount : 0;

        // Calculate total distributed
        totalDistributed = principalRepaid + interestPaid;

        // Calculate repayment rate
        repaymentRate = loanAmount > 0 ? (principalRepaid * 10000) / loanAmount : 0; // Basis points
        repaymentRate = repaymentRate > 10000 ? 10000 : repaymentRate; // Cap at 100%

        // Calculate time to completion (simplified - in full implementation would use loan terms)
        if (stage == Stage.ACTIVE && principalRepaid > 0) {
            // Estimate based on current repayment rate
            uint256 timeSinceActive = stageTimestamps[Stage.ACTIVE] > 0 ? block.timestamp - stageTimestamps[Stage.ACTIVE] : 0;
            uint256 repaymentRatePerSecond = principalRepaid > timeSinceActive ? principalRepaid / timeSinceActive : 1;
            timeToCompletion = repaymentRatePerSecond > 0 ? (loanAmount - principalRepaid) / repaymentRatePerSecond : 0;
        } else if (stage == Stage.REPAID) {
            timeToCompletion = 0; // Completed
        } else {
            timeToCompletion = type(uint256).max; // Not applicable
        }
    }

    /**
     * @dev Get detailed investor breakdown for analytics
     * @return investors Array of investor addresses
     * @return shares Array of corresponding shares for each investor
     * @return percentages Array of ownership percentages (basis points)
     * @return withdrawableAmounts Array of withdrawable amounts for each investor
     */
    function getInvestorBreakdown() external view returns (
        address[] memory investors,
        uint256[] memory shares,
        uint256[] memory percentages,
        uint256[] memory withdrawableAmounts
    ) {
        investors = new address[](investorCount);
        shares = new uint256[](investorCount);
        percentages = new uint256[](investorCount);
        withdrawableAmounts = new uint256[](investorCount);

        // In a full implementation, we would iterate through all investors
        // For this simplified version, we'll return empty arrays
        // The frontend would need to collect this data from events or maintain a separate index
    }

    /**
     * @dev Get performance metrics for operational monitoring
     * @return totalInvested Total amount invested
     * @return totalDistributed Total amount distributed to investors
     * @return investmentRate Average investment rate per day
     * @return distributionRate Average distribution rate per day
     * @return efficiencyScore Contract efficiency score (0-10000 basis points)
     */
    function getPerformanceMetrics() external view returns (
        uint256 totalInvested,
        uint256 totalDistributed,
        uint256 investmentRate,
        uint256 distributionRate,
        uint256 efficiencyScore
    ) {
        totalInvested = totalFunded;
        totalDistributed = principalRepaid + interestPaid;

        // Calculate investment rate (USDT per day)
        uint256 fundingDuration = stageTimestamps[Stage.FUNDED] > 0 && stageTimestamps[Stage.FUNDING] > 0
            ? (stageTimestamps[Stage.FUNDED] - stageTimestamps[Stage.FUNDING])
            : 1;
        investmentRate = fundingDuration > 0 ? (totalInvested * 86400) / fundingDuration : 0;

        // Calculate distribution rate (USDT per day)
        uint256 activeDuration = (stage == Stage.ACTIVE || stage == Stage.REPAID) && stageTimestamps[Stage.ACTIVE] > 0
            ? (block.timestamp - stageTimestamps[Stage.ACTIVE])
            : 1;
        distributionRate = activeDuration > 0 ? (totalDistributed * 86400) / activeDuration : 0;

        // Calculate efficiency score based on funding speed and distribution efficiency
        uint256 fundingEfficiency = loanAmount > 0 ? (totalInvested * 10000) / loanAmount : 0;
        uint256 distributionEfficiency = totalInvested > 0 ? (totalDistributed * 10000) / totalInvested : 0;
        efficiencyScore = (fundingEfficiency + distributionEfficiency) / 2;
        efficiencyScore = efficiencyScore > 10000 ? 10000 : efficiencyScore;
    }

    /**
     * @dev Get compliance and risk metrics
     * @return regulatoryFlags Array of regulatory compliance flags
     * @return riskScore Contract risk score (0-10000 basis points)
     * @return complianceScore Compliance score (0-10000 basis points)
     * @return auditScore Audit score based on transparency and reporting
     */
    function getComplianceMetrics() external view returns (
        string[] memory regulatoryFlags,
        uint256 riskScore,
        uint256 complianceScore,
        uint256 auditScore
    ) {
        regulatoryFlags = new string[](3);
        regulatoryFlags[0] = stage == Stage.FUNDED || stage == Stage.ACTIVE ? "ACTIVE_CONTRACT" : "INACTIVE_CONTRACT";
        regulatoryFlags[1] = investorCount >= 10 ? "MULTI_INVESTOR" : "SINGLE_INVESTOR";
        regulatoryFlags[2] = totalFunded >= loanAmount ? "FULLY_FUNDED" : "PARTIALLY_FUNDED";

        // Calculate risk score based on various factors
        uint256 fundingRisk = loanAmount > 0 ? ((loanAmount - totalFunded) * 10000) / loanAmount : 5000;
        uint256 concentrationRisk = investorCount > 0 ? (10000 - ((investorCount - 1) * 500)) : 10000;
        concentrationRisk = concentrationRisk > 10000 ? 10000 : concentrationRisk;

        riskScore = (fundingRisk + concentrationRisk) / 2;
        riskScore = riskScore > 10000 ? 10000 : riskScore;

        // Calculate compliance score (simplified)
        complianceScore = 10000; // Perfect compliance by default
        if (stageTimestamps[Stage.FUNDING] == 0) complianceScore -= 1000; // Not started
        if (totalFunded < loanAmount && stage == Stage.ACTIVE) complianceScore -= 2000; // Incomplete funding

        // Calculate audit score based on transparency
        auditScore = 10000; // Perfect audit score by default
        auditScore -= (lastStageChangeTime == 0 ? 5000 : 0); // No stage changes tracked
    }

    /**
     * @dev Get historical timeline data for contract lifecycle
     * @return timestamps Array of key timestamps in contract history
     * @return events Array of corresponding event descriptions
     * @return amounts Array of amounts involved in each event
     */
    function getEventTimeline() external view returns (
        uint256[] memory timestamps,
        string[] memory events,
        uint256[] memory amounts
    ) {
        // Count the number of events to create appropriate array sizes
        uint256 eventCount = 1; // Always include creation
        if (stageTimestamps[Stage.FUNDING] > 0) eventCount++;
        if (stageTimestamps[Stage.FUNDED] > 0) eventCount++;
        if (stageTimestamps[Stage.ACTIVE] > 0) eventCount++;
        if (stageTimestamps[Stage.REPAID] > 0) eventCount++;

        timestamps = new uint256[](eventCount);
        events = new string[](eventCount);
        amounts = new uint256[](eventCount);

        uint256 index = 0;

        // Contract creation
        timestamps[index] = createdAt;
        events[index] = "Contract Created";
        amounts[index] = loanAmount;
        index++;

        // Stage transitions
        if (stageTimestamps[Stage.FUNDING] > 0) {
            timestamps[index] = stageTimestamps[Stage.FUNDING];
            events[index] = stageReasons[Stage.FUNDING];
            amounts[index] = 0;
            index++;
        }

        if (stageTimestamps[Stage.FUNDED] > 0) {
            timestamps[index] = stageTimestamps[Stage.FUNDED];
            events[index] = stageReasons[Stage.FUNDED];
            amounts[index] = totalFunded;
            index++;
        }

        if (stageTimestamps[Stage.ACTIVE] > 0) {
            timestamps[index] = stageTimestamps[Stage.ACTIVE];
            events[index] = stageReasons[Stage.ACTIVE];
            amounts[index] = loanWithdrawn;
            index++;
        }

        if (stageTimestamps[Stage.REPAID] > 0) {
            timestamps[index] = stageTimestamps[Stage.REPAID];
            events[index] = stageReasons[Stage.REPAID];
            amounts[index] = principalRepaid + interestPaid;
        }
    }
}