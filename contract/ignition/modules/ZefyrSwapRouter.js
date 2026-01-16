const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

/**
 * Hardhat Ignition Module for deploying ZefyrSwapRouter contract
 * This module will use CREATE2 for deterministic deployment across networks
 *
 * The ZefyrSwapRouter will be deployed to the same address on:
 * - Base mainnet
 * - Base Sepolia
 * - Ethereum Sepolia
 * - Optimism mainnet
 * - Any other EVM-compatible network
 *
 * Constructor: None - inherits Ownable which sets deployer as owner
 *
 * To deploy with CREATE2:
 * npx hardhat ignition deploy ignition/modules/ZefyrSwapRouter.js --network <network> --strategy create2 --verify
 */
module.exports = buildModule("ZefyrSwapRouterModule", (m) => {
  // Deploy ZefyrSwapRouter contract (no constructor arguments)
  const zefyrSwapRouter = m.contract("ZefyrSwapRouter");

  return { zefyrSwapRouter };
});
