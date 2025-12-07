// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Mortgage Bond (Secure Version)
 * @notice Fixed Cap Loan, Tradeable Shares, Internal Marketplace.
 * @dev Includes SafeTransfer logic for ERC20 compatibility.
 */

interface IMinimalERC20 {
    function transfer(address to, uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

contract MortgageBond {
    IMinimalERC20 public paymentToken;
    address public issuer;

    uint256 public immutable FUNDING_CAP;
    uint256 public totalPrincipalRaised;
    bool public isFundingActive;

    uint256 public accInterestPerShare;
    uint256 public accPrincipalPerShare;

    struct InvestorInfo {
        uint256 shares;
        uint256 interestDebt;
        uint256 principalDebt;
    }

    mapping(address => InvestorInfo) public investors;

    struct SellOrder {
        address seller;
        uint256 shareAmount;
        uint256 price;
        bool isActive;
    }
    uint256 public nextOrderId = 1;
    mapping(uint256 => SellOrder) public sellOrders;

    event Invested(address indexed user, uint256 amount);
    event ShareTransfer(
        address indexed from,
        address indexed to,
        uint256 sharesMoved
    );
    event RewardsClaimed(
        address indexed user,
        uint256 interest,
        uint256 principal
    );
    event OrderCreated(
        uint256 indexed orderId,
        address indexed seller,
        uint256 amount,
        uint256 price
    );
    event OrderFilled(
        uint256 indexed orderId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 price
    );
    event OrderCancelled(uint256 indexed orderId);
    event PaymentDistributed(string paymentType, uint256 amountDeclared);

    constructor(address _paymentToken, uint256 _fundingCap) {
        issuer = msg.sender;
        paymentToken = IMinimalERC20(_paymentToken);
        FUNDING_CAP = _fundingCap;
        isFundingActive = true;
    }

    // --- SAFETY WRAPPER FOR ERC20 ---
    // Some tokens do not return bool, so standard interfaces fail. This fixes it.
    function _safeTransferFrom(
        address from,
        address to,
        uint256 amount
    ) internal {
        (bool success, bytes memory data) = address(paymentToken).call(
            abi.encodeWithSelector(
                IMinimalERC20.transferFrom.selector,
                from,
                to,
                amount
            )
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "TransferFrom failed"
        );
    }

    function _safeTransfer(address to, uint256 amount) internal {
        (bool success, bytes memory data) = address(paymentToken).call(
            abi.encodeWithSelector(IMinimalERC20.transfer.selector, to, amount)
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "Transfer failed"
        );
    }

    // --- CORE LOGIC ---

    function _moveShares(address _from, address _to, uint256 _amount) internal {
        InvestorInfo storage sender = investors[_from];
        InvestorInfo storage receiver = investors[_to];

        require(sender.shares >= _amount, "Not enough shares");

        uint256 intDebtMove = (sender.interestDebt * _amount) / sender.shares;
        uint256 principalDebtMove = (sender.principalDebt * _amount) /
            sender.shares;

        sender.shares -= _amount;
        sender.interestDebt -= intDebtMove;
        sender.principalDebt -= principalDebtMove;

        receiver.shares += _amount;
        receiver.interestDebt += intDebtMove;
        receiver.principalDebt += principalDebtMove;

        emit ShareTransfer(_from, _to, _amount);
    }

    // --- ACTIONS ---

    function invest(uint256 _amount) external {
        require(isFundingActive, "Funding closed");
        require(
            totalPrincipalRaised + _amount <= FUNDING_CAP,
            "Funding Cap reached"
        );

        _safeTransferFrom(msg.sender, address(this), _amount);

        InvestorInfo storage investor = investors[msg.sender];
        investor.interestDebt += (_amount * accInterestPerShare) / 1e18;
        investor.principalDebt += (_amount * accPrincipalPerShare) / 1e18;
        investor.shares += _amount;

        totalPrincipalRaised += _amount;
        emit Invested(msg.sender, _amount);
    }

    function transferShares(address _to, uint256 _amount) external {
        require(_to != address(0), "Invalid address");
        _moveShares(msg.sender, _to, _amount);
    }

    function claimRewards() external {
        InvestorInfo storage investor = investors[msg.sender];
        require(investor.shares > 0, "No shares");

        uint256 pendingInt = ((investor.shares * accInterestPerShare) / 1e18) -
            investor.interestDebt;
        uint256 pendingPrincipal = ((investor.shares * accPrincipalPerShare) /
            1e18) - investor.principalDebt;

        require(pendingInt > 0 || pendingPrincipal > 0, "Nothing to claim");

        investor.interestDebt = (investor.shares * accInterestPerShare) / 1e18;
        investor.principalDebt =
            (investor.shares * accPrincipalPerShare) /
            1e18;

        _safeTransfer(msg.sender, pendingInt + pendingPrincipal);
        emit RewardsClaimed(msg.sender, pendingInt, pendingPrincipal);
    }

    // --- MARKETPLACE ---

    function createSellOrder(uint256 _shareAmount, uint256 _price) external {
        require(_shareAmount > 0, "Amount > 0");
        _moveShares(msg.sender, address(this), _shareAmount);

        sellOrders[nextOrderId] = SellOrder({
            seller: msg.sender,
            shareAmount: _shareAmount,
            price: _price,
            isActive: true
        });

        emit OrderCreated(nextOrderId, msg.sender, _shareAmount, _price);
        nextOrderId++;
    }

    function cancelSellOrder(uint256 _orderId) external {
        SellOrder storage order = sellOrders[_orderId];
        require(order.seller == msg.sender, "Not your order");
        require(order.isActive, "Order not active");

        order.isActive = false;
        _moveShares(address(this), msg.sender, order.shareAmount);
        emit OrderCancelled(_orderId);
    }

    function buyShare(uint256 _orderId) external {
        SellOrder storage order = sellOrders[_orderId];
        require(order.isActive, "Order not active");

        // 1. Update state FIRST (Security Best Practice)
        order.isActive = false;

        // 2. Transfer Money: Buyer -> Seller
        _safeTransferFrom(msg.sender, order.seller, order.price);

        // 3. Move Shares: Contract -> Buyer
        _moveShares(address(this), msg.sender, order.shareAmount);

        emit OrderFilled(
            _orderId,
            msg.sender,
            order.seller,
            order.shareAmount,
            order.price
        );
    }

    // --- ISSUER ADMIN ---

    function distributeInterest(uint256 _totalDeclared) external {
        require(msg.sender == issuer, "Only Issuer");
        uint256 amountForInvestors = (_totalDeclared * totalPrincipalRaised) /
            FUNDING_CAP;
        accInterestPerShare += (_totalDeclared * 1e18) / FUNDING_CAP;

        if (amountForInvestors > 0) {
            _safeTransferFrom(msg.sender, address(this), amountForInvestors);
        }
        emit PaymentDistributed("Interest", _totalDeclared);
    }

    function distributePrincipalRepayment(uint256 _totalDeclared) external {
        require(msg.sender == issuer, "Only Issuer");
        uint256 amountForInvestors = (_totalDeclared * totalPrincipalRaised) /
            FUNDING_CAP;
        accPrincipalPerShare += (_totalDeclared * 1e18) / FUNDING_CAP;

        if (amountForInvestors > 0) {
            _safeTransferFrom(msg.sender, address(this), amountForInvestors);
        }
        emit PaymentDistributed("Principal", _totalDeclared);
    }

    function withdrawPrincipal() external {
        require(msg.sender == issuer, "Only Issuer");
        require(isFundingActive, "Already withdrawn");
        uint256 bal = paymentToken.balanceOf(address(this));
        isFundingActive = false;
        if (bal > 0) _safeTransfer(issuer, bal);
    }

    // View function
    function getPendingRewards(
        address _user
    ) external view returns (uint256 interest, uint256 principal) {
        InvestorInfo storage investor = investors[_user];
        if (investor.shares == 0) return (0, 0);
        interest =
            ((investor.shares * accInterestPerShare) / 1e18) -
            investor.interestDebt;
        principal =
            ((investor.shares * accPrincipalPerShare) / 1e18) -
            investor.principalDebt;
    }
}
