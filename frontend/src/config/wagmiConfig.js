import { createConfig, configureChains } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

const rpcUrls = [
  'https://eth-sepolia.public.blastapi.io',
  'https://rpc.sepolia.org',
  'https://sepolia.gateway.tenderly.co'
];

export const { chains, publicClient } = configureChains(
  [sepolia],
  [
    ...rpcUrls.map(url => 
      jsonRpcProvider({
        rpc: () => ({ http: url }),
      })
    ),
    publicProvider()
  ],
  {
    pollingInterval: 4_000,
    stallTimeout: 3_000,
    rank: true,
  }
);

export const wagmiConfig = createConfig({
  autoConnect: true,
  publicClient,
});
