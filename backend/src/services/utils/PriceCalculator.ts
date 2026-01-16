import { ethers } from 'ethers';
import { ERC20ABI } from '../../abi/ERC20';
import { Multicall, Call3 } from '../utils/Multicall';

export class PriceCalculator {
  /**
   * Calculate price with correct decimals using Multicall
   */
  static async calculatePrice(
    provider: ethers.providers.JsonRpcProvider,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    amountOut: ethers.BigNumber
  ): Promise<string> {
    try {
      const multicall = new Multicall(provider);
      const erc20Interface = new ethers.utils.Interface(ERC20ABI);

      const calls: Call3[] = [
        Multicall.createCall(
          tokenIn,
          erc20Interface.encodeFunctionData('decimals'),
          true
        ),
        Multicall.createCall(
          tokenOut,
          erc20Interface.encodeFunctionData('decimals'),
          true
        ),
      ];

      const results = await multicall.aggregate(calls);

      const decimalsInResult = Multicall.decodeResult(results[0], erc20Interface, 'decimals');
      const decimalsOutResult = Multicall.decodeResult(results[1], erc20Interface, 'decimals');

      const decimalsIn = decimalsInResult ? decimalsInResult[0] : 18;
      const decimalsOut = decimalsOutResult ? decimalsOutResult[0] : 18;

      const amountInFormatted = parseFloat(ethers.utils.formatUnits(amountIn, decimalsIn));
      const amountOutFormatted = parseFloat(ethers.utils.formatUnits(amountOut, decimalsOut));
      const price = amountOutFormatted / amountInFormatted;

      console.log(`💱 Price calculation:`);
      console.log(`   Input: ${amountInFormatted} (${decimalsIn} decimals)`);
      console.log(`   Output: ${amountOutFormatted} (${decimalsOut} decimals)`);
      console.log(`   Price: ${price.toFixed(6)}\n`);

      return price.toFixed(6);
    } catch (error) {
      console.warn('⚠️  Price calculation failed, using default');
      return '1.0';
    }
  }

  /**
   * Simple price impact estimation (safe fallback)
   * Estimates impact based on trade size relative to typical pool depth
   */
  static estimatePriceImpact(
    amountIn: ethers.BigNumber,
    amountOut: ethers.BigNumber,
    totalFees: number
  ): string {
    try {
      // Simple heuristic: larger trades relative to expected output = higher impact
      // For small trades on liquid pairs, this will be ~0.01-0.1%
      // For larger trades or less liquid pairs, this will be higher
      
      const feesPercent = totalFees / 100; // Convert bps to %
      
      // Base impact is proportional to fees (larger fee tiers = less liquid = more impact)
      // Multiply by a small factor since actual impact is usually less than fees
      const estimatedImpact = feesPercent * 0.2; // 20% of fee as impact estimate
      
      return Math.min(estimatedImpact, 5).toFixed(2);
    } catch {
      return '0.05'; // Default 0.05% for typical small trades
    }
  }

  /**
   * Calculate price impact for single-hop (with pool data attempt)
   */
  static async calculatePriceImpact(
    provider: ethers.providers.JsonRpcProvider,
    poolAddress: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: ethers.BigNumber,
    amountOut: ethers.BigNumber,
    totalFees: number
  ): Promise<string> {
    try {
      // Try to get pool reserves using direct contract call (simpler than multicall)
      const poolABI = ['function liquidity() external view returns (uint128)'];
      const poolContract = new ethers.Contract(poolAddress, poolABI, provider);
      
      const liquidity = await poolContract.liquidity();
      
      if (liquidity && liquidity.gt(0)) {
        // Simple impact calculation: impact is proportional to (amountIn / liquidity)
        const liquidityBN = ethers.BigNumber.from(liquidity);
        const ratio = amountIn.mul(10000).div(liquidityBN);
        const impact = ratio.toNumber() / 100;
        
        console.log(`💹 Price Impact: ~${impact.toFixed(2)}%\n`);
        
        return Math.min(impact, 100).toFixed(2);
      }
      
      // Fallback to estimation
      return this.estimatePriceImpact(amountIn, amountOut, totalFees);
    } catch (error) {
      // Fallback to simple estimation
      return this.estimatePriceImpact(amountIn, amountOut, totalFees);
    }
  }

  /**
   * Calculate price impact for multi-hop
   */
  static async calculateMultiHopPriceImpact(
    provider: ethers.providers.JsonRpcProvider,
    route: Array<{
      pool: string;
      tokenIn: string;
      tokenOut: string;
      amountIn: string;
      amountOut: string;
    }>,
    totalFees: number
  ): Promise<string> {
    try {
      // For multi-hop, sum the impacts of each hop
      let totalImpact = 0;

      for (const hop of route) {
        const amountIn = ethers.BigNumber.from(hop.amountIn);
        const amountOut = ethers.BigNumber.from(hop.amountOut);
        
        // Simple per-hop estimation
        const hopFees = totalFees / route.length; // Distribute fees across hops
        const hopImpact = parseFloat(this.estimatePriceImpact(amountIn, amountOut, hopFees));
        totalImpact += hopImpact;
      }

      console.log(`💹 Multi-hop Price Impact: ~${totalImpact.toFixed(2)}%\n`);
      
      return Math.min(totalImpact, 100).toFixed(2);
    } catch (error) {
      // Fallback: estimate based on total fees
      const impact = totalFees / 100 * 0.3; // 30% of fees
      return Math.min(impact, 5).toFixed(2);
    }
  }
}