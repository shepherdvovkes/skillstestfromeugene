import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNetworkManagement } from '@/hooks/useNetworkManagement';
import { useAccount, useSwitchNetwork, useNetwork } from 'wagmi';
import { APP_CONFIG } from '@/config/constants';

// Function to add chain to MetaMask
const addChainToMetaMask = async (networkId: number) => {
  const network = Object.values(APP_CONFIG.NETWORKS).find(n => n.id === networkId);
  if (!network) {
    throw new Error(`Network ${networkId} not found in configuration`);
  }

  const chainParams = {
    chainId: `0x${networkId.toString(16)}`, // Convert to hex
    chainName: network.name,
    nativeCurrency: {
      name: network.name === 'BSC' ? 'BNB' : network.name === 'Polygon' ? 'MATIC' : 'ETH',
      symbol: network.name === 'BSC' ? 'BNB' : network.name === 'Polygon' ? 'MATIC' : 'ETH',
      decimals: 18,
    },
    rpcUrls: [network.rpcUrl],
    blockExplorerUrls: [
      network.name === 'BSC' ? 'https://bscscan.com' :
      network.name === 'Polygon' ? 'https://polygonscan.com' :
      network.name === 'Linea' ? 'https://lineascan.build' :
      'https://etherscan.io'
    ],
  };

  try {
    // Check if MetaMask is available
    if (typeof window !== 'undefined' && window.ethereum) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [chainParams],
      });
      return true;
    } else {
      throw new Error('MetaMask not available');
    }
  } catch (error) {
    console.error('Failed to add chain to MetaMask:', error);
    throw error;
  }
};

