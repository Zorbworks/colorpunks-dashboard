'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { ReactNode, useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig, lightTheme } from '@rainbow-me/rainbowkit';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'colorpunks-diy';
const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

// Use Alchemy as the RPC transport instead of Base's free public endpoint.
// The public one rate-limits at ~10-20 req/s and returns 429s when we burst
// multicalls for 50+ tokenURI reads. Alchemy's free tier handles this fine.
const rpcUrl = alchemyKey && alchemyKey !== 'demo'
  ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
  : undefined; // falls back to default public RPC if no key

const config = getDefaultConfig({
  appName: 'ColorPunks Dashboard',
  projectId,
  chains: [base],
  transports: {
    [base.id]: http(rpcUrl),
  },
  ssr: true,
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: '#000000',
            accentColorForeground: '#ffffff',
            borderRadius: 'none',
            fontStack: 'system',
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
