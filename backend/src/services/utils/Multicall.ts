import { ethers } from 'ethers';

// Multicall3 is deployed at the same address on all chains
const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

const MULTICALL3_ABI = [
  'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) returns (tuple(bool success, bytes returnData)[] returnData)',
  'function aggregate3Value(tuple(address target, bool allowFailure, uint256 value, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)'
];

export interface Call3 {
  target: string;
  allowFailure: boolean;
  callData: string;
}

export interface Call3Value extends Call3 {
  value: string;
}

export interface Result {
  success: boolean;
  returnData: string;
}

export class Multicall {
  private contract: ethers.Contract;
  private provider: ethers.providers.JsonRpcProvider;

  constructor(provider: ethers.providers.JsonRpcProvider) {
    this.provider = provider;
    this.contract = new ethers.Contract(
      MULTICALL3_ADDRESS,
      MULTICALL3_ABI,
      provider
    );
  }

  /**
   * Execute multiple calls in a single transaction
   */
  async aggregate(calls: Call3[]): Promise<Result[]> {
    try {
      const results = await this.contract.callStatic.aggregate3(calls);
      return results;
    } catch (error) {
      console.error('Multicall aggregate failed:', error);
      throw error;
    }
  }

  /**
   * Execute multiple calls with value in a single transaction
   */
  async aggregateWithValue(calls: Call3Value[], totalValue: string): Promise<Result[]> {
    try {
      const results = await this.contract.callStatic.aggregate3Value(calls, {
        value: totalValue
      });
      return results;
    } catch (error) {
      console.error('Multicall aggregateWithValue failed:', error);
      throw error;
    }
  }

  /**
   * Helper: Create a call object
   */
  static createCall(
    target: string,
    callData: string,
    allowFailure: boolean = true
  ): Call3 {
    return {
      target,
      allowFailure,
      callData
    };
  }

  /**
   * Helper: Decode result based on return type
   */
  static decodeResult(
    result: Result,
    abiInterface: ethers.utils.Interface,
    functionName: string
  ): any {
    if (!result.success) {
      return null;
    }

    try {
      return abiInterface.decodeFunctionResult(functionName, result.returnData);
    } catch (error) {
      console.warn(`Failed to decode result for ${functionName}:`, error);
      return null;
    }
  }
}