export const NetworkSwitcher: React.FC = () => {
  // Use the complex service architecture for business logic
  const { 
    currentNetwork, 
    supportedNetworks, 
    isSwitching, 
    error, 
    switchNetwork: serviceSwitchNetwork,
    validateNetwork,
    getNetworkStatus,
    refreshSupportedNetworks 
  } = useNetworkManagement();
  
  // Use wagmi hooks directly for real-time chain information and switching
  const { chain } = useAccount();
  const { chains } = useNetwork();
  const { switchNetwork: wagmiSwitchNetwork, isPending: isWagmiSwitching } = useSwitchNetwork();
  
  const [isOpen, setIsOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Sync current network with wagmi chain
  useEffect(() => {
    if (chain && currentNetwork?.id !== chain.id) {
      // Update the service layer with the current wagmi chain
      refreshSupportedNetworks();
    }
  }, [chain, currentNetwork, refreshSupportedNetworks]);

  const handleNetworkSwitch = async (networkId: number) => {
    try {
      setLocalError(null);
      
      // First validate the network through the service layer
      const isValid = await validateNetwork(networkId);
      if (!isValid) {
        throw new Error(`Network ${networkId} validation failed`);
      }

      // Try to switch network using wagmi first
      if (wagmiSwitchNetwork) {
        try {
          await wagmiSwitchNetwork(networkId);
        } catch (switchError: any) {
          // If the error indicates an unrecognized chain, try to add it to MetaMask
          if (switchError.message?.includes('Unrecognized chain ID') || 
              switchError.message?.includes('wallet_addEthereumChain')) {
            console.log(`Chain ${networkId} not recognized, adding to MetaMask...`);
            
            try {
              // Add the chain to MetaMask
              await addChainToMetaMask(networkId);
              
              // Try switching again after adding the chain
              await wagmiSwitchNetwork(networkId);
            } catch (addChainError) {
              console.error('Failed to add chain to MetaMask:', addChainError);
              throw new Error(`Please add ${APP_CONFIG.NETWORKS[networkId as keyof typeof APP_CONFIG.NETWORKS]?.name || `Network ${networkId}`} to MetaMask manually and try again.`);
            }
          } else {
            // Re-throw other errors
            throw switchError;
          }
        }
      }
      
      // Also trigger the service layer switchNetwork for business logic
      try {
        await serviceSwitchNetwork(networkId);
      } catch (serviceError) {
        console.warn('Service layer network switch failed, but wagmi switch succeeded:', serviceError);
        // Don't fail the entire operation if service layer fails
      }
      
      // Refresh the supported networks list
      await refreshSupportedNetworks();
      
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch network:', error);
      setLocalError(error instanceof Error ? error.message : 'Network switch failed');
    }
  };

  const getCurrentNetworkName = () => {
    if (chain) {
      return chain.name;
    }
    if (currentNetwork) {
      return currentNetwork.name;
    }
    return 'Not Connected';
  };

  const getCurrentNetworkIcon = (networkName: string) => {
    const icons: Record<string, string> = {
      'Polygon': '🔷',
      'Linea': '🔵',
      'BSC': '🟡',
      'Ethereum': '💎',
      'Polygon Mumbai': '🔷',
      'Linea Goerli': '🔵',
      'BSC Testnet': '🟡'
    };
    return icons[networkName] || '🌐';
  };

  const getNetworkStatusColor = (networkId: number) => {
    if (chain?.id === networkId) {
      return 'bg-green-100 text-green-800 border-green-300';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
  };

  const isNetworkSupported = (networkId: number) => {
    // Check both wagmi chains and service layer networks
    const wagmiSupported = chains.some(chain => chain.id === networkId);
    const serviceSupported = supportedNetworks.some(network => network.id === networkId);
    return wagmiSupported && serviceSupported;
  };

  // Don't render if no networks are available
  if (supportedNetworks.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Loading networks...
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Current Network Display */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="flex items-center gap-2 min-w-[200px] justify-between"
        disabled={isSwitching || isWagmiSwitching}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {getCurrentNetworkIcon(getCurrentNetworkName())}
          </span>
          <span className="font-medium">
            {getCurrentNetworkName()}
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {/* Network Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">
              Switch Network
            </div>
            {supportedNetworks.map((network) => {
              const isSupported = isNetworkSupported(network.id);
              const isCurrentNetwork = chain?.id === network.id;
              const networkStatus = getNetworkStatus(network.id);
              
              return (
                <button
                  key={network.id}
                  onClick={() => handleNetworkSwitch(network.id)}
                  disabled={isSwitching || isWagmiSwitching || isCurrentNetwork || !isSupported}
                  className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                    isCurrentNetwork 
                      ? 'bg-green-100 text-green-800 border-green-300 cursor-not-allowed' 
                      : isSupported 
                        ? 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getCurrentNetworkIcon(network.name)}
                      </span>
                      <div>
                        <div className="font-medium">{network.name}</div>
                        <div className="text-xs text-gray-500">
                          Chain ID: {network.id} • {networkStatus.status}
                        </div>
                      </div>
                    </div>
                    {isCurrentNetwork && (
                      <span className="text-green-600 text-sm">✓ Connected</span>
                    )}
                    {!isSupported && (
                      <span className="text-gray-400 text-sm">Not Available</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Display from Service Layer */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          Service Error: {error}
        </div>
      )}

      {/* Local Error Display */}
      {localError && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          Network Switch Error: {localError}
        </div>
      )}

      {/* Loading State from Service Layer */}
      {isSwitching && (
        <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
          Processing via service layer...
        </div>
      )}

      {/* Loading State from Wagmi */}
      {isWagmiSwitching && (
        <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
          Switching network via wagmi...
        </div>
      )}

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <div>Service Networks: {supportedNetworks.length}</div>
          <div>Wagmi Chains: {chains.map(c => c.name).join(', ')}</div>
          <div>Current Chain: {chain?.name || 'None'}</div>
          <div>Current Network: {currentNetwork?.name || 'None'}</div>
          <div>Chain ID: {chain?.id || 'None'}</div>
        </div>
      )}
    </div>
  );
};
