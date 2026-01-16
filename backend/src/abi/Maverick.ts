export const MaverickFactoryABI = [
  'function lookup(address tokenA, address tokenB, uint256 startIndex, uint256 count) external view returns (address[] memory pools)'
];
export const MaverickQuoterABI = [
  'function calculateSwap(address pool, uint128 amount, bool tokenAIn, bool exactOutput, int32 tickLimit) external returns (uint256 amountIn, uint256 amountOut, uint256 feeAmount)'
];
export const MaverickPoolABI = [
  'function tokenA() external view returns (address)',
  'function tokenB() external view returns (address)',
  'function fee(bool tokenAIn) external view returns (uint256)',
  'function getState() external view returns (tuple(uint256 reserveA, uint256 reserveB, int32 activeTick))',
  'function swap(address recipient, tuple(uint256 amount, bool tokenAIn, bool exactOutput, int32 tickLimit) params, bytes calldata data) external returns (uint256 amountIn, uint256 amountOut)'
];