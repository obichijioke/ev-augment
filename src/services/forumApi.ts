// Forum API service for backend communication
import {
  ForumCategory,
  ForumThread,
  ForumReply,
  ForumImage,
  CreateThreadRequest,
  CreateReplyRequest,
} from "@/types/forum";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.session?.accessToken || null;
      }
    } catch (error) {
      console.error("Error parsing auth storage:", error);
    }
  }
  return null;
};

// Helper function to create headers
const createHeaders = (includeAuth: boolean = false): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Network error" }));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  const data = await response.json();
  return data.data || data; // Return the data field if it exists, otherwise return the whole response
};

// =============================================================================
// CATEGORIES API
// =============================================================================

export const categoriesApi = {
  // Get all categories
  getAll: async (): Promise<ForumCategory[]> => {
    const response = await fetch(`${API_BASE_URL}/forum/categories`, {
      headers: createHeaders(),
    });
    return handleResponse<ForumCategory[]>(response);
  },

  // Create new category (Admin only)
  create: async (categoryData: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    slug: string;
    sort_order?: number;
  }): Promise<ForumCategory> => {
    const response = await fetch(`${API_BASE_URL}/forum/categories`, {
      method: "POST",
      headers: createHeaders(true),
      body: JSON.stringify(categoryData),
    });
    return handleResponse<ForumCategory>(response);
  },
};

// =============================================================================
// THREADS API
// =============================================================================

export const threadsApi = {
  // Get threads with filters
  getAll: async (params?: {
    q?: string;
    category_id?: string;
    author_id?: string;
    sort?: "newest" | "oldest" | "most_replies" | "most_views";
    page?: number;
    limit?: number;
  }): Promise<{
    data: ForumThread[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/forum/threads?${searchParams}`,
      {
        headers: createHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Network error" }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const responseData = await response.json();
    return {
      data: responseData.data || [],
      pagination: responseData.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
    };
  },

  // Get single thread with replies
  getById: async (id: string): Promise<ForumThread> => {
    const response = await fetch(`${API_BASE_URL}/forum/threads/${id}`, {
      headers: createHeaders(),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Network error" }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const responseData = await response.json();
    const threadData = responseData.data;

    // Transform images to match the expected interface
    if (threadData.images) {
      threadData.images = threadData.images.map((img: any) => {
        const constructedUrl = `https://rszqdjbjswwfparbzfyi.supabase.co/storage/v1/object/public/forum-images/${img.storage_path}`;

        const transformedImg = {
          id: img.id,
          url: img.public_url || constructedUrl,
          filename: img.filename || img.original_filename,
          size: img.file_size,
          mimeType: img.mime_type,
          alt: img.alt_text,
        };
        return transformedImg;
      });
    }

    // Transform replies to include proper author object structure
    if (threadData.replies) {
      const transformReplies = (replies: any[]): any[] => {
        return replies.map((reply: any) => ({
          ...reply,
          author: {
            id: reply.author_id,
            username: reply.author_username,
            displayName: reply.author_name || reply.author_username,
            avatar: reply.author_avatar,
            isVerified: false, // Default to false for now
          },
          images: reply.images
            ? reply.images.map((img: any) => {
                const constructedUrl = `https://rszqdjbjswwfparbzfyi.supabase.co/storage/v1/object/public/forum-images/${img.storage_path}`;
                return {
                  id: img.id,
                  url: img.public_url || constructedUrl,
                  filename: img.filename || img.original_filename,
                  size: img.file_size,
                  mimeType: img.mime_type,
                  alt: img.alt_text,
                };
              })
            : [],
          createdAt: reply.created_at,
          updatedAt: reply.updated_at,
          isEdited: reply.updated_at !== reply.created_at,
          editedAt:
            reply.updated_at !== reply.created_at ? reply.updated_at : null,
          replies: reply.replies ? transformReplies(reply.replies) : [],
        }));
      };

      threadData.replies = transformReplies(threadData.replies);
    }

    return threadData;
  },

  // Create new thread
  create: async (threadData: CreateThreadRequest): Promise<ForumThread> => {
    const response = await fetch(`${API_BASE_URL}/forum/threads`, {
      method: "POST",
      headers: createHeaders(true),
      body: JSON.stringify(threadData),
    });
    return handleResponse<ForumThread>(response);
  },

  // Update thread
  update: async (
    id: string,
    threadData: Partial<{
      title: string;
      content: string;
      is_pinned: boolean;
      is_locked: boolean;
    }>
  ): Promise<ForumThread> => {
    const response = await fetch(`${API_BASE_URL}/forum/threads/${id}`, {
      method: "PUT",
      headers: createHeaders(true),
      body: JSON.stringify(threadData),
    });
    return handleResponse<ForumThread>(response);
  },

  // Delete thread
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/forum/threads/${id}`, {
      method: "DELETE",
      headers: createHeaders(true),
    });
    await handleResponse(response);
  },
};

// =============================================================================
// REPLIES API
// =============================================================================

export const repliesApi = {
  // Create new reply
  create: async (replyData: CreateReplyRequest): Promise<ForumReply> => {
    const response = await fetch(`${API_BASE_URL}/forum/replies`, {
      method: "POST",
      headers: createHeaders(true),
      body: JSON.stringify(replyData),
    });
    return handleResponse<ForumReply>(response);
  },

  // Update reply
  update: async (
    id: string,
    replyData: { content: string }
  ): Promise<ForumReply> => {
    const response = await fetch(`${API_BASE_URL}/forum/replies/${id}`, {
      method: "PUT",
      headers: createHeaders(true),
      body: JSON.stringify(replyData),
    });
    return handleResponse<ForumReply>(response);
  },

  // Delete reply
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/forum/replies/${id}`, {
      method: "DELETE",
      headers: createHeaders(true),
    });
    await handleResponse(response);
  },
};

