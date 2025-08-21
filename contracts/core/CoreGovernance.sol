// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
contract CoreGovernance is Ownable, Pausable {
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool canceled;
        uint256 quorum;
        uint256 minVotingPower;
    }
    
    struct Vote {
        bool support;
        uint256 votingPower;
        uint256 timestamp;
        string reason;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;
    mapping(address => uint256) public userVotingPower;
    mapping(address => uint256) public lastVoteTime;
    
    uint256 private _proposalIds;
    
    uint256 public constant MIN_PROPOSAL_DURATION = 1 days;
    uint256 public constant MAX_PROPOSAL_DURATION = 30 days;
    uint256 public constant MIN_QUORUM = 1000; // 10%
    uint256 public constant MIN_VOTING_POWER = 100; // Minimum veCORE required
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 votingPower);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    event VotingPowerUpdated(address indexed user, uint256 newPower);
    
    modifier onlyProposer(uint256 proposalId) {
        require(proposals[proposalId].proposer == msg.sender, "Only proposer can call this");
        _;
    }
    
    modifier proposalExists(uint256 proposalId) {
        require(proposals[proposalId].id != 0, "Proposal does not exist");
        _;
    }
    
    modifier proposalActive(uint256 proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.startTime <= block.timestamp, "Proposal not started");
        require(proposal.endTime > block.timestamp, "Proposal ended");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.canceled, "Proposal canceled");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        _proposalIds = 1; // Start from 1
    }
    
    function createProposal(
        string memory title,
        string memory description,
        uint256 duration
    ) external returns (uint256 proposalId) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(duration >= MIN_PROPOSAL_DURATION, "Duration too short");
        require(duration <= MAX_PROPOSAL_DURATION, "Duration too long");
        require(userVotingPower[msg.sender] >= MIN_VOTING_POWER, "Insufficient voting power");
        
        proposalId = _proposalIds;
        _proposalIds++;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            executed: false,
            canceled: false,
            quorum: MIN_QUORUM,
            minVotingPower: MIN_VOTING_POWER
        });
        
        emit ProposalCreated(proposalId, msg.sender, title);
    }
    
    function vote(
        uint256 proposalId,
        bool support,
        string memory reason
    ) external proposalExists(proposalId) proposalActive(proposalId) {
        require(userVotingPower[msg.sender] > 0, "No voting power");
        require(votes[proposalId][msg.sender].timestamp == 0, "Already voted");
        
        uint256 votingPower = userVotingPower[msg.sender];
        
        votes[proposalId][msg.sender] = Vote({
            support: support,
            votingPower: votingPower,
            timestamp: block.timestamp,
            reason: reason
        });
        
        if (support) {
            proposals[proposalId].forVotes += votingPower;
        } else {
            proposals[proposalId].againstVotes += votingPower;
        }
        
        lastVoteTime[msg.sender] = block.timestamp;
        
        emit Voted(proposalId, msg.sender, support, votingPower);
    }
    
    function executeProposal(uint256 proposalId) external proposalExists(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.endTime, "Proposal not ended");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.canceled, "Proposal canceled");
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        require(totalVotes >= proposal.quorum, "Quorum not reached");
        
        if (proposal.forVotes > proposal.againstVotes) {
            proposal.executed = true;
            emit ProposalExecuted(proposalId);
            
            // Execute the proposal logic here
            _executeProposalLogic(proposalId);
        }
    }
    
    function cancelProposal(uint256 proposalId) external onlyProposer(proposalId) proposalExists(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.canceled, "Proposal canceled");
        require(block.timestamp < proposal.endTime, "Proposal already ended");
        
        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }
    
    function updateVotingPower(address user, uint256 newPower) external onlyOwner {
        userVotingPower[user] = newPower;
        emit VotingPowerUpdated(user, newPower);
    }
    
    function batchUpdateVotingPower(
        address[] calldata users,
        uint256[] calldata powers
    ) external onlyOwner {
        require(users.length == powers.length, "Array lengths mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            userVotingPower[users[i]] = powers[i];
            emit VotingPowerUpdated(users[i], powers[i]);
        }
    }
    
    function getProposalInfo(uint256 proposalId) external view returns (
        address proposer,
        string memory title,
        string memory description,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 startTime,
        uint256 endTime,
        bool executed,
        bool canceled,
        uint256 quorum,
        uint256 minVotingPower
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.startTime,
            proposal.endTime,
            proposal.executed,
            proposal.canceled,
            proposal.quorum,
            proposal.minVotingPower
        );
    }
    
    function getUserVote(uint256 proposalId, address user) external view returns (
        bool support,
        uint256 votingPower,
        uint256 timestamp,
        string memory reason
    ) {
        Vote storage vote = votes[proposalId][user];
        return (
            vote.support,
            vote.votingPower,
            vote.timestamp,
            vote.reason
        );
    }
    
    function getProposalStatus(uint256 proposalId) external view returns (
        bool isActive,
        bool isPassed,
        bool isExecuted,
        bool isCanceled,
        uint256 timeRemaining
    ) {
        Proposal storage proposal = proposals[proposalId];
        
        bool isActive = proposal.startTime <= block.timestamp && 
                       proposal.endTime > block.timestamp && 
                       !proposal.executed && 
                       !proposal.canceled;
        
        bool isPassed = false;
        if (block.timestamp >= proposal.endTime && !proposal.executed && !proposal.canceled) {
            uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
            isPassed = totalVotes >= proposal.quorum && proposal.forVotes > proposal.againstVotes;
        }
        
        uint256 timeRemaining = 0;
        if (proposal.endTime > block.timestamp) {
            timeRemaining = proposal.endTime - block.timestamp;
        }
        
        return (
            isActive,
            isPassed,
            proposal.executed,
            proposal.canceled,
            timeRemaining
        );
    }
    
    function getProposalCount() external view returns (uint256) {
        return _proposalIds - 1;
    }
    
    function getActiveProposals() external view returns (uint256[] memory) {
        uint256 count = 0;
        uint256 totalProposals = _proposalIds - 1;
        
        // Count active proposals
        for (uint256 i = 1; i <= totalProposals; i++) {
            if (proposals[i].startTime <= block.timestamp && 
                proposals[i].endTime > block.timestamp && 
                !proposals[i].executed && 
                !proposals[i].canceled) {
                count++;
            }
        }
        
        uint256[] memory activeProposals = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalProposals; i++) {
            if (proposals[i].startTime <= block.timestamp && 
                proposals[i].endTime > block.timestamp && 
                !proposals[i].executed && 
                !proposals[i].canceled) {
                activeProposals[index] = i;
                index++;
            }
        }
        
        return activeProposals;
    }
    
    function _executeProposalLogic(uint256 proposalId) internal {
        // This function would contain the actual proposal execution logic
        // For now, it's a placeholder
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
