'use client';

import { useState, useCallback } from 'react';

interface ForumError {
  message: string;
  code?: string;
  details?: any;
}

interface UseForumErrorReturn {
  error: ForumError | null;
  isError: boolean;
  setError: (error: ForumError | string | null) => void;
  clearError: () => void;
  handleError: (error: any) => void;
  retryCount: number;
  incrementRetry: () => void;
  resetRetry: () => void;
}

export const useForumError = (): UseForumErrorReturn => {
  const [error, setErrorState] = useState<ForumError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const setError = useCallback((error: ForumError | string | null) => {
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
    console.error('Forum error:', error);

    if (error?.response?.data?.message) {
      // API error with structured response
      setError({
        message: error.response.data.message,
        code: error.response.data.code,
        details: error.response.data.details,
      });
    } else if (error?.message) {
      // Standard error object
      setError({
        message: error.message,
        code: error.code,
        details: error,
      });
    } else if (typeof error === 'string') {
      // String error
      setError({ message: error });
    } else {
      // Unknown error
      setError({ 
        message: 'An unexpected error occurred',
        details: error,
      });
    }
  }, [setError]);

  const incrementRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  const resetRetry = useCallback(() => {
    setRetryCount(0);
  }, []);

  return {
    error,
    isError: error !== null,
    setError,
    clearError,
    handleError,
    retryCount,
    incrementRetry,
    resetRetry,
  };
};

// Common error messages
export const FORUM_ERRORS = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You need to be logged in to perform this action.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested content was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  THREAD_LOCKED: 'This thread is locked and cannot be modified.',
  CONTENT_TOO_LONG: 'Content exceeds maximum length limit.',
  CONTENT_TOO_SHORT: 'Content is too short. Please provide more details.',
  INVALID_FORMAT: 'Invalid content format. Please check your input.',
} as const;

// Error type guards
export const isNetworkError = (error: any): boolean => {
  return error?.code === 'NETWORK_ERROR' || 
         error?.message?.includes('network') ||
         error?.message?.includes('fetch');
};

export const isAuthError = (error: any): boolean => {
  return error?.code === 'UNAUTHORIZED' || 
         error?.code === 'FORBIDDEN' ||
         error?.status === 401 ||
         error?.status === 403;
};

export const isValidationError = (error: any): boolean => {
  return error?.code === 'VALIDATION_ERROR' ||
         error?.status === 400;
};

// Error formatting utilities
export const formatErrorMessage = (error: ForumError): string => {
  if (error.code && FORUM_ERRORS[error.code as keyof typeof FORUM_ERRORS]) {
    return FORUM_ERRORS[error.code as keyof typeof FORUM_ERRORS];
  }
  return error.message || 'An unexpected error occurred';
};

export const getErrorSeverity = (error: ForumError): 'low' | 'medium' | 'high' => {
  if (isNetworkError(error)) return 'medium';
  if (isAuthError(error)) return 'high';
  if (isValidationError(error)) return 'low';
  return 'medium';
};

export default useForumError;
