import type { AppProps } from 'next/app';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { polygon, linea, bsc } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
// import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

// Configure chains and providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [polygon, linea, bsc],
  [publicProvider()]
);

// Set up wagmi config with improved error handling
const config = createConfig({
  autoConnect: false, // Disable autoConnect to prevent race conditions
  publicClient,
  webSocketPublicClient,
  connectors: [
    new MetaMaskConnector({ 
      chains,
      options: {
        shimDisconnect: true, // Better disconnect handling
      }
    }),
    // Temporarily disabled WalletConnect due to invalid project ID
    // new WalletConnectConnector({
    //   chains,
    //   options: {
    //     projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
    //     showQrModal: true,
    //     metadata: {
    //       name: 'Blockchain Wallet Demo',
    //       description: 'Enhanced blockchain wallet connection demo',
    //       url: typeof window !== 'undefined' ? window.location.origin : '',
    //       icons: ['https://avatars.githubusercontent.com/u/37784886']
    //     }
    //   },
    // }),
  ],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={config}>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </WagmiConfig>
  );
}
