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
        projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
});

export default function App({ Component, pageProps }: AppProps) {
  // Create services using the factory
  const services = serviceFactory.createAllServices();

  return (
    <WagmiConfig config={config}>
      <ServiceProvider services={services}>
        <Component {...pageProps} />
      </ServiceProvider>
    </WagmiConfig>
  );
}
