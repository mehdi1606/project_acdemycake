import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to error tracking service when integrated (PROD-2)
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="d-flex flex-column align-items-center justify-content-center"
             style={{ minHeight: '50vh', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
          <i className="ti ti-alert-circle" style={{ fontSize: '3rem', color: '#dc3545' }} />
          <h4>Something went wrong</h4>
          <p className="text-muted">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={this.handleReset}>
              Try again
            </button>
            <Link to="/" className="btn btn-outline-secondary">
              Go home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
