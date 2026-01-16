// BalanceFetcher.js
import { ethers } from "ethers";

class BalanceFetcher {
  constructor(state, setState, CONFIG) {
    this.state = state;
    this.setState = setState;
    this.CONFIG = CONFIG;
  }

  async fetchBalances() {
    if (!this.state.account || !this.state.provider) {
      console.log("No account or provider available");
      return;
    }

    try {
      this.setState((prev) => ({ ...prev, fetchingBalance: true }));

      console.log("Fetching balances for account:", this.state.account);
      console.log(
        "From token:",
        this.state.fromToken.symbol,
        this.state.fromToken.address
      );
      console.log(
        "To token:",
        this.state.toToken.symbol,
        this.state.toToken.address
      );

      // Fetch ETH balance (for native tokens)
      const ethBalance = await this.state.provider.getBalance(
        this.state.account
      );
      const formattedEthBalance = ethers.utils.formatEther(ethBalance);

      console.log("ETH Balance:", formattedEthBalance);

      // Fetch fromToken balance
      let fromTokenBalance = "0";
      if (this.state.fromToken.isNative) {
        fromTokenBalance = formattedEthBalance;
      } else {
        try {
          const fromTokenContract = new ethers.Contract(
            this.state.fromToken.address,
            this.CONFIG.ABI.ERC20,
            this.state.provider
          );
          const balance = await fromTokenContract.balanceOf(this.state.account);
          fromTokenBalance = ethers.utils.formatUnits(
            balance,
            this.state.fromToken.decimals
          );
          console.log(
            `${this.state.fromToken.symbol} Balance:`,
            fromTokenBalance
          );
        } catch (error) {
          console.error(
            `Error fetching ${this.state.fromToken.symbol} balance:`,
            error
          );
        }
      }

      // Fetch toToken balance
      let toTokenBalance = "0";
      if (this.state.toToken.isNative) {
        toTokenBalance = formattedEthBalance;
      } else {
        try {
          const toTokenContract = new ethers.Contract(
            this.state.toToken.address,
            this.CONFIG.ABI.ERC20,
            this.state.provider
          );
          const balance = await toTokenContract.balanceOf(this.state.account);
          toTokenBalance = ethers.utils.formatUnits(
            balance,
            this.state.toToken.decimals
          );
          console.log(`${this.state.toToken.symbol} Balance:`, toTokenBalance);
        } catch (error) {
          console.error(
            `Error fetching ${this.state.toToken.symbol} balance:`,
            error
          );
        }
      }

      // Update state with fetched balances
      this.setState((prev) => ({
        ...prev,
        fromToken: {
          ...prev.fromToken,
          balance: fromTokenBalance,
        },
        toToken: {
          ...prev.toToken,
          balance: toTokenBalance,
        },
        fetchingBalance: false,
      }));
    } catch (error) {
      console.error("Error fetching balances:", error);
      this.setState((prev) => ({ ...prev, fetchingBalance: false }));
    }
  }

  fetchBalancesEffect() {
    if (this.state.account && this.state.provider) {
      this.fetchBalances();
    } else {
      this.setState((prev) => ({
        ...prev,
        fromToken: { ...prev.fromToken, balance: "0" },
        toToken: { ...prev.toToken, balance: "0" },
      }));
    }
  }
}

export default BalanceFetcher;
