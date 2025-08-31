import React from 'react';
import type { AppProps } from 'next/app';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { polygon, linea, bsc, mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { ServiceProvider } from '@/contexts/ServiceContext';
import { serviceFactory } from '@/services/ServiceFactory';
import '@/styles/globals.css';

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [polygon, linea, bsc, mainnet],
  [publicProvider()]
);

// Set up wagmi config
const connectors = [
  new MetaMaskConnector({ chains }),
];

// Only add WalletConnect if project ID is provided and not the demo ID
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (walletConnectProjectId && 
    walletConnectProjectId !== 'your-actual-project-id-here' && 
    walletConnectProjectId !== '8c4f79cc821944d9680842e34466bfbd9') {
  connectors.push(
    new WalletConnectConnector({
      chains,
      options: {
        projectId: walletConnectProjectId,
        showQrModal: true,
        qrModalOptions: {
          themeMode: 'dark',
          themeVariables: {
            '--w3m-z-index': '9999',
          },
        },
        metadata: {
          name: 'Blockchain Wallet Connection Demo',
          description: 'Enhanced blockchain wallet connection demo',
          url: 'https://localhost:3000',
          icons: ['https://localhost:3000/favicon.ico']
        }
      },
    })
  );
}

const config = createConfig({
  autoConnect: true,
  connectors,
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
