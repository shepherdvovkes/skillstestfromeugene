import React, { useState } from 'react';
import { Web3Status } from '@/components/web3/Web3Status';
import { ConnectionHealthMonitor } from '@/components/ConnectionHealthMonitor';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useUser } from '@/hooks/user';
import { Button } from '@/components/ui/button';
import { preferenceToast, walletToast } from '@/utils/toast';

interface WalletExampleProps {
  className?: string;
}

export const WalletExample: React.FC<WalletExampleProps> = ({ className }) => {
  const {
    isConnected,
    address,
    userPreferences,
    saveUserPreferences,
    checkConnectionHealth,
    connectors
  } = useUser();
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggleAutoReconnect = () => {
    const newValue = !userPreferences.autoReconnect;
    saveUserPreferences({ autoReconnect: newValue });
    preferenceToast[newValue ? 'autoReconnectEnabled' : 'autoReconnectDisabled']();
  };

  const handleCheckHealth = () => {
    const isHealthy = checkConnectionHealth();
    if (isHealthy) {
      walletToast.info('Connection is healthy');
    }
  };

  const handleResetPreferences = () => {
    saveUserPreferences({
      autoReconnect: true,
      preferredNetworks: [137, 59144, 56],
      lastConnectedAt: 0
    });
    preferenceToast.reset();
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Blockchain Wallet Connection
        </h1>
        <p className="text-gray-600">
          Enhanced wallet connection with error handling, loading states, network validation, and persistence.
        </p>
      </div>

      {/* Main Wallet Status with Error Boundary */}
      <div className="mb-8">
        <ErrorBoundary>
          <Web3Status className="w-full" />
        </ErrorBoundary>
      </div>

      {/* Connection Health Monitor */}
      <div className="mb-8">
        <ConnectionHealthMonitor className="w-full" showAdvanced={showAdvanced} />
      </div>

      {/* Connection Status */}
      {isConnected && (
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-xl font-semibold text-green-900 mb-4">
            Connection Active
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-800 mb-1">
                Wallet Address
              </label>
              <code className="text-sm bg-green-100 px-2 py-1 rounded">
                {address}
              </code>
            </div>
            <div>
              <label className="block text-sm font-medium text-green-800 mb-1">
                Connection Status
              </label>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
          </div>
        </div>
      )}

              {/* Advanced Settings */}
        <div className="mb-8">
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="outline"
            className="mb-4"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings & Health Monitor
          </Button>

        {showAdvanced && (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Advanced Settings
            </h3>
            
            {/* Auto-reconnect Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Auto-reconnect
                </label>
                <p className="text-xs text-gray-500">
                  Automatically reconnect to the last used wallet on page refresh
                </p>
              </div>
              <Button
                onClick={handleToggleAutoReconnect}
                variant={userPreferences.autoReconnect ? 'default' : 'outline'}
                size="sm"
              >
                {userPreferences.autoReconnect ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            {/* Connection Health Check */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Connection Health
                </label>
                <p className="text-xs text-gray-500">
                  Check if the current connection is still valid
                </p>
              </div>
              <Button
                onClick={handleCheckHealth}
                variant="outline"
                size="sm"
              >
                Check Health
              </Button>
            </div>

            {/* Reset Preferences */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Reset Preferences
                </label>
                <p className="text-xs text-gray-500">
                  Reset all user preferences to default values
                </p>
              </div>
              <Button
                onClick={handleResetPreferences}
                variant="outline"
                size="sm"
              >
                Reset
              </Button>
            </div>

            {/* Available Connectors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Wallet Connectors
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {connectors.map((connector) => (
                  <div
                    key={connector.id}
                    className={`p-2 rounded text-xs ${
                      connector.ready
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {connector.name}
                    <span className="block text-xs opacity-75">
                      {connector.ready ? 'Ready' : 'Not Available'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Enhanced Error Handling
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Specific error messages for each wallet type</li>
            <li>• Retry mechanism with configurable attempts</li>
            <li>• User-friendly error notifications</li>
            <li>• Error logging for debugging</li>
          </ul>
        </div>

        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            Loading States
          </h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Connection progress indicators</li>
            <li>• Disabled buttons during connection</li>
            <li>• Retry attempt counter display</li>
            <li>• Visual feedback for connection status</li>
          </ul>
        </div>

        <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">
            Network Validation
          </h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Multi-chain support (Polygon, Linea, BSC)</li>
            <li>• Network status indicators</li>
            <li>• Quick network switching</li>
            <li>• Unsupported network warnings</li>
          </ul>
        </div>

        <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-900 mb-3">
            Connection Persistence
          </h3>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Connection state persistence</li>
            <li>• Auto-reconnect on page refresh</li>
            <li>• Last connected wallet memory</li>
            <li>• User preferences storage</li>
          </ul>
        </div>

        <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">
            Error Boundaries & Health Monitoring
          </h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Comprehensive error handling</li>
            <li>• Real-time connection health monitoring</li>
            <li>• Automatic reconnection attempts</li>
            <li>• Network latency and uptime tracking</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          This implementation provides a comprehensive wallet connection experience with professional UI design and robust error handling.
        </p>
      </div>
    </div>
  );
};
