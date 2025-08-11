// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CorePrincipalToken is ERC20, Ownable {
    address public immutable syToken;
    uint256 public immutable maturity;
    
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    constructor(
        string memory name,
        string memory symbol,
        address _syToken,
        uint256 _maturity
    ) ERC20(name, symbol) Ownable(msg.sender) {
        syToken = _syToken;
        maturity = _maturity;
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
    
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        require(block.timestamp < maturity, "Market expired");
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        require(block.timestamp < maturity, "Market expired");
        return super.transferFrom(from, to, amount);
    }
}