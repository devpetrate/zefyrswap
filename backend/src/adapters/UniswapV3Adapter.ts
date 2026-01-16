// UniswapV3Adapter.ts
import { ethers } from 'ethers';
import { IDexAdapter } from './IDexAdapter';
import { DexQuote } from '../types';
import { config } from '../config';
import { QuoterV2ABI } from '../abi/QuoterV2';
import { Multicall, Call3 } from '../services/utils/Multicall';
import { FactoryABI } from '../abi/Factory';

export class UniswapV3Adapter implements IDexAdapter {
  name = 'uniswap-v3';
  private provider: ethers.providers.JsonRpcProvider;
  private quoterContract: ethers.Contract;
  private factoryContract: ethers.Contract;
  private multicall: Multicall;

  constructor(provider: ethers.providers.JsonRpcProvider) {
    this.provider = provider;
    this.quoterContract = new ethers.Contract(
      config.uniswap.quoterV2,
      QuoterV2ABI,
      provider
    );
    this.factoryContract = new ethers.Contract(
      config.uniswap.factory,
      FactoryABI,
      provider
    );
    this.multicall = new Multicall(provider);
  }

  /**
   * Get quote from Uniswap V3 by trying all fee tiers
   */
  async getQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<DexQuote | null> {
    try {
      console.log(`Getting quote for ${amountIn} tokens...`);

      // ✅ Build all calls for multicall
      const calls: Call3[] = config.uniswapFeeTiers.map(fee => {
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
          config.uniswap.quoterV2,
          callData,
          true // Allow failure
        );
      });

      console.log(`📞 Querying ${calls.length} fee tiers via multicall...`);

      // ✅ Execute all calls in ONE RPC request
      const results = await this.multicall.aggregate(calls);

      // ✅ Process results - Declare with proper type
      const quotes: DexQuote[] = [];

      results.forEach((result, index) => {
        const fee = config.uniswapFeeTiers[index];

        if (!result.success) {
          console.log(`Fee tier ${fee} failed`);
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
          console.log(`Fee tier ${fee} success: ${amountOut.toString()}`);

          const zeroForOne = tokenIn.toLowerCase() < tokenOut.toLowerCase();

          quotes.push({
            dexName: this.name,
            amountOut: amountOut.toString(),
            fee: fee,
            gasEstimate: (decoded.gasEstimate || decoded[3] || 200000).toString(),
            pool: ethers.constants.AddressZero, // Temporary
            zeroForOne,
            sqrtPriceX96After: (decoded.sqrtPriceX96After || decoded[1] || '0').toString(),
            initializedTicksCrossed: decoded.initializedTicksCrossed || decoded[2] || 0,
          });
        } catch (error) {
          console.log(`Fee tier ${fee} decode error:`, error);
        }
      });

      if (quotes.length === 0) {
        console.log('No valid quotes found');
        return null;
      }

      // ✅ Find best quote
      const bestQuote = quotes.reduce((best, current) => {
        const bestAmount = ethers.BigNumber.from(best.amountOut);
        const currentAmount = ethers.BigNumber.from(current.amountOut);
        return currentAmount.gt(bestAmount) ? current : best;
      });

      // ✅ Get pool address for best quote
      const poolAddress = await this.factoryContract.getPool(
        tokenIn,
        tokenOut,
        bestQuote.fee
      );
      
      bestQuote.pool = poolAddress;

      return bestQuote;
    } catch (error) {
      console.error('Error getting Uniswap V3 quote:', error);
      return null;
    }
  }
}