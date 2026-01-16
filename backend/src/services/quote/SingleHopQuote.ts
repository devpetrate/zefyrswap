import { ethers } from 'ethers';
import { IDexAdapter } from '../../adapters/IDexAdapter';
import { QuoteResponse, RouteHop } from '../../types';
import { ERC20ABI } from '../../abi/ERC20';
import { PriceCalculator } from '../utils/PriceCalculator';
import { TokenHelper } from '../utils/TokenHelper';

export class SingleHopQuote {
  private provider: ethers.providers.JsonRpcProvider;
  private adapters: IDexAdapter[];

  constructor(
    provider: ethers.providers.JsonRpcProvider,
    adapters: IDexAdapter[]
  ) {
    this.provider = provider;
    this.adapters = adapters;
  }

  /**
   * Get best single-hop quote across all DEXes
   */
  async getQuote(
    normalizedTokenIn: string,
    normalizedTokenOut: string,
    amountIn: string,
    slippage: number
  ): Promise<QuoteResponse | null> {
    console.log('📊 SINGLE-HOP QUOTES');
    console.log('─────────────────────────────────────────');
    
    // Query all adapters in parallel
    const quotes = await Promise.all(
      this.adapters.map(adapter => 
        adapter.getQuote(normalizedTokenIn, normalizedTokenOut, amountIn)
      )
    );

    const validQuotes = quotes.filter(q => q !== null);
    
    // ✅ Log results from all adapters
    console.log('Results:');
    quotes.forEach((quote, index) => {
      const adapterName = this.adapters[index].name;
      if (quote) {
        console.log(`  ✅ ${adapterName.padEnd(20)} ${quote.amountOut.padStart(15)} (fee: ${quote.fee})`);
      } else {
        console.log(`  ❌ ${adapterName.padEnd(20)} No valid quote`);
      }
    });
    
    if (validQuotes.length === 0) {
      console.log('\n⚠️  No single-hop routes found\n');
      return null;
    }

    // Find best quote
    const bestQuote = validQuotes.reduce((best, current) => {
      const bestAmount = ethers.BigNumber.from(best!.amountOut);
      const currentAmount = ethers.BigNumber.from(current!.amountOut);
      return currentAmount.gt(bestAmount) ? current : best;
    });

    console.log(`\n🏆 Single-hop winner: ${bestQuote!.dexName}`);
    console.log(`   Output: ${bestQuote!.amountOut}\n`);

    // Calculate values
    const amountOut = ethers.BigNumber.from(bestQuote.amountOut);
    const slippageBps = Math.floor(slippage * 100);
    const amountOutMin = amountOut.mul(10000 - slippageBps).div(10000);
    
    // ✅ Calculate price with correct decimals
    const price = await PriceCalculator.calculatePrice(
      this.provider,
      normalizedTokenIn,
      normalizedTokenOut,
      amountIn,
      amountOut
    );

    // ✅ Calculate price impact (simple estimation for single hop)
    const amountInBN = ethers.BigNumber.from(amountIn);
    // ✅ Calculate price impact
const priceImpact = await PriceCalculator.calculatePriceImpact(
  this.provider,
  bestQuote.pool,
  normalizedTokenIn,
  normalizedTokenOut,
  amountInBN,
  amountOut,
  bestQuote.fee
);

console.log(`📊 Price Impact: ${priceImpact}%\n`);

    // ✅ Map DEX name to DEX ID
    const dexIdMap = TokenHelper.getDexIdMap();

    // ✅ Build route array with single hop
    const route: RouteHop[] = [{
      dex: bestQuote.dexName,
      tokenIn: normalizedTokenIn,
      tokenOut: normalizedTokenOut,
      amountIn: amountIn,
      amountOut: bestQuote.amountOut,
      fee: bestQuote.fee,
      pool: bestQuote.pool!,
      zeroForOne: bestQuote.zeroForOne!,
      dexId: dexIdMap[bestQuote.dexName] || 1,
    }];

    return {
      tokenIn: normalizedTokenIn,
      tokenOut: normalizedTokenOut,
      amountIn,
      amountOut: bestQuote.amountOut,
      amountOutMin: amountOutMin.toString(),
      price,
      route,
      totalFees: bestQuote.fee,
      priceImpact,
      gasEstimate: bestQuote.gasEstimate,
    };
  }
}