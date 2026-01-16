import { ethers } from "ethers";
import apiService from "../services/apiService";

class RateFetcher {
  constructor(state, setState, CONFIG) {
    this.state = state;
    this.setState = setState;
    this.CONFIG = CONFIG;
    this.debounceTimeout = null;
    this.lastFetch = {};
  }

  async fetchBestRate() {
    if (!this.state.amount || parseFloat(this.state.amount) <= 0) {
      this.setState((prev) => ({
        ...prev,
        showComparison: false,
        quoteData: null,
      }));
      return;
    }

    const cacheKey = `${this.state.amount}_${this.state.fromToken.address}_${this.state.toToken.address}_${this.state.slippage}`;
    const now = Date.now();

    // Use cache if recent (3 seconds)
    if (
      this.lastFetch[cacheKey] &&
      now - this.lastFetch[cacheKey].timestamp < 3000
    ) {
      this.setState((prev) => ({
        ...prev,
        quoteData: this.lastFetch[cacheKey].quoteData,
        showComparison: true,
        loading: false,
      }));
      return;
    }

    this.setState((prev) => ({ ...prev, loading: true }));

    try {
      // Convert amount to wei/smallest unit
      const amountIn = ethers.utils
        .parseUnits(this.state.amount, this.state.fromToken.decimals)
        .toString();

      console.log("Calling API with:", {
        tokenIn: this.state.fromToken.address,
        tokenOut: this.state.toToken.address,
        amountIn: amountIn,
        slippage: this.state.slippage,
      });

      // Call backend API
      const quoteData = await apiService.getQuote(
        this.state.fromToken.address,
        this.state.toToken.address,
        amountIn,
        this.state.slippage
      );

      console.log("Quote from API:", quoteData);

      // Cache the result
      this.lastFetch[cacheKey] = {
        quoteData: quoteData,
        timestamp: now,
      };

      this.setState((prev) => ({
        ...prev,
        quoteData: quoteData,
        bestDex: quoteData.route || "Uniswap V3",
        showComparison: true,
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching quote from API:", error);

      // Clear quote on error
      this.setState((prev) => ({
        ...prev,
        quoteData: null,
        showComparison: false,
        loading: false,
      }));

      // Show user-friendly error
      alert(
        "Failed to get quote. Please check your backend API is running on http://localhost:3001"
      );
    }
  }

  handleAmountChange(value) {
    const numericValue = value.replace(/[^0-9.]/g, "");
    const parts = numericValue.split(".");
    if (parts.length > 2) return;

    if (parts[1] && parts[1].length > this.state.fromToken.decimals) return;

    this.setState((prev) => ({ ...prev, amount: numericValue }));

    // Clear previous timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    if (numericValue && parseFloat(numericValue) > 0) {
      // Show loading immediately
      this.setState((prev) => ({ ...prev, loading: true }));

      // Debounce API call - call 500ms after user stops typing
      this.debounceTimeout = setTimeout(() => {
        this.fetchBestRate();
      }, 500);
    } else {
      // Clear quote if amount is empty
      this.setState((prev) => ({
        ...prev,
        showComparison: false,
        quoteData: null,
        loading: false,
      }));
    }
  }

  handleTokenSelect(token, isFrom) {
    if (isFrom) {
      this.setState((prev) => ({ ...prev, fromToken: token }));
    } else {
      this.setState((prev) => ({ ...prev, toToken: token }));
    }

    // Reset quote data when token changes
    this.setState((prev) => ({
      ...prev,
      amount: "",
      quoteData: null,
      showComparison: false,
    }));

    // Clear cache
    this.lastFetch = {};
  }
}

export default RateFetcher;
