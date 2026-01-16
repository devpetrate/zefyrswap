import { config } from '../../config';

export class TokenHelper {
  static isNativeETH(token: string): boolean {
    return token.toLowerCase() === config.tokens.ETH.toLowerCase();
  }

  static normalizeTokenAddress(token: string): string {
    if (this.isNativeETH(token)) {
      console.log(`🔄 Converting ETH (${token}) → WETH (${config.tokens.WETH})`);
      return config.tokens.WETH;
    }
    return token;
  }

  static isWrapUnwrap(tokenIn: string, tokenOut: string): boolean {
    const isEthToWeth = 
      this.isNativeETH(tokenIn) && 
      tokenOut.toLowerCase() === config.tokens.WETH.toLowerCase();
    
    const isWethToEth = 
      tokenIn.toLowerCase() === config.tokens.WETH.toLowerCase() && 
      this.isNativeETH(tokenOut);
    
    return isEthToWeth || isWethToEth;
  }

  static getDexIdMap(): { [key: string]: number } {
    return {
      'uniswap-v3': 1,
      'pancakeswap-v3': 2,
      'aerodrome': 3,
      'sushiswap-v3': 4,
      'maverick-v2': 5,
    };
  }
}