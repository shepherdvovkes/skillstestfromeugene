import React from 'react';
import type { AppProps } from 'next/app';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { polygon, linea, bsc } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { ServiceProvider } from '@/contexts/ServiceContext';
import { serviceFactory } from '@/services/ServiceFactory';
import '@/styles/globals.css';

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [polygon, linea, bsc],
  [publicProvider()]
);

// Set up wagmi config
const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'c4f79cc821944d9680842e34466bfbd9',
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
});

export default function App({ Component, pageProps }: AppProps) {
  // Create services using the factory only on client side
  const [services, setServices] = React.useState<any>(null);

  React.useEffect(() => {
    setServices(serviceFactory.createAllServices());
  }, []);

  // Don't render until services are created
  if (!services) {
    return null;
  }

  return (
    <WagmiConfig config={config}>
      <ServiceProvider services={services}>
        <Component {...pageProps} />
      </ServiceProvider>
    </WagmiConfig>
  );
}
