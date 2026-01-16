import React from "react";
import {
  useAppKit,
  useAppKitAccount,
  useDisconnect,
} from "@reown/appkit/react";
import NetworkSelector from "./NetworkSelector";
import zefyrLogo from "../assets/Zefyr.svg";

const Header = ({ state, networkManager }) => {
  const { open } = useAppKit(); // AppKit modal controls
  const { address, isConnected } = useAppKitAccount(); // Wallet connection state
  const { disconnect } = useDisconnect(); // Disconnect function

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="logo">
          <div className="logo-icon">
            <img src={zefyrLogo} alt="ZefyrSwap" width="55rem" height="55rem" />
          </div>
          <span>
            <span class="swap-word1">Zefyr</span>
            <span class="swap-word2">Swap</span>
          </span>
        </div>

        <NetworkSelector
          selectedNetwork={state.selectedNetwork}
          onSelect={(network) => networkManager.setSelectedNetwork(network)}
        />
      </div>

      <div className="header-wallet">
        {isConnected && address ? (
          <div className="account-info">
            <span className="account-address">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            <button className="disconnect-button" onClick={() => disconnect()}>
              Disconnect
            </button>
          </div>
        ) : (
          <button className="wallet-button" onClick={() => open()}>
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
