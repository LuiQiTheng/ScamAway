import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ErrorBoundary from '../components/ErrorBoundary';

// Component that throws on demand
const BrokenComponent = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test render error: chart crash');
  }
  return <div data-testid="ok-child">All good</div>;
};

// Suppress React's error boundary console noise in tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('[ARCH-03] ErrorBoundary', () => {
  it('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('ok-child')).toBeInTheDocument();
    expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
  });

  it('catches a render error and displays the fallback card', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload View/i })).toBeInTheDocument();
    expect(screen.queryByTestId('ok-child')).not.toBeInTheDocument();
  });

  it('resets the error state when "Reload View" is clicked', async () => {
    // Control which render should throw via a ref
    let shouldThrow = true;

    const Fixture = () => {
      const [key, setKey] = React.useState(0);
      const [throws, setThrows] = React.useState(true);
      return (
        <ErrorBoundary
          key={key}
          onReset={() => {
            // When boundary resets, stop throwing and re-key to remount
            setThrows(false);
            setKey(k => k + 1);
          }}
        >
          <BrokenComponent shouldThrow={throws} />
        </ErrorBoundary>
      );
    };

    render(<Fixture />);

    // Error UI is showing
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

    // Click "Reload View" — onReset sets throws=false + remounts boundary
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Reload View/i }));
    });

    // Now the boundary is fresh (remounted) and child doesn't throw
    expect(screen.getByTestId('ok-child')).toBeInTheDocument();
    expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
  });

  it('calls the onReset callback when Reload View is clicked', () => {
    const onReset = vi.fn();
    render(
      <ErrorBoundary onReset={onReset}>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByRole('button', { name: /Reload View/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('has an accessible alert role on the fallback', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
