import { ethers } from 'ethers';
import { IDexAdapter } from '../adapters/IDexAdapter';
import { UniswapV3Adapter } from '../adapters/UniswapV3Adapter';
import { PancakeSwapV3Adapter } from '../adapters/PancakeSwapV3Adapter';
import { AerodromeAdapter } from '../adapters/AerodromeAdapter';
import { SushiSwapV3Adapter } from '../adapters/SushiSwapV3Adapter';
import { MaverickV2Adapter } from '../adapters/MaverickV2Adapter';
import { QuoteResponse, SwapRequest, SwapResponse } from '../types';
import { config } from '../config';
import { ERC20ABI } from '../abi/ERC20';
import { TokenHelper } from './utils/TokenHelper';
import { PathEncoder } from './encoding/PathEncoder';
import { WrapUnwrapQuote } from './quote/WrapUnwrapQuote';
import { SingleHopQuote } from './quote/SingleHopQuote';
import { MultiHopQuote } from './quote/MultiHopQuote';
import { QuoteComparator } from './quote/QuoteComparator';

export class AggregatorService {
  private provider: ethers.providers.JsonRpcProvider;
  private adapters: IDexAdapter[];
  private routerAddress: string;
  private executorAddress: string;

  /**
   * List of intermediate tokens for multi-hop routing
   */
  private intermediateTokens = [
    config.tokens.WETH,  // Most liquid
    config.tokens.USDC,  // Stablecoin bridge
    config.tokens.USDbC,
  ];

  // Quote services
  private singleHopQuote: SingleHopQuote;
  private multiHopQuote: MultiHopQuote;

  constructor() {
    console.log('\n🚀 Initializing Aggregator Service...');
    
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    
    // Build adapters based on enabled DEXes
    const allAdapters = {
      uniswap: () => new UniswapV3Adapter(this.provider),
      pancakeswap: () => new PancakeSwapV3Adapter(this.provider),
      aerodrome: () => new AerodromeAdapter(this.provider),
      sushiswap: () => new SushiSwapV3Adapter(this.provider),
      maverick: () => new MaverickV2Adapter(this.provider),
    };

    // Only create enabled adapters
    this.adapters = Object.entries(config.enabledDexes)
      .filter(([_, enabled]) => enabled)
      .map(([name, _]) => allAdapters[name as keyof typeof allAdapters]?.())
      .filter(adapter => adapter !== undefined);

    console.log('✅ Enabled DEXes:', this.adapters.map(a => a.name).join(', '));

    // Validate and store router addresses
    if (!config.customRouter.routerAddress) {
      throw new Error('ROUTER_ADDRESS not set in environment variables');
    }
    if (!config.customRouter.executorAddress) {
      throw new Error('EXECUTOR_ADDRESS not set in environment variables');
    }
    
    this.routerAddress = config.customRouter.routerAddress;
    this.executorAddress = config.customRouter.executorAddress;
    
    console.log('✅ Router initialized:', {
      router: this.routerAddress,
      executor: this.executorAddress
    });
    console.log('✅ Intermediate tokens:', this.intermediateTokens);
    console.log(''); // Empty line for readability

    // Initialize quote services
    this.singleHopQuote = new SingleHopQuote(this.provider, this.adapters);
    this.multiHopQuote = new MultiHopQuote(this.provider, this.adapters, this.intermediateTokens);
  }

