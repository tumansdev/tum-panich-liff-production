import React from 'react';
import { Icon, Button } from './index';

class ErrorBoundary extends React.Component {
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
      errorInfo: errorInfo
    });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background-light flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Icon name="error_outline" className="text-5xl text-red-500" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">
            เกิดข้อผิดพลาด
          </h1>

          <p className="text-gray-500 mb-6 max-w-xs">
            แอปพลิเคชันพบปัญหาบางอย่าง กรุณาลองใหม่อีกครั้ง
          </p>

          <Button
            onClick={this.handleReload}
            variant="primary"
            icon="refresh"
          >
            โหลดหน้าใหม่
          </Button>

          {/* Show error details in development */}
          {import.meta.env.DEV && this.state.error && (
            <div className="mt-8 p-4 bg-gray-100 rounded-xl text-left w-full max-w-md overflow-auto">
              <p className="text-sm font-mono text-red-600">
                {this.state.error.toString()}
              </p>
              <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
