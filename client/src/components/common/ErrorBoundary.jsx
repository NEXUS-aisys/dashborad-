import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[200px] p-6">
          <div className="text-center">
            <div className="text-2xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              Component Loading Error
            </h3>
            <p className="text-[var(--text-secondary)] mb-4">
              There was an issue loading this component. This might be due to:
            </p>
            <ul className="text-sm text-[var(--text-secondary)] mb-4 text-left max-w-md mx-auto">
              <li>• Network connectivity issues</li>
              <li>• Missing dependencies</li>
              <li>• Temporary server issues</li>
            </ul>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary)]/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;