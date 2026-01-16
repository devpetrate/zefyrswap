// SwapExecutor.js - UPDATED with Modal Integration
import { ethers } from "ethers";
import apiService from "../services/apiService";

const ROUTER_ABI = [
  "function swap(tuple(address inputToken, uint256 inputAmount, address inputReceiver, address outputToken, uint256 outputQuote, uint256 outputMin, address outputReceiver) tokenInfo, bytes pathDefinition, address executor, uint32 referralCode) payable returns (uint256 amountOut)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

const WETH_ABI = [
  "function deposit() payable",
  "function withdraw(uint256) public",
  "function balanceOf(address account) view returns (uint256)",
];

class SwapExecutor {
  constructor(state, setState, balanceFetcher) {
    this.state = state;
    this.setState = setState;
    this.balanceFetcher = balanceFetcher;

    // Modal callback handlers
    this.onModalUpdate = null;
  }

  // Set modal update callback
  setModalCallback(callback) {
    this.onModalUpdate = callback;
  }

  // Update modal state
  updateModal(updates) {
    if (this.onModalUpdate) {
      this.onModalUpdate(updates);
    }
  }

  isWrapOrUnwrap() {
    const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

    const isWrap =
      this.state.fromToken.address.toLowerCase() ===
        "0x0000000000000000000000000000000000000000" &&
      this.state.toToken.address.toLowerCase() === WETH_ADDRESS.toLowerCase();

    const isUnwrap =
      this.state.fromToken.address.toLowerCase() ===
        WETH_ADDRESS.toLowerCase() &&
      this.state.toToken.address.toLowerCase() ===
        "0x0000000000000000000000000000000000000000";

    return { isWrap, isUnwrap, needsWrapUnwrap: isWrap || isUnwrap };
  }

  async executeWrapUnwrap(isWrap, amountIn) {
    const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

    const wethContract = new ethers.Contract(
      WETH_ADDRESS,
      WETH_ABI,
      this.state.signer
    );

    try {
      // Show modal - Step 5: Wrapping/Unwrapping
      this.updateModal({
        isOpen: true,
        step: 5,
        tokenSymbol: isWrap ? "ETH" : "WETH",
        isWrapOrUnwrap: { isWrap, isUnwrap: !isWrap },
      });

      let tx;
      if (isWrap) {
        console.log("Wrapping ETH to WETH:", amountIn);
        tx = await wethContract.deposit({ value: amountIn });
      } else {
        console.log("Unwrapping WETH to ETH:", amountIn);
        tx = await wethContract.withdraw(amountIn);
      }

      console.log("Transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction confirmed!", receipt);

      // Show success - Step 6: Wrap/Unwrap Complete
      this.updateModal({
        step: 6,
        swapTxHash: tx.hash,
      });

      // Refresh balances after successful wrap/unwrap
      if (this.balanceFetcher) {
        await this.balanceFetcher.fetchBalances();
      }

      // Reset state
      this.setState((prev) => ({
        ...prev,
        amount: "",
        quoteData: null,
        showComparison: false,
        executing: false,
      }));
    } catch (error) {
      console.error("Wrap/unwrap error:", error);

      let errorMessage = isWrap ? "Wrap failed: " : "Unwrap failed: ";
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user";
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = "Unknown error occurred";
      }

      // Show error in modal
      this.updateModal({
        error: errorMessage,
      });

      this.setState((prev) => ({ ...prev, executing: false }));
    }
  }

  async executeSwap() {
    if (!this.state.quoteData || !this.state.account || !this.state.signer) {
      this.updateModal({
        isOpen: true,
        error: "Missing required data for swap",
      });
      return;
    }

    this.setState((prev) => ({ ...prev, executing: true }));

    try {
      const amountIn = ethers.utils
        .parseUnits(this.state.amount, this.state.fromToken.decimals)
        .toString();

      // Check if this is wrap/unwrap
      const { isWrap, needsWrapUnwrap } = this.isWrapOrUnwrap();

      if (needsWrapUnwrap) {
        return await this.executeWrapUnwrap(isWrap, amountIn);
      }

      const slippageBps = Math.floor(this.state.slippage * 100);

      console.log("Preparing swap with:", {
        tokenIn: this.state.fromToken.address,
        tokenOut: this.state.toToken.address,
        amountIn: amountIn,
        userAddress: this.state.account,
        slippageBps: slippageBps,
      });

      const swapData = await apiService.prepareSwap(
        this.state.fromToken.address,
        this.state.toToken.address,
        amountIn,
        this.state.account,
        slippageBps
      );

      console.log("Swap data from API:", swapData);

      const isNativeETH =
        this.state.fromToken.address.toLowerCase() ===
        "0x0000000000000000000000000000000000000000";

      let approveTxHash = null;

      // Handle ERC20 approval
      if (!isNativeETH) {
        console.log(
          "🔍 ERC20 Token detected, checking balance and approval..."
        );

        const tokenContract = new ethers.Contract(
          this.state.fromToken.address,
          ERC20_ABI,
          this.state.signer
        );

        const balance = await tokenContract.balanceOf(this.state.account);
        console.log("Token balance:", {
          raw: balance.toString(),
          formatted: ethers.utils.formatUnits(
            balance,
            this.state.fromToken.decimals
          ),
          needed: ethers.utils.formatUnits(
            amountIn,
            this.state.fromToken.decimals
          ),
        });

        if (balance.lt(amountIn)) {
          throw new Error(
            `Insufficient ${this.state.fromToken.symbol} balance`
          );
        }

        const currentAllowance = await tokenContract.allowance(
          this.state.account,
          swapData.routerAddress
        );

        console.log("Current allowance:", {
          raw: currentAllowance.toString(),
          formatted: ethers.utils.formatUnits(
            currentAllowance,
            this.state.fromToken.decimals
          ),
          sufficient: currentAllowance.gte(amountIn),
        });

        // Check if approval is needed
        if (currentAllowance.lt(amountIn)) {
          // Step 1: Show approve button
          this.updateModal({
            isOpen: true,
            step: 1,
            tokenSymbol: this.state.fromToken.symbol,
          });

          // Wait a moment for user to see the modal
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Step 2: Approving
          this.updateModal({ step: 2 });

          approveTxHash = await this.handleApproval(
            this.state.fromToken.address,
            swapData.routerAddress,
            amountIn
          );

          // Step 3: Approved, moving to swap
          this.updateModal({
            step: 3,
            approveTxHash: approveTxHash,
          });

          // Wait a moment before asking for swap confirmation
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          // Approval not needed, go straight to swap
          this.updateModal({
            isOpen: true,
            step: 3,
            tokenSymbol: this.state.fromToken.symbol,
          });
        }

        console.log("✅ Balance and approval checks passed!");
      } else {
        // Native ETH - skip approval, go straight to swap
        console.log("Native ETH detected, skipping approval");
        this.updateModal({
          isOpen: true,
          step: 3,
          tokenSymbol: "ETH",
        });
      }

      // Execute the swap
      const router = new ethers.Contract(
        swapData.routerAddress,
        ROUTER_ABI,
        this.state.signer
      );

      const tokenInfo = {
        inputToken: this.state.fromToken.address,
        inputAmount: amountIn,
        inputReceiver: swapData.inputReceiver,
        outputToken: this.state.toToken.address,
        outputQuote: swapData.amountOut,
        outputMin: swapData.amountOutMin,
        outputReceiver: this.state.account,
      };

      console.log("Calling router.swap with:", {
        tokenInfo,
        pathDefinition: swapData.pathDefinition,
        executorAddress: swapData.executorAddress,
        value: swapData.value,
      });

      const txValue = isNativeETH ? ethers.BigNumber.from(swapData.value) : 0;

      let tx;
      try {
        const estimatedGas = await router.estimateGas.swap(
          tokenInfo,
          swapData.pathDefinition,
          swapData.executorAddress,
          0,
          { value: txValue }
        );

        const gasLimit = estimatedGas.mul(120).div(100);

        console.log("Estimated gas:", estimatedGas.toString());
        console.log("Gas with buffer:", gasLimit.toString());

        tx = await router.swap(
          tokenInfo,
          swapData.pathDefinition,
          swapData.executorAddress,
          0,
          {
            value: txValue,
            gasLimit,
          }
        );
      } catch (estimateError) {
        console.warn("Gas estimation failed, using fallback:", estimateError);

        tx = await router.swap(
          tokenInfo,
          swapData.pathDefinition,
          swapData.executorAddress,
          0,
          {
            value: txValue,
            gasLimit: 500000,
          }
        );
      }

      console.log("Transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction confirmed!", receipt);

      // Step 4: Transaction confirmed
      this.updateModal({
        step: 4,
        swapTxHash: tx.hash,
      });

      // Refresh balances after successful swap
      if (this.balanceFetcher) {
        await this.balanceFetcher.fetchBalances();
      }

      this.setState((prev) => ({
        ...prev,
        amount: "",
        quoteData: null,
        showComparison: false,
        executing: false,
      }));
    } catch (error) {
      console.error("Swap execution error:", error);

      let errorMessage = "Swap failed: ";
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user";
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = "Unknown error occurred";
      }

      // Show error in modal
      this.updateModal({
        error: errorMessage,
      });

      this.setState((prev) => ({ ...prev, executing: false }));
    }
  }

  async handleApproval(tokenAddress, spenderAddress, amount) {
    console.log("Approving token:", tokenAddress);

    if (
      tokenAddress.toLowerCase() ===
      "0x0000000000000000000000000000000000000000"
    ) {
      console.log("Cannot approve native ETH, skipping");
      return null;
    }

    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      this.state.signer
    );

    try {
      const currentAllowance = await tokenContract.allowance(
        this.state.account,
        spenderAddress
      );

      console.log("Current allowance:", currentAllowance.toString());
      console.log("Required amount:", amount);

      if (currentAllowance.gte(ethers.BigNumber.from(amount))) {
        console.log("Sufficient allowance, skipping approval");
        return null;
      }

      console.log("Approving token spend...");

      const approveTx = await tokenContract.approve(
        spenderAddress,
        ethers.constants.MaxUint256
      );

      console.log("Approval transaction sent:", approveTx.hash);

      await approveTx.wait();
      console.log("Approval confirmed!");

      return approveTx.hash;
    } catch (error) {
      console.error("Approval failed:", error);
      throw new Error(`Approval failed: ${error.message}`);
    }
  }
}

export default SwapExecutor;
