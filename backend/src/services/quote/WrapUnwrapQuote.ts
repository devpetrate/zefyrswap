import { ethers } from 'ethers';
import { QuoteResponse } from '../../types';
import { config } from '../../config';
import { TokenHelper } from '../utils/TokenHelper';

export class WrapUnwrapQuote {
  /**
   * Get wrap/unwrap quote (1:1 exchange)
   */
  static getQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippage: number
  ): QuoteResponse {
    const amountInBN = ethers.BigNumber.from(amountIn);
    const slippageBps = Math.floor(slippage * 100);
    const amountOutMin = amountInBN.mul(10000 - slippageBps).div(10000);

    console.log('🔄 Wrap/Unwrap detected - returning 1:1 quote');
    console.log(`   ${TokenHelper.isNativeETH(tokenIn) ? 'ETH → WETH' : 'WETH → ETH'}`);
    console.log(`   Amount: ${amountIn}\n`);

    const isWrap = TokenHelper.isNativeETH(tokenIn);

    return {
      tokenIn: TokenHelper.isNativeETH(tokenIn) ? config.tokens.WETH : tokenIn,
      tokenOut: TokenHelper.isNativeETH(tokenOut) ? config.tokens.WETH : tokenOut,
      amountIn,
      amountOut: amountIn,
      amountOutMin: amountOutMin.toString(),
      price: '1.0',
      route: [{
        dex: 'wrap/unwrap',
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        amountIn: amountIn,
        amountOut: amountIn,
        fee: 0,
        pool: config.tokens.WETH,
        zeroForOne: isWrap,
        dexId: 0, // Special ID for wrap/unwrap
      }],
      totalFees: 0,
      priceImpact: '0.00',
      gasEstimate: '50000',
    };
  }
}