// =============================================================================
// Forum API Service - Frontend API Integration
// =============================================================================

import { ForumPost, ForumReply, ForumCategory } from "@/types/forum";

// Base API configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4005/api";

// =============================================================================
// TYPE DEFINITIONS
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

export interface CreateForumPostRequest {
  title: string;
  content: string;
  category_id: string;
  tags?: string[];
}

export interface UpdateForumPostRequest {
  title?: string;
  content?: string;
  category_id?: string;
  tags?: string[];
}

export interface CreateForumReplyRequest {
  content: string;
  parent_id?: string;
}

export interface VoteRequest {
  vote_type: "upvote" | "downvote";
}

export interface ReportRequest {
  reason: string;
  description?: string;
}

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

export interface VoteResponse {
  success: boolean;
  message: string;
  data: {
    upvotes: number;
    downvotes: number;
    score: number;
    userVote: "upvote" | "downvote" | null;
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

export interface ApiError {
  success: false;
  message: string;
  error?: {
    status: number;
    code?: string;
    details?: any;
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Get authentication token from localStorage
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (!authStorage) return null;

    const authData = JSON.parse(authStorage);
    return authData?.state?.session?.accessToken || null;
  } catch (error) {
    console.error("Error parsing auth token:", error);
    return null;
  }
}

// Generic API request function with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();

    if (!response.ok) {
      throw {
        success: false,
        message: data.message || data.error?.message || "An error occurred",
        error: {
          status: response.status,
          code: data.error?.code,
          details: data,
        },
      } as ApiError;
    }

    return data;
  } catch (error) {
    if (error && typeof error === "object" && "success" in error) {
      throw error; // Re-throw API errors
    }

    // Handle network errors
    throw {
      success: false,
      message: "Network error occurred",
      error: {
        status: 0,
        details: error,
      },
    } as ApiError;
  }
}

// Build query string from parameters
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// =============================================================================
// FORUM API FUNCTIONS
// =============================================================================

// Categories
export async function getForumCategories(): Promise<ForumCategoriesResponse> {
  return apiRequest<ForumCategoriesResponse>("/forums/categories");
}

// Posts
export async function getForumPosts(
  query: ForumPostsQuery = {}
): Promise<ForumPostsResponse> {
  const queryString = buildQueryString(query);
  return apiRequest<ForumPostsResponse>(`/forums/posts${queryString}`);
}

export async function getForumPost(
  id: string,
  page: number = 1,
  limit: number = 20
): Promise<ForumPostResponse> {
  const queryString = buildQueryString({ page, limit });
  return apiRequest<ForumPostResponse>(`/forums/posts/${id}${queryString}`);
}

export async function getForumCategory(id: string): Promise<any> {
  return apiRequest<any>(`/forums/categories/${id}`);
}

export async function getForumPostsByCategory(
  categoryId: string,
  query: ForumPostsQuery = {}
): Promise<ForumPostsResponse> {
  const queryWithCategory = { ...query, category_id: categoryId };
  const queryString = buildQueryString(queryWithCategory);
  return apiRequest<ForumPostsResponse>(`/forums/posts${queryString}`);
}

// Edit a forum reply
export async function editForumReply(
  replyId: string,
  content: string
): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/forums/replies/${replyId}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

// Delete a forum reply
export async function deleteForumReply(
  replyId: string
): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/forums/replies/${replyId}`, {
    method: "DELETE",
  });
}

export async function createForumPost(
  postData: CreateForumPostRequest
): Promise<ForumPostResponse> {
  return apiRequest<ForumPostResponse>("/forums/posts", {
    method: "POST",
    body: JSON.stringify(postData),
  });
}

export async function updateForumPost(
  id: string,
  postData: UpdateForumPostRequest
): Promise<ForumPostResponse> {
  return apiRequest<ForumPostResponse>(`/forums/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(postData),
  });
}

export async function deleteForumPost(
  id: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    `/forums/posts/${id}`,
    {
      method: "DELETE",
    }
  );
}

