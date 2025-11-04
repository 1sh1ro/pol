// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Proof of Love Token (PoL)
 * @dev 治理和影响力代币，通过社区贡献获得
 * @author Proof of Love Team
 */
contract PoLToken is ERC20, ERC20Votes, Ownable, Pausable {
    // 贡献类型枚举
    enum ContributionType {
        EDUCATION,      // 教育内容创作
        CODE_CONTRIB,   // 代码贡献
        GOVERNANCE,     // 治理参与
        COMMUNITY,      // 社区建设
        TRANSLATION,    // 翻译工作
        MENTORING       // 指导新人
    }

    // 贡献记录结构
    struct Contribution {
        address contributor;
        ContributionType contributionType;
        uint256 amount;
        uint256 timestamp;
        string metadata; // IPFS hash 或其他元数据
        bool verified;
    }

    // 状态变量
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 10亿 PoL
    uint256 public constant CONTRIBUTION_REWARD_BASE = 100 * 10**18; // 基础奖励 100 PoL

    mapping(address => uint256) public contributionPoints;
    mapping(ContributionType => uint256) public typeMultipliers;
    mapping(address => Contribution[]) public userContributions;
    mapping(address => mapping(address => bool)) private _delegates;

    Contribution[] public allContributions;

    // 事件
    event ContributionMade(
        address indexed contributor,
        ContributionType indexed contributionType,
        uint256 amount,
        string metadata,
        uint256 timestamp
    );

    event ContributionVerified(
        address indexed contributor,
        uint256 indexed contributionIndex,
        bool verified
    );

    event TokensMinted(
        address indexed to,
        uint256 amount,
        string reason
    );

    // 修饰符
    modifier onlyVerifier() {
        require(msg.sender == owner() || _delegates[msg.sender][owner()], "Not authorized verifier");
        _;
    }

    constructor() ERC20("Proof of Love", "PoL") ERC20Permit("Proof of Love") {
        // 初始化贡献类型奖励倍数
        typeMultipliers[ContributionType.EDUCATION] = 15; // 1.5x
        typeMultipliers[ContributionType.CODE_CONTRIB] = 20; // 2.0x
        typeMultipliers[ContributionType.GOVERNANCE] = 10; // 1.0x
        typeMultipliers[ContributionType.COMMUNITY] = 8; // 0.8x
        typeMultipliers[ContributionType.TRANSLATION] = 12; // 1.2x
        typeMultipliers[ContributionType.MENTORING] = 18; // 1.8x
    }

    /**
     * @dev 记录贡献并奖励 PoL 代币
     */
    function makeContribution(
        ContributionType _contributionType,
        uint256 _impactScore,
        string calldata _metadata
    ) external whenNotPaused {
        require(_impactScore > 0, "Impact score must be positive");
        require(bytes(_metadata).length > 0, "Metadata required");

        uint256 rewardAmount = _calculateReward(_contributionType, _impactScore);

        // 创建贡献记录
        Contribution memory contribution = Contribution({
            contributor: msg.sender,
            contributionType: _contributionType,
            amount: rewardAmount,
            timestamp: block.timestamp,
            metadata: _metadata,
            verified: false
        });

        allContributions.push(contribution);
        userContributions[msg.sender].push(contribution);
        contributionPoints[msg.sender] += _impactScore;

        emit ContributionMade(msg.sender, _contributionType, rewardAmount, _metadata, block.timestamp);

        // 自动验证小额贡献，大额贡献需要人工审核
        if (rewardAmount <= 1000 * 10**18) { // 1000 PoL 以下自动验证
            _verifyContribution(msg.sender, allContributions.length - 1);
        }
    }

    /**
     * @dev 验证贡献并发放代币
     */
    function verifyContribution(address _contributor, uint256 _contributionIndex)
        external onlyVerifier {
        _verifyContribution(_contributor, _contributionIndex);
    }

    /**
     * @dev 内部验证函数
     */
    function _verifyContribution(address _contributor, uint256 _contributionIndex) internal {
        require(_contributionIndex < allContributions.length, "Invalid contribution index");

        Contribution storage contribution = allContributions[_contributionIndex];
        require(contribution.contributor == _contributor, "Contributor mismatch");
        require(!contribution.verified, "Already verified");

        contribution.verified = true;

        // 铸造 PoL 代币
        _mint(_contributor, contribution.amount);

        emit ContributionVerified(_contributor, _contributionIndex, true);
        emit TokensMinted(_contributor, contribution.amount, contribution.metadata);
    }

    /**
     * @dev 计算奖励金额
     */
    function _calculateReward(ContributionType _type, uint256 _impactScore)
        internal view returns (uint256) {
        uint256 multiplier = typeMultipliers[_type];
        return (CONTRIBUTION_REWARD_BASE * _impactScore * multiplier) / 100;
    }

    /**
     * @dev 设置贡献类型倍数
     */
    function setTypeMultiplier(ContributionType _type, uint256 _multiplier)
        external onlyOwner {
        require(_multiplier > 0, "Multiplier must be positive");
        typeMultipliers[_type] = _multiplier;
    }

    /**
     * @dev 获取用户贡献统计
     */
    function getUserStats(address _user)
        external view returns (
            uint256 totalContributions,
            uint256 totalPoints,
            uint256 verifiedContributions,
            uint256 totalRewards
        ) {
        Contribution[] storage contributions = userContributions[_user];

        for (uint i = 0; i < contributions.length; i++) {
            totalContributions++;
            if (contributions[i].verified) {
                verifiedContributions++;
                totalRewards += contributions[i].amount;
            }
        }

        totalPoints = contributionPoints[_user];
    }

    /**
     * @dev 质押 PoL 代币参与治理
     */
    function delegate(address _delegatee) external {
        require(balanceOf(msg.sender) > 0, "No tokens to delegate");
        _delegate(msg.sender, _delegatee);
    }

    /**
     * @dev 暂停合约（紧急情况）
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev 恢复合约
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // 重写必要的函数
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function _maxSupply() internal view override returns (uint256) {
        return MAX_SUPPLY;
    }
}