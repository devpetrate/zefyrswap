import { ethers } from 'ethers';
import { IDexAdapter } from '../../adapters/IDexAdapter';
import { QuoteResponse, RouteHop } from '../../types';
import { ERC20ABI } from '../../abi/ERC20';
import { config } from '../../config';
import { PriceCalculator } from '../utils/PriceCalculator';
import { TokenHelper } from '../utils/TokenHelper';

export class MultiHopQuote {
  private provider: ethers.providers.JsonRpcProvider;
  private adapters: IDexAdapter[];
  private intermediateTokens: string[];

  constructor(
    provider: ethers.providers.JsonRpcProvider,
    adapters: IDexAdapter[],
    intermediateTokens: string[]
  ) {
    this.provider = provider;
    this.adapters = adapters;
    this.intermediateTokens = intermediateTokens;
  }

  /**
   * Get best multi-hop quote (2-hop routes)
   */
  async getQuote(
    normalizedTokenIn: string,
    normalizedTokenOut: string,
    amountIn: string,
    slippage: number
  ): Promise<QuoteResponse | null> {
    console.log('📊 MULTI-HOP QUOTES');
    console.log('─────────────────────────────────────────');
    
    const multiHopQuotes: QuoteResponse[] = [];

    // Try each intermediate token
    for (const intermediateToken of this.intermediateTokens) {
      // Skip if intermediate is same as input or output
      if (intermediateToken.toLowerCase() === normalizedTokenIn.toLowerCase() ||
          intermediateToken.toLowerCase() === normalizedTokenOut.toLowerCase()) {
        console.log(`⏭️  Skipping ${intermediateToken} (same as input/output)\n`);
        continue;
      }

      try {
        console.log(`🔗 Trying route via ${intermediateToken}...`);

        // ✅ First hop: tokenIn → intermediate
        const hop1Quotes = await Promise.all(
          this.adapters.map(adapter => 
            adapter.getQuote(normalizedTokenIn, intermediateToken, amountIn)
          )
        );

        const validHop1 = hop1Quotes.filter(q => q !== null);
        if (validHop1.length === 0) {
          console.log('   ❌ No path for first hop\n');
          continue;
        }

        const bestHop1 = validHop1.reduce((best, current) => {
          const bestAmount = ethers.BigNumber.from(best!.amountOut);
          const currentAmount = ethers.BigNumber.from(current!.amountOut);
          return currentAmount.gt(bestAmount) ? current : best;
        });

        console.log(`   ✅ Hop 1: ${bestHop1.dexName.padEnd(15)} → ${bestHop1.amountOut}`);

        // ✅ Second hop: intermediate → tokenOut
        const hop2Quotes = await Promise.all(
          this.adapters.map(adapter => 
            adapter.getQuote(intermediateToken, normalizedTokenOut, bestHop1.amountOut)
          )
        );

        const validHop2 = hop2Quotes.filter(q => q !== null);
        if (validHop2.length === 0) {
          console.log('   ❌ No path for second hop\n');
          continue;
        }

        const bestHop2 = validHop2.reduce((best, current) => {
          const bestAmount = ethers.BigNumber.from(best!.amountOut);
          const currentAmount = ethers.BigNumber.from(current!.amountOut);
          return currentAmount.gt(bestAmount) ? current : best;
        });

        console.log(`   ✅ Hop 2: ${bestHop2.dexName.padEnd(15)} → ${bestHop2.amountOut}`);
        console.log(`   💰 Total: ${bestHop2.amountOut}\n`);

        // ✅ Build multi-hop quote
        const dexIdMap = TokenHelper.getDexIdMap();

        const route: RouteHop[] = [
          {
            dex: bestHop1.dexName,
            tokenIn: normalizedTokenIn,
            tokenOut: intermediateToken,
            amountIn: amountIn,
            amountOut: bestHop1.amountOut,
            fee: bestHop1.fee,
            pool: bestHop1.pool!,
            zeroForOne: bestHop1.zeroForOne!,
            dexId: dexIdMap[bestHop1.dexName] || 1,
          },
          {
            dex: bestHop2.dexName,
            tokenIn: intermediateToken,
            tokenOut: normalizedTokenOut,
            amountIn: bestHop1.amountOut,
            amountOut: bestHop2.amountOut,
            fee: bestHop2.fee,
            pool: bestHop2.pool!,
            zeroForOne: bestHop2.zeroForOne!,
            dexId: dexIdMap[bestHop2.dexName] || 1,
          }
        ];

        const amountOut = ethers.BigNumber.from(bestHop2.amountOut);
        const slippageBps = Math.floor(slippage * 100);
        const amountOutMin = amountOut.mul(10000 - slippageBps).div(10000);

        // ✅ Calculate price
        const price = await PriceCalculator.calculatePrice(
          this.provider,
          normalizedTokenIn,
          normalizedTokenOut,
          amountIn,
          amountOut
        );

// ✅ Calculate price impact for multi-hop
const routeForImpact = route.map(hop => ({
  pool: hop.pool,
  tokenIn: hop.tokenIn,
  tokenOut: hop.tokenOut,
  amountIn: hop.amountIn,
  amountOut: hop.amountOut,
}));

const priceImpact = await PriceCalculator.calculateMultiHopPriceImpact(
  this.provider,
  routeForImpact,
  bestHop1.fee + bestHop2.fee
);

console.log(`📊 Multi-hop Price Impact: ${priceImpact}%\n`);

        // ✅ FIX: Proper gas estimation for multi-hop
        const gas1 = ethers.BigNumber.from(bestHop1.gasEstimate || "200000");
        const gas2 = ethers.BigNumber.from(bestHop2.gasEstimate || "200000");
        const totalGas = gas1.add(gas2);

        console.log(`⛽ Gas Estimation:`);
        console.log(`   Hop 1: ${gas1.toString()}`);
        console.log(`   Hop 2: ${gas2.toString()}`);
        console.log(`   Total: ${totalGas.toString()}\n`);

        multiHopQuotes.push({
          tokenIn: normalizedTokenIn,
          tokenOut: normalizedTokenOut,
          amountIn,
          amountOut: bestHop2.amountOut,
          amountOutMin: amountOutMin.toString(),
          price,
          route,
          totalFees: bestHop1.fee + bestHop2.fee,
          priceImpact,
          gasEstimate: totalGas.toString(),
        });

      } catch (error: any) {
        console.log(`   ❌ Failed: ${error.message}\n`);
        continue;
      }
    }

    if (multiHopQuotes.length === 0) {
      console.log('⚠️  No valid multi-hop routes found\n');
      return null;
    }

    // ✅ Find best multi-hop route
    const bestMultiHop = multiHopQuotes.reduce((best, current) => {
      const bestAmount = ethers.BigNumber.from(best.amountOut);
      const currentAmount = ethers.BigNumber.from(current.amountOut);
      return currentAmount.gt(bestAmount) ? current : best;
    });

    console.log(`🏆 Multi-hop winner:`);
    console.log(`   Route: ${bestMultiHop.route.map(h => h.dex).join(' → ')}`);
    console.log(`   Path: ${normalizedTokenIn.slice(0, 8)}... → ${bestMultiHop.route[0].tokenOut.slice(0, 8)}... → ${normalizedTokenOut.slice(0, 8)}...`);
    console.log(`   Output: ${bestMultiHop.amountOut}`);
    console.log(`   Total Fees: ${bestMultiHop.totalFees} bps`);
    console.log(`   Gas: ${bestMultiHop.gasEstimate}\n`);

    return bestMultiHop;
  }
}