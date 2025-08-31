"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  AlertTriangle,
  RefreshCw,
  BookOpen,
  FileText,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// =============================================================================
// ERROR BOUNDARY COMPONENT
// =============================================================================

class BlogErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Blog Error Boundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
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
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We encountered an error while loading the blog content. Please try
              refreshing the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              <Link
                href="/blog"
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Back to Blog
              </Link>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.stack}
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

// =============================================================================
// LOADING COMPONENTS
// =============================================================================

// General blog loading component
export const BlogLoading: React.FC<{ message?: string }> = ({
  message = "Loading blog content...",
}) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-300">{message}</p>
    </div>
  </div>
);

// Blog post loading skeleton
export const BlogPostLoading: React.FC = () => (
  <div className="max-w-4xl mx-auto p-6 animate-pulse">
    {/* Header skeleton */}
    <div className="mb-8">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
    </div>

    {/* Content skeleton */}
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  </div>
);

// Blog list loading skeleton
export const BlogListLoading: React.FC = () => (
  <div className="space-y-6">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
      >
        <div className="flex space-x-4">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Comment loading skeleton
export const BlogCommentsLoading: React.FC = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="flex space-x-3">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// =============================================================================
// ERROR COMPONENTS
// =============================================================================

// General blog error component
export const BlogError: React.FC<{
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}> = ({
  message = "Failed to load blog content",
  onRetry,
  showRetry = true,
}) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
      <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      Error Loading Content
    </h3>
    <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
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

// Blog post not found component
export const BlogPostNotFound: React.FC = () => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
      <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      Blog Post Not Found
    </h3>
    <p className="text-gray-600 dark:text-gray-300 mb-4">
      The blog post you're looking for doesn't exist or may have been removed.
    </p>
    <Link
      href="/blog"
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
    >
      <BookOpen className="h-4 w-4 mr-2" />
      Browse All Posts
    </Link>
  </div>
);

// Empty blog state component
export const BlogEmpty: React.FC<{
  title?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
}> = ({
  title = "No blog posts found",
  message = "There are no blog posts to display yet.",
  actionLabel,
  actionHref,
}) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
      <BookOpen className="h-8 w-8 text-gray-400 dark:text-gray-500" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
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

// Comments empty state
export const BlogCommentsEmpty: React.FC<{
  onAddComment?: () => void;
}> = ({ onAddComment }) => (
  <div className="text-center py-8">
    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
      <MessageSquare className="h-6 w-6 text-gray-400 dark:text-gray-500" />
    </div>
    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
      No comments yet
    </h4>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
      Be the first to share your thoughts!
    </p>
    {onAddComment && (
      <button
        onClick={onAddComment}
        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
      >
        Add a comment
      </button>
    )}
  </div>
);

export default BlogErrorBoundary;
