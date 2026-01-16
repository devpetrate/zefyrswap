import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.api.get("/api/health");
      return response.data;
    } catch (error) {
      console.error("Health check failed:", error);
      throw error;
    }
  }

  // Get quote from backend
  async getQuote(tokenIn, tokenOut, amountIn, slippage = 0.5) {
    try {
      const response = await this.api.post("/api/quote", {
        tokenIn,
        tokenOut,
        amountIn,
        slippage,
      });
      return response.data;
    } catch (error) {
      console.error("Get quote failed:", error);
      throw error;
    }
  }

  // Prepare swap transaction - NEW STRUCTURE
  async prepareSwap(tokenIn, tokenOut, amountIn, userAddress, slippageBps) {
    try {
      const response = await this.api.post("/api/swap", {
        tokenIn,
        tokenOut,
        amountIn,
        userAddress,
        slippageBps,
      });
      return response.data;
    } catch (error) {
      console.error("Prepare swap failed:", error);
      throw error;
    }
  }

  // Get token info
  async getTokenInfo(address) {
    try {
      const response = await this.api.get(`/api/token/${address}`);
      return response.data;
    } catch (error) {
      console.error("Get token info failed:", error);
      throw error;
    }
  }
}

const apiServiceInstance = new ApiService();
export default apiServiceInstance;