// =============================================================================
// IMAGES API
// =============================================================================

export const imagesApi = {
  // Upload image
  upload: async (
    file: File,
    threadId?: string,
    replyId?: string,
    altText?: string
  ): Promise<ForumImage> => {
    const formData = new FormData();
    formData.append("image", file);
    if (threadId) formData.append("thread_id", threadId);
    if (replyId) formData.append("reply_id", replyId);
    if (altText) formData.append("alt_text", altText);

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/forum/images/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    return handleResponse<ForumImage>(response);
  },

  // Get image details
  getById: async (id: string): Promise<ForumImage> => {
    const response = await fetch(`${API_BASE_URL}/forum/images/${id}`, {
      headers: createHeaders(),
    });
    return handleResponse<ForumImage>(response);
  },

  // Delete image
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/forum/images/${id}`, {
      method: "DELETE",
      headers: createHeaders(true),
    });
    await handleResponse(response);
  },

  // Get thread images
  getByThread: async (threadId: string): Promise<ForumImage[]> => {
    const response = await fetch(
      `${API_BASE_URL}/forum/images/thread/${threadId}`,
      {
        headers: createHeaders(),
      }
    );
    return handleResponse<ForumImage[]>(response);
  },

  // Get reply images
  getByReply: async (replyId: string): Promise<ForumImage[]> => {
    const response = await fetch(
      `${API_BASE_URL}/forum/images/reply/${replyId}`,
      {
        headers: createHeaders(),
      }
    );
    return handleResponse<ForumImage[]>(response);
  },
};

// =============================================================================
// MODERATION API
// =============================================================================

export const moderationApi = {
  // Get users (Admin only)
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/forum/moderation/users?${searchParams}`,
      {
        headers: createHeaders(true),
      }
    );
    return handleResponse(response);
  },

  // Update user role (Admin only)
  updateUserRole: async (
    userId: string,
    forumRole: "user" | "moderator" | "admin"
  ): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/forum/moderation/users/${userId}/role`,
      {
        method: "PUT",
        headers: createHeaders(true),
        body: JSON.stringify({ forum_role: forumRole }),
      }
    );
    return handleResponse(response);
  },

  // Moderate thread
  moderateThread: async (
    threadId: string,
    action: "pin" | "unpin" | "lock" | "unlock" | "delete" | "restore",
    reason?: string
  ): Promise<ForumThread> => {
    const response = await fetch(
      `${API_BASE_URL}/forum/moderation/threads/${threadId}/action`,
      {
        method: "POST",
        headers: createHeaders(true),
        body: JSON.stringify({ action, reason }),
      }
    );
    return handleResponse<ForumThread>(response);
  },

  // Moderate reply
  moderateReply: async (
    replyId: string,
    action: "delete" | "restore",
    reason?: string
  ): Promise<ForumReply> => {
    const response = await fetch(
      `${API_BASE_URL}/forum/moderation/replies/${replyId}/action`,
      {
        method: "POST",
        headers: createHeaders(true),
        body: JSON.stringify({ action, reason }),
      }
    );
    return handleResponse<ForumReply>(response);
  },

  // Get forum statistics
  getStats: async (): Promise<{
    totals: {
      threads: number;
      replies: number;
      users: number;
    };
    recent: {
      threads: number;
      replies: number;
    };
    categories: any[];
  }> => {
    const response = await fetch(`${API_BASE_URL}/forum/moderation/stats`, {
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },
};

// Export all APIs as a single object for convenience
export const forumApi = {
  categories: categoriesApi,
  threads: threadsApi,
  replies: repliesApi,
  images: imagesApi,
  moderation: moderationApi,
};
