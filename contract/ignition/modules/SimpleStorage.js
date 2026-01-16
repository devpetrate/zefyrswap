const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

/**
 * Hardhat Ignition Module for deploying SimpleStorage contract
 * This module will use CREATE2 for deterministic deployment across networks
 * 
 * The same contract will be deployed to the same address on:
 * - Base mainnet
 * - Ethereum Sepolia
 * - Optimism mainnet
 * - Any other EVM-compatible network
 * 
 * To deploy with CREATE2:
 * npx hardhat ignition deploy ignition/modules/SimpleStorage.js --network <network> --strategy create2 --verify
 */
module.exports = buildModule("SimpleStorageModule", (m) => {
  // Get the initial value parameter (default: 42)
  const initialValue = m.getParameter("initialValue", 42);
  
  // Deploy SimpleStorage contract with initial value
  const simpleStorage = m.contract("SimpleStorage", [initialValue]);
  
  return { simpleStorage };
});