// Replies
export async function createForumReply(
  postId: string,
  replyData: CreateForumReplyRequest
): Promise<{ success: boolean; message: string; data: { reply: ForumReply } }> {
  return apiRequest<{
    success: boolean;
    message: string;
    data: { reply: ForumReply };
  }>(`/forums/posts/${postId}/replies`, {
    method: "POST",
    body: JSON.stringify(replyData),
  });
}

export async function updateForumReply(
  id: string,
  content: string
): Promise<{ success: boolean; message: string; data: { reply: ForumReply } }> {
  return apiRequest<{
    success: boolean;
    message: string;
    data: { reply: ForumReply };
  }>(`/forums/replies/${id}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

// Voting
export async function voteOnPost(
  id: string,
  voteType: "upvote" | "downvote"
): Promise<VoteResponse> {
  return apiRequest<VoteResponse>(`/forums/posts/${id}/vote`, {
    method: "POST",
    body: JSON.stringify({ vote_type: voteType }),
  });
}

export async function voteOnReply(
  id: string,
  voteType: "upvote" | "downvote"
): Promise<VoteResponse> {
  return apiRequest<VoteResponse>(`/forums/replies/${id}/vote`, {
    method: "POST",
    body: JSON.stringify({ vote_type: voteType }),
  });
}

// Reporting
export async function reportPost(
  id: string,
  reportData: ReportRequest
): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    `/forums/posts/${id}/report`,
    {
      method: "POST",
      body: JSON.stringify(reportData),
    }
  );
}

// Moderation (requires moderator permissions)
export async function pinPost(
  id: string,
  isPinned: boolean
): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    `/forums/posts/${id}/pin`,
    {
      method: "POST",
      body: JSON.stringify({ is_pinned: isPinned }),
    }
  );
}

export async function lockPost(
  id: string,
  isLocked: boolean
): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    `/forums/posts/${id}/lock`,
    {
      method: "POST",
      body: JSON.stringify({ is_locked: isLocked }),
    }
  );
}

export async function featurePost(
  id: string,
  isFeatured: boolean
): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    `/forums/posts/${id}/feature`,
    {
      method: "POST",
      body: JSON.stringify({ is_featured: isFeatured }),
    }
  );
}

// Statistics
export async function getForumStats(): Promise<ForumStatsResponse> {
  return apiRequest<ForumStatsResponse>("/forums/stats");
}

// User posts
export async function getUserPosts(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<ForumPostsResponse> {
  const queryString = buildQueryString({ page, limit });
  return apiRequest<ForumPostsResponse>(
    `/forums/user/${userId}/posts${queryString}`
  );
}

// Search posts
export async function searchForumPosts(
  query: string,
  filters: ForumPostsQuery = {}
): Promise<ForumPostsResponse> {
  const searchQuery = { ...filters, q: query };
  const queryString = buildQueryString(searchQuery);
  return apiRequest<ForumPostsResponse>(`/forums/posts${queryString}`);
}

// Admin endpoints (require admin/moderator permissions)
export async function getForumReports(
  page: number = 1,
  limit: number = 20,
  status: string = "pending"
): Promise<{
  success: boolean;
  data: {
    reports: any[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
}> {
  const queryString = buildQueryString({ page, limit, status });
  return apiRequest(`/admin/forum/reports${queryString}`);
}

export async function updateForumReport(
  reportId: string,
  status: string,
  adminNotes?: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/admin/forum/reports/${reportId}`, {
    method: "PUT",
    body: JSON.stringify({ status, admin_notes: adminNotes }),
  });
}

export async function getForumAdminStats(timeframe: string = "30d"): Promise<{
  success: boolean;
  data: {
    posts: { total: number; new: number };
    replies: { total: number; new: number };
    reports: { pending: number; total: number };
    timeframe: string;
  };
}> {
  const queryString = buildQueryString({ timeframe });
  return apiRequest(`/admin/forum/stats${queryString}`);
}
