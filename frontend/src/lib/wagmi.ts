import { createConfig, http } from 'wagmi';
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  sepolia,
  localhost
} from 'wagmi/chains';
import { getDefaultConfig } from 'rainbowkit';

// Polkadot Asset Hub (EVM compatible) configuration
const polkadotAssetHub = {
  id: 1000, // Placeholder - actual chain ID would be different
  name: 'Polkadot Asset Hub',
  nativeCurrency: {
    decimals: 18,
    name: 'DOT',
    symbol: 'DOT',
  },
  rpcUrls: {
    public: { http: ['https://rpc-assethub-polkadot.lodestar.io'] },
    default: { http: ['https://rpc-assethub-polkadot.lodestar.io'] },
  },
  blockExplorers: {
    default: { name: 'Subscan', url: 'https://assethub-polkadot.subscan.io' },
  },
  testnet: false,
};

export const chains = [
  mainnet,
  polygon,
  arbitrum,
  optimism,
  polkadotAssetHub,
  ...(process.env.NODE_ENV === 'development' ? [localhost] : []),
];

export const wagmiConfig = getDefaultConfig({
  appName: 'Proof of Love',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [polkadotAssetHub.id]: http('https://rpc-assethub-polkadot.lodestar.io'),
    ...(process.env.NODE_ENV === 'development' ? {
      [localhost.id]: http(),
    } : {}),
  },
  ssr: true,
});

// Contract addresses (would be loaded from environment variables)
export const CONTRACT_ADDRESSES = {
  POL_TOKEN: process.env.NEXT_PUBLIC_POL_TOKEN_ADDRESS || '0x...',
  NFT_BADGE: process.env.NEXT_PUBLIC_NFT_BADGE_ADDRESS || '0x...',
  GOVERNANCE: process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS || '0x...',
  CONTRIBUTION_REGISTRY: process.env.NEXT_PUBLIC_CONTRIBUTION_REGISTRY_ADDRESS || '0x...',
} as const;