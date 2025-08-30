import React, { useState, useEffect } from 'react';
import { WalletConnect } from './WalletConnect';

interface ClientOnlyWalletConnectProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export const ClientOnlyWalletConnect: React.FC<ClientOnlyWalletConnectProps> = (props) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-gray-600 mb-2">
          Connect your wallet to continue
        </div>
        <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
    );
  }

  return <WalletConnect {...props} />;
};
