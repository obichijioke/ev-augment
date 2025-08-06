// =============================================================================
// Forum Type Definitions - New Clean Implementation
// =============================================================================

export interface ForumUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  isVerified?: boolean;
  joinDate: string;
}

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  slug: string;
  color: string;
  icon: string;
  thread_count: number;
  post_count: number;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
  is_active: boolean;
}

export interface ForumImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  alt?: string;
}

export interface ForumThread {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  content: string;
  slug: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_deleted: boolean;
  view_count: number;
  reply_count: number;
  last_reply_at?: string;
  last_reply_by?: string;
  created_at: string;
  updated_at: string;
  // Populated fields from joins
  author?: ForumUser;
  category?: ForumCategory;
  images?: ForumImage[];
  replies?: ForumReply[];
}

export interface ForumReply {
  id: string;
  thread_id: string;
  author_id: string;
  parent_id?: string; // For nested replies (max 1 level deep)
  content: string;
  nesting_level: number; // 0 or 1 (max 2 levels)
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // Populated fields from joins
  author?: ForumUser;
  images?: ForumImage[];
  replies?: ForumReply[]; // Only one level of nesting allowed
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  images?: ForumImage[];
  author: ForumUser;
  category: ForumCategory;
  replies: ForumReply[];
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ForumCategoriesResponse {
  success: boolean;
  data: ForumCategory[];
  error?: string;
}

export interface ForumThreadsResponse {
  success: boolean;
  data: {
    threads: ForumThread[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

export interface ForumPostResponse {
  success: boolean;
  data: ForumPost;
  error?: string;
}

// =============================================================================
// Form Types
// =============================================================================

export interface CreateThreadForm {
  title: string;
  content: string;
  categoryId: string;
}

export interface CreateReplyForm {
  content: string;
  parentId?: string;
  images?: File[];
}

// API Request Types
export interface CreateThreadRequest {
  category_id: string;
  title: string;
  content: string;
  images?: string[];
}

export interface CreateReplyRequest {
  thread_id: string;
  parent_id?: string;
  content: string;
  images?: string[];
}

// =============================================================================
// Filter and Sort Types
// =============================================================================

export type ThreadSortOption = "latest" | "oldest" | "popular" | "replies";
export type ThreadFilterOption = "all" | "pinned" | "locked" | "unanswered";

export interface ThreadFilters {
  sort: ThreadSortOption;
  filter: ThreadFilterOption;
  search?: string;
  categoryId?: string;
}

// =============================================================================
// UI State Types
// =============================================================================

export interface ForumUIState {
  isLoading: boolean;
  error: string | null;
  selectedCategory: string | null;
  filters: ThreadFilters;
}

// =============================================================================
// Mock Data Types (for development)
// =============================================================================

export interface MockForumData {
  categories: ForumCategory[];
  threads: ForumThread[];
  posts: ForumPost[];
  users: ForumUser[];
}
