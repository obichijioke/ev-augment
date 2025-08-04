// =============================================================================
// Forum Type Definitions
// =============================================================================

export interface ForumUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  is_verified: boolean;
  role: string;
  join_date?: string;
  created_at?: string;
}

export interface ForumCategory {
  id: string;
  name: string;
  description?: string;
  slug: string;
  color?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  post_count: number;
  last_post_id?: string;
  last_post_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  slug: string;
  author_id: string;
  category_id: string;
  tags?: string[];
  is_pinned: boolean;
  is_locked: boolean;
  is_featured: boolean;
  is_active: boolean;
  view_count: number;
  like_count: number;
  reply_count: number;
  last_activity_at: string;
  last_reply_at?: string;
  last_reply_by?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  users?: ForumUser;
  forum_categories?: ForumCategory;
  forum_replies?: ForumReply[];
  attachments?: ForumAttachment[];

  // Vote information (when user is authenticated)
  user_vote?: "upvote" | "downvote" | null;
  upvotes?: number;
  downvotes?: number;
  score?: number;

  // Additional display properties for legacy compatibility
  author?: {
    name: string;
    avatar: string;
    joinDate: string;
    posts: number;
    reputation: number;
  };
  category?: string;
  createdAt?: string;
  views?: number;
  likes?: number;
  isPinned?: boolean;
  isLocked?: boolean;
}

export interface ForumReply {
  id: string;
  post_id: string;
  author_id: string;
  parent_id?: string;
  content: string;
  like_count: number;
  is_edited: boolean;
  is_active: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  users?: ForumUser;
  attachments?: ForumAttachment[];

  // Nested replies (for threaded discussions)
  replies?: ForumReply[];

  // Vote information (when user is authenticated)
  user_vote?: "upvote" | "downvote" | null;
  upvotes?: number;
  downvotes?: number;
  score?: number;
}

export interface ForumVote {
  id: string;
  user_id: string;
  post_id?: string;
  reply_id?: string;
  vote_type: "upvote" | "downvote";
  created_at: string;
  updated_at: string;
}

export interface ForumReport {
  id: string;
  reporter_id: string;
  post_id?: string;
  reply_id?: string;
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  reporter?: ForumUser;
  post?: ForumPost;
  reply?: ForumReply;
  reviewed_by_user?: ForumUser;
}

export interface ForumAttachment {
  id: string;
  post_id?: string;
  reply_id?: string;
  uploader_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  is_image: boolean;
  alt_text?: string;
  created_at: string;
}

export interface ForumSubscription {
  id: string;
  user_id: string;
  post_id: string;
  notification_type: "all" | "replies" | "mentions";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ForumTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ForumPostsResponse {
  success: boolean;
  data: {
    posts: ForumPost[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface ForumPostResponse {
  success: boolean;
  data: {
    post: ForumPost;
    replies?: ForumReply[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface ForumCategoriesResponse {
  success: boolean;
  data: {
    categories: ForumCategory[];
  };
}

export interface ForumStatsResponse {
  success: boolean;
  data: {
    totalPosts: number;
    totalReplies: number;
    totalCategories: number;
    recentPosts: number;
    totalDiscussions: number;
  };
}

// =============================================================================
// Form Types
// =============================================================================

export interface CreateForumPostForm {
  title: string;
  content: string;
  category_id: string;
  tags: string[];
}

export interface UpdateForumPostForm {
  title?: string;
  content?: string;
  category_id?: string;
  tags?: string[];
}

export interface CreateForumReplyForm {
  content: string;
  parent_id?: string;
}

export interface ForumSearchForm {
  query: string;
  category_id?: string;
  author?: string;
  tags?: string[];
  sort_by?: "relevance" | "date" | "replies" | "votes";
  time_range?: "day" | "week" | "month" | "year" | "all";
}

// =============================================================================
// Filter and Query Types
// =============================================================================

export interface ForumPostsQuery {
  page?: number;
  limit?: number;
  category_id?: string;
  author_id?: string;
  sort?: "asc" | "desc";
  sortBy?:
    | "created_at"
    | "updated_at"
    | "views"
    | "title"
    | "reply_count"
    | "last_activity_at";
  q?: string;
  is_pinned?: boolean;
  is_locked?: boolean;
  is_featured?: boolean;
}

export interface ForumPostsFilter {
  category?: string;
  author?: string;
  tags?: string[];
  timeRange?: "day" | "week" | "month" | "year" | "all";
  sortBy?: "latest" | "popular" | "replies" | "votes";
  showPinned?: boolean;
  showLocked?: boolean;
  showFeatured?: boolean;
}

// =============================================================================
// UI State Types
// =============================================================================

export interface ForumUIState {
  selectedCategory?: string;
  searchQuery?: string;
  currentFilter: ForumPostsFilter;
  viewMode: "list" | "grid" | "compact";
  isLoading: boolean;
  error?: string;
}

export interface ForumPostUIState {
  isEditing: boolean;
  showReplyForm: boolean;
  replyingTo?: string;
  sortReplies: "oldest" | "newest" | "popular";
  expandedReplies: Set<string>;
  isVoting: boolean;
  isReporting: boolean;
}

// =============================================================================
// Permission Types
// =============================================================================

export interface ForumPermissions {
  canCreatePosts: boolean;
  canEditOwnPosts: boolean;
  canDeleteOwnPosts: boolean;
  canReply: boolean;
  canVote: boolean;
  canReport: boolean;
  canModerate: boolean;
  canPin: boolean;
  canLock: boolean;
  canFeature: boolean;
  canDeleteAny: boolean;
  canEditAny: boolean;
  canViewReports: boolean;
  canManageCategories: boolean;
}

// =============================================================================
// Utility Types
// =============================================================================

export type ForumSortOption =
  | "latest"
  | "popular"
  | "replies"
  | "votes"
  | "views"
  | "oldest";

export type ForumTimeRange = "today" | "week" | "month" | "year" | "all";

export type ForumViewMode = "list" | "grid" | "compact";

export type VoteType = "upvote" | "downvote";

export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate"
  | "off-topic"
  | "misinformation"
  | "other";

export type PostStatus =
  | "active"
  | "locked"
  | "pinned"
  | "featured"
  | "archived"
  | "deleted";

export type ReplyStatus = "active" | "edited" | "deleted" | "hidden";
