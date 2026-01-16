import React, { useState, useEffect, useRef } from "react";
import { FiChevronDown, FiX, FiSearch } from "react-icons/fi";
import { BASE_TOKENS, getPopularTokens, searchTokens } from "./tokenList";
import apiService from "../services/apiService";

const TokenSelector = ({
  selectedToken,
  onSelect,
  network,
  isFrom,
  excludeToken,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customToken, setCustomToken] = useState(null);
  const [loadingCustomToken, setLoadingCustomToken] = useState(false);
  const modalRef = useRef(null);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setCustomToken(null);
    }
  }, [isOpen]);

  // Handle token search
  useEffect(() => {
    const fetchCustomToken = async () => {
      if (!searchQuery) {
        setCustomToken(null);
        return;
      }

      // Check if it's an address (starts with 0x and 42 chars)
      const isAddress =
        searchQuery.startsWith("0x") && searchQuery.length === 42;

      if (isAddress) {
        setLoadingCustomToken(true);
        try {
          const tokenInfo = await apiService.getTokenInfo(searchQuery);
          setCustomToken({
            address: searchQuery,
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            decimals: tokenInfo.decimals,
            isCustom: true,
          });
        } catch (error) {
          console.error("Failed to fetch token info:", error);
          setCustomToken(null);
        } finally {
          setLoadingCustomToken(false);
        }
      }
    };

    const debounce = setTimeout(fetchCustomToken, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelect = (token) => {
    onSelect(token);
    setIsOpen(false);
  };

  // Get filtered tokens
  const getFilteredTokens = () => {
    let tokens = searchQuery ? searchTokens(searchQuery) : BASE_TOKENS;

    // Exclude the other selected token
    if (excludeToken?.address) {
      tokens = tokens.filter(
        (token) =>
          token.address.toLowerCase() !== excludeToken.address.toLowerCase()
      );
    }

    return tokens;
  };

  const filteredTokens = getFilteredTokens();
  const popularTokens = getPopularTokens().filter(
    (token) =>
      !excludeToken ||
      token.address.toLowerCase() !== excludeToken.address.toLowerCase()
  );

  // Get token logo or fallback to first letter
  const TokenLogo = ({ token }) => {
    if (token.logoURI) {
      return (
        <img
          src={token.logoURI}
          alt={token.symbol}
          className="token-logo-img"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      );
    }
    return (
      <div className={`token-logo-fallback ${token.symbol.toLowerCase()}`}>
        {token.symbol.charAt(0)}
      </div>
    );
  };

  return (
    <>
      <div className="token-selector">
        <button
          className="token-selector-button"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          {selectedToken && (
            <>
              <TokenLogo token={selectedToken} />
              <span>{selectedToken.symbol}</span>
            </>
          )}
          <FiChevronDown />
        </button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="token-modal-overlay">
          <div className="token-modal" ref={modalRef}>
            {/* Header */}
            <div className="token-modal-header">
              <h3>Select a token</h3>
              <button
                className="token-modal-close"
                onClick={() => setIsOpen(false)}
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Search */}
            <div className="token-search-container">
              <FiSearch className="token-search-icon" />
              <input
                type="text"
                className="token-search-input"
                placeholder="Search name, symbol, or paste address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Popular Tokens */}
            {!searchQuery && (
              <div className="token-popular-section">
                <div className="token-section-title">Popular tokens</div>
                <div className="token-popular-grid">
                  {popularTokens.map((token) => (
                    <button
                      key={token.address}
                      className="token-popular-button"
                      onClick={() => handleSelect(token)}
                    >
                      <TokenLogo token={token} />
                      <span>{token.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Token List */}
            <div className="token-list-container">
              {loadingCustomToken && (
                <div className="token-list-loading">Searching for token...</div>
              )}

              {customToken &&
                !filteredTokens.find(
                  (t) =>
                    t.address.toLowerCase() ===
                    customToken.address.toLowerCase()
                ) && (
                  <>
                    <div className="token-section-title">Custom token</div>
                    <button
                      className="token-list-item"
                      onClick={() => handleSelect(customToken)}
                    >
                      <div className="token-item-left">
                        <TokenLogo token={customToken} />
                        <div className="token-item-info">
                          <div className="token-item-symbol">
                            {customToken.symbol}
                          </div>
                          <div className="token-item-name">
                            {customToken.name}
                          </div>
                        </div>
                      </div>
                      <div className="token-item-address">
                        {customToken.address.slice(0, 6)}...
                        {customToken.address.slice(-4)}
                      </div>
                    </button>
                    <div className="token-section-divider"></div>
                  </>
                )}

              {!searchQuery && (
                <div className="token-section-title">All tokens</div>
              )}

              <div className="token-list">
                {filteredTokens.length > 0
                  ? filteredTokens.map((token) => (
                      <button
                        key={token.address}
                        className="token-list-item"
                        onClick={() => handleSelect(token)}
                      >
                        <div className="token-item-left">
                          <TokenLogo token={token} />
                          <div className="token-item-info">
                            <div className="token-item-symbol">
                              {token.symbol}
                            </div>
                            <div className="token-item-name">{token.name}</div>
                          </div>
                        </div>
                        <div className="token-item-address">
                          {token.address.slice(0, 6)}...
                          {token.address.slice(-4)}
                        </div>
                      </button>
                    ))
                  : !loadingCustomToken &&
                    !customToken && (
                      <div className="token-list-empty">No tokens found</div>
                    )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TokenSelector;
