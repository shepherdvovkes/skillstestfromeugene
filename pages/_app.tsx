import React from 'react';
import type { AppProps } from 'next/app';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { polygon, linea, mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { ServiceProvider } from '@/contexts/ServiceContext';
import { serviceFactory } from '@/services/ServiceFactory';
import { APP_CONFIG } from '@/config/constants';
import '@/styles/globals.css';

// Custom BSC chain configuration to match our RPC URL
const bsc = {
  id: 56,
  name: 'BNB Smart Chain',
  network: 'bsc',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: {
      http: [APP_CONFIG.NETWORKS.BSC.rpcUrl],
    },
    public: {
      http: [APP_CONFIG.NETWORKS.BSC.rpcUrl],
    },
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://bscscan.com' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 15921452,
    },
  },
} as const;

// Custom Polygon chain configuration
const customPolygon = {
  ...polygon,
  rpcUrls: {
    default: {
      http: [APP_CONFIG.NETWORKS.POLYGON.rpcUrl],
    },
    public: {
      http: [APP_CONFIG.NETWORKS.POLYGON.rpcUrl],
    },
  },
} as const;

// Custom Linea chain configuration
const customLinea = {
  ...linea,
  rpcUrls: {
    default: {
      http: [APP_CONFIG.NETWORKS.LINEA.rpcUrl],
    },
    public: {
      http: [APP_CONFIG.NETWORKS.LINEA.rpcUrl],
    },
  },
} as const;

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [customPolygon, customLinea, bsc, mainnet],
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
