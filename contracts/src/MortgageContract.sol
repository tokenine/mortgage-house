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

    // Events
    event Invested(address indexed investor, uint256 amount, uint256 shares);
    event StageChanged(uint8 indexed oldStage, uint8 indexed newStage);
    event Withdrawn(address indexed investor, uint256 principalAmount, uint256 interestAmount);

    // Distribution events
    event PrincipalDeposited(address indexed from, uint256 amount, uint256 totalPrincipal, uint256 perShareAmount);
    event InterestDeposited(address indexed from, uint256 amount, uint256 totalInterest, uint256 perShareAmount);
    event PayoutWithdrawn(address indexed to, uint256 principalAmount, uint256 interestAmount);

    constructor() {
        // Setup default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
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
            emit StageChanged(uint8(Stage.FUNDING), uint8(Stage.FUNDED));
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

    function withdrawLoan(uint256 amount) external onlyRole(OPERATOR_ROLE) {
        revert("Not implemented yet");
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

        // Calculate per-share amount (pro-rata distribution)
        uint256 perShareAmount = (amount * 1e6) / totalShares; // Maintain precision

        // Transfer USDT from operator to contract
        usdtToken.safeTransferFrom(msg.sender, address(this), amount);

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

        // Calculate per-share amount (pro-rata distribution)
        uint256 perShareAmount = (amount * 1e6) / totalShares; // Maintain precision

        // Transfer USDT from operator to contract
        usdtToken.safeTransferFrom(msg.sender, address(this), amount);

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
}