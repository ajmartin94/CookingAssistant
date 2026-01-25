import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

// Import mocked Sentry after the mock is set up
import * as Sentry from '@sentry/react';

// Component that throws an error for testing
const ThrowError = ({ error }: { error: Error }) => {
  throw error;
};

describe('ErrorBoundary', () => {
  // Suppress console.error during tests since we expect errors
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
    vi.clearAllMocks();
  });
  afterEach(() => {
    console.error = originalError;
  });

  describe('Error catching and fallback UI rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal content')).toBeInTheDocument();
    });

    it('should render fallback UI when a child component throws', () => {
      const testError = new Error('Test error message');

      render(
        <ErrorBoundary>
          <ThrowError error={testError} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
      expect(
        screen.getByText('We apologize for the inconvenience. An unexpected error has occurred.')
      ).toBeInTheDocument();
    });

    it('should display Try again and Reload page buttons in fallback UI', () => {
      const testError = new Error('Test error');

      render(
        <ErrorBoundary>
          <ThrowError error={testError} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument();
    });
  });

  describe('Custom fallback prop', () => {
    it('should render custom fallback when provided and error occurs', () => {
      const testError = new Error('Test error');
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError error={testError} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should render children normally when custom fallback is provided but no error', () => {
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal content')).toBeInTheDocument();
      expect(screen.queryByText('Custom error message')).not.toBeInTheDocument();
    });
  });

  describe('Reset functionality (Try again button)', () => {
    it('should allow retry by clicking Try again button', async () => {
      const user = userEvent.setup();
      const testError = new Error('Test error');

      // Use a stateful approach to simulate error recovery
      let shouldThrow = true;
      const TestComponent = () => {
        if (shouldThrow) {
          throw testError;
        }
        return <div>Recovered successfully</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      // Verify error state is shown
      expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();

      // Simulate fixing the error condition
      shouldThrow = false;

      // Click Try again
      await user.click(screen.getByRole('button', { name: 'Try again' }));

      // Re-render to reflect the state change
      rerender(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      // Verify recovery - child should render successfully now
      expect(screen.getByText('Recovered successfully')).toBeInTheDocument();
    });

    it('should reset error state when Try again is clicked', async () => {
      const user = userEvent.setup();
      const testError = new Error('Test error');

      render(
        <ErrorBoundary>
          <ThrowError error={testError} />
        </ErrorBoundary>
      );

      // Verify error state
      expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();

      // Click Try again - this will reset state and attempt to re-render children
      // Since ThrowError always throws, we'll see the error again
      await user.click(screen.getByRole('button', { name: 'Try again' }));

      // The error boundary should catch the error again
      expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    });
  });

  describe('Sentry error reporting', () => {
    it('should call Sentry.captureException when an error is caught', () => {
      const testError = new Error('Test error for Sentry');

      render(
        <ErrorBoundary>
          <ThrowError error={testError} />
        </ErrorBoundary>
      );

      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
      expect(Sentry.captureException).toHaveBeenCalledWith(testError, {
        extra: {
          componentStack: expect.any(String),
        },
      });
    });

    it('should pass component stack trace to Sentry', () => {
      const testError = new Error('Error with stack');

      render(
        <ErrorBoundary>
          <ThrowError error={testError} />
        </ErrorBoundary>
      );

      const sentryCall = vi.mocked(Sentry.captureException).mock.calls[0];
      expect(sentryCall[0]).toBe(testError);
      expect(sentryCall[1]).toHaveProperty('extra.componentStack');
      const context = sentryCall[1] as { extra?: { componentStack?: string } };
      expect(typeof context?.extra?.componentStack).toBe('string');
    });

    it('should report error only once per error occurrence', () => {
      const testError = new Error('Single report error');

      render(
        <ErrorBoundary>
          <ThrowError error={testError} />
        </ErrorBoundary>
      );

      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });
  });

  describe('Development-only error details', () => {
    it('should show error details in development mode', () => {
      // import.meta.env.DEV is true in test environment (Vitest)
      const testError = new Error('Detailed error message');
      testError.stack = 'Error: Detailed error message\n    at TestComponent';

      render(
        <ErrorBoundary>
          <ThrowError error={testError} />
        </ErrorBoundary>
      );

      // The details element should be present with summary
      const summary = screen.getByText('Error details (development only)');
      expect(summary).toBeInTheDocument();
    });

    it('should display error message and stack trace in details section', async () => {
      const user = userEvent.setup();
      const testError = new Error('Specific error for details');
      testError.stack = 'Error: Specific error for details\n    at Component';

      render(
        <ErrorBoundary>
          <ThrowError error={testError} />
        </ErrorBoundary>
      );

      // Click to expand details
      const summary = screen.getByText('Error details (development only)');
      await user.click(summary);

      // Verify error message is shown
      expect(screen.getByText(/Specific error for details/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure in fallback UI', () => {
      const testError = new Error('Test error');

      render(
        <ErrorBoundary>
          <ThrowError error={testError} />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { level: 1, name: 'Something went wrong' });
      expect(heading).toBeInTheDocument();
    });

    it('should have aria-hidden on decorative SVG icon', () => {
      const testError = new Error('Test error');

      const { container } = render(
        <ErrorBoundary>
          <ThrowError error={testError} />
        </ErrorBoundary>
      );

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
