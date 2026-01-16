import React, { useState } from "react";
import { FiSettings, FiX } from "react-icons/fi";

const SlippageSettings = ({ slippage, onSlippageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customSlippage, setCustomSlippage] = useState("");
  const [activeTab, setActiveTab] = useState("preset");

  const presetOptions = [0.1, 0.5, 1.0, 2.0];

  const handlePresetSelect = (value) => {
    onSlippageChange(value);
    setIsOpen(false);
  };

  const handleCustomSlippage = () => {
    const value = parseFloat(customSlippage);
    if (!isNaN(value) && value >= 0.1 && value <= 10) {
      onSlippageChange(value);
      setIsOpen(false);
      setCustomSlippage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleCustomSlippage();
    }
  };

  return (
    <div className="slippage-settings-container">
      <button
        className="settings-toggle-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Slippage Settings"
      >
        <FiSettings size={22} />
      </button>

      {isOpen && (
        <div className="slippage-dropdown">
          <div className="slippage-header">
            <h4>Slippage Tolerance</h4>
            <button className="close-button" onClick={() => setIsOpen(false)}>
              <FiX size={20} />
            </button>
          </div>

          <div className="slippage-tabs">
            <button
              className={`tab-button ${activeTab === "preset" ? "active" : ""}`}
              onClick={() => setActiveTab("preset")}
            >
              Preset
            </button>
            <button
              className={`tab-button ${activeTab === "custom" ? "active" : ""}`}
              onClick={() => setActiveTab("custom")}
            >
              Custom
            </button>
          </div>

          {activeTab === "preset" ? (
            <div className="preset-options">
              {presetOptions.map((option) => (
                <button
                  key={option}
                  className={`preset-option ${
                    slippage === option ? "active" : ""
                  }`}
                  onClick={() => handlePresetSelect(option)}
                >
                  {option}%
                </button>
              ))}
            </div>
          ) : (
            <div className="custom-slippage">
              <div className="custom-input-container">
                <input
                  type="number"
                  className="custom-input"
                  value={customSlippage}
                  onChange={(e) => setCustomSlippage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter %"
                  min="0.1"
                  max="10"
                  step="0.1"
                />
                <span className="percent-symbol">%</span>
              </div>
              <div className="input-hint">Enter value between 0.1% - 10%</div>
              <button
                className="apply-button"
                onClick={handleCustomSlippage}
                disabled={
                  !customSlippage ||
                  parseFloat(customSlippage) < 0.1 ||
                  parseFloat(customSlippage) > 10
                }
              >
                Apply Slippage
              </button>
            </div>
          )}

          <div className="slippage-info">
            <p>
              Your transaction will revert if the price changes unfavorably by
              more than this percentage.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlippageSettings;
