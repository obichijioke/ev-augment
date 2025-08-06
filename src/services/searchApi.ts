// =============================================================================
// Advanced Search API Service
// =============================================================================

import { ForumPost, ForumReply, ForumCategory } from "@/types/forum";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface SearchFilters {
  query?: string;
  category?: string;
  author?: string;
  tags?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  scoreRange?: {
    min?: number;
    max?: number;
  };
  sortBy?: 'relevance' | 'date' | 'score' | 'replies' | 'views';
  contentType?: 'all' | 'posts' | 'replies';
  hasAttachments?: boolean;
  isPinned?: boolean;
  isLocked?: boolean;
  minReplies?: number;
  maxReplies?: number;
}

export interface SearchResult {
  id: string;
  type: 'post' | 'reply';
  title?: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    username: string;
    avatar_url?: string;
    reputation?: number;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  created_at: string;
  updated_at: string;
  score: number;
  upvotes: number;
  downvotes: number;
  reply_count?: number;
  view_count?: number;
  tags?: string[];
  is_pinned?: boolean;
  is_locked?: boolean;
  is_featured?: boolean;
  has_attachments?: boolean;
  relevance_score?: number;
  highlighted_content?: string;
  post_id?: string; // For replies, reference to parent post
}

export interface SearchResponse {
  success: boolean;
  data: {
    results: SearchResult[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    facets: {
      categories: Array<{ id: string; name: string; count: number }>;
      authors: Array<{ id: string; username: string; count: number }>;
      tags: Array<{ name: string; count: number }>;
      dateRanges: Array<{ range: string; count: number }>;
      scoreRanges: Array<{ range: string; count: number }>;
    };
    suggestions?: string[];
    query_info: {
      original_query: string;
      processed_query: string;
      search_time_ms: number;
      total_results: number;
    };
  };
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'category' | 'author' | 'tag';
  count?: number;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function makeSearchRequest(endpoint: string, params: Record<string, any>): Promise<Response> {
  const token = localStorage.getItem("token");
  const queryString = new URLSearchParams();

  // Build query string
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => queryString.append(key, item.toString()));
      } else if (typeof value === 'object') {
        queryString.append(key, JSON.stringify(value));
      } else {
        queryString.append(key, value.toString());
      }
    }
  });

  const url = `/api/forum/search${endpoint}?${queryString.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Search failed' }));
    throw new Error(errorData.message || `Search failed: ${response.statusText}`);
  }

  return response;
}

export async function searchForumContent(
  filters: SearchFilters,
  page: number = 1,
  limit: number = 20
): Promise<SearchResponse> {
  try {
    const params = {
      q: filters.query || '',
      category_id: filters.category,
      author: filters.author,
      tags: filters.tags,
      date_from: filters.dateRange?.from,
      date_to: filters.dateRange?.to,
      score_min: filters.scoreRange?.min,
      score_max: filters.scoreRange?.max,
      sort: filters.sortBy || 'relevance',
      type: filters.contentType || 'all',
      has_attachments: filters.hasAttachments,
      is_pinned: filters.isPinned,
      is_locked: filters.isLocked,
      min_replies: filters.minReplies,
      max_replies: filters.maxReplies,
      page,
      limit,
    };

    const response = await makeSearchRequest('', params);
    return await response.json();
  } catch (error) {
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getSearchSuggestions(
  query: string,
  limit: number = 10
): Promise<SearchSuggestion[]> {
  try {
    const response = await makeSearchRequest('/suggestions', { q: query, limit });
    const data = await response.json();
    return data.data.suggestions || [];
  } catch (error) {
    console.error('Failed to get search suggestions:', error);
    return [];
  }
}

export async function getPopularSearches(limit: number = 10): Promise<string[]> {
  try {
    const response = await makeSearchRequest('/popular', { limit });
    const data = await response.json();
    return data.data.searches || [];
  } catch (error) {
    console.error('Failed to get popular searches:', error);
    return [];
  }
}

export async function saveSearch(query: string, filters: SearchFilters): Promise<void> {
  try {
    const token = localStorage.getItem("token");
    if (!token) return; // Only save for authenticated users

    await fetch('/api/forum/search/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ query, filters }),
    });
  } catch (error) {
    console.error('Failed to save search:', error);
  }
}

export async function getSavedSearches(): Promise<Array<{ id: string; query: string; filters: SearchFilters; created_at: string }>> {
  try {
    const token = localStorage.getItem("token");
    if (!token) return [];

    const response = await fetch('/api/forum/search/saved', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.data.searches || [];
  } catch (error) {
    console.error('Failed to get saved searches:', error);
    return [];
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function highlightSearchTerms(text: string, query: string): string {
  if (!query || !text) return text;

  const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
  let highlightedText = text;

  terms.forEach(term => {
    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    highlightedText = highlightedText.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>'
    );
  });

  return highlightedText;
}

export function createSearchExcerpt(content: string, query: string, maxLength: number = 200): string {
  if (!query || !content) {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }

  const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
  const contentLower = content.toLowerCase();

  // Find the first occurrence of any search term
  let firstIndex = -1;
  for (const term of terms) {
    const index = contentLower.indexOf(term);
    if (index !== -1 && (firstIndex === -1 || index < firstIndex)) {
      firstIndex = index;
    }
  }

  if (firstIndex === -1) {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }

  // Create excerpt around the found term
  const start = Math.max(0, firstIndex - Math.floor(maxLength / 2));
  const end = Math.min(content.length, start + maxLength);
  
  let excerpt = content.substring(start, end);
  
  if (start > 0) excerpt = '...' + excerpt;
  if (end < content.length) excerpt = excerpt + '...';

  return excerpt;
}

export function buildSearchQuery(filters: SearchFilters): string {
  const parts: string[] = [];

  if (filters.query) parts.push(filters.query);
  if (filters.author) parts.push(`author:${filters.author}`);
  if (filters.category) parts.push(`category:${filters.category}`);
  if (filters.tags && filters.tags.length > 0) {
    parts.push(`tags:${filters.tags.join(',')}`);
  }
  if (filters.scoreRange?.min !== undefined) parts.push(`score:>=${filters.scoreRange.min}`);
  if (filters.scoreRange?.max !== undefined) parts.push(`score:<=${filters.scoreRange.max}`);
  if (filters.hasAttachments) parts.push('has:attachments');
  if (filters.isPinned) parts.push('is:pinned');
  if (filters.isLocked) parts.push('is:locked');

  return parts.join(' ');
}

export function parseSearchQuery(query: string): SearchFilters {
  const filters: SearchFilters = {};
  const parts = query.split(/\s+/);
  const queryParts: string[] = [];

  parts.forEach(part => {
    if (part.includes(':')) {
      const [key, value] = part.split(':', 2);
      switch (key.toLowerCase()) {
        case 'author':
          filters.author = value;
          break;
        case 'category':
          filters.category = value;
          break;
        case 'tags':
          filters.tags = value.split(',');
          break;
        case 'score':
          if (value.startsWith('>=')) {
            filters.scoreRange = { ...filters.scoreRange, min: parseInt(value.substring(2)) };
          } else if (value.startsWith('<=')) {
            filters.scoreRange = { ...filters.scoreRange, max: parseInt(value.substring(2)) };
          }
          break;
        case 'has':
          if (value === 'attachments') filters.hasAttachments = true;
          break;
        case 'is':
          if (value === 'pinned') filters.isPinned = true;
          if (value === 'locked') filters.isLocked = true;
          break;
        default:
          queryParts.push(part);
      }
    } else {
      queryParts.push(part);
    }
  });

  if (queryParts.length > 0) {
    filters.query = queryParts.join(' ');
  }

  return filters;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
