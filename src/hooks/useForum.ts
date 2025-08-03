// =============================================================================
// Forum Custom Hooks
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import {
  getForumPosts,
  getForumPost,
  getForumCategories,
  createForumPost,
  updateForumPost,
  deleteForumPost,
  createForumReply,
  voteOnPost,
  voteOnReply,
  reportPost,
  getForumStats,
  getUserPosts,
  ApiError,
} from "@/services/forumApi";
import {
  ForumPost,
  ForumReply,
  ForumCategory,
  ForumPostsQuery,
  CreateForumPostRequest,
  UpdateForumPostRequest,
  CreateForumReplyRequest,
  VoteType,
  ReportRequest,
} from "@/types/forum";

// =============================================================================
// FORUM POSTS HOOK
// =============================================================================

interface UseForumPostsReturn {
  posts: ForumPost[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useForumPosts(query: ForumPostsQuery = {}): UseForumPostsReturn {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);

  const fetchPosts = useCallback(async (resetPosts = true) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getForumPosts(query);
      
      if (resetPosts) {
        setPosts(response.data.posts);
      } else {
        setPosts(prev => [...prev, ...response.data.posts]);
      }
      
      setPagination(response.data.pagination);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to fetch forum posts");
      console.error("Error fetching forum posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const loadMore = useCallback(async () => {
    if (!pagination || pagination.page >= pagination.pages) return;
    
    const nextPageQuery = { ...query, page: pagination.page + 1 };
    
    try {
      const response = await getForumPosts(nextPageQuery);
      setPosts(prev => [...prev, ...response.data.posts]);
      setPagination(response.data.pagination);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to load more posts");
    }
  }, [query, pagination]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    isLoading,
    error,
    pagination,
    refetch: () => fetchPosts(true),
    loadMore,
    hasMore: pagination ? pagination.page < pagination.pages : false,
  };
}

// =============================================================================
// SINGLE FORUM POST HOOK
// =============================================================================

interface UseForumPostReturn {
  post: ForumPost | null;
  replies: ForumReply[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
}

export function useForumPost(postId: string, page: number = 1): UseForumPostReturn {
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);

  const fetchPost = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getForumPost(postId, page);
      setPost(response.data.post);
      setReplies(response.data.replies || []);
      setPagination(response.data.pagination || null);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to fetch forum post");
      console.error("Error fetching forum post:", err);
    } finally {
      setIsLoading(false);
    }
  }, [postId, page]);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [fetchPost]);

  return {
    post,
    replies,
    isLoading,
    error,
    refetch: fetchPost,
    pagination,
  };
}

// =============================================================================
// FORUM CATEGORIES HOOK
// =============================================================================

interface UseForumCategoriesReturn {
  categories: ForumCategory[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useForumCategories(): UseForumCategoriesReturn {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getForumCategories();
      setCategories(response.data.categories);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to fetch forum categories");
      console.error("Error fetching forum categories:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
}

// =============================================================================
// FORUM POST ACTIONS HOOK
// =============================================================================

interface UseForumPostActionsReturn {
  createPost: (postData: CreateForumPostRequest) => Promise<ForumPost>;
  updatePost: (id: string, postData: UpdateForumPostRequest) => Promise<ForumPost>;
  deletePost: (id: string) => Promise<void>;
  createReply: (postId: string, replyData: CreateForumReplyRequest) => Promise<ForumReply>;
  votePost: (id: string, voteType: VoteType) => Promise<{ upvotes: number; downvotes: number; score: number; userVote: VoteType | null }>;
  voteReply: (id: string, voteType: VoteType) => Promise<{ upvotes: number; downvotes: number; score: number; userVote: VoteType | null }>;
  reportPost: (id: string, reportData: ReportRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useForumPostActions(): UseForumPostActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async <T>(action: () => Promise<T>): Promise<T> => {
    try {
      setIsLoading(true);
      setError(null);
      return await action();
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || "An error occurred";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createPost = useCallback(async (postData: CreateForumPostRequest): Promise<ForumPost> => {
    return handleAction(async () => {
      const response = await createForumPost(postData);
      return response.data.post;
    });
  }, []);

  const updatePost = useCallback(async (id: string, postData: UpdateForumPostRequest): Promise<ForumPost> => {
    return handleAction(async () => {
      const response = await updateForumPost(id, postData);
      return response.data.post;
    });
  }, []);

  const deletePostAction = useCallback(async (id: string): Promise<void> => {
    return handleAction(async () => {
      await deleteForumPost(id);
    });
  }, []);

  const createReply = useCallback(async (postId: string, replyData: CreateForumReplyRequest): Promise<ForumReply> => {
    return handleAction(async () => {
      const response = await createForumReply(postId, replyData);
      return response.data.reply;
    });
  }, []);

  const votePost = useCallback(async (id: string, voteType: VoteType) => {
    return handleAction(async () => {
      const response = await voteOnPost(id, voteType);
      return response.data;
    });
  }, []);

  const voteReply = useCallback(async (id: string, voteType: VoteType) => {
    return handleAction(async () => {
      const response = await voteOnReply(id, voteType);
      return response.data;
    });
  }, []);

  const reportPostAction = useCallback(async (id: string, reportData: ReportRequest): Promise<void> => {
    return handleAction(async () => {
      await reportPost(id, reportData);
    });
  }, []);

  return {
    createPost,
    updatePost,
    deletePost: deletePostAction,
    createReply,
    votePost,
    voteReply,
    reportPost: reportPostAction,
    isLoading,
    error,
  };
}

// =============================================================================
// FORUM STATS HOOK
// =============================================================================

interface UseForumStatsReturn {
  stats: {
    totalPosts: number;
    totalReplies: number;
    totalCategories: number;
    recentPosts: number;
    totalDiscussions: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useForumStats(): UseForumStatsReturn {
  const [stats, setStats] = useState<UseForumStatsReturn["stats"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getForumStats();
      setStats(response.data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to fetch forum statistics");
      console.error("Error fetching forum stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

// =============================================================================
// USER POSTS HOOK
// =============================================================================

export function useUserPosts(userId: string, page: number = 1): UseForumPostsReturn {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);

  const fetchUserPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getUserPosts(userId, page);
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to fetch user posts");
      console.error("Error fetching user posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, page]);

  useEffect(() => {
    if (userId) {
      fetchUserPosts();
    }
  }, [fetchUserPosts]);

  return {
    posts,
    isLoading,
    error,
    pagination,
    refetch: fetchUserPosts,
    loadMore: async () => {}, // Not implemented for user posts
    hasMore: false,
  };
}
