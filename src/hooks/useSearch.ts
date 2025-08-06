// =============================================================================
// Search Hook
// =============================================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  SearchFilters, 
  SearchResponse, 
  searchForumContent, 
  getSearchSuggestions,
  saveSearch,
  getSavedSearches,
  SearchSuggestion
} from '@/services/searchApi';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface UseSearchOptions {
  initialFilters?: SearchFilters;
  autoSearch?: boolean;
  debounceMs?: number;
  saveSearches?: boolean;
  onSearchComplete?: (response: SearchResponse) => void;
  onSearchError?: (error: string) => void;
}

interface UseSearchReturn {
  // State
  searchResponse: SearchResponse | null;
  filters: SearchFilters;
  isLoading: boolean;
  error: string | null;
  suggestions: SearchSuggestion[];
  savedSearches: Array<{ id: string; query: string; filters: SearchFilters; created_at: string }>;
  
  // Actions
  search: (newFilters?: SearchFilters, page?: number) => Promise<void>;
  updateFilters: (newFilters: Partial<SearchFilters>) => void;
  clearSearch: () => void;
  clearError: () => void;
  getSuggestions: (query: string) => Promise<void>;
  saveCurrentSearch: () => Promise<void>;
  loadSavedSearches: () => Promise<void>;
  
  // Pagination
  currentPage: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  
  // Utilities
  hasResults: boolean;
  totalResults: number;
  searchTime: number;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    initialFilters = {},
    autoSearch = false,
    debounceMs = 500,
    saveSearches = true,
    onSearchComplete,
    onSearchError,
  } = options;

  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [savedSearches, setSavedSearches] = useState<Array<{ id: string; query: string; filters: SearchFilters; created_at: string }>>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const debounceRef = useRef<NodeJS.Timeout>();
  const lastSearchRef = useRef<string>('');

  // Auto-search when filters change (if enabled)
  useEffect(() => {
    if (!autoSearch || !filters.query) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const searchKey = JSON.stringify(filters);
      if (searchKey !== lastSearchRef.current) {
        search(filters, 1);
        lastSearchRef.current = searchKey;
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filters, autoSearch, debounceMs]);

  // Search function
  const search = useCallback(async (newFilters?: SearchFilters, page: number = 1) => {
    const searchFilters = newFilters || filters;
    
    if (!searchFilters.query && !hasActiveFilters(searchFilters)) {
      setSearchResponse(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentPage(page);

    try {
      const response = await searchForumContent(searchFilters, page);
      setSearchResponse(response);
      onSearchComplete?.(response);

      // Save search if enabled and user is authenticated
      if (saveSearches && searchFilters.query) {
        await saveSearch(searchFilters.query, searchFilters);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      onSearchError?.(errorMessage);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, saveSearches, onSearchComplete, onSearchError]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchResponse(null);
    setFilters({});
    setError(null);
    setCurrentPage(1);
    setSuggestions([]);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get suggestions
  const getSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const newSuggestions = await getSearchSuggestions(query);
      setSuggestions(newSuggestions);
    } catch (err) {
      console.error('Failed to get suggestions:', err);
      setSuggestions([]);
    }
  }, []);

  // Save current search
  const saveCurrentSearch = useCallback(async () => {
    if (!filters.query) return;

    try {
      await saveSearch(filters.query, filters);
      await loadSavedSearches(); // Refresh saved searches
    } catch (err) {
      console.error('Failed to save search:', err);
    }
  }, [filters]);

  // Load saved searches
  const loadSavedSearches = useCallback(async () => {
    try {
      const searches = await getSavedSearches();
      setSavedSearches(searches);
    } catch (err) {
      console.error('Failed to load saved searches:', err);
    }
  }, []);

  // Pagination functions
  const goToPage = useCallback((page: number) => {
    if (page < 1 || (searchResponse && page > searchResponse.data.pagination.pages)) return;
    search(filters, page);
  }, [filters, search, searchResponse]);

  const nextPage = useCallback(() => {
    if (searchResponse && searchResponse.data.pagination.hasNext) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, goToPage, searchResponse]);

  const prevPage = useCallback(() => {
    if (searchResponse && searchResponse.data.pagination.hasPrev) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage, searchResponse]);

  // Load saved searches on mount
  useEffect(() => {
    loadSavedSearches();
  }, [loadSavedSearches]);

  // Computed values
  const hasResults = searchResponse?.data.results.length > 0;
  const totalResults = searchResponse?.data.query_info.total_results || 0;
  const searchTime = searchResponse?.data.query_info.search_time_ms || 0;

  return {
    // State
    searchResponse,
    filters,
    isLoading,
    error,
    suggestions,
    savedSearches,
    
    // Actions
    search,
    updateFilters,
    clearSearch,
    clearError,
    getSuggestions,
    saveCurrentSearch,
    loadSavedSearches,
    
    // Pagination
    currentPage,
    goToPage,
    nextPage,
    prevPage,
    
    // Utilities
    hasResults: hasResults || false,
    totalResults,
    searchTime,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function hasActiveFilters(filters: SearchFilters): boolean {
  return Object.keys(filters).some(key => {
    const value = filters[key as keyof SearchFilters];
    if (key === 'query' || key === 'sortBy') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== null);
    }
    return value !== undefined && value !== null && value !== '';
  });
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

// Hook for quick search (with auto-search enabled)
export function useQuickSearch(initialQuery?: string) {
  return useSearch({
    initialFilters: { query: initialQuery },
    autoSearch: true,
    debounceMs: 300,
  });
}

// Hook for advanced search (manual search)
export function useAdvancedSearch(initialFilters?: SearchFilters) {
  return useSearch({
    initialFilters,
    autoSearch: false,
    saveSearches: true,
  });
}

// Hook for search suggestions only
export function useSearchSuggestions() {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const newSuggestions = await getSearchSuggestions(query);
      setSuggestions(newSuggestions);
    } catch (err) {
      console.error('Failed to get suggestions:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestions,
    isLoading,
    getSuggestions,
  };
}
