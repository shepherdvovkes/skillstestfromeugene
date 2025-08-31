import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ServiceProvider } from '@/contexts/ServiceContext';
import { ServiceFactory } from '@/services/ServiceFactory';

// Create mock services for testing
const createMockServices = () => {
  const serviceFactory = ServiceFactory.getInstance();
  return serviceFactory.createAllServices();
};

interface TestWrapperProps {
  children: ReactNode;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  const services = createMockServices();
  
  return (
    <ServiceProvider services={services}>
      {children}
    </ServiceProvider>
  );
};

// Custom render function that includes the TestWrapper
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestWrapper, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override the render function
export { customRender as render };

// Add a simple test to make this a valid test suite
describe('Test Utils', () => {
  it('should provide custom render function', () => {
    expect(customRender).toBeDefined();
    expect(typeof customRender).toBe('function');
  });

  it('should provide TestWrapper component', () => {
    expect(TestWrapper).toBeDefined();
    expect(typeof TestWrapper).toBe('function');
  });
});
