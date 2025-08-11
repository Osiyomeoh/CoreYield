// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../interfaces/ICoreYieldFactory.sol";

library LibDiamond {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("diamond.standard.diamond.storage");
    
    struct DiamondStorage {
        // Core market management
        mapping(address => ICoreYieldFactory.Market) markets;
        mapping(address => mapping(address => ICoreYieldFactory.UserPosition)) userPositions;
        mapping(address => address[]) userMarkets;
        
        // Protocol configuration
        address[] allMarkets;
        uint256 protocolFeeRate;
        uint256 maxProtocolFeeRate;
        address feeRecipient;
        address priceOracle;
    }
    
    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
} 