// DexAggregator.js - UPDATED with Modal Support
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers } from "ethers";
import NetworkManager from "./NetworkManager";
import SwapInterface from "./SwapInterface";
import BalanceFetcher from "./BalanceFetcher";
import RateFetcher from "./RateFetcher";
import SwapExecutor from "./SwapExecutor";
import Header from "./Header";
import Footer from "./Footer";
import ComparisonTable from "./ComparisonTable";
import Background from "./Background";
import { CONFIG } from "./config";
import "./styles.css";

const DexAggregator = () => {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const [state, setState] = useState(() => {
    const baseNetwork = CONFIG.NETWORKS[8453];

    return {
      account: "",
      provider: null,
      signer: null,
      selectedNetwork: {
        id: baseNetwork.chainId,
        name: baseNetwork.name,
        chainId: baseNetwork.chainId,
        logoURI: baseNetwork.logoURI,
        isTestnet: baseNetwork.isTestnet,
      },
      fromToken: {
        ...baseNetwork.tokens.ETH,
        balance: "0",
      },
      toToken: {
        ...baseNetwork.tokens.USDC,
        balance: "0",
      },
      amount: "",
      slippage: 0.5,
      loading: false,
      fetchingBalance: false,
      executing: false,
      bestRate: "0.00",
      bestDex: "",
      showComparison: false,
      walletError: "",
      quoteData: null,
    };
  });

  const managersRef = useRef(null);

  if (!managersRef.current) {
    const balanceFetcher = new BalanceFetcher(state, setState, CONFIG);

    managersRef.current = {
      networkManager: new NetworkManager(state, setState, CONFIG),
      balanceFetcher: balanceFetcher,
      rateFetcher: new RateFetcher(state, setState, CONFIG),
      swapExecutor: new SwapExecutor(state, setState, balanceFetcher),
    };
  }

  useEffect(() => {
    if (isConnected && address && walletProvider) {
      const ethersProvider = new ethers.providers.Web3Provider(walletProvider);
      const ethersSigner = ethersProvider.getSigner();

      setState((prev) => ({
        ...prev,
        account: address,
        provider: ethersProvider,
        signer: ethersSigner,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        account: "",
        provider: null,
        signer: null,
        fromToken: {
          ...prev.fromToken,
          balance: "0",
        },
        toToken: {
          ...prev.toToken,
          balance: "0",
        },
      }));
    }
  }, [isConnected, address, walletProvider]);

  useEffect(() => {
    if (managersRef.current) {
      managersRef.current.networkManager.state = state;
      managersRef.current.balanceFetcher.state = state;
      managersRef.current.rateFetcher.state = state;
      managersRef.current.swapExecutor.state = state;
    }
  }, [state]);

  const lastNetworkId = useRef(null);
  useEffect(() => {
    if (
      lastNetworkId.current !== state.selectedNetwork.id &&
      managersRef.current?.networkManager
    ) {
      managersRef.current.networkManager.initializeNetwork();
      lastNetworkId.current = state.selectedNetwork.id;
    }
  }, [state.selectedNetwork.id]);

  const lastBalanceFetch = useRef(0);
  useEffect(() => {
    const now = Date.now();
    if (
      state.account &&
      state.provider &&
      managersRef.current?.balanceFetcher
    ) {
      if (now - lastBalanceFetch.current > 1000) {
        managersRef.current.balanceFetcher.fetchBalancesEffect();
        lastBalanceFetch.current = now;
      }
    }
  }, [
    state.account,
    state.provider,
    state.fromToken.address,
    state.toToken.address,
  ]);

  const swapTokens = useCallback(() => {
    setState((prev) => ({
      ...prev,
      fromToken: {
        ...prev.toToken,
        balance: "0",
      },
      toToken: {
        ...prev.fromToken,
        balance: "0",
      },
      amount: "",
      bestRate: "0.00",
      bestDex: "",
      showComparison: false,
      quoteData: null,
    }));
    lastBalanceFetch.current = 0;
  }, []);

  const handleMax = useCallback(() => {
    const maxAmount = state.fromToken.balance;
    setState((prev) => ({
      ...prev,
      amount: maxAmount,
    }));
    if (managersRef.current?.rateFetcher && parseFloat(maxAmount) > 0) {
      managersRef.current.rateFetcher.state = state;
      managersRef.current.rateFetcher.setState = setState;
      setTimeout(() => {
        managersRef.current.rateFetcher.fetchBestRate();
      }, 100);
    }
  }, [state]);

  const setSlippage = useCallback((value) => {
    setState((prev) => ({ ...prev, slippage: value }));
  }, []);

  const handleAmountChange = useCallback((value) => {
    if (managersRef.current?.rateFetcher) {
      managersRef.current.rateFetcher.handleAmountChange(value);
    }
  }, []);

  const handleTokenSelect = useCallback((token, isFrom) => {
    if (managersRef.current?.rateFetcher) {
      managersRef.current.rateFetcher.handleTokenSelect(token, isFrom);
    }
  }, []);

  // Enhanced handleSwap with modal callback
  const handleSwap = useCallback((modalCallback) => {
    if (managersRef.current?.swapExecutor) {
      // Set the modal callback
      managersRef.current.swapExecutor.setModalCallback(modalCallback);
      // Execute swap
      managersRef.current.swapExecutor.executeSwap();
    }
  }, []);

  const uiActions = {
    swapTokens,
    handleMax,
    setSlippage,
    handleAmountChange,
    handleTokenSelect,
    handleSwap,
  };

  return (
    <>
      <Background />
      <Header
        state={state}
        networkManager={managersRef.current?.networkManager}
      />

      {state.walletError && (
        <div className="error-banner fade-in">
          <span>{state.walletError}</span>
        </div>
      )}

      <main className="main-content">
        <SwapInterface
          state={state}
          uiActions={uiActions}
          rateFetcher={managersRef.current?.rateFetcher}
          showComparison={state.showComparison}
          ComparisonTable={ComparisonTable}
        />
      </main>

      <Footer state={state} />
    </>
  );
};

export default DexAggregator;
