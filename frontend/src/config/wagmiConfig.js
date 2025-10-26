import { createConfig, configureChains } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';

// Use Alchemy RPC from environment variable
const PRIMARY_RPC = process.env.REACT_APP_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
export const WALLETCONNECT_PROJECT_ID = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const { chains, publicClient } = configureChains(
  [sepolia],
  [
    jsonRpcProvider({
      rpc: () => ({ http: PRIMARY_RPC }),
    }),
    w3mProvider({ projectId: WALLETCONNECT_PROJECT_ID }),
    publicProvider()
  ],
  {
    pollingInterval: 4_000,
    stallTimeout: 3_000,
  }
);

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({
    projectId: WALLETCONNECT_PROJECT_ID,
    chains: [sepolia],
    version: 2,
    explorerRecommendedWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    ],
    explorerExcludedWalletIds: 'ALL'
  }),
  publicClient,
});

// Create EthereumClient for Web3Modal
export const ethereumClient = new EthereumClient(wagmiConfig, chains);
