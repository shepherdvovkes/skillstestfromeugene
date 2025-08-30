import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('UI Components', () => {
  describe('Button Component', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });

    it('applies variant styles correctly', () => {
      const { rerender } = render(<Button variant="default">Default</Button>);
      
      let button = screen.getByRole('button', { name: 'Default' });
      expect(button).toHaveClass('bg-blue-600', 'text-white');
      
      rerender(<Button variant="destructive">Destructive</Button>);
      button = screen.getByRole('button', { name: 'Destructive' });
      expect(button).toHaveClass('bg-red-600', 'text-white');
      
      rerender(<Button variant="outline">Outline</Button>);
      button = screen.getByRole('button', { name: 'Outline' });
      expect(button).toHaveClass('border', 'border-gray-300', 'bg-transparent');
      
      rerender(<Button variant="ghost">Ghost</Button>);
      button = screen.getByRole('button', { name: 'Ghost' });
      expect(button).toHaveClass('hover:bg-gray-100');
    });

    it('applies size styles correctly', () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      
      let button = screen.getByRole('button', { name: 'Small' });
      expect(button).toHaveClass('h-8', 'px-3', 'text-xs');
      
      rerender(<Button size="md">Medium</Button>);
      button = screen.getByRole('button', { name: 'Medium' });
      expect(button).toHaveClass('h-10', 'px-4');
    });

    it('handles click events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button', { name: 'Click me' });
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button', { name: 'Disabled' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('applies loading state', () => {
      render(<Button loading>Loading</Button>);
      
      const button = screen.getByRole('button', { name: 'Loading' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none');
    });

    it('shows loading spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      
      const button = screen.getByRole('button', { name: 'Loading' });
      const spinner = button.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('combines multiple props correctly', () => {
      const handleClick = jest.fn();
      render(
        <Button 
          variant="destructive" 
          size="lg" 
          disabled 
          onClick={handleClick}
          className="custom-class"
        >
          Complex Button
        </Button>
      );
      
      const button = screen.getByRole('button', { name: 'Complex Button' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('bg-red-600', 'text-white');
      expect(button).toHaveClass('h-12', 'px-6');
      expect(button).toHaveClass('custom-class');
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled(); // Should not call when disabled
    });

    it('handles loading timeout', async () => {
      jest.useFakeTimers();
      const loggerSpy = jest.spyOn(require('@/utils/logger').logger, 'warn').mockImplementation(() => {});
      
      render(<Button loading loadingTimeout={1000}>Timeout Test</Button>);
      
      const button = screen.getByRole('button', { name: 'Timeout Test' });
      expect(button).toBeDisabled();
      
      // Fast-forward time to trigger timeout
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(loggerSpy).toHaveBeenCalledWith('Button loading state timeout - auto-resetting');
      
      jest.useRealTimers();
      loggerSpy.mockRestore();
    });

    it('syncs external loading state', () => {
      const { rerender } = render(<Button loading={false}>Sync Test</Button>);
      
      let button = screen.getByRole('button', { name: 'Sync Test' });
      expect(button).not.toBeDisabled();
      
      rerender(<Button loading={true}>Sync Test</Button>);
      button = screen.getByRole('button', { name: 'Sync Test' });
      expect(button).toBeDisabled();
      
      rerender(<Button loading={false}>Sync Test</Button>);
      button = screen.getByRole('button', { name: 'Sync Test' });
      expect(button).not.toBeDisabled();
    });
  });
});
