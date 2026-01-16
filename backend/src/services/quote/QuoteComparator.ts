import { ethers } from 'ethers';
import { QuoteResponse } from '../../types';

export class QuoteComparator {
  /**
   * Compare single-hop vs multi-hop and return best
   */
  static getBest(
    singleHop: QuoteResponse | null,
    multiHop: QuoteResponse | null
  ): QuoteResponse {
    if (!singleHop && !multiHop) {
      throw new Error('No valid routes found');
    }

    if (!singleHop) {
      console.log('⚖️  Only multi-hop available\n');
      return multiHop!;
    }
    
    if (!multiHop) {
      console.log('⚖️  Only single-hop available\n');
      return singleHop;
    }

    const singleAmount = ethers.BigNumber.from(singleHop.amountOut);
    const multiAmount = ethers.BigNumber.from(multiHop.amountOut);

    console.log('⚖️  ROUTE COMPARISON');
    console.log('─────────────────────────────────────────');
    console.log(`   Single-hop: ${singleAmount.toString()}`);
    console.log(`   Multi-hop:  ${multiAmount.toString()}`);

    if (multiAmount.gt(singleAmount)) {
      const improvement = multiAmount.sub(singleAmount);
      const improvementPercent = improvement.mul(10000).div(singleAmount).toNumber() / 100;
      console.log(`   🎯 Multi-hop wins! (+${improvementPercent.toFixed(2)}% better)\n`);
      return multiHop;
    } else {
      const difference = singleAmount.sub(multiAmount);
      const differencePercent = difference.mul(10000).div(multiAmount).toNumber() / 100;
      console.log(`   🎯 Single-hop wins! (+${differencePercent.toFixed(2)}% better)\n`);
      return singleHop;
    }
  }
}