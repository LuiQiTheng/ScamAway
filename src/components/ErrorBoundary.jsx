import React from 'react';
import { ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react';

/**
 * [ARCH-03] React Error Boundary
 * Catches unhandled runtime errors in chart renders (Recharts), TTS, or any child
 * component tree and displays a friendly fallback card instead of a white screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
    this.handleReset = this.handleReset.bind(this);
    this.toggleDetails = this.toggleDetails.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught unhandled error:', error, errorInfo);
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  }

  toggleDetails() {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo, showDetails } = this.state;
    const isDev = typeof process !== 'undefined' && process.env?.MODE === 'development';

    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '2rem',
        }}
      >
        <div
          className="glass-panel fade-in"
          style={{
            width: '100%',
            maxWidth: '520px',
            padding: '2.5rem 2rem',
            borderRadius: '20px',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            background: 'rgba(15, 23, 42, 0.96)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={32} color="#ef4444" />
          </div>

          {/* Title */}
          <div>
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
                marginBottom: '0.5rem',
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              This section encountered an unexpected error. Your data is safe — click{' '}
              <strong style={{ color: 'var(--primary)' }}>Reload View</strong> to try again.
            </p>
          </div>

          {/* Reload button */}
          <button
            onClick={this.handleReset}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1.75rem',
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            <RefreshCw size={17} />
            Reload View
          </button>

          {/* Dev error details */}
          {(isDev || import.meta.env?.DEV) && error && (
            <div style={{ width: '100%', textAlign: 'left' }}>
              <button
                onClick={this.toggleDetails}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                {showDetails ? '▲ Hide' : '▼ Show'} technical details
              </button>
              {showDetails && (
                <pre
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    color: '#fca5a5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  {error?.toString()}
                  {errorInfo?.componentStack}
                </pre>
              )}
            </div>
          )}

          {/* Branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
            }}
          >
            <ShieldAlert size={13} color="var(--primary)" />
            Scam Away — Protected by Error Boundary
          </div>
        </div>
      </div>
    );
  }
}
