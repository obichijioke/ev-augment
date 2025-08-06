'use client';

import { useState, useCallback, useEffect } from 'react';
import { BlogPost } from '@/types/blog';
import { blogPostsApi, blogSearchApi, blogCategoriesApi, blogTagsApi } from '@/services/blogApi';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface BlogFilters {
  category?: string;
  tag?: string;
  author?: string;
  status?: string;
  q?: string;
}

interface BlogSortOptions {
  sort?: string;
  sortBy?: string;
}

interface BlogPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UseBlogOptions {
  initialFilters?: BlogFilters;
  initialSort?: BlogSortOptions;
  initialPage?: number;
  initialLimit?: number;
  autoLoad?: boolean;
}

interface UseBlogReturn {
  // Data
  posts: BlogPost[];
  categories: Array<{ name: string; post_count: number }>;
  tags: Array<{ name: string; post_count: number }>;
  pagination: BlogPagination;
  
  // State
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  
  // Filters and sorting
  filters: BlogFilters;
  sortOptions: BlogSortOptions;
  
  // Actions
  loadPosts: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadTags: () => Promise<void>;
  searchPosts: (query: string) => Promise<void>;
  setFilters: (filters: Partial<BlogFilters>) => void;
  setSortOptions: (sort: Partial<BlogSortOptions>) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  clearFilters: () => void;
  clearError: () => void;
  refresh: () => Promise<void>;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export const useBlog = (options: UseBlogOptions = {}): UseBlogReturn => {
  const {
    initialFilters = {},
    initialSort = { sort: 'desc', sortBy: 'published_at' },
    initialPage = 1,
    initialLimit = 20,
    autoLoad = true,
  } = options;

  // State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Array<{ name: string; post_count: number }>>([]);
  const [tags, setTags] = useState<Array<{ name: string; post_count: number }>>([]);
  const [pagination, setPagination] = useState<BlogPagination>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<BlogFilters>(initialFilters);
  const [sortOptions, setSortOptionsState] = useState<BlogSortOptions>(initialSort);

  // Error handling
  const handleError = useCallback((err: any) => {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    setError(errorMessage);
    console.error('Blog hook error:', err);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load posts
  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...sortOptions,
      };

      const response = await blogPostsApi.getAll(params);
      setPosts(response.posts);
      setPagination(response.pagination);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, sortOptions, handleError, clearError]);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await blogCategoriesApi.getAll();
      setCategories(categoriesData);
    } catch (err) {
      console.warn('Failed to load categories:', err);
    }
  }, []);

  // Load tags
  const loadTags = useCallback(async () => {
    try {
      const tagsData = await blogTagsApi.getAll();
      setTags(tagsData);
    } catch (err) {
      console.warn('Failed to load tags:', err);
    }
  }, []);

  // Search posts
  const searchPosts = useCallback(async (query: string) => {
    if (!query.trim()) {
      // If empty query, load regular posts
      await loadPosts();
      return;
    }

    try {
      setIsSearching(true);
      clearError();

      const params = {
        q: query,
        page: pagination.page,
        limit: pagination.limit,
        category: filters.category,
        tag: filters.tag,
      };

      const response = await blogSearchApi.search(params);
      setPosts(response.posts);
      setPagination(response.pagination);
    } catch (err) {
      handleError(err);
    } finally {
      setIsSearching(false);
    }
  }, [pagination.page, pagination.limit, filters.category, filters.tag, loadPosts, handleError, clearError]);

  // Filter and sorting actions
  const setFilters = useCallback((newFilters: Partial<BlogFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filtering
  }, []);

  const setSortOptions = useCallback((newSort: Partial<BlogSortOptions>) => {
    setSortOptionsState(prev => ({ ...prev, ...newSort }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when sorting
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 })); // Reset to first page when changing limit
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      loadPosts(),
      loadCategories(),
      loadTags(),
    ]);
  }, [loadPosts, loadCategories, loadTags]);

  // Auto-load on mount and when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadPosts();
    }
  }, [autoLoad, loadPosts]);

  // Load categories and tags on mount
  useEffect(() => {
    if (autoLoad) {
      loadCategories();
      loadTags();
    }
  }, [autoLoad, loadCategories, loadTags]);

  return {
    // Data
    posts,
    categories,
    tags,
    pagination,
    
    // State
    isLoading,
    isSearching,
    error,
    
    // Filters and sorting
    filters,
    sortOptions,
    
    // Actions
    loadPosts,
    loadCategories,
    loadTags,
    searchPosts,
    setFilters,
    setSortOptions,
    setPage,
    setLimit,
    clearFilters,
    clearError,
    refresh,
  };
};

export default useBlog;
