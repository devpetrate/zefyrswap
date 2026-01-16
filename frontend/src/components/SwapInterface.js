// SwapInterface.js - UPDATED with Modal
import React, { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { ethers } from "ethers";
import TokenSelector from "./TokenSelector";
import SlippageSettings from "./SlippageSettings";
import SwapConfirmationModal from "./SwapConfirmationModal";

const SwapInterface = ({
  state,
  uiActions,
  rateFetcher,
  showComparison,
  ComparisonTable,
}) => {
  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    step: 1,
    tokenSymbol: "",
    approveTxHash: null,
    swapTxHash: null,
    error: null,
    isWrapOrUnwrap: null,
  });

  // Close modal handler
  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      step: 1,
      tokenSymbol: "",
      approveTxHash: null,
      swapTxHash: null,
      error: null,
      isWrapOrUnwrap: null,
    });
  };

  // Enhanced handleSwap with modal callback
  const handleSwapWithModal = () => {
    // Update modal state callback
    const modalCallback = (updates) => {
      setModalState((prev) => ({ ...prev, ...updates }));
    };

    // Pass callback to uiActions
    uiActions.handleSwap(modalCallback);
  };

  // Calculate output amount from API quote data
  const getOutputAmount = () => {
    if (!state.amount || !state.quoteData) {
      return "";
    }

    try {
      const amountOut = ethers.utils.formatUnits(
        state.quoteData.amountOut,
        state.toToken.decimals
      );
      return parseFloat(amountOut).toFixed(6);
    } catch (error) {
      console.error("Error formatting output amount:", error);
      return "";
    }
  };

  const getButtonText = () => {
    const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

    const isWrap =
      state.fromToken.address.toLowerCase() ===
        "0x0000000000000000000000000000000000000000" &&
      state.toToken.address.toLowerCase() === WETH_ADDRESS.toLowerCase();

    const isUnwrap =
      state.fromToken.address.toLowerCase() === WETH_ADDRESS.toLowerCase() &&
      state.toToken.address.toLowerCase() ===
        "0x0000000000000000000000000000000000000000";

    if (!state.account) return "Connect Wallet";
    if (!state.amount) return "Enter Amount";
    if (parseFloat(state.amount) > parseFloat(state.fromToken.balance))
      return "Insufficient Balance";
    if (state.loading) return "Finding Best Rate...";
    if (state.executing) {
      if (isWrap) return "Wrapping...";
      if (isUnwrap) return "Unwrapping...";
      return "Executing Swap...";
    }
    if (state.quoteData) {
      if (isWrap) return "Wrap";
      if (isUnwrap) return "Unwrap";
      return "Swap";
    }
    return "Get Quote";
  };

  return (
    <>
      <div className="swap-card">
        <div className="card-header">
          <h2 className="card-title">Swap Tokens</h2>
          <SlippageSettings
            slippage={state.slippage}
            onSlippageChange={uiActions.setSlippage}
          />
        </div>

        {/* From Token Input */}
        <div className="token-input">
          <div className="token-header">
            <span>From</span>
            <div className="token-balance">
              <span>
                Balance:{" "}
                {state.fetchingBalance ? "Loading..." : state.fromToken.balance}
              </span>
              <button
                className="max-button"
                onClick={uiActions.handleMax}
                disabled={
                  !state.account || parseFloat(state.fromToken.balance) <= 0
                }
              >
                MAX
              </button>
            </div>
          </div>
          <div className="input-row">
            <input
              type="text"
              className="amount-input"
              value={state.amount}
              onChange={(e) => uiActions.handleAmountChange(e.target.value)}
              placeholder="0.0"
              inputMode="decimal"
            />
            <TokenSelector
              selectedToken={state.fromToken}
              onSelect={(token) => uiActions.handleTokenSelect(token, true)}
              network={state.selectedNetwork}
              isFrom={true}
            />
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="swap-direction">
          <button
            className="swap-arrow"
            onClick={uiActions.swapTokens}
            title="Swap tokens"
          >
            <FiRefreshCw />
          </button>
        </div>

        {/* To Token Input */}
        <div className="token-input">
          <div className="token-header">
            <span>To (Estimated)</span>
            <div className="token-balance">
              <span>
                Balance:{" "}
                {state.fetchingBalance ? "Loading..." : state.toToken.balance}
              </span>
            </div>
          </div>
          <div className="input-row">
            <input
              type="text"
              className="amount-input"
              value={state.loading ? "Fetching..." : getOutputAmount()}
              readOnly
              placeholder="0.0"
            />
            <TokenSelector
              selectedToken={state.toToken}
              onSelect={(token) => uiActions.handleTokenSelect(token, false)}
              network={state.selectedNetwork}
              isFrom={false}
              excludeToken={state.fromToken}
            />
          </div>
        </div>

        {/* Slippage Display */}
        <div className="slippage-display-container">
          <div className="slippage-label">
            <span>Max. Slippage</span>
            <span>{state.slippage}%</span>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          className="confirm-button"
          disabled={
            !state.account ||
            !state.amount ||
            parseFloat(state.amount) <= 0 ||
            state.loading ||
            !state.quoteData ||
            parseFloat(state.amount) > parseFloat(state.fromToken.balance) ||
            state.executing
          }
          onClick={handleSwapWithModal}
        >
          {getButtonText()}
        </button>

        {/* Comparison Table */}
        {showComparison &&
          state.amount &&
          parseFloat(state.amount) > 0 &&
          ComparisonTable &&
          state.quoteData && (
            <div className="swap-comparison-table">
              <ComparisonTable
                fromToken={state.fromToken}
                toToken={state.toToken}
                amount={state.amount}
                bestRate={state.quoteData?.price || "0"}
                bestDex={state.bestDex}
                network={state.selectedNetwork}
                quoteData={state.quoteData}
              />
            </div>
          )}
      </div>

      {/* Swap Confirmation Modal */}
      <SwapConfirmationModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        step={modalState.step}
        tokenSymbol={modalState.tokenSymbol}
        approveTxHash={modalState.approveTxHash}
        swapTxHash={modalState.swapTxHash}
        error={modalState.error}
        isWrapOrUnwrap={modalState.isWrapOrUnwrap}
      />
    </>
  );
};

export default SwapInterface;
