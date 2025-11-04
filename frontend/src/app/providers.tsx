'use client';

import { QueryClient, QueryClientProvider } from 'react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { wagmiConfig, chains } from '../lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import '../styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          chains={chains}
          appInfo={{
            appName: 'Proof of Love',
            disclaimer: ({ Text }) => (
              <Text>
                通过连接钱包，您同意 Proof of Love 平台的服务条款和隐私政策。
              </Text>
            ),
          }}
          theme={{
            mode: 'dark',
            accentColor: '#d946ef',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          }}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            forcedTheme="dark"
          >
            <div className="min-h-screen bg-gray-900 text-gray-100">
              {children}
            </div>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}