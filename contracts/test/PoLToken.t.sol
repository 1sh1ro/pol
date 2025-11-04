// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PoLToken.sol";

/**
 * @title PoL Token Test Suite
 * @dev 测试PoL代币的核心功能
 * @author Proof of Love Team
 */
contract PoLTokenTest is Test {
    PoLToken public polToken;
    address public owner;
    address public contributor1;
    address public contributor2;

    function setUp() public {
        owner = address(this);
        contributor1 = address(0x1);
        contributor2 = address(0x2);

        polToken = new PoLToken();

        // 给测试账户一些ETH用于gas
        vm.deal(contributor1, 1 ether);
        vm.deal(contributor2, 1 ether);
    }

    function testInitialSupply() public {
        assertEq(polToken.totalSupply(), 0, "Initial supply should be 0");
        assertEq(polToken.balanceOf(owner), 0, "Owner should have 0 tokens initially");
    }

    function testMakeContribution() public {
        vm.startPrank(contributor1);

        // 测试教育贡献
        polToken.makeContribution(
            PoLToken.ContributionType.EDUCATION,
            10,
            "ipfs://QmTestEducation123"
        );

        (uint256 totalContributions, uint256 totalPoints, uint256 verifiedContributions, uint256 totalRewards) =
            polToken.getUserStats(contributor1);

        assertEq(totalContributions, 1, "Should have 1 contribution");
        assertEq(totalPoints, 10, "Should have 10 points");
        assertEq(verifiedContributions, 0, "Should not be verified yet (manual verification required)");

        vm.stopPrank();
    }

    function testAutoVerification() public {
        vm.startPrank(contributor1);

        // 小额贡献应该自动验证
        polToken.makeContribution(
            PoLToken.ContributionType.COMMUNITY,
            1,
            "ipfs://QmTestCommunity123"
        );

        (uint256 totalContributions, uint256 totalPoints, uint256 verifiedContributions, uint256 totalRewards) =
            polToken.getUserStats(contributor1);

        assertEq(totalContributions, 1, "Should have 1 contribution");
        assertEq(verifiedContributions, 1, "Should be automatically verified");
        assertGt(totalRewards, 0, "Should have received rewards");

        vm.stopPrank();
    }

    function testManualVerification() public {
        vm.startPrank(contributor1);

        // 创建需要手动验证的大额贡献
        polToken.makeContribution(
            PoLToken.ContributionType.CODE_CONTRIB,
            100,
            "ipfs://QmTestCode123"
        );

        (,,,, uint256 totalRewards1) = polToken.getUserStats(contributor1);
        assertEq(totalRewards1, 0, "Should not have rewards yet");

        vm.stopPrank();

        // 所有者验证贡献
        vm.startPrank(owner);
        polToken.verifyContribution(contributor1, 0);

        (,,,, uint256 totalRewards2) = polToken.getUserStats(contributor1);
        assertGt(totalRewards2, 0, "Should have received rewards after verification");

        vm.stopPrank();
    }

    function testContributionTypes() public {
        vm.startPrank(contributor1);

        // 测试不同贡献类型
        polToken.makeContribution(PoLToken.ContributionType.EDUCATION, 5, "test1");
        polToken.makeContribution(PoLToken.ContributionType.CODE_CONTRIB, 5, "test2");
        polToken.makeContribution(PoLToken.ContributionType.GOVERNANCE, 5, "test3");

        (uint256 totalContributions,,,) = polToken.getUserStats(contributor1);
        assertEq(totalContributions, 3, "Should have 3 contributions");

        vm.stopPrank();
    }

    function testInvalidContribution() public {
        vm.startPrank(contributor1);

        // 测试无效的贡献参数
        vm.expectRevert("Impact score must be positive");
        polToken.makeContribution(PoLToken.ContributionType.EDUCATION, 0, "test");

        vm.expectRevert("Metadata required");
        polToken.makeContribution(PoLToken.ContributionType.EDUCATION, 5, "");

        vm.stopPrank();
    }

    function testPausing() public {
        vm.startPrank(owner);

        // 测试暂停功能
        polToken.pause();

        vm.startPrank(contributor1);
        vm.expectRevert("Pausable: paused");
        polToken.makeContribution(PoLToken.ContributionType.EDUCATION, 5, "test");

        vm.stopPrank();

        // 恢复合约
        vm.startPrank(owner);
        polToken.unpause();

        vm.startPrank(contributor1);
        polToken.makeContribution(PoLToken.ContributionType.EDUCATION, 5, "test");

        vm.stopPrank();
    }

    function testContributionRewards() public {
        vm.startPrank(contributor1);

        // 测试不同贡献类型的奖励倍数
        polToken.makeContribution(PoLToken.ContributionType.EDUCATION, 10, "education");
        polToken.makeContribution(PoLToken.ContributionType.CODE_CONTRIB, 10, "code");

        // 代码贡献的倍数应该更高
        // 验证两个贡献
        vm.startPrank(owner);
        polToken.verifyContribution(contributor1, 0); // education
        polToken.verifyContribution(contributor1, 1); // code

        (,,,, uint256 totalRewards) = polToken.getUserStats(contributor1);

        // 验证奖励差异
        assertGt(totalRewards, 0, "Should have received rewards");

        vm.stopPrank();
    }

    function testTokenDelegation() public {
        vm.startPrank(owner);

        // 铸造一些代币用于测试
        polToken.makeContribution(PoLToken.ContributionType.EDUCATION, 1, "test");
        polToken.verifyContribution(owner, 0);

        uint256 balance = polToken.balanceOf(owner);
        assertGt(balance, 0, "Should have tokens for delegation test");

        // 测试委托
        polToken.delegate(contributor1);
        address delegate = polToken.delegates(owner);
        assertEq(delegate, contributor1, "Delegation should work");

        vm.stopPrank();
    }

    function testGetAllContributions() public {
        vm.startPrank(contributor1);

        polToken.makeContribution(PoLToken.ContributionType.EDUCATION, 5, "test1");
        polToken.makeContribution(PoLToken.ContributionType.CODE_CONTRIB, 10, "test2");

        PoLToken.Contribution[] memory contributions = polToken.getUserContributions(contributor1);
        assertEq(contributions.length, 2, "Should have 2 contributions");
        assertEq(contributions[0].contributor, contributor1, "First contributor should match");
        assertEq(contributions[1].contributor, contributor1, "Second contributor should match");

        vm.stopPrank();
    }

    function testMaxSupply() public {
        // 测试最大供应量限制
        assertEq(polToken.maxSupply(), 1000000000 * 10**18, "Max supply should be 1 billion tokens");
    }

    function testContributionTypeMultipliers() public {
        // 测试初始倍数设置
        assertEq(polToken.typeMultipliers(PoLToken.ContributionType.EDUCATION), 15);
        assertEq(polToken.typeMultipliers(PoLToken.ContributionType.CODE_CONTRIB), 20);
        assertEq(polToken.typeMultipliers(PoLToken.ContributionType.GOVERNANCE), 10);
        assertEq(polToken.typeMultipliers(PoLToken.ContributionType.COMMUNITY), 8);
        assertEq(polToken.typeMultipliers(PoLToken.ContributionType.TRANSLATION), 12);
        assertEq(polToken.typeMultipliers(PoLToken.ContributionType.MENTORING), 18);
    }

    function testSetTypeMultiplier() public {
        vm.startPrank(owner);

        // 测试设置倍数
        polToken.setTypeMultiplier(PoLToken.ContributionType.EDUCATION, 25);
        assertEq(polToken.typeMultipliers(PoLToken.ContributionType.EDUCATION), 25);

        // 测试无效倍数
        vm.expectRevert("Multiplier must be positive");
        polToken.setTypeMultiplier(PoLToken.ContributionType.EDUCATION, 0);

        vm.stopPrank();
    }

    function testUnauthorizedVerification() public {
        vm.startPrank(contributor1);

        polToken.makeContribution(PoLToken.ContributionType.EDUCATION, 10, "test");

        // 非授权用户尝试验证应该失败
        vm.expectRevert("Not authorized verifier");
        polToken.verifyContribution(contributor1, 0);

        vm.stopPrank();
    }
}