// dex-aggregator-backend\src\adapters\AerodromeAdapter.ts
import { ethers } from 'ethers';
import { IDexAdapter } from './IDexAdapter';
import { DexQuote } from '../types';
import { config } from '../config';
import { AerodromeQuoterV2ABI } from '../abi/AerodromeQuoterV2';
import { AerodromeFactoryABI } from '../abi/Factory';
import { PoolABI } from '../abi/Pool';
import { Multicall, Call3 } from '../services/utils/Multicall';

export class AerodromeAdapter implements IDexAdapter {
  name = 'aerodrome';
  private provider: ethers.providers.JsonRpcProvider;
  private quoterContract: ethers.Contract;
  private factoryContract: ethers.Contract;
  private multicall: Multicall;

  constructor(provider: ethers.providers.JsonRpcProvider) {
    this.provider = provider;
    this.quoterContract = new ethers.Contract(
      config.aerodrome.quoterV2,
      AerodromeQuoterV2ABI,
      provider
    );
    this.factoryContract = new ethers.Contract(
      config.aerodrome.factory,
      AerodromeFactoryABI,
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
      console.log(`[Aerodrome] Getting quote for ${amountIn} tokens...`);

      // ✅ Build all calls for multicall
      const calls: Call3[] = config.aerodromeTickSpacings.map(tickSpacing => {
        const params = {
          tokenIn,
          tokenOut,
          amountIn,
          tickSpacing,
          sqrtPriceLimitX96: 0,
        };

        const callData = this.quoterContract.interface.encodeFunctionData(
          'quoteExactInputSingle',
          [params]
        );

        return Multicall.createCall(
          config.aerodrome.quoterV2,
          callData,
          true
        );
      });

      console.log(`[Aerodrome] 📞 Querying ${calls.length} tick spacings via multicall...`);

      // ✅ Execute all calls in ONE RPC request
      const results = await this.multicall.aggregate(calls);

      // ✅ Process results
      const quotes: DexQuote[] = [];

      results.forEach((result, index) => {
        const tickSpacing = config.aerodromeTickSpacings[index];

        if (!result.success) {
          console.log(`[Aerodrome] TickSpacing ${tickSpacing} failed`);
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
          console.log(`[Aerodrome] TickSpacing ${tickSpacing} success: ${amountOut.toString()}`);

          const zeroForOne = tokenIn.toLowerCase() < tokenOut.toLowerCase();

          quotes.push({
            dexName: this.name,
            amountOut: amountOut.toString(),
            fee: tickSpacing * 50, // Approximate
            gasEstimate: '200000', // Will estimate separately for best quote
            pool: ethers.constants.AddressZero, // Temporary
            zeroForOne,
            sqrtPriceX96After: (decoded.sqrtPriceX96After || decoded[3] || '0').toString(),
            initializedTicksCrossed: decoded.initializedTicksCrossed || decoded[2] || 0,
            tickSpacing, // Store for later use
          } as any);
        } catch (error) {
          console.log(`[Aerodrome] TickSpacing ${tickSpacing} decode error`);
        }
      });

      if (quotes.length === 0) {
        console.log('[Aerodrome] No valid quotes found');
        return null;
      }

      // ✅ Find best quote
      const bestQuote = quotes.reduce((best, current) => {
        const bestAmount = ethers.BigNumber.from(best.amountOut);
        const currentAmount = ethers.BigNumber.from(current.amountOut);
        return currentAmount.gt(bestAmount) ? current : best;
      });

      const bestTickSpacing = (bestQuote as any).tickSpacing;

      // ✅ Get pool address for best quote
      const poolAddress = await this.factoryContract.getPool(
        tokenIn,
        tokenOut,
        bestTickSpacing
      );
      bestQuote.pool = poolAddress;

      // ✅ Get actual fee from pool
      try {
        const poolContract = new ethers.Contract(poolAddress, PoolABI, this.provider);
        const actualFee = await poolContract.fee();
        bestQuote.fee = actualFee;
      } catch {
        // Keep approximation
      }

      // ✅ Estimate gas for best quote
      try {
        const params = {
          tokenIn,
          tokenOut,
          amountIn,
          tickSpacing: bestTickSpacing,
          sqrtPriceLimitX96: 0,
        };
        const estimatedGas = await this.quoterContract.estimateGas.quoteExactInputSingle(params);
        bestQuote.gasEstimate = estimatedGas.toString();
        console.log(`[Aerodrome] Estimated gas: ${estimatedGas.toString()}`);
      } catch {
        console.warn('[Aerodrome] Gas estimation failed, using default 200000');
      }

      // Remove temporary tickSpacing property
      delete (bestQuote as any).tickSpacing;

      return bestQuote;
    } catch (error) {
      console.error('[Aerodrome] Error getting quote:', error);
      return null;
    }
  }
}