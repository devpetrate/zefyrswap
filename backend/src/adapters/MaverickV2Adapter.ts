import { ethers } from 'ethers';
import { IDexAdapter } from './IDexAdapter';
import { DexQuote } from '../types';
import { config } from '../config';
import { MaverickFactoryABI, MaverickQuoterABI, MaverickPoolABI } from '../abi/Maverick';
import { Multicall, Call3 } from '../services/utils/Multicall';

export class MaverickV2Adapter implements IDexAdapter {
  name = 'maverick-v2';
  private provider: ethers.providers.JsonRpcProvider;
  private factoryContract: ethers.Contract;
  private quoterContract: ethers.Contract;
  private multicall: Multicall;

  constructor(provider: ethers.providers.JsonRpcProvider) {
    this.provider = provider;
    this.factoryContract = new ethers.Contract(
      config.maverick.factory,
      MaverickFactoryABI,
      provider
    );
    this.quoterContract = new ethers.Contract(
      config.maverick.quoter,
      MaverickQuoterABI,
      provider
    );
    this.multicall = new Multicall(provider);
  }

  /**
   * Get quote from Maverick V2
   * Uses Promise.all for quotes (too gas-intensive for multicall)
   * Uses Multicall for fee fetch (cheap view call)
   */
  async getQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<DexQuote | null> {
    try {
      console.log(`[Maverick V2] Getting quote for ${amountIn} tokens...`);

      // Determine token order (Maverick uses tokenA < tokenB)
      const tokenAIn = tokenIn.toLowerCase() < tokenOut.toLowerCase();
      const [tokenA, tokenB] = tokenAIn 
        ? [tokenIn, tokenOut] 
        : [tokenOut, tokenIn];

      // ✅ Lookup ALL pools for this token pair
      console.log(`[Maverick V2] Looking up pools for ${tokenA}/${tokenB}...`);
      const pools: string[] = await this.factoryContract.lookup(
        tokenA,
        tokenB,
        0,    // startIndex
        100   // count (max pools to check)
      );

      if (pools.length === 0) {
        console.log('[Maverick V2] No pools found for this pair');
        return null;
      }

      console.log(`[Maverick V2] Found ${pools.length} pools, querying in parallel...`);

      // ✅ Query all pools in parallel using Promise.all (not multicall - too gas intensive)
      const tickLimit = tokenAIn ? 2147483647 : -2147483648;

      const quotePromises = pools.map(async (poolAddress, index) => {
        if (poolAddress === ethers.constants.AddressZero) {
          return null;
        }

        try {
          const quote = await this.quoterContract.callStatic.calculateSwap(
            poolAddress,
            amountIn,
            tokenAIn,
            false,
            tickLimit
          );

          const amountOut = quote.amountOut || quote[1];
          const thirdValue = quote.feeAmount || quote.gasEstimate || quote[2];

          console.log(`[Maverick V2] Pool ${index + 1}: ${amountOut.toString()} output`);

          const gasEstimate = thirdValue && ethers.BigNumber.isBigNumber(thirdValue) && thirdValue.gt(0)
            ? thirdValue.toString()
            : '250000';

          return {
            poolAddress,
            amountOut,
            gasEstimate,
          };
        } catch (error: any) {
          console.log(`[Maverick V2] Pool ${index + 1} failed`);
          return null;
        }
      });

      // ✅ Wait for all quotes in parallel
      const quoteResults = await Promise.all(quotePromises);
      const validQuotes = quoteResults.filter(q => q !== null) as Array<{
        poolAddress: string;
        amountOut: ethers.BigNumber;
        gasEstimate: string;
      }>;

      if (validQuotes.length === 0) {
        console.log('[Maverick V2] No valid quotes found');
        return null;
      }

      // ✅ Find best quote by output amount
      const bestQuoteData = validQuotes.reduce((best, current) => {
        return current.amountOut.gt(best.amountOut) ? current : best;
      });

      console.log(`[Maverick V2] Best pool: ${bestQuoteData.poolAddress.slice(0, 10)}... with output ${bestQuoteData.amountOut.toString()}`);

      // ✅ Get pool fee for best pool using multicall (this is cheap)
      const poolInterface = new ethers.utils.Interface(MaverickPoolABI);
      
      const feeCall = Multicall.createCall(
        bestQuoteData.poolAddress,
        poolInterface.encodeFunctionData('fee', [tokenAIn]),
        true
      );

      const feeResults = await this.multicall.aggregate([feeCall]);
      
      if (!feeResults[0].success) {
        console.log('[Maverick V2] Failed to fetch pool fee, using default');
        // Fallback to direct call
        const poolContract = new ethers.Contract(
          bestQuoteData.poolAddress,
          MaverickPoolABI,
          this.provider
        );
        const poolFeeRaw = await poolContract.fee(tokenAIn);
        const feeBps = Math.round(
          parseFloat(ethers.utils.formatUnits(poolFeeRaw, 18)) * 10000
        );

        const fee = feeBps * 100;

        return {
          dexName: this.name,
          amountOut: bestQuoteData.amountOut.toString(),
          fee: fee,
          gasEstimate: bestQuoteData.gasEstimate,
          pool: bestQuoteData.poolAddress,
          zeroForOne: tokenAIn,
          sqrtPriceX96After: '0',
          initializedTicksCrossed: 0,
        };
      }

      const feeDecoded = Multicall.decodeResult(
        feeResults[0],
        poolInterface,
        'fee'
      );

      const poolFeeRaw = feeDecoded[0];
      
      // Convert fee from 18-decimal to basis points
      const feeBps = Math.round(
        parseFloat(ethers.utils.formatUnits(poolFeeRaw, 18)) * 10000
      );
      const fee = feeBps * 100;

      console.log(`[Maverick V2] Pool fee: ${fee}`);

      // ✅ Return best quote
      return {
        dexName: this.name,
        amountOut: bestQuoteData.amountOut.toString(),
        fee: fee,
        gasEstimate: bestQuoteData.gasEstimate,
        pool: bestQuoteData.poolAddress,
        zeroForOne: tokenAIn,
        sqrtPriceX96After: '0',
        initializedTicksCrossed: 0,
      };

    } catch (error) {
      console.error('[Maverick V2] Error getting quote:', error);
      return null;
    }
  }
}