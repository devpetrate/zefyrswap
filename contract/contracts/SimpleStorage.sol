// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

/**
 * @title SimpleStorage
 * @dev Store and retrieve a value in a variable
 * @notice This contract will be deployed to the same address across multiple networks using CREATE2
 */
contract SimpleStorage {
    uint256 private value;
    address public owner;
    
    event ValueChanged(uint256 newValue, address changedBy);
    
    constructor(uint256 _initialValue) {
        value = _initialValue;
        owner = msg.sender;
    }
    
    /**
     * @dev Store a new value
     * @param _newValue The new value to store
     */
    function setValue(uint256 _newValue) public {
        value = _newValue;
        emit ValueChanged(_newValue, msg.sender);
    }
    
    /**
     * @dev Retrieve the stored value
     * @return The stored value
     */
    function getValue() public view returns (uint256) {
        return value;
    }
    
    /**
     * @dev Increment the stored value by 1
     */
    function increment() public {
        value += 1;
        emit ValueChanged(value, msg.sender);
    }
}
