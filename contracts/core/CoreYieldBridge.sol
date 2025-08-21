// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract CoreYieldBridge is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    struct BridgeRequest {
        uint256 requestId;
        address user;
        uint256 sourceChainId;
        uint256 targetChainId;
        address token;
        uint256 amount;
        uint256 fee;
        uint256 timestamp;
        BridgeStatus status;
        bytes32 transactionHash;
    }
    
    struct ChainInfo {
        uint256 chainId;
        bool isSupported;
        uint256 minBridgeAmount;
        uint256 maxBridgeAmount;
        uint256 bridgeFee;
        uint256 processingTime;
        address bridgeOperator;
    }
    
    enum BridgeStatus {
        Pending,
        Processing,
        Completed,
        Failed,
        Cancelled
    }
    
    mapping(uint256 => BridgeRequest) public bridgeRequests;
    mapping(uint256 => ChainInfo) public supportedChains;
    mapping(address => uint256[]) public userBridgeRequests;
    mapping(bytes32 => bool) public processedTransactions;
    
    uint256 public requestCount;
    uint256 public totalBridgedValue;
    uint256 public bridgeFee = 50; // 0.5% in basis points
    
    event BridgeRequestCreated(
        uint256 indexed requestId,
        address indexed user,
        uint256 sourceChainId,
        uint256 targetChainId,
        address token,
        uint256 amount,
        uint256 fee
    );
    
    event BridgeRequestProcessed(
        uint256 indexed requestId,
        BridgeStatus status,
        bytes32 transactionHash
    );
    
    event ChainAdded(uint256 indexed chainId, uint256 minAmount, uint256 maxAmount);
    event ChainRemoved(uint256 indexed chainId);
    event BridgeFeeUpdated(uint256 newFee);
    
    modifier onlyBridgeOperator(uint256 chainId) {
        require(supportedChains[chainId].bridgeOperator == msg.sender, "Not bridge operator");
        _;
    }
    
    modifier chainSupported(uint256 chainId) {
        require(supportedChains[chainId].isSupported, "Chain not supported");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        requestCount = 0;
        
        // Add current chain as supported
        supportedChains[block.chainid] = ChainInfo({
            chainId: block.chainid,
            isSupported: true,
            minBridgeAmount: 0,
            maxBridgeAmount: type(uint256).max,
            bridgeFee: 0,
            processingTime: 0,
            bridgeOperator: address(this)
        });
    }
    
    function createBridgeRequest(
        uint256 targetChainId,
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused chainSupported(targetChainId) returns (uint256 requestId) {
        require(amount > 0, "Amount must be greater than 0");
        require(token != address(0), "Invalid token address");
        
        ChainInfo storage targetChain = supportedChains[targetChainId];
        require(amount >= targetChain.minBridgeAmount, "Amount below minimum");
        require(amount <= targetChain.maxBridgeAmount, "Amount above maximum");
        
        uint256 fee = (amount * bridgeFee) / 10000;
        uint256 totalAmount = amount + fee;
        
        // Transfer tokens from router (msg.sender) instead of user
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalAmount);
        
        requestId = ++requestCount;
        
        bridgeRequests[requestId] = BridgeRequest({
            requestId: requestId,
            user: msg.sender, // This will be the router address
            sourceChainId: block.chainid,
            targetChainId: targetChainId,
            token: token,
            amount: amount,
            fee: fee,
            timestamp: block.timestamp,
            status: BridgeStatus.Pending,
            transactionHash: bytes32(0)
        });
        
        userBridgeRequests[msg.sender].push(requestId);
        totalBridgedValue += amount;
        
        emit BridgeRequestCreated(
            requestId,
            msg.sender,
            block.chainid,
            targetChainId,
            token,
            amount,
            fee
        );
    }
    
    function processBridgeRequest(
        uint256 requestId,
        BridgeStatus status,
        bytes32 transactionHash
    ) external onlyBridgeOperator(bridgeRequests[requestId].targetChainId) {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.status == BridgeStatus.Pending, "Request not pending");
        
        request.status = status;
        request.transactionHash = transactionHash;
        
        if (status == BridgeStatus.Completed) {
            // Bridge completed successfully
            totalBridgedValue -= request.amount;
        } else if (status == BridgeStatus.Failed || status == BridgeStatus.Cancelled) {
            // Refund user
            uint256 totalAmount = request.amount + request.fee;
            IERC20(request.token).safeTransfer(request.user, totalAmount);
            totalBridgedValue -= request.amount;
        }
        
        emit BridgeRequestProcessed(requestId, status, transactionHash);
    }
    
    function cancelBridgeRequest(uint256 requestId) external {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.user == msg.sender, "Not request owner");
        require(request.status == BridgeStatus.Pending, "Request not pending");
        
        // Check if enough time has passed
        ChainInfo storage targetChain = supportedChains[request.targetChainId];
        require(block.timestamp >= request.timestamp + targetChain.processingTime, "Too early to cancel");
        
        request.status = BridgeStatus.Cancelled;
        
        // Refund user
        uint256 totalAmount = request.amount + request.fee;
        IERC20(request.token).safeTransfer(request.user, totalAmount);
        totalBridgedValue -= request.amount;
        
        emit BridgeRequestProcessed(requestId, BridgeStatus.Cancelled, bytes32(0));
    }
    
    function addSupportedChain(
        uint256 chainId,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 processingTime,
        address bridgeOperator
    ) external onlyOwner {
        require(chainId != block.chainid, "Cannot add current chain");
        require(bridgeOperator != address(0), "Invalid bridge operator");
        
        supportedChains[chainId] = ChainInfo({
            chainId: chainId,
            isSupported: true,
            minBridgeAmount: minAmount,
            maxBridgeAmount: maxAmount,
            bridgeFee: bridgeFee,
            processingTime: processingTime,
            bridgeOperator: bridgeOperator
        });
        
        emit ChainAdded(chainId, minAmount, maxAmount);
    }
    
    function removeSupportedChain(uint256 chainId) external onlyOwner {
        require(chainId != block.chainid, "Cannot remove current chain");
        
        supportedChains[chainId].isSupported = false;
        
        emit ChainRemoved(chainId);
    }
    
    function updateBridgeFee(uint256 newFee) external onlyOwner {
        require(newFee <= 500, "Fee too high"); // Max 5%
        bridgeFee = newFee;
        
        emit BridgeFeeUpdated(newFee);
    }
    
    function updateChainInfo(
        uint256 chainId,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 processingTime
    ) external onlyOwner chainSupported(chainId) {
        ChainInfo storage chain = supportedChains[chainId];
        chain.minBridgeAmount = minAmount;
        chain.maxBridgeAmount = maxAmount;
        chain.processingTime = processingTime;
    }
    
    function getBridgeRequest(uint256 requestId) external view returns (
        address user,
        uint256 sourceChainId,
        uint256 targetChainId,
        address token,
        uint256 amount,
        uint256 fee,
        uint256 timestamp,
        BridgeStatus status,
        bytes32 transactionHash
    ) {
        BridgeRequest storage request = bridgeRequests[requestId];
        return (
            request.user,
            request.sourceChainId,
            request.targetChainId,
            request.token,
            request.amount,
            request.fee,
            request.timestamp,
            request.status,
            request.transactionHash
        );
    }
    
    function getUserBridgeRequests(address user) external view returns (uint256[] memory) {
        return userBridgeRequests[user];
    }
    
    function getSupportedChains() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count supported chains
        for (uint256 i = 0; i < 1000; i++) { // Reasonable upper limit
            if (supportedChains[i].isSupported) {
                count++;
            }
        }
        
        uint256[] memory chains = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < 1000; i++) {
            if (supportedChains[i].isSupported) {
                chains[index] = i;
                index++;
            }
        }
        
        return chains;
    }
    
    function getChainInfo(uint256 chainId) external view returns (
        bool isSupported,
        uint256 minBridgeAmount,
        uint256 maxBridgeAmount,
        uint256 bridgeFee,
        uint256 processingTime,
        address bridgeOperator
    ) {
        ChainInfo storage chain = supportedChains[chainId];
        return (
            chain.isSupported,
            chain.minBridgeAmount,
            chain.maxBridgeAmount,
            chain.bridgeFee,
            chain.processingTime,
            chain.bridgeOperator
        );
    }
    
    function calculateBridgeFee(uint256 amount) external view returns (uint256 fee) {
        return (amount * bridgeFee) / 10000;
    }
    
    function getBridgeStats() external view returns (
        uint256 totalRequests,
        uint256 totalValue,
        uint256 pendingRequests,
        uint256 completedRequests
    ) {
        uint256 pending = 0;
        uint256 completed = 0;
        
        for (uint256 i = 1; i <= requestCount; i++) {
            if (bridgeRequests[i].status == BridgeStatus.Pending) {
                pending++;
            } else if (bridgeRequests[i].status == BridgeStatus.Completed) {
                completed++;
            }
        }
        
        return (requestCount, totalBridgedValue, pending, completed);
    }
    
    function emergencyPause() external onlyOwner {
        _pause();
    }
    
    function emergencyResume() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
