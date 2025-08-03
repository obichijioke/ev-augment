'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  User, 
  Tag, 
  TrendingUp, 
  Clock,
  Bookmark,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SearchFilters, getSearchSuggestions, SearchSuggestion } from '@/services/searchApi';

interface AdvancedSearchProps {
  initialFilters?: SearchFilters;
  onSearch: (filters: SearchFilters) => void;
  onFiltersChange?: (filters: SearchFilters) => void;
  isLoading?: boolean;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  className?: string;
}

const AdvancedSearch = ({
  initialFilters = {},
  onSearch,
  onFiltersChange,
  isLoading = false,
  placeholder = "Search posts, replies, and discussions...",
  showAdvancedFilters = true,
  className = '',
}: AdvancedSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Update filters when props change
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Get suggestions when query changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (filters.query && filters.query.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const newSuggestions = await getSearchSuggestions(filters.query || '', 8);
          setSuggestions(newSuggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to get suggestions:', error);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filters.query]);

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange?.(updatedFilters);
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setShowSuggestions(false);
    onSearch(filters);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestionIndex >= 0) {
          updateFilters({ query: suggestions[suggestionIndex].text });
          setShowSuggestions(false);
          setSuggestionIndex(-1);
        }
        handleSearch();
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSuggestionIndex(-1);
        break;
    }
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    updateFilters({ query: suggestion.text });
    setShowSuggestions(false);
    setSuggestionIndex(-1);
    searchInputRef.current?.focus();
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = { query: filters.query };
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    key !== 'query' && key !== 'sortBy' && filters[key as keyof SearchFilters] !== undefined
  );

  return (
    <div className={`advanced-search ${className}`}>
      {/* Main Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={placeholder}
                value={filters.query || ''}
                onChange={(e) => updateFilters({ query: e.target.value })}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              
              {/* Clear Query Button */}
              {filters.query && (
                <button
                  type="button"
                  onClick={() => updateFilters({ query: '' })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${
                      index === suggestionIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">{suggestion.text}</span>
                    {suggestion.count && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                        {suggestion.count} results
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>

          {/* Advanced Filters Toggle */}
          {showAdvancedFilters && (
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors flex items-center gap-2 ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                  {Object.keys(filters).filter(key => 
                    key !== 'query' && key !== 'sortBy' && filters[key as keyof SearchFilters] !== undefined
                  ).length}
                </span>
              )}
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </form>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && showFilters && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Content Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content Type
              </label>
              <select
                value={filters.contentType || 'all'}
                onChange={(e) => updateFilters({ contentType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Content</option>
                <option value="posts">Posts Only</option>
                <option value="replies">Replies Only</option>
              </select>
            </div>

            {/* Sort By Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy || 'relevance'}
                onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Newest First</option>
                <option value="score">Highest Score</option>
                <option value="replies">Most Replies</option>
                <option value="views">Most Views</option>
              </select>
            </div>

            {/* Author Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Author
              </label>
              <input
                type="text"
                placeholder="Username..."
                value={filters.author || ''}
                onChange={(e) => updateFilters({ author: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Score Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <TrendingUp className="h-4 w-4 inline mr-1" />
                Minimum Score
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.scoreRange?.min || ''}
                onChange={(e) => updateFilters({ 
                  scoreRange: { 
                    ...filters.scoreRange, 
                    min: e.target.value ? parseInt(e.target.value) : undefined 
                  } 
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Tags Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                Tags
              </label>
              <input
                type="text"
                placeholder="tag1, tag2, tag3..."
                value={filters.tags?.join(', ') || ''}
                onChange={(e) => updateFilters({ 
                  tags: e.target.value ? e.target.value.split(',').map(t => t.trim()).filter(t => t) : undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date From
              </label>
              <input
                type="date"
                value={filters.dateRange?.from || ''}
                onChange={(e) => updateFilters({ 
                  dateRange: { 
                    ...filters.dateRange, 
                    from: e.target.value || undefined 
                  } 
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Filter Toggles */}
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.hasAttachments || false}
                onChange={(e) => updateFilters({ hasAttachments: e.target.checked || undefined })}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Has Attachments</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.isPinned || false}
                onChange={(e) => updateFilters({ isPinned: e.target.checked || undefined })}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Pinned Only</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.isLocked || false}
                onChange={(e) => updateFilters({ isLocked: e.target.checked || undefined })}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Locked Only</span>
            </label>
          </div>

          {/* Filter Actions */}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Filters
            </button>

            <div className="text-xs text-gray-500 dark:text-gray-400">
              {hasActiveFilters && (
                <span>
                  {Object.keys(filters).filter(key => 
                    key !== 'query' && key !== 'sortBy' && filters[key as keyof SearchFilters] !== undefined
                  ).length} filter{Object.keys(filters).filter(key => 
                    key !== 'query' && key !== 'sortBy' && filters[key as keyof SearchFilters] !== undefined
                  ).length !== 1 ? 's' : ''} active
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
