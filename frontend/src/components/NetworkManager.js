import { ethers } from "ethers";

class NetworkManager {
  constructor(state, setState, CONFIG) {
    this.state = state;
    this.setState = setState;
    this.CONFIG = CONFIG;
  }

  initializeNetwork() {
    const networkConfig = this.CONFIG.NETWORKS[this.state.selectedNetwork.id];
    if (!networkConfig) return;

    const newProvider = new ethers.providers.JsonRpcProvider(
      networkConfig.rpcUrl
    );

    const networkTokens = networkConfig.tokens;
    const firstNonNativeToken = Object.values(networkTokens).find(
      (t) => !t.isNative
    );

    this.setState((prev) => ({
      ...prev,
      provider: newProvider,
      fromToken: {
        ...prev.fromToken,
        ...networkTokens.ETH,
        balance: "0",
      },
      toToken: firstNonNativeToken
        ? {
            ...prev.toToken,
            ...firstNonNativeToken,
            balance: "0",
          }
        : prev.toToken,
    }));
  }

  setSelectedNetwork(network) {
    this.setState((prev) => ({ ...prev, selectedNetwork: network }));
  }
}

export default NetworkManager;
