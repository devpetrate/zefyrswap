export interface QuoteRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippage?: number; // Optional, default to 0.5%
}

// export interface QuoteResponse {
//   tokenIn: string;
//   tokenOut: string;
//   amountIn: string;
//   amountOut: string;
//   amountOutMin: string;
//   route: string;
//   fee: number;
//   priceImpact: string;
//   gasEstimate: string;
//   price: string;
//   pool?: string; // Add pool address
//   zeroForOne?: boolean; // Add swap direction
// }

export interface QuoteResponse {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountInUsd?: string;
  amountOut: string;
  amountOutUsd?: string;
  amountOutMin: string;
  price: string;
  route: RouteHop[];  // ✅ Array of hops
  totalFees: number;
  priceImpact: string;
  gasEstimate: string;
}

export interface RouteHop {
  dex: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  fee: number;
  pool: string;
  zeroForOne: boolean;
  dexId: number;  // Add for encoding
}

export interface SwapRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  userAddress: string;
  slippageBps?: number; // Basis points (50 = 0.5%)
}

export interface SwapResponse {
  amountOut: string;
  amountOutMin: string;
  pathDefinition: string;
  executorAddress: string;
  routerAddress: string;
  inputReceiver: string;
  outputReceiver: string;
  value: string;
}

export interface DexQuote {
  dexName: string;
  amountOut: string;
  fee: number;
  gasEstimate: string;
  pool: string; // Add pool address
  zeroForOne: boolean; // Add swap direction
  sqrtPriceX96After?: string;
  initializedTicksCrossed?: number;
}

export interface TokenInfo {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
}