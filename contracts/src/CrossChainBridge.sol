// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PoLToken.sol";

/**
 * @title CrossChainBridge
 * @dev Polkadot 与其他区块链之间的跨链桥接合约
 * @author Proof of Love Team
 */
contract CrossChainBridge is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // 跨链消息接口
    interface IMessageChannel {
        function sendMessage(
            uint256 _targetChainId,
            bytes calldata _data
        ) external returns (bytes32);
    }

    // 跨链请求状态
    enum RequestStatus {
        PENDING,
        COMPLETED,
        FAILED,
        REFUNDED
    }

    // 跨链请求结构
    struct CrossChainRequest {
        uint256 requestId;
        address user;
        uint256 sourceChainId;
        uint256 targetChainId;
        address targetToken;
        uint256 amount;
        address recipient;
        uint256 fee;
        RequestStatus status;
        uint256 timestamp;
        bytes32 sourceTxHash;
        bytes32 messageHash;
    }

    // 状态变量
    PoLToken public immutable polToken;
    IMessageChannel public messageChannel;

    mapping(uint256 => CrossChainRequest) public requests;
    mapping(uint256 => mapping(address => bool)) public processedMessages;
    mapping(uint256 => uint256) public chainFees;

    uint256 public requestCounter;
    uint256 public constant MAX_FEE = 100 * 10**18; // 最大手续费 100 PoL

    // 支持的链ID列表
    uint256[] public supportedChains;
    mapping(uint256 => bool) public isChainSupported;

    // 事件
    event CrossChainRequestCreated(
        uint256 indexed requestId,
        address indexed user,
        uint256 sourceChainId,
        uint256 targetChainId,
        address targetToken,
        uint256 amount,
        address recipient
    );

    event CrossChainRequestCompleted(
        uint256 indexed requestId,
        address indexed user,
        uint256 amount
    );

    event MessageReceived(
        uint256 indexed sourceChainId,
        bytes32 indexed messageHash,
        address indexed recipient,
        uint256 amount
    );

    event FeeUpdated(uint256 chainId, uint256 newFee);

    // 修饰符
    modifier onlySupportedChain(uint256 _chainId) {
        require(isChainSupported[_chainId], "Chain not supported");
        _;
    }

    modifier onlyValidRequest(uint256 _requestId) {
        require(_requestId < requestCounter, "Invalid request ID");
        _;
    }

    constructor(address _polTokenAddress, address _messageChannelAddress) {
        polToken = PoLToken(_polTokenAddress);
        messageChannel = IMessageChannel(_messageChannelAddress);

        // 初始化支持的链
        _initializeSupportedChains();
    }

    /**
     * @dev 初始化支持的区块链
     */
    function _initializeSupportedChains() internal {
        // Polkadot Asset Hub
        supportedChains.push(1000);
        isChainSupported[1000] = true;
        chainFees[1000] = 5 * 10**18; // 5 PoL

        // Ethereum
        supportedChains.push(1);
        isChainSupported[1] = true;
        chainFees[1] = 10 * 10**18; // 10 PoL

        // Polygon
        supportedChains.push(137);
        isChainSupported[137] = true;
        chainFees[137] = 8 * 10**18; // 8 PoL

        // Arbitrum
        supportedChains.push(42161);
        isChainSupported[42161] = true;
        chainFees[42161] = 7 * 10**18; // 7 PoL
    }

    /**
     * @dev 发起跨链转移请求
     */
    function initiateCrossChainTransfer(
        uint256 _targetChainId,
        address _targetToken,
        uint256 _amount,
        address _recipient
    ) external nonReentrant onlySupportedChain(_targetChainId) returns (uint256) {
        require(_amount > 0, "Amount must be positive");
        require(_recipient != address(0), "Invalid recipient");
        require(_targetToken != address(0), "Invalid target token");

        uint256 fee = chainFees[_targetChainId];
        uint256 totalAmount = _amount + fee;

        // 检查用户余额
        require(
            polToken.balanceOf(msg.sender) >= totalAmount,
            "Insufficient balance"
        );

        // 转移代币到合约
        polToken.transferFrom(msg.sender, address(this), totalAmount);

        // 创建跨链请求
        uint256 requestId = requestCounter++;
        requests[requestId] = CrossChainRequest({
            requestId: requestId,
            user: msg.sender,
            sourceChainId: block.chainid,
            targetChainId: _targetChainId,
            targetToken: _targetToken,
            amount: _amount,
            recipient: _recipient,
            fee: fee,
            status: RequestStatus.PENDING,
            timestamp: block.timestamp,
            sourceTxHash: bytes32(0), // 将在交易确认后设置
            messageHash: bytes32(0)
        });

        // 构建跨链消息
        bytes memory message = abi.encode(
            requestId,
            msg.sender,
            _recipient,
            _targetToken,
            _amount
        );

        // 发送跨链消息
        bytes32 messageHash = messageChannel.sendMessage(_targetChainId, message);
        requests[requestId].messageHash = messageHash;

        emit CrossChainRequestCreated(
            requestId,
            msg.sender,
            block.chainid,
            _targetChainId,
            _targetToken,
            _amount,
            _recipient
        );

        return requestId;
    }

    /**
     * @dev 处理来自其他链的跨链消息
     */
    function handleIncomingMessage(
        uint256 _sourceChainId,
        bytes32 _messageHash,
        address _sender,
        address _recipient,
        address _token,
        uint256 _amount
    ) external onlySupportedChain(_sourceChainId) {
        // 只允许消息通道合约调用
        require(
            msg.sender == address(messageChannel),
            "Only message channel can call"
        );

        // 防止重复处理
        require(
            !processedMessages[_sourceChainId][_messageHash],
            "Message already processed"
        );

        // 标记消息已处理
        processedMessages[_sourceChainId][_messageHash] = true;

        // 发放代币给接收者
        require(
            polToken.balanceOf(address(this)) >= _amount,
            "Insufficient bridge balance"
        );

        polToken.transfer(_recipient, _amount);

        emit MessageReceived(_sourceChainId, _messageHash, _recipient, _amount);
    }

    /**
     * @dev 完成跨链请求（当目标链确认收到资金时调用）
     */
    function completeCrossChainRequest(uint256 _requestId)
        external onlyOwner onlyValidRequest(_requestId) {
        CrossChainRequest storage request = requests[_requestId];
        require(request.status == RequestStatus.PENDING, "Request not pending");

        request.status = RequestStatus.COMPLETED;

        emit CrossChainRequestCompleted(_requestId, request.user, request.amount);
    }

    /**
     * @dev 退款失败的跨链请求
     */
    function refundFailedRequest(uint256 _requestId)
        external onlyOwner onlyValidRequest(_requestId) {
        CrossChainRequest storage request = requests[_requestId];
        require(request.status == RequestStatus.PENDING, "Request not pending");

        uint256 refundAmount = request.amount + request.fee;
        request.status = RequestStatus.REFUNDED;

        // 退款给用户
        polToken.transfer(request.user, refundAmount);
    }

    /**
     * @dev 添加新的支持链
     */
    function addSupportedChain(uint256 _chainId, uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE, "Fee too high");
        require(!isChainSupported[_chainId], "Chain already supported");

        supportedChains.push(_chainId);
        isChainSupported[_chainId] = true;
        chainFees[_chainId] = _fee;

        emit FeeUpdated(_chainId, _fee);
    }

    /**
     * @dev 更新链手续费
     */
    function updateChainFee(uint256 _chainId, uint256 _newFee) external onlyOwner {
        require(isChainSupported[_chainId], "Chain not supported");
        require(_newFee <= MAX_FEE, "Fee too high");

        chainFees[_chainId] = _newFee;

        emit FeeUpdated(_chainId, _newFee);
    }

    /**
     * @dev 移除支持的链
     */
    function removeSupportedChain(uint256 _chainId) external onlyOwner {
        require(isChainSupported[_chainId], "Chain not supported");

        isChainSupported[_chainId] = false;

        // 从数组中移除
        for (uint i = 0; i < supportedChains.length; i++) {
            if (supportedChains[i] == _chainId) {
                supportedChains[i] = supportedChains[supportedChains.length - 1];
                supportedChains.pop();
                break;
            }
        }
    }

    /**
     * @dev 获取用户跨链请求列表
     */
    function getUserRequests(address _user)
        external view returns (CrossChainRequest[] memory) {
        uint256 count = 0;

        // 计算用户请求数量
        for (uint i = 0; i < requestCounter; i++) {
            if (requests[i].user == _user) {
                count++;
            }
        }

        // 收集用户请求
        CrossChainRequest[] memory userRequests = new CrossChainRequest[](count);
        uint256 index = 0;

        for (uint i = 0; i < requestCounter; i++) {
            if (requests[i].user == _user) {
                userRequests[index] = requests[i];
                index++;
            }
        }

        return userRequests;
    }

    /**
     * @dev 获取跨链统计信息
     */
    function getBridgeStats()
        external view returns (
            uint256 totalRequests,
            uint256 completedRequests,
            uint256 pendingRequests,
            uint256 totalVolume
        ) {
        for (uint i = 0; i < requestCounter; i++) {
            CrossChainRequest memory request = requests[i];
            totalRequests++;
            totalVolume += request.amount;

            if (request.status == RequestStatus.COMPLETED) {
                completedRequests++;
            } else if (request.status == RequestStatus.PENDING) {
                pendingRequests++;
            }
        }
    }

    /**
     * @dev 获取支持的链列表
     */
    function getSupportedChains() external view returns (uint256[] memory) {
        return supportedChains;
    }

    /**
     * @dev 紧急提取代币（仅限所有者）
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        polToken.transfer(owner(), _amount);
    }

    /**
     * @dev 更新消息通道地址
     */
    function updateMessageChannel(address _newMessageChannel) external onlyOwner {
        messageChannel = IMessageChannel(_newMessageChannel);
    }

    /**
     * @dev 获取请求详情
     */
    function getRequest(uint256 _requestId)
        external view onlyValidRequest(_requestId) returns (CrossChainRequest memory) {
        return requests[_requestId];
    }
}