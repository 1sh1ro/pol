// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ContributionRegistry
 * @notice 存储 AI 评审结果与治理终审结果的链上登记册
 */
contract ContributionRegistry is Ownable, ReentrancyGuard {
    enum Verdict {
        Pending,
        Accept,
        NeedsReview,
        Reject
    }

    struct Score {
        uint16 technical;
        uint16 community;
        uint16 governance;
        uint16 overall;
    }

    struct Contribution {
        uint256 id;
        address submitter;
        string title;
        string metadataURI;
        string aiReport;
        Verdict aiVerdict;
        Score score;
        uint256 submittedAt;
        Verdict finalVerdict;
        address finalApprover;
        uint256 finalizedAt;
        uint256 proposalId;
        string notes;
    }

    address public governanceExecutor;

    uint256 public nextContributionId = 1;
    mapping(uint256 => Contribution) private contributions;
    uint256[] private contributionIds;

    event GovernanceExecutorUpdated(address indexed executor);
    event ContributionSubmitted(
        uint256 indexed id,
        address indexed submitter,
        Verdict aiVerdict,
        uint256 submittedAt
    );
    event ContributionResolved(
        uint256 indexed id,
        Verdict verdict,
        uint256 proposalId,
        address indexed approver,
        string notes
    );

    modifier onlyGovernance() {
        require(
            msg.sender == governanceExecutor || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    constructor(address _owner) {
        require(_owner != address(0), "Invalid owner");
        _transferOwnership(_owner);
        governanceExecutor = _owner;
    }

    function submitContribution(
        string calldata _title,
        string calldata _metadataURI,
        string calldata _aiReport,
        Verdict _aiVerdict,
        uint16 _technicalScore,
        uint16 _communityScore,
        uint16 _governanceScore,
        uint16 _overallScore
    ) external nonReentrant returns (uint256) {
        require(bytes(_metadataURI).length > 0, "Metadata required");
        require(bytes(_aiReport).length > 0, "AI report required");

        uint256 contributionId = nextContributionId++;

        Contribution storage contribution = contributions[contributionId];
        contribution.id = contributionId;
        contribution.submitter = msg.sender;
        contribution.title = _title;
        contribution.metadataURI = _metadataURI;
        contribution.aiReport = _aiReport;
        contribution.aiVerdict = _aiVerdict;
        contribution.score = Score({
            technical: _technicalScore,
            community: _communityScore,
            governance: _governanceScore,
            overall: _overallScore
        });
        contribution.submittedAt = block.timestamp;
        contribution.finalVerdict = Verdict.Pending;

        contributionIds.push(contributionId);

        emit ContributionSubmitted(
            contributionId,
            msg.sender,
            _aiVerdict,
            block.timestamp
        );

        return contributionId;
    }

    function resolveContribution(
        uint256 _contributionId,
        Verdict _finalVerdict,
        uint256 _proposalId,
        string calldata _notes
    ) external onlyGovernance {
        Contribution storage contribution = contributions[_contributionId];
        require(contribution.id != 0, "Contribution not found");
        require(
            contribution.finalVerdict == Verdict.Pending ||
                contribution.finalVerdict == Verdict.NeedsReview,
            "Already finalized"
        );

        contribution.finalVerdict = _finalVerdict;
        contribution.finalApprover = msg.sender;
        contribution.finalizedAt = block.timestamp;
        contribution.proposalId = _proposalId;
        contribution.notes = _notes;

        emit ContributionResolved(
            _contributionId,
            _finalVerdict,
            _proposalId,
            msg.sender,
            _notes
        );
    }

    function setGovernanceExecutor(address _executor) external onlyOwner {
        require(_executor != address(0), "Invalid executor");
        governanceExecutor = _executor;
        emit GovernanceExecutorUpdated(_executor);
    }

    function getContribution(uint256 _contributionId)
        external
        view
        returns (Contribution memory)
    {
        require(_contributionId != 0 && _contributionId < nextContributionId, "Invalid id");
        return contributions[_contributionId];
    }

    function getContributions(uint256 _offset, uint256 _limit)
        external
        view
        returns (Contribution[] memory)
    {
        require(_offset <= contributionIds.length, "Offset out of range");
        uint256 endExclusive = _offset + _limit;
        if (endExclusive > contributionIds.length) {
            endExclusive = contributionIds.length;
        }

        uint256 resultLength = endExclusive - _offset;
        Contribution[] memory result = new Contribution[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            uint256 contributionId = contributionIds[_offset + i];
            result[i] = contributions[contributionId];
        }

        return result;
    }

    function contributionCount() external view returns (uint256) {
        return contributionIds.length;
    }

    function getContributionIds() external view returns (uint256[] memory) {
        return contributionIds;
    }
}

