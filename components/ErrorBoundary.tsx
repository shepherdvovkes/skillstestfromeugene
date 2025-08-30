import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <h3 className="text-lg font-semibold text-red-800">
              Something went wrong
            </h3>
          </div>
          
          <p className="text-sm text-red-700 mb-4">
            An unexpected error occurred. This might be related to wallet connection issues.
          </p>
          
          {this.state.error && (
            <details className="mb-4">
              <summary className="text-sm text-red-600 cursor-pointer">
                Error details
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={this.handleRetry}
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
            <Button
              onClick={this.handleRefresh}
              variant="default"
              size="sm"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
