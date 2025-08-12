pragma solidity ^0.8.19;

interface ICoreYieldAMM {
    struct Pool {
        address ptToken;
        address ytToken;
        uint256 ptReserves;
        uint256 ytReserves;
        uint256 totalSupply;
        bool isActive;
    }

    function pools(address ptToken, address ytToken) external view returns (Pool memory);
    function createPool(address ptToken, address ytToken) external returns (address poolAddress);
    function addLiquidity(address ptToken, address ytToken, uint256 ptAmount, uint256 ytAmount) external returns (uint256 liquidity);
    function removeLiquidity(address ptToken, address ytToken, uint256 liquidity) external returns (uint256 ptAmount, uint256 ytAmount);
    function swapPTForYT(address ptToken, address ytToken, uint256 ptAmount) external returns (uint256 ytAmount);
    function swapYTForPT(address ptToken, address ytToken, uint256 ytAmount) external returns (uint256 ptAmount);
    function getPoolReserves(address ptToken, address ytToken) external view returns (uint256 ptReserves, uint256 ytReserves);
    function getSwapQuote(address ptToken, address ytToken, uint256 amount, bool isPTForYT) external view returns (uint256 outputAmount);
} 