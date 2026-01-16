import React, { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { ethers } from "ethers";
import { CONFIG } from "./config";

// Common intermediate tokens that appear in routes
const COMMON_TOKENS = {
  "0x4200000000000000000000000000000000000006": {
    symbol: "WETH",
    decimals: 18,
  },
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { symbol: "USDC", decimals: 6 },
  "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca": {
    symbol: "USDbC",
    decimals: 6,
  },
  // Add more common tokens here as needed
};

const ComparisonTable = ({
  fromToken,
  toToken,
  amount,
  bestRate,
  bestDex,
  network,
  quoteData,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Only show comparison table if we have real quote from API
  if (!quoteData) {
    return null;
  }

  const amountOutFormatted = ethers.utils.formatUnits(
    quoteData.amountOut,
    toToken.decimals
  );

  // Get DEX logo from config based on route name
  const getDexLogo = (dexName) => {
    const networkConfig = CONFIG.NETWORKS[network.id];
    if (!networkConfig) return null;

    // Find DEX by matching route name with DEX name
    const dexEntry = Object.values(networkConfig.dexes).find(
      (dex) => dex.name.toLowerCase() === dexName.toLowerCase()
    );

    return dexEntry?.logo || null;
  };

  // Get token info (symbol and decimals) from address
  const getTokenInfo = (address) => {
    // Check if it's fromToken
    if (address.toLowerCase() === fromToken.address.toLowerCase()) {
      return { symbol: fromToken.symbol, decimals: fromToken.decimals };
    }
    // Check if it's toToken
    if (address.toLowerCase() === toToken.address.toLowerCase()) {
      return { symbol: toToken.symbol, decimals: toToken.decimals };
    }
    // Check common tokens
    const commonToken = COMMON_TOKENS[address.toLowerCase()];
    if (commonToken) {
      return commonToken;
    }
    // Otherwise show shortened address
    return {
      symbol: address.slice(0, 6) + "..." + address.slice(-4),
      decimals: 18,
    };
  };

  // Build route display name
  const getRouteDisplayName = () => {
    if (!quoteData.route || quoteData.route.length === 0) {
      return "Direct Swap";
    }

    // Get unique DEX names
    const dexNames = [
      ...new Set(
        quoteData.route.map((hop) => {
          const dexName = hop.dex;
          // Capitalize first letter
          return dexName
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        })
      ),
    ];

    return dexNames.join(" + ");
  };

  // Request new quote from API
  // const handleRefresh = () => {
  //   // Trigger rate fetch - this should call your rateFetcher
  //   if (window.rateFetcherInstance) {
  //     window.rateFetcherInstance.fetchBestRate();
  //   }
  //   // Or you can emit a custom event that your parent component listens to
  // };

  const routeDisplayName = getRouteDisplayName();
  const totalFeeBps = quoteData.totalFees || 0;
  const feePercentage = (totalFeeBps / 10000).toFixed(2);

  return (
    <div className="comparison-card-new">
      <div className="comparison-header">
        <div className="comparison-badge">
          <span>Best Quote</span>
        </div>
        {/* <button 
          className="refresh-button"
          onClick={handleRefresh}
        >
          <span className="refresh-icon">🔄</span>
          Refresh
        </button> */}
      </div>

      <div className="route-summary">
        <div className="route-info">
          {quoteData.route && quoteData.route.length > 0 && (
            <div className="route-dex-logos">
              {quoteData.route.map((hop, index) => {
                const logo = getDexLogo(hop.dex);
                const isImagePath =
                  typeof logo === "string" &&
                  (logo.startsWith("http://") ||
                    logo.startsWith("https://") ||
                    logo.startsWith("/"));

                return (
                  <div key={index} className="route-dex-logo">
                    {isImagePath ? (
                      <img
                        src={logo}
                        alt={hop.dex}
                        className="dex-logo-small"
                      />
                    ) : (
                      <div className="dex-icon-small">
                        {logo || hop.dex.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="route-name">{routeDisplayName}</div>
        </div>

        <div className="route-output">
          <div className="output-amount">
            {parseFloat(amountOutFormatted).toFixed(4)} {toToken.symbol}
          </div>
          <div className="output-equivalent">
            ≈ {parseFloat(amount).toFixed(4)} {fromToken.symbol}
          </div>
        </div>

        <div className="route-fee">
          <div className="fee-label">Fee</div>
          <div className="fee-value">{feePercentage}%</div>
        </div>
      </div>

      {/* Expandable route details */}
      {quoteData.route && quoteData.route.length > 0 && (
        <>
          <button
            className="toggle-details"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <FiChevronUp /> : <FiChevronDown />}
          </button>

          {showDetails && (
            <div className="route-details">
              {quoteData.route.map((hop, index) => {
                const tokenInInfo = getTokenInfo(hop.tokenIn);
                const tokenOutInfo = getTokenInfo(hop.tokenOut);

                const hopAmountIn = ethers.utils.formatUnits(
                  hop.amountIn,
                  tokenInInfo.decimals
                );
                const hopAmountOut = ethers.utils.formatUnits(
                  hop.amountOut,
                  tokenOutInfo.decimals
                );
                const hopFee = (hop.fee / 10000).toFixed(2);

                const dexDisplayName = hop.dex
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");

                const logo = getDexLogo(hop.dex);
                const isImagePath =
                  typeof logo === "string" &&
                  (logo.startsWith("http://") ||
                    logo.startsWith("https://") ||
                    logo.startsWith("/"));

                return (
                  <div key={index} className="hop-row">
                    <div className="hop-indicator">
                      <span className="hop-dot"></span>
                      <span className="hop-label">Hop {index + 1}:</span>
                    </div>

                    <div className="hop-content">
                      <span className="hop-amount">
                        {parseFloat(hopAmountIn).toFixed(4)}{" "}
                        {tokenInInfo.symbol}
                      </span>
                      <span className="hop-arrow">→</span>

                      {isImagePath ? (
                        <img
                          src={logo}
                          alt={dexDisplayName}
                          className="hop-dex-logo"
                        />
                      ) : (
                        <div className="hop-dex-icon">
                          {logo || hop.dex.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <span className="hop-amount">
                        {parseFloat(hopAmountOut).toFixed(4)}{" "}
                        {tokenOutInfo.symbol}
                      </span>

                      <span className="hop-dex-info">
                        ({dexDisplayName}, {hopFee}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ComparisonTable;
