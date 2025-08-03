'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Eye, 
  Clock, 
  User, 
  Tag, 
  TrendingUp, 
  Pin, 
  Lock, 
  Star,
  FileText,
  Paperclip,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SearchResult, SearchResponse } from '@/services/searchApi';
import { highlightSearchTerms, createSearchExcerpt } from '@/services/searchApi';
import { formatRelativeTime } from '@/utils/forumUtils';
import ReputationBadge from './ReputationBadge';
import VoteButtons from './VoteButtons';

interface SearchResultsProps {
  searchResponse: SearchResponse | null;
  query: string;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  showVoting?: boolean;
  viewMode?: 'list' | 'grid' | 'compact';
  className?: string;
}

const SearchResults = ({
  searchResponse,
  query,
  isLoading,
  onPageChange,
  showVoting = true,
  viewMode = 'list',
  className = '',
}: SearchResultsProps) => {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <div className={`search-results ${className}`}>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!searchResponse || searchResponse.data.results.length === 0) {
    return (
      <div className={`search-results ${className}`}>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No results found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {query ? `No results found for "${query}"` : 'Try adjusting your search terms or filters'}
          </p>
        </div>
      </div>
    );
  }

  const { results, pagination, query_info } = searchResponse.data;

  const toggleExpanded = (resultId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  };

  const renderResult = (result: SearchResult) => {
    const isExpanded = expandedResults.has(result.id);
    const excerpt = result.highlighted_content || 
                   createSearchExcerpt(result.content, query, isExpanded ? 500 : 200);
    const highlightedExcerpt = highlightSearchTerms(excerpt, query);

    return (
      <div
        key={result.id}
        className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start gap-4">
          {/* Voting Section */}
          {showVoting && (
            <div className="flex-shrink-0">
              <VoteButtons
                itemId={result.id}
                itemType={result.type}
                initialUpvotes={result.upvotes}
                initialDownvotes={result.downvotes}
                size="sm"
                orientation="vertical"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                {/* Title */}
                {result.title ? (
                  <Link
                    href={`/forums/${result.category?.slug}/${result.id}`}
                    className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 line-clamp-2"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightSearchTerms(result.title, query) 
                    }}
                  />
                ) : (
                  <Link
                    href={`/forums/post/${result.post_id}#reply-${result.id}`}
                    className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Reply in discussion
                  </Link>
                )}

                {/* Badges */}
                <div className="flex items-center gap-2 mt-1">
                  {result.type === 'reply' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Reply
                    </span>
                  )}
                  {result.is_pinned && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
                      <Pin className="h-3 w-3 mr-1" />
                      Pinned
                    </span>
                  )}
                  {result.is_locked && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200">
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </span>
                  )}
                  {result.is_featured && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </span>
                  )}
                  {result.has_attachments && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                      <Paperclip className="h-3 w-3 mr-1" />
                      Attachments
                    </span>
                  )}
                </div>
              </div>

              {/* Relevance Score */}
              {result.relevance_score && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(result.relevance_score * 100)}% match
                </div>
              )}
            </div>

            {/* Content Excerpt */}
            <div 
              className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightedExcerpt }}
            />

            {/* Expand/Collapse Button */}
            {result.content.length > 200 && (
              <button
                onClick={() => toggleExpanded(result.id)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-3"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                {/* Author */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <Link
                    href={`/users/${result.author.username}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                  >
                    {result.author.username}
                  </Link>
                  {result.author.reputation && (
                    <ReputationBadge
                      reputation={result.author.reputation}
                      showLabel={false}
                      size="sm"
                    />
                  )}
                </div>

                {/* Category */}
                {result.category && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    <Link
                      href={`/forums/${result.category.slug}`}
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {result.category.name}
                    </Link>
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatRelativeTime(result.created_at)}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                {result.view_count !== undefined && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{result.view_count}</span>
                  </div>
                )}
                {result.reply_count !== undefined && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{result.reply_count}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className={result.score >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {result.score >= 0 ? '+' : ''}{result.score}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {result.tags && result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {result.tags.map((tag, index) => (
                  <Link
                    key={index}
                    href={`/forums/search?tags=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`search-results ${className}`}>
      {/* Search Info */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Found <span className="font-semibold">{query_info.total_results}</span> results
              {query && (
                <span> for "<span className="font-medium">{query_info.original_query}</span>"</span>
              )}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Search completed in {query_info.search_time_ms}ms
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4 mb-8">
        {results.map(renderResult)}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
              Page {pagination.page} of {pagination.pages}
            </span>

            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
