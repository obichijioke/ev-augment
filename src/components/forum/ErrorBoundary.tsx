'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Forum Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Oops! Something went wrong
            </h2>
            
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error while loading the forum. 
              This has been logged and we'll look into it.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Error Details:</h3>
                <p className="text-sm text-gray-700 font-mono">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              
              <Link
                href="/forums"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Forums
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading State Component
export const ForumLoading: React.FC<{ message?: string }> = ({ 
  message = "Loading forum content..." 
}) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Error State Component
export const ForumError: React.FC<{ 
  message?: string; 
  onRetry?: () => void;
  showRetry?: boolean;
}> = ({ 
  message = "Failed to load forum content", 
  onRetry,
  showRetry = true 
}) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <AlertTriangle className="h-8 w-8 text-red-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Content</h3>
    <p className="text-gray-600 mb-4">{message}</p>
    {showRetry && onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </button>
    )}
  </div>
);

// Empty State Component
export const ForumEmpty: React.FC<{ 
  title?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
}> = ({ 
  title = "No content found",
  message = "There's nothing here yet.",
  actionLabel,
  actionHref
}) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <AlertTriangle className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-4">{message}</p>
    {actionLabel && actionHref && (
      <Link
        href={actionHref}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        {actionLabel}
      </Link>
    )}
  </div>
);

export default ErrorBoundary;
