// Popular tokens on Base Mainnet
export const BASE_TOKENS = [
  {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    isNative: true,
    logoURI: "/logos/ethereum-eth-logo.svg",
    popular: true,
  },
  {
    address: "0x4200000000000000000000000000000000000006",
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    isNative: false,
    logoURI: "/logos/weth.png",
    popular: true,
  },
  {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI: "/logos/usd-coin-usdc-logo.svg",
    popular: true,
  },
  {
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    logoURI: "/logos/multi-collateral-dai-dai-logo.svg",
    popular: true,
  },
  {
    address: "0x311935Cd80B76769bF2ecC9D8Ab7635b2139cf82",
    symbol: "SOL",
    name: "SOLANA",
    decimals: 9,
    logoURI: "/logos/solana-sol-logo.svg",
    popular: true,
  },
  {
    address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    symbol: "USDbC",
    name: "USD Base Coin",
    decimals: 6,
    logoURI: "/logos/USDbC.png",
    popular: true,
  },
  {
    address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
    symbol: "AERO",
    name: "Aerodrome Finance",
    decimals: 18,
    logoURI: "/logos/aerodrome-logo.svg",
    popular: true,
  },
  {
    address: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b",
    symbol: "VIRTUAL",
    name: "Virtual Protocol",
    decimals: 18,
    logoURI: "/logos/virtual-protocol-virtual-logo.svg",
    popular: false,
  },
  {
    address: "0x1111111111166b7FE7bd91427724B487980aFc69",
    symbol: "ZORA",
    name: "Zora",
    decimals: 18,
    logoURI: "/logos/zorb-logo.svg",
    popular: false,
  },
  {
    address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
    symbol: "cbETH",
    name: "Coinbase Wrapped Staked ETH",
    decimals: 18,
    logoURI: "/logos/CBETH.svg",
    popular: true,
  },
  {
    address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    symbol: "cbBTC",
    name: "Coinbase Wrapped Staked BTC",
    decimals: 8,
    logoURI: "/logos/cbBTC.png",
    popular: false,
  },
  {
    address: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452",
    symbol: "wstETH",
    name: "Wrapped liquid staked Ether 2.0",
    decimals: 18,
    logoURI: "/logos/wstETH.png",
    popular: false,
  },
  {
    address: "0x532f27101965dd16442E59d40670FaF5eBB142E4",
    symbol: "BRETT",
    name: "Brett",
    decimals: 18,
    logoURI: "/logos/based-brett-brett-logo.svg", // Add logo URL if available
    popular: false,
  },
];

// Function to get token by address
export const getTokenByAddress = (address) => {
  return BASE_TOKENS.find(
    (token) => token.address.toLowerCase() === address.toLowerCase()
  );
};

// Function to get popular tokens only
export const getPopularTokens = () => {
  return BASE_TOKENS.filter((token) => token.popular);
};

// Function to search tokens
export const searchTokens = (query) => {
  const lowerQuery = query.toLowerCase();
  return BASE_TOKENS.filter(
    (token) =>
      token.symbol.toLowerCase().includes(lowerQuery) ||
      token.name.toLowerCase().includes(lowerQuery) ||
      token.address.toLowerCase().includes(lowerQuery)
  );
};
