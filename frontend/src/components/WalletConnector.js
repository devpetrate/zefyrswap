// WalletConnector.js
import { ethers } from "ethers";

class WalletConnector {
  constructor(state, setState) {
    this.state = state;
    this.setState = setState;
    this.isConnecting = false;
  }

  async connectWallet() {
    if (this.isConnecting) return;

    this.isConnecting = true;

    try {
      this.setState((prev) => ({ ...prev, loading: true, walletError: "" }));

      if (!window.ethereum) {
        throw new Error("Please install MetaMask!");
      }

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        const userAccount = accounts[0];
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const web3Signer = web3Provider.getSigner();

        // Check and switch to Base Mainnet
        await this.switchToBaseMainnet();

        this.setState((prev) => ({
          ...prev,
          account: userAccount,
          signer: web3Signer,
          provider: web3Provider,
          loading: false,
        }));

        this.setupEventListeners();
        this.isConnecting = false;
        return;
      }

      const newAccounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const userAccount = newAccounts[0];
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();

      // Check and switch to Base Mainnet
      await this.switchToBaseMainnet();

      this.setState((prev) => ({
        ...prev,
        account: userAccount,
        signer: web3Signer,
        provider: web3Provider,
        loading: false,
      }));

      this.setupEventListeners();
    } catch (error) {
      console.error("Wallet connection error:", error);
      this.setState((prev) => ({
        ...prev,
        walletError: error.message,
        loading: false,
      }));
      if (error.code !== 4001) {
        alert(`Failed to connect wallet: ${error.message}`);
      }
    } finally {
      this.isConnecting = false;
    }
  }

  async switchToBaseMainnet() {
    try {
      // Try to switch to Base Mainnet (chainId: 8453 = 0x2105 in hex)
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x2105" }], // 8453 in hex
      });
      console.log("Switched to Base Mainnet");
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x2105", // 8453 in hex
                chainName: "Base Mainnet",
                nativeCurrency: {
                  name: "Ethereum",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://mainnet.base.org"],
                blockExplorerUrls: ["https://basescan.org"],
              },
            ],
          });
          console.log("Base Mainnet added to MetaMask");
        } catch (addError) {
          console.error("Failed to add Base Mainnet:", addError);
          throw new Error("Please add Base Mainnet to MetaMask manually");
        }
      } else {
        console.error("Failed to switch to Base Mainnet:", switchError);
        throw switchError;
      }
    }
  }

  disconnectWallet() {
    this.setState({
      account: "",
      signer: null,
      selectedNetwork: {
        id: 8453,
        name: "Base",
        icon: "base",
        chainId: 8453,
      },
      fromToken: {
        symbol: "ETH",
        name: "Ethereum",
        balance: "0",
        isNative: true,
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
      },
      toToken: {
        symbol: "USDC",
        name: "USD Coin",
        balance: "0",
        isNative: false,
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        decimals: 6,
      },
      amount: "",
      slippage: 0.5,
      loading: false,
      fetchingBalance: false,
      bestRate: "0.00",
      bestDex: "",
      showComparison: false,
      walletError: "",
    });

    if (window.ethereum?.removeListener) {
      window.ethereum.removeListener(
        "accountsChanged",
        this.handleAccountsChanged
      );
      window.ethereum.removeListener("chainChanged", this.handleChainChanged);
    }
  }

  handleAccountsChanged = (newAccounts) => {
    if (newAccounts.length === 0) {
      this.disconnectWallet();
    } else {
      this.setState((prev) => ({ ...prev, account: newAccounts[0] }));
    }
  };

  handleChainChanged = () => {
    window.location.reload();
  };

  setupEventListeners() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", this.handleAccountsChanged);
      window.ethereum.on("chainChanged", this.handleChainChanged);
    }
  }
}

export default WalletConnector;
