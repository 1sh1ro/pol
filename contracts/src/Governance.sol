// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PoLToken.sol";
import "./ContributionRegistry.sol";

/**
 * @title Proof of Love Governance
 * @dev 基于PoL代币的去中心化治理系统
 * @author Proof of Love Team
 */
contract PoLGovernance is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    Ownable
{
    // 提案类型枚举
    enum ProposalType {
        FUNDING,           // 资金提案
        PARAMETER_CHANGE,  // 参数修改
        NEW_ACHIEVEMENT,   // 新成就创建
        COMMUNITY_GRANT,   // 社区资助
        TECH_UPGRADE,      // 技术升级
        PARTNERSHIP        // 合作伙伴关系
    }

    // 提案扩展信息
    struct ProposalExtended {
        uint256 proposalId;
        ProposalType proposalType;
        string category;
        string impactDescription;
        uint256 requestedAmount; // 请求的资金（如适用）
        address payable beneficiary; // 受益人（如适用）
        string metadata; // IPFS hash
        bool isCommunityProposal; // 是否为社区提案
        uint256 minVotesRequired; // 最低票数要求
    }

    // 社区资金池
    struct TreasuryInfo {
        uint256 totalBalance;
        uint256 availableFunds;
        uint256 totalSpent;
        mapping(address => uint256) allocatedFunds;
        uint256 lastDistribution;
    }

    // 状态变量
    PoLToken public immutable polToken;
    ContributionRegistry public contributionRegistry;

    mapping(uint256 => ProposalExtended) public proposalExtended;
    TreasuryInfo public treasury;

    uint256 public constant MIN_PROPOSAL_THRESHOLD = 1000 * 10**18; // 1000 PoL
    uint256 public constant MAX_PROPOSAL_AMOUNT = 100000 * 10**18; // 100k PoL

    // 提案ID计数器
    uint256 private _proposalIdCounter;

    event ContributionRegistryUpdated(address indexed registry);
    event ContributionDecisionRelayed(
        uint256 indexed contributionId,
        ContributionRegistry.Verdict verdict,
        uint256 indexed proposalId,
        string notes
    );

    // 事件
    event CommunityProposalCreated(
        address indexed proposer,
        uint256 indexed proposalId,
        ProposalType indexed proposalType,
        uint256 requestedAmount
    );

    event FundDisbursed(
        uint256 indexed proposalId,
        address indexed beneficiary,
        uint256 amount,
        string reason
    );

    event TreasuryUpdated(
        uint256 newBalance,
        uint256 availableFunds,
        uint256 timestamp
    );

    // 修饰符
    modifier onlyActiveProposal(uint256 proposalId) {
        require(state(proposalId) == ProposalState.Active, "Proposal not active");
        _;
    }

    function setContributionRegistry(address _registry) external onlyOwner {
        contributionRegistry = ContributionRegistry(_registry);
        emit ContributionRegistryUpdated(_registry);
    }

    function relayContributionDecision(
        uint256 _contributionId,
        ContributionRegistry.Verdict _verdict,
        uint256 _proposalId,
        string calldata _notes
    ) external onlyOwner {
        require(address(contributionRegistry) != address(0), "Registry not set");
        contributionRegistry.resolveContribution(
            _contributionId,
            _verdict,
            _proposalId,
            _notes
        );

        emit ContributionDecisionRelayed(
            _contributionId,
            _verdict,
            _proposalId,
            _notes
        );
    }

    modifier onlySufficientTreasury(uint256 _amount) {
        require(treasury.availableFunds >= _amount, "Insufficient treasury funds");
        _;
    }

    constructor(
        address _polTokenAddress,
        address _timelockAddress
    )
        Governor("Proof of Love Governance")
        GovernorSettings(
            1 days, // voting delay
            7 days, // voting period
            1 // proposal threshold
        )
        GovernorVotes(PoLToken(_polTokenAddress))
        GovernorVotesQuorumFraction(4) // 4% quorum
        GovernorTimelockControl(ITimelock(_timelockAddress))
    {
        polToken = PoLToken(_polTokenAddress);
        _proposalIdCounter = 1;
        treasury.lastDistribution = block.timestamp;
    }

    /**
     * @dev 创建社区提案
     */
    function proposeCommunity(
        address[] memory _targets,
        uint256[] memory _values,
        bytes[] memory _calldatas,
        string memory _description,
        ProposalType _proposalType,
        string memory _category,
        string memory _impactDescription,
        uint256 _requestedAmount,
        address payable _beneficiary,
        string memory _metadata
    ) public returns (uint256) {
        require(
            polToken.balanceOf(msg.sender) >= MIN_PROPOSAL_THRESHOLD,
            "Insufficient PoL tokens to propose"
        );

        uint256 proposalId = propose(
            _targets,
            _values,
            _calldatas,
            _description
        );

        // 存储扩展信息
        proposalExtended[proposalId] = ProposalExtended({
            proposalId: proposalId,
            proposalType: _proposalType,
            category: _category,
            impactDescription: _impactDescription,
            requestedAmount: _requestedAmount,
            beneficiary: _beneficiary,
            metadata: _metadata,
            isCommunityProposal: true,
            minVotesRequired: _calculateMinVotes(_proposalType, _requestedAmount)
        });

        emit CommunityProposalCreated(
            msg.sender,
            proposalId,
            _proposalType,
            _requestedAmount
        );

        return proposalId;
    }

    /**
     * @dev 执行提案（包括资金发放）
     */
    function executeWithFunding(
        uint256 proposalId
    ) public payable onlySufficientTreasury(proposalExtended[proposalId].requestedAmount) {
        _execute(proposalId);

        // 发放资金
        ProposalExtended storage proposal = proposalExtended[proposalId];
        if (proposal.requestedAmount > 0 && proposal.beneficiary != address(0)) {
            _disburseFunds(proposalId, proposal.beneficiary, proposal.requestedAmount);
        }
    }

    /**
     * @dev 资金发放
     */
    function _disburseFunds(
        uint256 _proposalId,
        address payable _beneficiary,
        uint256 _amount
    ) internal {
        require(_beneficiary != address(0), "Invalid beneficiary");

        treasury.availableFunds -= _amount;
        treasury.totalSpent += _amount;

        // 执行转账
        (bool success, ) = _beneficiary.call{value: _amount}("");
        require(success, "Transfer failed");

        emit FundDisbursed(_proposalId, _beneficiary, _amount, "Community grant disbursed");
    }

    /**
     * @dev 计算最低投票要求
     */
    function _calculateMinVotes(ProposalType _type, uint256 _amount)
        internal pure returns (uint256) {
        if (_type == ProposalType.FUNDING) {
            return _amount / 10; // 10% of requested amount in votes
        } else if (_type == ProposalType.PARAMETER_CHANGE) {
            return 5000 * 10**18; // 5000 PoL minimum
        } else {
            return 1000 * 10**18; // Default minimum
        }
    }

    /**
     * @dev 向国库注资
     */
    function fundTreasury() external payable {
        require(msg.value > 0, "No funds provided");

        treasury.totalBalance += msg.value;
        treasury.availableFunds += msg.value;

        emit TreasuryUpdated(
            treasury.totalBalance,
            treasury.availableFunds,
            block.timestamp
        );
    }

    /**
     * @dev 获取提案详细信息
     */
    function getProposalDetails(uint256 _proposalId)
        external view returns (
            uint256 id,
            address proposer,
            uint256 startBlock,
            uint256 endBlock,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            uint256 totalVotes,
            ProposalState currentState,
            ProposalExtended memory extended
        ) {
            (
                uint256 _startBlock,
                uint256 _endBlock,
                uint256 _forVotes,
                uint256 _againstVotes,
                uint256 _abstainVotes
            ) = proposalDetails(_proposalId);

            return (
                _proposalId,
                proposalProposer(_proposalId),
                _startBlock,
                _endBlock,
                _forVotes,
                _againstVotes,
                _abstainVotes,
                _forVotes + _againstVotes + _abstainVotes,
                state(_proposalId),
                proposalExtended[_proposalId]
            );
        }

    /**
     * @dev 获取社区提案统计
     */
    function getCommunityProposalStats()
        external view returns (
            uint256 totalProposals,
            uint256 activeProposals,
            uint256 successfulProposals,
            uint256 totalFundsRequested,
            uint256 totalFundsDisbursed
        ) {
            uint256 _totalProposals = 0;
            uint256 _activeProposals = 0;
            uint256 _successfulProposals = 0;
            uint256 _totalFundsRequested = 0;
            uint256 _totalFundsDisbursed = 0;

            for (uint i = 1; i < _proposalIdCounter; i++) {
                if (proposalExtended[i].isCommunityProposal) {
                    _totalProposals++;
                    _totalFundsRequested += proposalExtended[i].requestedAmount;

                    ProposalState currentState = state(i);
                    if (currentState == ProposalState.Active) {
                        _activeProposals++;
                    } else if (currentState == ProposalState.Executed) {
                        _successfulProposals++;
                        _totalFundsDisbursed += proposalExtended[i].requestedAmount;
                    }
                }
            }

            return (
                _totalProposals,
                _activeProposals,
                _successfulProposals,
                _totalFundsRequested,
                _totalFundsDisbursed
            );
        }

    /**
     * @dev 更新提案参数
     */
    function setVotingDelay(uint256 newVotingDelay) external onlyOwner {
        _setVotingDelay(newVotingDelay);
    }

    function setVotingPeriod(uint256 newVotingPeriod) external onlyOwner {
        _setVotingPeriod(newVotingPeriod);
    }

    function setProposalThreshold(uint256 newProposalThreshold) external onlyOwner {
        _setProposalThreshold(newProposalThreshold);
    }

    function updateQuorumNumerator(uint256 newQuorumNumerator) external onlyOwner {
        _updateQuorumNumerator(newQuorumNumerator);
    }

    // 重写必要的Governor函数
    function _execute(uint256 proposalId)
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._execute(proposalId);
    }

    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}