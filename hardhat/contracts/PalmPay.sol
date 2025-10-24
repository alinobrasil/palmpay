// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PalmPay
 * @dev Smart contract for palm recognition payment system
 * Note: Palm verification is done OFF-CHAIN by backend for privacy.
 *       Contract only handles payment logic, limits, and audit trail.
 */
contract PalmPay is Ownable, ReentrancyGuard {

    // ============ State Variables ============

    IERC20 public paymentToken;
    address public backendVerifier; // Backend address that can authorize charges
    uint256 public maxSpendingLimitCeiling; // Universal ceiling for customer spending limits

    // ============ Structs ============

    struct CustomerSettings {
        uint256 maxTransactionAmount;
        bool active;
    }

    struct StoreInfo {
        string name;
        string city;
        bool active;
    }

    // ============ Mappings ============

    // Customer data
    mapping(address => CustomerSettings) public customers;
    mapping(address => uint256) public customerNonce; //helps protect against replay attacks

    // Store data
    mapping(address => StoreInfo) public stores;

    // ============ Events ============

    event CustomerRegistered(
        address indexed customer,
        uint256 timestamp
    );

    event CustomerDeactivated(
        address indexed customer,
        uint256 timestamp
    );

    event MaxSpendingLimitCeilingUpdated(
        uint256 oldCeiling,
        uint256 newCeiling,
        uint256 timestamp
    );

    event StoreRegistered(
        address indexed store,
        string name,
        string city,
        uint256 timestamp
    );

    event StoreDeactivated(
        address indexed store,
        uint256 timestamp
    );

    event ChargeRecorded(
        address indexed customer,
        address indexed store,
        uint256 amount,
        uint256 nonce,
        uint256 timestamp,
        bytes32 receiptHash
    );

    event LimitsUpdated(
        address indexed customer,
        uint256 maxTransactionAmount
    );

    event BackendVerifierUpdated(
        address indexed oldVerifier,
        address indexed newVerifier,
        uint256 timestamp
    );

    // ============ Modifiers ============

    modifier onlyActiveCustomer() {
        require(customers[msg.sender].active, "Customer not active");
        _;
    }

    modifier onlyBackendVerifier() {
        require(msg.sender == backendVerifier, "Only backend verifier");
        _;
    }

    // ============ Constructor ============

    constructor(address _paymentToken, address _backendVerifier) Ownable(msg.sender) {
        require(_paymentToken != address(0), "Invalid token");
        require(_backendVerifier != address(0), "Invalid verifier");

        paymentToken = IERC20(_paymentToken);
        backendVerifier = _backendVerifier;
        maxSpendingLimitCeiling = 200 * 10**6; // 200 pyUSD (6 decimals)
    }

    // ============ Customer Functions ============

    /**
     * @dev Register customer (palm registration happens off-chain)
     */
    function registerCustomer() external {
        require(!customers[msg.sender].active, "Already registered");

        customers[msg.sender] = CustomerSettings({
            maxTransactionAmount: 100 * 10**6, // Default 100 pyUSD (6 decimals)
            active: true
        });

        emit CustomerRegistered(msg.sender, block.timestamp);
    }

    /**
     * @dev Deactivate own customer account (close access)
     */
    function deactivateSelf() external onlyActiveCustomer {
        customers[msg.sender].active = false;
        emit CustomerDeactivated(msg.sender, block.timestamp);
    }

    /**
     * @dev Set spending limit
     * @param _maxTransactionAmount Max amount per transaction
     */
    function setSpendingLimit(uint256 _maxTransactionAmount)
        external
        onlyActiveCustomer
    {
        require(_maxTransactionAmount > 0, "Transaction limit must be > 0");
        require(_maxTransactionAmount <= maxSpendingLimitCeiling, "Exceeds universal ceiling");

        customers[msg.sender].maxTransactionAmount = _maxTransactionAmount;

        emit LimitsUpdated(msg.sender, _maxTransactionAmount);
    }

    // ============ Store Functions ============

    /**
     * @dev Register as a store
     * @param _name Store name
     * @param _city Store city
     */
    function registerStore(string calldata _name, string calldata _city) external {
        require(bytes(stores[msg.sender].name).length == 0, "Already registered");
        require(bytes(_name).length > 0, "Store name required");
        require(bytes(_city).length > 0, "Store city required");

        stores[msg.sender] = StoreInfo({
            name: _name,
            city: _city,
            active: true
        });

        emit StoreRegistered(msg.sender, _name, _city, block.timestamp);
    }

    // ============ Backend Verifier Functions ============

    /**
     * @dev Record a charge (called by backend after OFF-CHAIN palm verification)
     * @param _customer Customer address
     * @param _store Store address
     * @param _amount Amount to charge
     * @param _nonce Customer's current nonce (for replay protection)
     * @param _receiptHash Hash of full transaction details (stored off-chain)
     */
    function recordCharge(
        address _customer,
        address _store,
        uint256 _amount,
        uint256 _nonce,
        bytes32 _receiptHash
    )
        external
        onlyBackendVerifier
        nonReentrant
    {
        // Validations
        require(customers[_customer].active, "Customer not active");
        require(stores[_store].active, "Store not active");
        require(_amount > 0, "Amount must be > 0");
        require(_receiptHash != bytes32(0), "Invalid receipt hash");

        // Verify nonce (replay protection)
        require(_nonce == customerNonce[_customer], "Invalid nonce");

        // Check transaction limit
        require(
            _amount <= customers[_customer].maxTransactionAmount,
            "Exceeds transaction limit"
        );

        // Increment nonce
        customerNonce[_customer]++;

        // Transfer tokens from customer to store
        require(
            paymentToken.transferFrom(_customer, _store, _amount),
            "Token transfer failed"
        );

        // Emit event for audit trail
        emit ChargeRecorded(
            _customer,
            _store,
            _amount,
            _nonce,
            block.timestamp,
            _receiptHash
        );
    }

    // ============ Admin Functions ============

    /**
     * @dev Deactivate a customer (admin function)
     * @param _customer Customer address to deactivate
     */
    function deactivateCustomer(address _customer) external onlyOwner {
        require(customers[_customer].active, "Customer not active");

        customers[_customer].active = false;

        emit CustomerDeactivated(_customer, block.timestamp);
    }

    /**
     * @dev Deactivate a store
     * @param _store Store address to deactivate
     */
    function deactivateStore(address _store) external onlyOwner {
        require(bytes(stores[_store].name).length > 0, "Store not registered");
        require(stores[_store].active, "Already deactivated");

        stores[_store].active = false;

        emit StoreDeactivated(_store, block.timestamp);
    }

    /**
     * @dev Update the universal spending limit ceiling
     * @param _newCeiling New ceiling amount
     */
    function updateMaxSpendingLimitCeiling(uint256 _newCeiling) external onlyOwner {
        require(_newCeiling > 0, "Ceiling must be > 0");

        uint256 oldCeiling = maxSpendingLimitCeiling;
        maxSpendingLimitCeiling = _newCeiling;

        emit MaxSpendingLimitCeilingUpdated(oldCeiling, _newCeiling, block.timestamp);
    }

    /**
     * @dev Update backend verifier address
     * @param _newVerifier New backend verifier address
     */
    function updateBackendVerifier(address _newVerifier) external onlyOwner {
        require(_newVerifier != address(0), "Invalid verifier");

        address oldVerifier = backendVerifier;
        backendVerifier = _newVerifier;

        emit BackendVerifierUpdated(oldVerifier, _newVerifier, block.timestamp);
    }

    // ============ View Functions ============

    /**
     * @dev Get customer settings
     * @param _customer Customer address
     */
    function getCustomerSettings(address _customer)
        external
        view
        returns (
            uint256 maxTransactionAmount,
            bool active,
            uint256 nonce
        )
    {
        CustomerSettings memory settings = customers[_customer];
        return (
            settings.maxTransactionAmount,
            settings.active,
            customerNonce[_customer]
        );
    }

    /**
     * @dev Get store info
     * @param _store Store address
     */
    function getStoreInfo(address _store)
        external
        view
        returns (
            string memory name,
            string memory city,
            bool active
        )
    {
        StoreInfo memory info = stores[_store];
        return (
            info.name,
            info.city,
            info.active
        );
    }
}
