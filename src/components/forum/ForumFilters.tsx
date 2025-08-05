'use client';

import React from 'react';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { ThreadSortOption, ThreadFilterOption, ThreadFilters } from '@/types/forum';

interface ForumFiltersProps {
  filters: ThreadFilters;
  onFiltersChange: (filters: ThreadFilters) => void;
  className?: string;
}

const ForumFilters: React.FC<ForumFiltersProps> = ({
  filters,
  onFiltersChange,
  className = '',
}) => {
  const sortOptions: { value: ThreadSortOption; label: string }[] = [
    { value: 'latest', label: 'Latest Activity' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'replies', label: 'Most Replies' },
  ];

  const filterOptions: { value: ThreadFilterOption; label: string }[] = [
    { value: 'all', label: 'All Threads' },
    { value: 'pinned', label: 'Pinned Only' },
    { value: 'locked', label: 'Locked Threads' },
    { value: 'unanswered', label: 'Unanswered' },
  ];

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleSortChange = (sort: ThreadSortOption) => {
    onFiltersChange({ ...filters, sort });
  };

  const handleFilterChange = (filter: ThreadFilterOption) => {
    onFiltersChange({ ...filters, filter });
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search threads..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center space-x-4">
          {/* Filter Dropdown */}
          <div className="relative">
            <label className="sr-only">Filter threads</label>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filters.filter}
                onChange={(e) => handleFilterChange(e.target.value as ThreadFilterOption)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <label className="sr-only">Sort threads</label>
            <div className="flex items-center space-x-2">
              {filters.sort === 'oldest' ? (
                <SortAsc className="h-4 w-4 text-gray-500" />
              ) : (
                <SortDesc className="h-4 w-4 text-gray-500" />
              )}
              <select
                value={filters.sort}
                onChange={(e) => handleSortChange(e.target.value as ThreadSortOption)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.search || filters.filter !== 'all') && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Active filters:</span>
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{filters.search}"
                <button
                  onClick={() => handleSearchChange('')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.filter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {filterOptions.find(opt => opt.value === filters.filter)?.label}
                <button
                  onClick={() => handleFilterChange('all')}
                  className="ml-1 text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumFilters;
