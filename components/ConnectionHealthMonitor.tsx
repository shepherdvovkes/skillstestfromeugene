import React, { useState } from 'react';
import { useConnectionHealth } from '@/hooks/useConnectionHealth';
import { useUser } from '@/hooks/user';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ConnectionHealthMonitorProps {
  className?: string;
  showAdvanced?: boolean;
}

const HealthStatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      case 'disconnected':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'degraded':
        return 'Degraded';
      case 'unhealthy':
        return 'Unhealthy';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
      <span className="text-sm font-medium capitalize">{getStatusText(status)}</span>
    </div>
  );
};

const HealthMetrics: React.FC<{ health: any }> = ({ health }) => {
  const formatUptime = (age: number) => {
    const minutes = Math.floor(age / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatLatency = (latency: number) => {
    if (latency < 1000) {
      return `${latency}ms`;
    } else {
      return `${(latency / 1000).toFixed(1)}s`;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Uptime</label>
        <span className="font-medium">{formatUptime(health.connectionAge)}</span>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Latency</label>
        <span className="font-medium">{formatLatency(health.networkLatency)}</span>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Last Check</label>
        <span className="font-medium">
          {new Date(health.lastCheck).toLocaleTimeString()}
        </span>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Error Count</label>
        <span className="font-medium">{health.errorCount}</span>
      </div>
    </div>
  );
};

const IssuesList: React.FC<{ issues: string[] }> = ({ issues }) => {
  if (issues.length === 0) {
    return (
      <div className="text-sm text-green-600">
        No issues detected
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {issues.map((issue, index) => (
        <div key={index} className="flex items-start gap-2 text-sm text-red-600">
          <span className="text-red-500 mt-0.5">•</span>
          <span>{issue}</span>
        </div>
      ))}
    </div>
  );
};

export const ConnectionHealthMonitor: React.FC<ConnectionHealthMonitorProps> = ({
  className,
  showAdvanced = false
}) => {
  const { isConnected } = useUser();
  const {
    health,
    isChecking,
    checkHealth,
    reconnect,
    getHealthSummary
  } = useConnectionHealth({
    checkInterval: 30000, // 30 seconds
    autoReconnect: true
  });

  const [showDetails, setShowDetails] = useState(showAdvanced);

  if (!isConnected) {
    return (
      <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Connection Health</h3>
          <HealthStatusIndicator status="disconnected" />
        </div>
        <p className="text-sm text-gray-500">
          Wallet not connected. Health monitoring will start when connected.
        </p>
      </div>
    );
  }

  const summary = getHealthSummary();

  return (
    <ErrorBoundary>
      <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">Connection Health</h3>
          <HealthStatusIndicator status={health.status} />
        </div>

        {/* Health Summary */}
        <div className="mb-4">
          <HealthMetrics health={health} />
        </div>

        {/* Issues */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-2">Current Issues</label>
          <IssuesList issues={health.issues} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={checkHealth}
            disabled={isChecking}
            variant="outline"
            size="sm"
            loading={isChecking}
          >
            {isChecking ? 'Checking...' : 'Check Health'}
          </Button>
          
          {summary.canReconnect && (
            <Button
              onClick={reconnect}
              variant="outline"
              size="sm"
            >
              Reconnect
            </Button>
          )}
          
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
            size="sm"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>

        {/* Advanced Details */}
        {showDetails && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Advanced Details</h4>
            
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Health Summary</label>
                <div className="bg-gray-50 p-3 rounded">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(summary, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Raw Health Data</label>
                <div className="bg-gray-50 p-3 rounded">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(health, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Connection Age</label>
                  <span className="font-medium">
                    {Math.floor(health.connectionAge / 1000 / 60)} minutes
                  </span>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Network Latency</label>
                  <span className="font-medium">{health.networkLatency}ms</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {health.status === 'degraded' && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Connection is experiencing issues. Some features may be limited.
            </p>
          </div>
        )}

        {health.status === 'unhealthy' && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Connection is unhealthy. Consider reconnecting or checking your network.
            </p>
          </div>
        )}

        {health.status === 'healthy' && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Connection is healthy and stable.
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

// Wrapper component with error boundary
export const ConnectionHealthMonitorWithErrorBoundary: React.FC<ConnectionHealthMonitorProps> = (props) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            Health Monitor Error
          </h3>
          <p className="text-sm text-red-700">
            Unable to display connection health information. Please refresh the page.
          </p>
        </div>
      }
    >
      <ConnectionHealthMonitor {...props} />
    </ErrorBoundary>
  );
};
