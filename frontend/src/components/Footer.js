import React from "react";

const Footer = ({ state }) => {
  const networkName = state?.selectedNetwork?.name || "Base";
  const isTestnet = state?.selectedNetwork?.isTestnet || false;
  const account = state?.account;

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-links">
          <a href="#docs" className="footer-link">
            Documentation
          </a>
          <a href="#faq" className="footer-link">
            FAQs
          </a>
          <a href="#audit" className="footer-link">
            Audit
          </a>
          <a href="#security" className="footer-link">
            Security
          </a>
        </div>
        <div className="network-status">
          {isTestnet ? "Testnet" : "Mainnet"}: {networkName}
          {account && ` • ${account.slice(0, 6)}...${account.slice(-4)}`}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
