// dex-aggregator-backend\src\adapters\IDexAdapter.ts
import { DexQuote } from '../types';

/**
 * Base interface for all DEX adapters
 * This allows easy extension with new DEXes
 */
export interface IDexAdapter {
  name: string;
  
  /**
   * Get a quote for swapping tokens
   * @param tokenIn - Input token address
   * @param tokenOut - Output token address
   * @param amountIn - Amount of input token (in wei)
   * @returns Quote details including expected output amount
   */
  getQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<DexQuote | null>;
  
}
