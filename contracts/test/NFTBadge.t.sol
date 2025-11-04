// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PoLToken.sol";
import "../src/NFTBadge.sol";

/**
 * @title NFT Badge Test Suite
 * @dev 测试NFT徽章系统功能
 * @author Proof of Love Team
 */
contract NFTBadgeTest is Test {
    PoLToken public polToken;
    NFTBadge public nftBadge;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        polToken = new PoLToken();
        nftBadge = new NFTBadge(address(polToken));

        // 给用户一些初始PoL代币用于测试
        vm.startPrank(owner);
        polToken.makeContribution(
            PoLToken.ContributionType.EDUCATION,
            100,
            "ipfs://QmTestOwner"
        );
        polToken.verifyContribution(owner, 0);
        vm.stopPrank();

        vm.startPrank(user1);
        polToken.makeContribution(
            PoLToken.ContributionType.EDUCATION,
            50,
            "ipfs://QmTestUser1"
        );
        polToken.verifyContribution(user1, 0);
        vm.stopPrank();

        vm.deal(user1, 1 ether);
        vm.deal(user2, 1 ether);
    }

    function testInitialAchievements() public {
        // 检查初始成就是否正确创建
        assertEq(nftBadge.achievementCount(), 5, "Should have 5 initial achievements");

        // 检查第一个成就（首次贡献）
        NFTBadge.Achievement memory firstAchievement = nftBadge.achievements(0);
        assertEq(firstAchievement.name, "First Contribution", "First achievement name incorrect");
        assertEq(uint(firstAchievement.rarity), uint(NFTBadge.Rarity.COMMON), "First achievement should be common");
    }

    function testClaimFirstContribution() public {
        vm.startPrank(user1);

        // 用户应该能够领取首次贡献成就
        nftBadge.claimAchievement(0);

        // 验证NFT已铸造
        assertEq(nftBadge.balanceOf(user1), 1, "User should have 1 NFT");
        assertTrue(nftBadge.hasAchievement(user1, 0), "User should have the achievement");

        // 验证NFT详细信息
        uint256 tokenId = 0; // 第一个铸造的token
        assertEq(nftBadge.ownerOf(tokenId), user1, "Token owner should be user1");

        uint256 achievementId = nftBadge.nftIdToAchievement(user1, tokenId);
        assertEq(achievementId, 0, "Token should correspond to first achievement");

        vm.stopPrank();
    }

    function testCannotClaimSameAchievementTwice() public {
        vm.startPrank(user1);

        nftBadge.claimAchievement(0);

        // 尝试再次领取相同成就应该失败
        vm.expectRevert("Achievement already claimed");
        nftBadge.claimAchievement(0);

        vm.stopPrank();
    }

    function testClaimWithoutRequirements() public {
        vm.startPrank(user2);

        // user2 没有贡献，不应该能够领取首次贡献成就
        vm.expectRevert("Requirements not met");
        nftBadge.claimAchievement(0);

        vm.stopPrank();
    }

    function testCreateCustomAchievement() public {
        vm.startPrank(owner);

        // 创建自定义成就
        nftBadge.createCustomAchievement(
            "Test Achievement",
            "This is a test achievement",
            NFTBadge.AchievementType.CODE_MASTER,
            NFTBadge.Rarity.LEGENDARY,
            1000 * 10**18,
            5,
            "ipfs://QmTestCustom"
        );

        // 验证成就创建
        assertEq(nftBadge.achievementCount(), 6, "Should have 6 achievements now");

        NFTBadge.Achievement memory customAchievement = nftBadge.achievements(5);
        assertEq(customAchievement.name, "Test Achievement", "Custom achievement name incorrect");
        assertEq(uint(customAchievement.rarity), uint(NFTBadge.Rarity.LEGENDARY), "Custom achievement should be legendary");

        vm.stopPrank();
    }

    function testCheckAvailableAchievements() public {
        uint256[] memory available = nftBadge.checkAvailableAchievements(user1);

        // user1 应该至少有一个可领取的成就（首次贡献）
        assertGt(available.length, 0, "Should have available achievements");
        assertEq(available[0], 0, "First achievement should be available");
    }

    function testGetUserAchievements() public {
        vm.startPrank(user1);

        // 领取一个成就
        nftBadge.claimAchievement(0);

        // 获取用户成就列表
        NFTBadge.UserAchievement[] memory userAchievements = nftBadge.getUserAchievements(user1);
        assertEq(userAchievements.length, 1, "User should have 1 achievement");
        assertEq(userAchievements[0].achievementId, 0, "Achievement ID should be 0");
        assertGt(userAchievements[0].earnedAt, 0, "Earned timestamp should be set");

        vm.stopPrank();
    }

    function testAchievementStatusUpdate() public {
        vm.startPrank(owner);

        // 禁用一个成就
        nftBadge.updateAchievementStatus(0, false);

        NFTBadge.Achievement memory achievement = nftBadge.achievements(0);
        assertFalse(achievement.isActive, "Achievement should be inactive");

        // 尝试领取被禁用的成就应该失败
        vm.startPrank(user1);
        vm.expectRevert("Achievement not active");
        nftBadge.claimAchievement(0);

        vm.stopPrank();
    }

    function testTokenURI() public {
        vm.startPrank(user1);

        nftBadge.claimAchievement(0);

        // 验证token URI
        string memory tokenURI = nftBadge.tokenURI(0);
        assertEq(tokenURI, "ipfs://QmPlaceholder1", "Token URI should match achievement metadata");

        vm.stopPrank();
    }

    function testAchievementRarities() public {
        // 验证不同稀有度的成就
        assertEq(uint(nftBadge.achievements(0).rarity), uint(NFTBadge.Rarity.COMMON));
        assertEq(uint(nftBadge.achievements(1).rarity), uint(NFTBadge.Rarity.RARE));
        assertEq(uint(nftBadge.achievements(2).rarity), uint(NFTBadge.Rarity.EPIC));
        assertEq(uint(nftBadge.achievements(3).rarity), uint(NFTBadge.Rarity.EPIC));
        assertEq(uint(nftBadge.achievements(4).rarity), uint(NFTBadge.Rarity.LEGENDARY));
    }

    function testAchievementTypes() public {
        // 验证不同类型的成就
        assertEq(uint(nftBadge.achievements(0).achievementType), uint(NFTBadge.AchievementType.FIRST_CONTRIBUTION));
        assertEq(uint(nftBadge.achievements(1).achievementType), uint(NFTBadge.AchievementType.EDUCATOR));
        assertEq(uint(nftBadge.achievements(2).achievementType), uint(NFTBadge.AchievementType.CODE_MASTER));
        assertEq(uint(nftBadge.achievements(3).achievementType), uint(NFTBadge.AchievementType.COMMUNITY_LEADER));
        assertEq(uint(nftBadge.achievements(4).achievementType), uint(NFTBadge.AchievementType.CROSS_CHAIN_EXPERT));
    }

    function testTokenOwnership() public {
        vm.startPrank(owner);

        // 所有者应该是NFT合约的初始所有者
        assertEq(nftBadge.owner(), owner, "Owner should be initial deployer");

        // 转移所有权
        nftBadge.transferOwnership(user1);
        assertEq(nftBadge.pendingOwner(), user1, "Pending owner should be user1");

        // 接受所有权
        vm.startPrank(user1);
        nftBadge.acceptOwnership();
        assertEq(nftBadge.owner(), user1, "User1 should be new owner");

        vm.stopPrank();
    }

    function testPausableFunctionality() public {
        vm.startPrank(owner);

        // 暂停合约
        nftBadge.pause();

        vm.startPrank(user1);
        vm.expectRevert("Pausable: paused");
        nftBadge.claimAchievement(0);

        vm.stopPrank();

        // 恢复合约
        vm.startPrank(owner);
        nftBadge.unpause();

        vm.startPrank(user1);
        nftBadge.claimAchievement(0); // 现在应该成功
        assertEq(nftBadge.balanceOf(user1), 1, "User should have 1 NFT after unpause");

        vm.stopPrank();
    }

    function testMultipleAchievements() public {
        vm.startPrank(user1);

        // 给用户更多贡献以解锁更多成就
        for (uint i = 1; i < 20; i++) {
            polToken.makeContribution(
                PoLToken.ContributionType.EDUCATION,
                5,
                string(abi.encodePacked("test", i))
            );
            polToken.verifyContribution(user1, i);
        }

        // 检查可领取的成就
        uint256[] memory available = nftBadge.checkAvailableAchievements(user1);
        assertGt(available.length, 1, "Should have multiple available achievements");

        // 领取多个成就
        for (uint i = 0; i < available.length && i < 3; i++) {
            nftBadge.claimAchievement(available[i]);
        }

        // 验证用户拥有多个NFT
        assertGt(nftBadge.balanceOf(user1), 1, "User should have multiple NFTs");

        vm.stopPrank();
    }

    function testInvalidAchievementId() public {
        vm.startPrank(user1);

        // 尝试领取不存在的成就
        vm.expectRevert("Invalid achievement ID");
        nftBadge.claimAchievement(999);

        vm.stopPrank();
    }

    function testAchievementStats() public {
        // 初始状态下应该没有获得者
        (uint256 totalEarners, NFTBadge.Rarity rarity) = nftBadge.getAchievementStats(0);
        assertEq(totalEarners, 0, "No earners initially");
        assertEq(uint(rarity), uint(NFTBadge.Rarity.COMMON), "Rarity should be common");

        vm.startPrank(user1);
        nftBadge.claimAchievement(0);
        vm.stopPrank();

        // 注意：实际的实现可能需要更复杂的统计逻辑
        // 这里只是测试函数接口
    }

    function testEnumerableFunctions() public {
        vm.startPrank(user1);

        nftBadge.claimAchievement(0);
        nftBadge.claimAchievement(1);

        // 测试可枚举函数
        assertEq(nftBadge.totalSupply(), 2, "Total supply should be 2");
        assertEq(nftBadge.tokenOfOwnerByIndex(user1, 0), 0, "First token should be 0");
        assertEq(nftBadge.tokenOfOwnerByIndex(user1, 1), 1, "Second token should be 1");
        assertEq(nftBadge.tokenByIndex(0), 0, "First token by index should be 0");
        assertEq(nftBadge.tokenByIndex(1), 1, "Second token by index should be 1");

        vm.stopPrank();
    }
}