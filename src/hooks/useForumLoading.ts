'use client';

import { useState, useCallback } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface UseForumLoadingReturn {
  isLoading: boolean;
  loadingStates: LoadingState;
  setLoading: (key: string, loading: boolean) => void;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  isLoadingKey: (key: string) => boolean;
  clearAllLoading: () => void;
  withLoading: <T>(key: string, asyncFn: () => Promise<T>) => Promise<T>;
}

export const useForumLoading = (): UseForumLoadingReturn => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading,
    }));
  }, []);

  const startLoading = useCallback((key: string) => {
    setLoading(key, true);
  }, [setLoading]);

  const stopLoading = useCallback((key: string) => {
    setLoading(key, false);
  }, [setLoading]);

  const isLoadingKey = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  const withLoading = useCallback(async <T>(
    key: string, 
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    try {
      startLoading(key);
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  const isLoading = Object.values(loadingStates).some(Boolean);

  return {
    isLoading,
    loadingStates,
    setLoading,
    startLoading,
    stopLoading,
    isLoadingKey,
    clearAllLoading,
    withLoading,
  };
};

// Common loading keys
export const LOADING_KEYS = {
  CATEGORIES: 'categories',
  THREADS: 'threads',
  THREAD_DETAIL: 'threadDetail',
  CREATE_THREAD: 'createThread',
  CREATE_REPLY: 'createReply',
  UPDATE_THREAD: 'updateThread',
  UPDATE_REPLY: 'updateReply',
  DELETE_THREAD: 'deleteThread',
  DELETE_REPLY: 'deleteReply',
  VOTE: 'vote',
  SEARCH: 'search',
} as const;

export default useForumLoading;
