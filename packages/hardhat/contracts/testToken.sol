// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CZT_TestToken is ERC20, Ownable {

    constructor() ERC20("Test-Token", "TT") Ownable() {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount * 10**18);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount * 10**18);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
