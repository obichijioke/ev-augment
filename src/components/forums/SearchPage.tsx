'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bookmark, Clock, TrendingUp, Filter } from 'lucide-react';
import AdvancedSearch from './AdvancedSearch';
import SearchResults from './SearchResults';
import { useAdvancedSearch } from '@/hooks/useSearch';
import { SearchFilters, parseSearchQuery } from '@/services/searchApi';

interface SearchPageProps {
  className?: string;
}

const SearchPage = ({ className = '' }: SearchPageProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSavedSearches, setShowSavedSearches] = useState(false);

  // Parse initial filters from URL
  const initialFilters: SearchFilters = {
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || undefined,
    author: searchParams.get('author') || undefined,
    tags: searchParams.getAll('tags').filter(Boolean),
    sortBy: (searchParams.get('sort') as any) || 'relevance',
    contentType: (searchParams.get('type') as any) || 'all',
  };

  const {
    searchResponse,
    filters,
    isLoading,
    error,
    savedSearches,
    search,
    updateFilters,
    clearSearch,
    clearError,
    goToPage,
    currentPage,
    loadSavedSearches,
  } = useAdvancedSearch(initialFilters);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.query) params.set('q', filters.query);
    if (filters.category) params.set('category', filters.category);
    if (filters.author) params.set('author', filters.author);
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }
    if (filters.sortBy && filters.sortBy !== 'relevance') {
      params.set('sort', filters.sortBy);
    }
    if (filters.contentType && filters.contentType !== 'all') {
      params.set('type', filters.contentType);
    }

    const newUrl = params.toString() ? `/forums/search?${params.toString()}` : '/forums/search';
    router.replace(newUrl, { scroll: false });
  }, [filters, router]);

  // Perform initial search if there are filters
  useEffect(() => {
    if (filters.query || hasActiveFilters(filters)) {
      search(filters);
    }
  }, []); // Only run on mount

  const handleSearch = (newFilters: SearchFilters) => {
    search(newFilters);
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    updateFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    goToPage(page);
  };

  const loadSavedSearch = (savedSearch: { query: string; filters: SearchFilters }) => {
    updateFilters(savedSearch.filters);
    search(savedSearch.filters);
    setShowSavedSearches(false);
  };

  const hasActiveFilters = (filters: SearchFilters): boolean => {
    return Object.keys(filters).some(key => {
      const value = filters[key as keyof SearchFilters];
      if (key === 'query' || key === 'sortBy') return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== undefined && v !== null);
      }
      return value !== undefined && value !== null && value !== '';
    });
  };

  return (
    <div className={`search-page ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Search Forum
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find posts, replies, and discussions across all forum categories
          </p>
        </div>

        {/* Search Interface */}
        <div className="mb-8">
          <AdvancedSearch
            initialFilters={filters}
            onSearch={handleSearch}
            onFiltersChange={handleFiltersChange}
            isLoading={isLoading}
            showAdvancedFilters={true}
          />
        </div>

        {/* Sidebar and Results Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={clearSearch}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Clear Search
                  </button>
                  <button
                    onClick={() => setShowSavedSearches(!showSavedSearches)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Bookmark className="h-4 w-4" />
                    Saved Searches ({savedSearches.length})
                  </button>
                </div>
              </div>

              {/* Saved Searches */}
              {showSavedSearches && savedSearches.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Saved Searches
                  </h3>
                  <div className="space-y-2">
                    {savedSearches.slice(0, 5).map((savedSearch) => (
                      <button
                        key={savedSearch.id}
                        onClick={() => loadSavedSearch(savedSearch)}
                        className="w-full text-left p-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {savedSearch.query}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(savedSearch.created_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Tips */}
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Search Tips
                </h3>
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>
                    <strong>author:username</strong> - Find posts by specific user
                  </div>
                  <div>
                    <strong>tags:tag1,tag2</strong> - Search by tags
                  </div>
                  <div>
                    <strong>score:>=10</strong> - Find highly rated content
                  </div>
                  <div>
                    <strong>has:attachments</strong> - Posts with files
                  </div>
                  <div>
                    <strong>is:pinned</strong> - Pinned posts only
                  </div>
                </div>
              </div>

              {/* Search Stats */}
              {searchResponse && (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Search Statistics
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Results:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {searchResponse.data.query_info.total_results}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Search time:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {searchResponse.data.query_info.search_time_ms}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Page:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {currentPage} of {searchResponse.data.pagination.pages}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  <button
                    onClick={clearError}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Search Results */}
            <SearchResults
              searchResponse={searchResponse}
              query={filters.query || ''}
              isLoading={isLoading}
              onPageChange={handlePageChange}
              showVoting={true}
              viewMode="list"
            />

            {/* No Search Performed */}
            {!searchResponse && !isLoading && !error && (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Start Your Search
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Enter keywords, use filters, or try advanced search operators to find exactly what you're looking for.
                  </p>
                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <p>Popular searches: "getting started", "troubleshooting", "best practices"</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
