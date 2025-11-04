// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./PoLToken.sol";

/**
 * @title Proof of Love NFT Badge
 * @dev 开发者成就和里程碑的NFT徽章系统
 * @author Proof of Love Team
 */
contract NFTBadge is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, Pausable {
    using Counters for Counters.Counter;

    // 成就类型枚举
    enum AchievementType {
        FIRST_CONTRIBUTION,   // 首次贡献
        EDUCATOR,            // 教育成就
        CODE_MASTER,         // 代码大师
        COMMUNITY_LEADER,    // 社区领袖
        GOVERNANCE_CHAMPION, // 治理冠军
        TRANSLATOR,          // 翻译家
        MENTOR,              // 导师
        EARLY_ADOPTER,       // 早期采用者
        CONSISTENT_BUILDER,  # 持续建设者
        CROSS_CHAIN_EXPERT   // 跨链专家
    }

    // 成就稀有度
    enum Rarity {
        COMMON,    // 普通
        RARE,      // 稀有
        EPIC,      // 史诗
        LEGENDARY  // 传奇
    }

    // 成就结构
    struct Achievement {
        uint256 id;
        string name;
        string description;
        AchievementType achievementType;
        Rarity rarity;
        uint256 requiredPoL;
        uint256 requiredContributions;
        bool isActive;
        string metadataURI; // 基础元数据URI
    }

    // 用户成就记录
    struct UserAchievement {
        uint256 achievementId;
        uint256 earnedAt;
        string customMetadata; // 自定义元数据IPFS哈希
    }

    // 状态变量
    PoLToken public polToken;
    Counters.Counter private _tokenIdCounter;

    mapping(uint256 => Achievement) public achievements;
    mapping(address => UserAchievement[]) public userAchievements;
    mapping(address => mapping(uint256 => bool)) public hasAchievement;
    mapping(address => mapping(uint256 => uint256)) public nftIdToAchievement;

    uint256 public achievementCount;

    // 事件
    event AchievementCreated(
        uint256 indexed achievementId,
        string name,
        AchievementType indexed achievementType,
        Rarity indexed rarity
    );

    event AchievementEarned(
        address indexed earner,
        uint256 indexed achievementId,
        uint256 indexed nftId,
        uint256 timestamp
    );

    event AchievementMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 achievementId
    );

    // 修饰符
    modifier onlyValidAchievement(uint256 _achievementId) {
        require(_achievementId < achievementCount, "Invalid achievement ID");
        require(achievements[_achievementId].isActive, "Achievement not active");
        _;
    }

    constructor(address _polTokenAddress) ERC721("Proof of Love Badge", "PoLB") {
        polToken = PoLToken(_polTokenAddress);
        _initializeAchievements();
    }

    /**
     * @dev 初始化基础成就
     */
    function _initializeAchievements() internal {
        // 首次贡献成就
        _createAchievement(
            "First Contribution",
            "Made your first contribution to the Proof of Love ecosystem",
            AchievementType.FIRST_CONTRIBUTION,
            Rarity.COMMON,
            100 * 10**18,
            1,
            "ipfs://QmPlaceholder1"
        );

        // 教育成就
        _createAchievement(
            "Educator",
            "Created 10 educational pieces of content",
            AchievementType.EDUCATOR,
            Rarity.RARE,
            5000 * 10**18,
            10,
            "ipfs://QmPlaceholder2"
        );

        // 代码大师
        _createAchievement(
            "Code Master",
            "Made significant code contributions across 5 different projects",
            AchievementType.CODE_MASTER,
            Rarity.EPIC,
            15000 * 10**18,
            20,
            "ipfs://QmPlaceholder3"
        );

        // 社区领袖
        _createAchievement(
            "Community Leader",
            "Active community participation with over 100 contributions",
            AchievementType.COMMUNITY_LEADER,
            Rarity.EPIC,
            25000 * 10**18,
            100,
            "ipfs://QmPlaceholder4"
        );

        // 传奇成就
        _createAchievement(
            "Polkadot Ambassador",
            "Made exceptional contributions bridging Polkadot ecosystem with Chinese developers",
            AchievementType.CROSS_CHAIN_EXPERT,
            Rarity.LEGENDARY,
            100000 * 10**18,
            500,
            "ipfs://QmPlaceholder5"
        );
    }

    /**
     * @dev 创建成就
     */
    function _createAchievement(
        string memory _name,
        string memory _description,
        AchievementType _achievementType,
        Rarity _rarity,
        uint256 _requiredPoL,
        uint256 _requiredContributions,
        string memory _metadataURI
    ) internal {
        achievements[achievementCount] = Achievement({
            id: achievementCount,
            name: _name,
            description: _description,
            achievementType: _achievementType,
            rarity: _rarity,
            requiredPoL: _requiredPoL,
            requiredContributions: _requiredContributions,
            isActive: true,
            metadataURI: _metadataURI
        });

        emit AchievementCreated(achievementCount, _name, _achievementType, _rarity);
        achievementCount++;
    }

    /**
     * @dev 检查并领取成就
     */
    function claimAchievement(uint256 _achievementId)
        external whenNotPaused onlyValidAchievement(_achievementId) {
        require(!hasAchievement[msg.sender][_achievementId], "Achievement already claimed");

        (bool canClaim, ) = _checkAchievementRequirements(msg.sender, _achievementId);
        require(canClaim, "Requirements not met");

        _mintAchievement(msg.sender, _achievementId);
    }

    /**
     * @dev 检查成就要求
     */
    function _checkAchievementRequirements(address _user, uint256 _achievementId)
        internal view returns (bool canClaim, string memory reason) {
        Achievement storage achievement = achievements[_achievementId];
        (uint256 totalContributions, uint256 totalPoints, uint256 verifiedContributions, uint256 totalRewards) =
            polToken.getUserStats(_user);

        if (totalRewards < achievement.requiredPoL) {
            return (false, "Insufficient PoL tokens");
        }

        if (verifiedContributions < achievement.requiredContributions) {
            return (false, "Insufficient verified contributions");
        }

        return (true, "");
    }

    /**
     * @dev 铸造成就NFT
     */
    function _mintAchievement(address _to, uint256 _achievementId) internal {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        Achievement storage achievement = achievements[_achievementId];

        // 生成NFT元数据
        string memory tokenURI = _generateTokenURI(_achievementId, tokenId);

        // 铸造NFT
        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // 记录用户成就
        userAchievements[_to].push(UserAchievement({
            achievementId: _achievementId,
            earnedAt: block.timestamp,
            customMetadata: ""
        }));

        hasAchievement[_to][_achievementId] = true;
        nftIdToAchievement[_to][tokenId] = _achievementId;

        emit AchievementEarned(_to, _achievementId, tokenId, block.timestamp);
        emit AchievementMinted(_to, tokenId, _achievementId);
    }

    /**
     * @dev 生成NFT元数据URI
     */
    function _generateTokenURI(uint256 _achievementId, uint256 _tokenId)
        internal view returns (string memory) {
        Achievement storage achievement = achievements[_achievementId];

        // 这里应该生成动态的JSON元数据，包含成就信息和稀有度等
        // 实际实现中会使用IPFS或类似服务
        return achievement.metadataURI;
    }

    /**
     * @dev 批量检查可领取的成就
     */
    function checkAvailableAchievements(address _user)
        external view returns (uint256[] memory availableAchievements) {
        uint256 count = 0;

        // 计算可领取成就数量
        for (uint i = 0; i < achievementCount; i++) {
            if (!hasAchievement[_user][i]) {
                (bool canClaim, ) = _checkAchievementRequirements(_user, i);
                if (canClaim) {
                    count++;
                }
            }
        }

        // 收集可领取成就ID
        availableAchievements = new uint256[](count);
        uint256 index = 0;

        for (uint i = 0; i < achievementCount; i++) {
            if (!hasAchievement[_user][i]) {
                (bool canClaim, ) = _checkAchievementRequirements(_user, i);
                if (canClaim) {
                    availableAchievements[index] = i;
                    index++;
                }
            }
        }
    }

    /**
     * @dev 创建自定义成就（仅管理员）
     */
    function createCustomAchievement(
        string memory _name,
        string memory _description,
        AchievementType _achievementType,
        Rarity _rarity,
        uint256 _requiredPoL,
        uint256 _requiredContributions,
        string memory _metadataURI
    ) external onlyOwner {
        _createAchievement(
            _name,
            _description,
            _achievementType,
            _rarity,
            _requiredPoL,
            _requiredContributions,
            _metadataURI
        );
    }

    /**
     * @dev 更新成就状态
     */
    function updateAchievementStatus(uint256 _achievementId, bool _isActive)
        external onlyOwner {
        require(_achievementId < achievementCount, "Invalid achievement ID");
        achievements[_achievementId].isActive = _isActive;
    }

    /**
     * @dev 获取用户的所有成就
     */
    function getUserAchievements(address _user)
        external view returns (UserAchievement[] memory) {
        return userAchievements[_user];
    }

    /**
     * @dev 获取特定成就的统计信息
     */
    function getAchievementStats(uint256 _achievementId)
        external view returns (uint256 totalEarners, Rarity rarity) {
        Achievement storage achievement = achievements[_achievementId];
        rarity = achievement.rarity;

        // 统计获得此成就的用户数量
        // 实际实现中可能需要额外的映射来优化查询
        return (0, rarity);
    }

    // 重写必要的ERC721函数
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view
        override(ERC721, ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}