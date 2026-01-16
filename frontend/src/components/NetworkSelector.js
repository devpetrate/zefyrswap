import React, { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { CONFIG } from "./config";

const networks = Object.values(CONFIG.NETWORKS).map((network) => ({
  id: network.chainId,
  name: network.name,
  chainId: network.chainId,
  logoURI: network.logoURI,
  isTestnet: network.isTestnet,
}));

const NetworkSelector = ({ selectedNetwork, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (network) => {
    onSelect(network);
    setIsOpen(false);
  };

  const currentNetwork = selectedNetwork || networks[0];

  return (
    <div className="network-selector">
      <button className="network-button" onClick={() => setIsOpen(!isOpen)}>
        {currentNetwork.logoURI ? (
          <img
            src={currentNetwork.logoURI}
            alt={currentNetwork.name}
            className="network-logo"
          />
        ) : (
          <span className="network-icon">{currentNetwork.name[0]}</span>
        )}
        <span>{currentNetwork.name}</span>
        {currentNetwork.isTestnet && (
          <span className="testnet-badge">Testnet</span>
        )}
        <FiChevronDown />
      </button>

      {isOpen && (
        <div className="network-dropdown">
          {networks.map((network) => (
            <div
              key={network.id}
              className={`network-option ${
                currentNetwork.id === network.id ? "active" : ""
              }`}
              onClick={() => handleSelect(network)}
            >
              {network.logoURI ? (
                <img
                  src={network.logoURI}
                  alt={network.name}
                  className="network-logo"
                />
              ) : (
                <span className="network-icon">{network.name[0]}</span>
              )}
              <span>{network.name}</span>
              {network.isTestnet && (
                <span className="testnet-badge">Testnet</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkSelector;
