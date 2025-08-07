'use client';

import { useState, useCallback } from 'react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface BlogError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

interface UseBlogErrorReturn {
  error: BlogError | null;
  setError: (error: BlogError | string | null) => void;
  clearError: () => void;
  handleError: (error: any) => void;
  isNetworkError: (error: BlogError) => boolean;
  isAuthError: (error: BlogError) => boolean;
  isValidationError: (error: BlogError) => boolean;
  isNotFoundError: (error: BlogError) => boolean;
  isServerError: (error: BlogError) => boolean;
  formatErrorMessage: (error: BlogError) => string;
  getErrorSeverity: (error: BlogError) => 'low' | 'medium' | 'high';
}

// =============================================================================
// ERROR CONSTANTS
// =============================================================================

// Common blog error messages
export const BLOG_ERRORS = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You need to be logged in to perform this action.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested blog post was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  
  // Blog-specific errors
  POST_NOT_FOUND: 'Blog post not found. It may have been deleted or moved.',
  COMMENT_NOT_FOUND: 'Comment not found. It may have been deleted.',
  SLUG_EXISTS: 'A blog post with this URL already exists. Please choose a different title.',
  CONTENT_TOO_LONG: 'Content exceeds maximum length limit (50,000 characters).',
  CONTENT_TOO_SHORT: 'Content is too short. Please provide at least 10 characters.',
  TITLE_TOO_LONG: 'Title exceeds maximum length limit (200 characters).',
  TITLE_TOO_SHORT: 'Title is too short. Please provide at least 5 characters.',
  INVALID_CATEGORY: 'Invalid category selected.',
  TOO_MANY_TAGS: 'Too many tags. Maximum 10 tags allowed.',
  TAG_TOO_LONG: 'Tag exceeds maximum length limit (50 characters).',
  INVALID_STATUS: 'Invalid post status. Must be draft, published, or archived.',
  INVALID_IMAGE_URL: 'Invalid image URL format.',
  EXCERPT_TOO_LONG: 'Excerpt exceeds maximum length limit (500 characters).',
  COMMENT_TOO_LONG: 'Comment exceeds maximum length limit (2,000 characters).',
  COMMENT_EMPTY: 'Comment cannot be empty.',
  MODERATOR_REQUIRED: 'Only moderators can create blog posts.',
  AUTHOR_REQUIRED: 'Only the author or a moderator can edit this post.',
  PUBLISHED_DATE_INVALID: 'Invalid publication date format.',
  SLUG_INVALID: 'Invalid URL format. Use only lowercase letters, numbers, and hyphens.',
} as const;

// =============================================================================
// ERROR TYPE CHECKING UTILITIES
// =============================================================================

export const isNetworkError = (error: BlogError): boolean => {
  return !error.statusCode || 
         error.message.toLowerCase().includes('network') ||
         error.message.toLowerCase().includes('fetch') ||
         error.message.toLowerCase().includes('connection');
};

export const isAuthError = (error: BlogError): boolean => {
  return error.statusCode === 401 || 
         error.statusCode === 403 ||
         error.code === 'UNAUTHORIZED' ||
         error.code === 'FORBIDDEN';
};

export const isValidationError = (error: BlogError): boolean => {
  return error.statusCode === 400 ||
         error.code === 'VALIDATION_ERROR' ||
         error.message.toLowerCase().includes('validation');
};

export const isNotFoundError = (error: BlogError): boolean => {
  return error.statusCode === 404 ||
         error.code === 'NOT_FOUND' ||
         error.message.toLowerCase().includes('not found');
};

export const isServerError = (error: BlogError): boolean => {
  return (error.statusCode && error.statusCode >= 500) ||
         error.code === 'SERVER_ERROR' ||
         error.code === 'INTERNAL_ERROR';
};

export const isRateLimitError = (error: BlogError): boolean => {
  return error.statusCode === 429 ||
         error.code === 'RATE_LIMITED' ||
         error.message.toLowerCase().includes('rate limit');
};

// =============================================================================
// ERROR FORMATTING UTILITIES
// =============================================================================

export const formatErrorMessage = (error: BlogError): string => {
  // Check for specific error codes first
  if (error.code && BLOG_ERRORS[error.code as keyof typeof BLOG_ERRORS]) {
    return BLOG_ERRORS[error.code as keyof typeof BLOG_ERRORS];
  }

  // Check for common HTTP status codes
  switch (error.statusCode) {
    case 400:
      return BLOG_ERRORS.VALIDATION_ERROR;
    case 401:
      return BLOG_ERRORS.UNAUTHORIZED;
    case 403:
      return BLOG_ERRORS.FORBIDDEN;
    case 404:
      return BLOG_ERRORS.NOT_FOUND;
    case 409:
      return BLOG_ERRORS.SLUG_EXISTS;
    case 429:
      return BLOG_ERRORS.RATE_LIMITED;
    case 500:
    case 502:
    case 503:
    case 504:
      return BLOG_ERRORS.SERVER_ERROR;
    default:
      break;
  }

  // Check for specific error message patterns
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return BLOG_ERRORS.NETWORK_ERROR;
  }
  
  if (message.includes('not found')) {
    return BLOG_ERRORS.NOT_FOUND;
  }
  
  if (message.includes('unauthorized') || message.includes('authentication')) {
    return BLOG_ERRORS.UNAUTHORIZED;
  }
  
  if (message.includes('forbidden') || message.includes('permission')) {
    return BLOG_ERRORS.FORBIDDEN;
  }

  // Return original message if no pattern matches
  return error.message || 'An unexpected error occurred';
};

export const getErrorSeverity = (error: BlogError): 'low' | 'medium' | 'high' => {
  if (isNetworkError(error)) return 'medium';
  if (isAuthError(error)) return 'high';
  if (isValidationError(error)) return 'low';
  if (isServerError(error)) return 'high';
  if (isRateLimitError(error)) return 'medium';
  return 'medium';
};

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export const useBlogError = (): UseBlogErrorReturn => {
  const [error, setErrorState] = useState<BlogError | null>(null);

  const setError = useCallback((error: BlogError | string | null) => {
    if (error === null) {
      setErrorState(null);
    } else if (typeof error === 'string') {
      setErrorState({ message: error });
    } else {
      setErrorState(error);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('Blog error:', error);
    
    if (error && typeof error === 'object') {
      // Handle API error format
      if (error.error && error.error.message) {
        setError({
          message: error.error.message,
          code: error.error.code,
          statusCode: error.error.statusCode,
          details: error,
        });
      } else if (error.message) {
        // Handle Error object
        setError({
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          details: error,
        });
      } else {
        // Handle unknown error format
        setError({
          message: 'An unexpected error occurred',
          details: error,
        });
      }
    } else if (typeof error === 'string') {
      setError({ message: error });
    } else {
      setError({ message: 'An unexpected error occurred' });
    }
  }, [setError]);

  return {
    error,
    setError,
    clearError,
    handleError,
    isNetworkError,
    isAuthError,
    isValidationError,
    isNotFoundError,
    isServerError,
    formatErrorMessage,
    getErrorSeverity,
  };
};

export default useBlogError;