  /**
   * Main quote function - finds best route (single or multi-hop)
   */
  async getQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippage: number = config.defaultSlippage
  ): Promise<QuoteResponse> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Starting quote search...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   From: ${tokenIn}`);
    console.log(`   To: ${tokenOut}`);
    console.log(`   Amount: ${amountIn}`);
    console.log(`   Slippage: ${slippage}%`);
    console.log('');

    // ✅ Check wrap/unwrap
    if (TokenHelper.isWrapUnwrap(tokenIn, tokenOut)) {
      return WrapUnwrapQuote.getQuote(tokenIn, tokenOut, amountIn, slippage);
    }

    const normalizedTokenIn = TokenHelper.normalizeTokenAddress(tokenIn);
    const normalizedTokenOut = TokenHelper.normalizeTokenAddress(tokenOut);
    
    // Validation
    if (!ethers.utils.isAddress(normalizedTokenIn) || 
        !ethers.utils.isAddress(normalizedTokenOut)) {
      throw new Error('Invalid token address');
    }

    const amount = ethers.BigNumber.from(amountIn);
    if (amount.lte(0)) {
      throw new Error('Amount must be greater than 0');
    }

    // ✅ Get both single-hop and multi-hop quotes in parallel
    console.log('⚡ Querying all routes in parallel...\n');
    const [singleHopQuoteResult, multiHopQuoteResult] = await Promise.all([
      this.singleHopQuote.getQuote(normalizedTokenIn, normalizedTokenOut, amountIn, slippage),
      this.multiHopQuote.getQuote(normalizedTokenIn, normalizedTokenOut, amountIn, slippage)
    ]);

    // ✅ Compare and return best
    const bestQuote = QuoteComparator.getBest(singleHopQuoteResult, multiHopQuoteResult);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🏆 FINAL WINNER: ${bestQuote.route.length} hop(s)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Route: ${bestQuote.route.map(h => h.dex).join(' → ')}`);
    console.log(`   Output: ${bestQuote.amountOut}`);
    console.log(`   Price: ${bestQuote.price}`);
    console.log(`   Total Fees: ${bestQuote.totalFees} bps`);
    console.log(`   Price Impact: ${bestQuote.priceImpact}%`);
    console.log(`   Gas Estimate: ${bestQuote.gasEstimate}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return bestQuote;
  }

  /**
   * Prepare swap transaction data
   */
  async prepareSwap(request: SwapRequest): Promise<SwapResponse> {
    console.log('\n📝 Preparing swap transaction...');
    console.log('─────────────────────────────────────────');
    
    // Validation
    if (!ethers.utils.isAddress(request.tokenIn) && !TokenHelper.isNativeETH(request.tokenIn)) {
      throw new Error('Invalid tokenIn address');
    }
    if (!ethers.utils.isAddress(request.tokenOut) && !TokenHelper.isNativeETH(request.tokenOut)) {
      throw new Error('Invalid tokenOut address');
    }

    const originalTokenIn = request.tokenIn;
    const originalTokenOut = request.tokenOut;
    const slippageBps = request.slippageBps || 50;
    const slippage = slippageBps / 100;
    
    console.log(`   User: ${request.userAddress}`);
    console.log(`   Slippage: ${slippage}%\n`);
    
    // Get quote (now returns route array)
    const quote = await this.getQuote(
      request.tokenIn,
      request.tokenOut,
      request.amountIn,
      slippage
    );

    // ✅ Encode pathDefinition with route hops
    const pathDefinition = PathEncoder.encode({
      route: quote.route,
      tokenIn: originalTokenIn,
      tokenOut: originalTokenOut,
    });

    const value = TokenHelper.isNativeETH(request.tokenIn) 
      ? request.amountIn 
      : '0';

    const response = {
      amountOut: quote.amountOut,
      amountOutMin: quote.amountOutMin,
      pathDefinition,
      executorAddress: this.executorAddress,
      routerAddress: this.routerAddress,
      inputReceiver: this.executorAddress,
      outputReceiver: request.userAddress,
      value,
    };

    console.log('\n✅ Swap prepared successfully');
    console.log('─────────────────────────────────────────');
    console.log(`   Amount Out: ${response.amountOut}`);
    console.log(`   Amount Out Min: ${response.amountOutMin}`);
    console.log(`   Path Length: ${pathDefinition.length} chars`);
    console.log(`   Value (ETH): ${ethers.utils.formatEther(value)}`);
    console.log('─────────────────────────────────────────\n');

    return response;
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: string) {
    if (!ethers.utils.isAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, this.provider);

    try {
      const [decimals, symbol, name] = await Promise.all([
        tokenContract.decimals(),
        tokenContract.symbol(),
        tokenContract.name(),
      ]);

      return { address: tokenAddress, decimals, symbol, name };
    } catch (error) {
      throw new Error('Failed to fetch token information');
    }
  }

  /**
   * Health check
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.provider.getBlockNumber();
      return true;
    } catch (error) {
      return false;
    }
  }
}