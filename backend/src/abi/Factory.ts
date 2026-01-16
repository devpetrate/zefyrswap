// Universal Factory ABI (works for Uniswap V3, PancakeSwap V3, SushiSwap V3)
export const FactoryABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
];

// Aerodrome uses different tick spacing
export const AerodromeFactoryABI = [
  'function getPool(address tokenA, address tokenB, int24 tickSpacing) external view returns (address pool)'
];