// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PoLToken.sol";
import "../src/NFTBadge.sol";
import "../src/Governance.sol";
import "../src/ContributionRegistry.sol";
import "forge-std/console.sol";

/**
 * @title Proof of Love Deployment Script
 * @dev 用于部署PoL平台的所有智能合约
 * @author Proof of Love Team
 */
contract DeployScript is Script {
    PoLToken public polToken;
    NFTBadge public nftBadge;
    TimelockController public timelock;
    PoLGovernance public governance;
    ContributionRegistry public contributionRegistry;

    // 部署参数
    uint256 public deployerPrivateKey;
    address public deployer;
    address[] public proposers;
    address[] public executors;

    function setUp() public {
        // 从环境变量获取私钥
        deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        deployer = vm.addr(deployerPrivateKey);

        // 设置时间锁控制器的提议者和执行者
        proposers = [deployer];
        executors = [deployer];

        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
    }

    function run() public {
        vm.startBroadcast(deployerPrivateKey);

        console.log("Starting deployment...");

        // 1. 部署PoL Token
        polToken = new PoLToken();
        console.log("PoL Token deployed at:", address(polToken));

        // 2. 部署Timelock Controller
        timelock = new TimelockController(
            2 days, // 2 days delay
            proposers,
            executors,
            deployer
        );
        console.log("Timelock Controller deployed at:", address(timelock));

        // 3. 部署NFT Badge
        nftBadge = new NFTBadge(address(polToken));
        console.log("NFT Badge deployed at:", address(nftBadge));

        // 4. 部署Governance
        governance = new PoLGovernance(
            address(polToken),
            address(timelock)
        );
        console.log("Governance deployed at:", address(governance));

        // 5. 部署 Contribution Registry
        contributionRegistry = new ContributionRegistry(deployer);
        console.log("ContributionRegistry deployed at:", address(contributionRegistry));

        // 6. 设置合约权限
        _setupPermissions();

        // 7. 配置贡献登记册
        _configureContributionRegistry();

        // 8. 验证部署
        _verifyDeployment();

        vm.stopBroadcast();

        console.log("Deployment completed successfully!");
        _logDeploymentInfo();
    }

    /**
     * @dev 设置合约权限和初始配置
     */
    function _setupPermissions() internal {
        console.log("Setting up permissions...");

        // 给Governance合约授予时间锁控制器的权限
        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        bytes32 executorRole = timelock.EXECUTOR_ROLE();
        bytes32 adminRole = timelock.TIMELOCK_ADMIN_ROLE();

        timelock.grantRole(proposerRole, address(governance));
        timelock.grantRole(executorRole, address(governance));

        // 设置NFT Badge的铸造权限
        nftBadge.transferOwnership(deployer);

        console.log("Permissions setup completed");
    }

    function _configureContributionRegistry() internal {
        console.log("Linking ContributionRegistry with governance...");

        contributionRegistry.setGovernanceExecutor(address(governance));
        governance.setContributionRegistry(address(contributionRegistry));

        console.log("ContributionRegistry linked successfully");
    }

    /**
     * @dev 验证部署是否成功
     */
    function _verifyDeployment() internal {
        console.log("Verifying deployment...");

        require(address(polToken) != address(0), "PoL Token deployment failed");
        require(address(nftBadge) != address(0), "NFT Badge deployment failed");
        require(address(timelock) != address(0), "Timelock deployment failed");
        require(address(governance) != address(0), "Governance deployment failed");
        require(address(contributionRegistry) != address(0), "ContributionRegistry deployment failed");

        // 验证合约设置
        require(polToken.balanceOf(deployer) == 0, "Initial balance should be 0");
        require(nftBadge.owner() == deployer, "NFT Badge ownership transfer failed");
        require(
            contributionRegistry.governanceExecutor() == address(governance),
            "ContributionRegistry executor misconfigured"
        );
        require(
            address(governance.contributionRegistry()) == address(contributionRegistry),
            "Governance registry misconfigured"
        );

        console.log("Deployment verification completed");
    }

    /**
     * @dev 记录部署信息
     */
    function _logDeploymentInfo() internal {
        console.log("\n=== Deployment Summary ===");
        console.log("Network ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("PoL Token:", address(polToken));
        console.log("NFT Badge:", address(nftBadge));
        console.log("Timelock Controller:", address(timelock));
        console.log("Governance:", address(governance));
        console.log("ContributionRegistry:", address(contributionRegistry));
        console.log("Deployment Timestamp:", block.timestamp);
        console.log("Gas Used:", gasleft());

        // 导出部署地址到JSON文件
        _exportDeploymentInfo();
    }

    /**
     * @dev 导出部署信息到JSON文件
     */
    function _exportDeploymentInfo() internal {
        string memory json = string(abi.encodePacked(
            "{",
            '"network": ', vm.toString(block.chainid), ",",
            '"deployer": "', vm.toString(deployer), '",',
            '"contracts": {',
                '"polToken": "', vm.toString(address(polToken)), '",',
                '"nftBadge": "', vm.toString(address(nftBadge)), '",',
                '"timelock": "', vm.toString(address(timelock)), '",',
                '"governance": "', vm.toString(address(governance)), '",',
                '"contributionRegistry": "', vm.toString(address(contributionRegistry)), '"'
            "},",
            '"timestamp": ', vm.toString(block.timestamp), ",",
            '"blockNumber": ', vm.toString(block.number),
            "}"
        ));

        vm.writeFile("./deployment.json", json);
        console.log("Deployment info saved to deployment.json");
    }

    /**
     * @dev 测试合约功能（开发环境）
     */
    function runTests() public {
        console.log("Running deployment tests...");

        // 测试PoL Token功能
        polToken.makeContribution(
            PoLToken.ContributionType.EDUCATION,
            5,
            "ipfs://QmTest123"
        );

        (uint256 totalContributions, uint256 totalPoints, uint256 verifiedContributions, uint256 totalRewards) =
            polToken.getUserStats(deployer);

        console.log("Test Results:");
        console.log("- Total contributions:", totalContributions);
        console.log("- Total points:", totalPoints);
        console.log("- Verified contributions:", verifiedContributions);
        console.log("- Total rewards:", totalRewards);

        console.log("Deployment tests completed successfully!");
    }
}