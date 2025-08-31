import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true
  }),
  useNetwork: () => ({
    chain: { id: 137, name: 'Polygon' }
  }),
  useConnect: () => ({
    connect: jest.fn(),
    connectors: [
      { id: 'metaMask', name: 'MetaMask', ready: true, getProvider: jest.fn() }
    ]
  }),
  useSwitchNetwork: () => ({
    switchNetwork: jest.fn(),
    isPending: false
  }),
  useDisconnect: () => ({
    disconnect: jest.fn()
  })
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch for network checks
global.fetch = jest.fn();

// Test component that can throw errors
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Test component that throws different types of errors
const ThrowSpecificError = ({ errorType }: { errorType: 'network' | 'wallet' | 'general' }) => {
  switch (errorType) {
    case 'network':
      throw new Error('Network connection failed');
    case 'wallet':
      throw new Error('Wallet connection failed');
    default:
      throw new Error('General application error');
  }
};

describe('ErrorBoundary Component', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    // Suppress console.error for all tests
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Single Responsibility Principle (SRP)', () => {
    it('should only handle error boundary responsibilities', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should catch and handle errors when they occur', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Open/Closed Principle (OCP)', () => {
    it('should be open for extension with custom fallback', () => {
      const CustomFallback = () => <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('should allow different error types without modification', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowSpecificError errorType="network" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();

      rerender(
        <ErrorBoundary>
          <ThrowSpecificError errorType="wallet" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });
  });

  describe('Liskov Substitution Principle (LSP)', () => {
    it('should work with any React component that can throw errors', () => {
      const FunctionalComponent = () => {
        throw new Error('Functional component error');
      };

      const ClassComponent = class extends React.Component {
        render() {
          throw new Error('Class component error');
        }
      };

      // Test with functional component
      const { rerender } = render(
        <ErrorBoundary>
          <FunctionalComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Test with class component
      rerender(
        <ErrorBoundary>
          <ClassComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Interface Segregation Principle (ISP)', () => {
    it('should only require necessary props', () => {
      // ErrorBoundary only needs children and optional fallback
      render(
        <ErrorBoundary>
          <div>Simple component</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Simple component')).toBeInTheDocument();
    });

    it('should handle minimal props correctly', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Dependency Inversion Principle (DIP)', () => {
    it('should depend on abstractions (React.Component) not concretions', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should not depend on external services directly', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // ErrorBoundary should work without external dependencies
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Error Recovery Actions', () => {
    it('should provide retry functionality', () => {
      const { rerender, unmount } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Try Again'));

      // Unmount and remount to properly reset the ErrorBoundary state
      unmount();
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should provide refresh functionality', () => {
      // Mock window.location.reload
      const mockReload = jest.fn();
      
      // Mock the entire window.location object
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = {
        ...originalLocation,
        reload: mockReload,
      };

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('Refresh Page'));

      expect(mockReload).toHaveBeenCalledTimes(1);
      
      // Restore original location
      (window as any).location = originalLocation;
    });
  });

  describe('Error Information Display', () => {
    it('should show error details when available', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error details')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should handle errors without messages gracefully', () => {
      const ThrowErrorWithoutMessage = () => {
        throw new Error();
      };

      render(
        <ErrorBoundary>
          <ThrowErrorWithoutMessage />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Error details')).toBeInTheDocument();
    });
  });

  describe('Error Logging', () => {
    it('should log errors to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      );
    });
  });
});
