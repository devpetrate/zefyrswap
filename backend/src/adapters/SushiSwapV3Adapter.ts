// dex-aggregator-backend\src\adapters\SushiSwapV3Adapter.ts
import { ethers } from 'ethers';
import { IDexAdapter } from './IDexAdapter';
import { DexQuote } from '../types';
import { config } from '../config';
import { QuoterV2ABI } from '../abi/QuoterV2';
import { FactoryABI } from '../abi/Factory';
import { Multicall, Call3 } from '../services/utils/Multicall';

export class SushiSwapV3Adapter implements IDexAdapter {
  name = 'sushiswap-v3';
  private provider: ethers.providers.JsonRpcProvider;
  private quoterContract: ethers.Contract;
  private factoryContract: ethers.Contract;
  private multicall: Multicall;

  constructor(provider: ethers.providers.JsonRpcProvider) {
    this.provider = provider;
    this.quoterContract = new ethers.Contract(
      config.sushiswap.quoterV2,
      QuoterV2ABI,
      provider
    );
    this.factoryContract = new ethers.Contract(
      config.sushiswap.factory,
      FactoryABI,
      provider
    );
    this.multicall = new Multicall(provider);
  }

  async getQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<DexQuote | null> {
    try {
      console.log(`[SushiSwap V3] Getting quote for ${amountIn} tokens...`);

      // ✅ Build all calls
      const calls: Call3[] = config.sushiswapFeeTiers.map(fee => {
        const params = {
          tokenIn,
          tokenOut,
          amountIn,
          fee,
          sqrtPriceLimitX96: 0,
        };

        const callData = this.quoterContract.interface.encodeFunctionData(
          'quoteExactInputSingle',
          [params]
        );

        return Multicall.createCall(
          config.sushiswap.quoterV2,
          callData,
          true
        );
      });

      console.log(`[SushiSwap V3] 📞 Querying ${calls.length} fee tiers via multicall...`);

      // ✅ Single RPC call
      const results = await this.multicall.aggregate(calls);

      // ✅ Process results
      const quotes: DexQuote[] = [];

      results.forEach((result, index) => {
        const fee = config.sushiswapFeeTiers[index];

        if (!result.success) {
          console.log(`[SushiSwap V3] Fee tier ${fee} failed`);
          return;
        }

        try {
          const decoded = Multicall.decodeResult(
            result,
            this.quoterContract.interface,
            'quoteExactInputSingle'
          );

          if (!decoded) return;

          const amountOut = decoded.amountOut || decoded[0];
          console.log(`[SushiSwap V3] Fee tier ${fee} success: ${amountOut.toString()}`);

          const zeroForOne = tokenIn.toLowerCase() < tokenOut.toLowerCase();

          quotes.push({
            dexName: this.name,
            amountOut: amountOut.toString(),
            fee: fee,
            gasEstimate: (decoded.gasEstimate || decoded[3] || 200000).toString(),
            pool: ethers.constants.AddressZero,
            zeroForOne,
            sqrtPriceX96After: (decoded.sqrtPriceX96After || decoded[1] || '0').toString(),
            initializedTicksCrossed: decoded.initializedTicksCrossed || decoded[2] || 0,
          });
        } catch (error) {
          console.log(`[SushiSwap V3] Fee tier ${fee} decode error`);
        }
      });

      if (quotes.length === 0) {
        console.log('[SushiSwap V3] No valid quotes found');
        return null;
      }

      // ✅ Find best
      const bestQuote = quotes.reduce((best, current) => {
        const bestAmount = ethers.BigNumber.from(best.amountOut);
        const currentAmount = ethers.BigNumber.from(current.amountOut);
        return currentAmount.gt(bestAmount) ? current : best;
      });

      // ✅ Get pool address
      const poolAddress = await this.factoryContract.getPool(
        tokenIn,
        tokenOut,
        bestQuote.fee
      );
      bestQuote.pool = poolAddress;

      return bestQuote;
    } catch (error) {
      console.error('[SushiSwap V3] Error getting quote:', error);
      return null;
    }
  }
}