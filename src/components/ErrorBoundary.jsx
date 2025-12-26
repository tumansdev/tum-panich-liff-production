/**
 * Error Boundary Component
 * Catches JavaScript errors and displays a friendly error page
 */

import React, { Component } from 'react';
import { Icon, Button } from './common';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);

    // TODO: Send to error tracking service in production
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Try to reload the component
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI passed as prop
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background-light flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <Icon name="error_outline" className="text-5xl text-red-500" />
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              เกิดข้อผิดพลาด
            </h1>
            <p className="text-gray-500 mb-6">
              ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button onClick={this.handleRetry} variant="primary" icon="refresh">
                ลองใหม่
              </Button>
              <Button onClick={this.handleReload} variant="outline" icon="restart_alt">
                โหลดหน้าใหม่
              </Button>
              <button
                onClick={this.handleGoHome}
                className="text-primary font-medium py-2"
              >
                กลับหน้าหลัก
              </button>
            </div>

            {/* Error details (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left bg-gray-100 rounded-xl p-4">
                <summary className="cursor-pointer text-sm text-gray-600 font-medium">
                  รายละเอียด Error (Developer)
                </summary>
                <pre className="mt-2 text-xs text-red-600 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for easier use
 */
export function withErrorBoundary(Component, fallback = null) {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
