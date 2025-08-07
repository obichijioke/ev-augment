// Blog API service for backend communication
import { BlogPost, Comment } from "@/types/blog";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

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
      errorData.error?.message ||
        errorData.message ||
        `HTTP error! status: ${response.status}`
    );
  }

  const data = await response.json();
  return data.data || data;
};

// Helper function to calculate read time
const calculateReadTime = (content: string): number => {
  if (!content || typeof content !== "string") {
    return 1; // Default to 1 minute if content is invalid
  }
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

// Helper function to transform backend blog post to frontend format
const transformBlogPost = (backendPost: any): BlogPost => {
  return {
    id: backendPost.id,
    title: backendPost.title,
    slug: backendPost.slug,
    content: backendPost.content,
    author: {
      id:
        backendPost.users?.id ||
        backendPost.author?.id ||
        backendPost.author_id,
      name:
        backendPost.users?.full_name ||
        backendPost.author?.full_name ||
        "Unknown Author",
      avatar:
        backendPost.users?.avatar_url &&
        backendPost.users.avatar_url.trim() !== ""
          ? backendPost.users.avatar_url
          : backendPost.author?.avatar_url &&
            backendPost.author.avatar_url.trim() !== ""
          ? backendPost.author.avatar_url
          : "/default-avatar.png",
      username:
        backendPost.users?.username ||
        backendPost.author?.username ||
        "unknown",
      bio: backendPost.users?.bio || backendPost.author?.bio || "",
    },
    publishedAt: backendPost.published_at || backendPost.created_at,
    updatedAt: backendPost.updated_at,
    readTime: calculateReadTime(backendPost.content),
    category: backendPost.category || "Uncategorized",
    tags: backendPost.tags || [],
    featuredImage:
      backendPost.featured_image && backendPost.featured_image.trim() !== ""
        ? backendPost.featured_image
        : "/default-blog-image.jpg",
    views: backendPost.view_count || backendPost.views || 0,
    likes: backendPost.like_count || 0,
    bookmarks: 0, // Not implemented in backend yet
    comments: [], // Will be loaded separately
    excerpt: backendPost.excerpt,
    status: backendPost.status,
  };
};

// Helper function to transform backend comment to frontend format
const transformComment = (backendComment: any): Comment => {
  return {
    id: backendComment.id,
    author: {
      name:
        backendComment.users?.full_name ||
        backendComment.author?.full_name ||
        "Unknown Author",
      avatar:
        backendComment.users?.avatar_url &&
        backendComment.users.avatar_url.trim() !== ""
          ? backendComment.users.avatar_url
          : backendComment.author?.avatar_url &&
            backendComment.author.avatar_url.trim() !== ""
          ? backendComment.author.avatar_url
          : "/default-avatar.png",
      username:
        backendComment.users?.username ||
        backendComment.author?.username ||
        "unknown",
    },
    content: backendComment.content,
    publishedAt: backendComment.created_at,
    likes: backendComment.like_count || 0,
    replies: backendComment.replies
      ? backendComment.replies.map(transformComment)
      : [],
  };
};

// =============================================================================
// BLOG POSTS API
// =============================================================================

export const blogPostsApi = {
  // Get all blog posts with filters and pagination
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
    author?: string;
    sort?: string;
    sortBy?: string;
    q?: string;
    status?: string;
  }): Promise<{
    posts: BlogPost[];
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

    const response = await fetch(`${API_BASE_URL}/blog/posts?${searchParams}`, {
      headers: createHeaders(),
    });

    const responseData = await handleResponse<any>(response);

    return {
      posts: responseData.posts?.map(transformBlogPost) || [],
      pagination: responseData.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
    };
  },

  // Get single blog post by slug
  getBySlug: async (
    slug: string
  ): Promise<{
    post: BlogPost;
    relatedPosts: BlogPost[];
  }> => {
    const response = await fetch(`${API_BASE_URL}/blog/posts/${slug}`, {
      headers: createHeaders(),
    });

    const responseData = await handleResponse<any>(response);

    return {
      post: transformBlogPost(responseData.post),
      relatedPosts: responseData.related_posts?.map(transformBlogPost) || [],
    };
  },

  // Get single blog post by ID (for editing)
  getById: async (id: string): Promise<BlogPost> => {
    const response = await fetch(`${API_BASE_URL}/blog/posts/by-id/${id}`, {
      headers: createHeaders(true),
    });

    const responseData = await handleResponse<any>(response);
    return transformBlogPost(responseData.post);
  },

  // Create new blog post (Moderator only)
  create: async (postData: {
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    featured_image?: string;
    category?: string;
    tags?: string[];
    status?: "draft" | "published" | "archived";
    is_featured?: boolean;
    published_at?: string;
  }): Promise<BlogPost> => {
    const response = await fetch(`${API_BASE_URL}/blog/posts`, {
      method: "POST",
      headers: createHeaders(true),
      body: JSON.stringify(postData),
    });

    const responseData = await handleResponse<any>(response);
    return transformBlogPost(responseData.post);
  },

  // Update blog post (Author or Moderator)
  update: async (
    id: string,
    postData: {
      title?: string;
      slug?: string;
      excerpt?: string;
      content?: string;
      featured_image?: string;
      category?: string;
      tags?: string[];
      status?: "draft" | "published" | "archived";
      is_featured?: boolean;
      published_at?: string;
    }
  ): Promise<BlogPost> => {
    const response = await fetch(`${API_BASE_URL}/blog/posts/${id}`, {
      method: "PUT",
      headers: createHeaders(true),
      body: JSON.stringify(postData),
    });

    const responseData = await handleResponse<any>(response);
    return transformBlogPost(responseData.post);
  },

  // Delete blog post (Author or Moderator)
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/blog/posts/${id}`, {
      method: "DELETE",
      headers: createHeaders(true),
    });

    await handleResponse<any>(response);
  },
};

// =============================================================================
// BLOG SEARCH API
// =============================================================================

export const blogSearchApi = {
  // Search blog posts
  search: async (params: {
    q: string;
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
  }): Promise<{
    posts: BlogPost[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    query: string;
  }> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(
      `${API_BASE_URL}/blog/search?${searchParams}`,
      {
        headers: createHeaders(),
      }
    );

    const responseData = await handleResponse<any>(response);

    return {
      posts: responseData.posts?.map(transformBlogPost) || [],
      pagination: responseData.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
      query: responseData.query || params.q,
    };
  },
};

// =============================================================================
// BLOG CATEGORIES API
// =============================================================================

export const blogCategoriesApi = {
  // Get all categories with post counts
  getAll: async (): Promise<
    Array<{
      name: string;
      post_count: number;
    }>
  > => {
    const response = await fetch(`${API_BASE_URL}/blog/categories`, {
      headers: createHeaders(),
    });

    const responseData = await handleResponse<any>(response);
    return responseData.categories || [];
  },
};

// =============================================================================
// BLOG TAGS API
// =============================================================================

export const blogTagsApi = {
  // Get all tags with post counts
  getAll: async (): Promise<
    Array<{
      name: string;
      post_count: number;
    }>
  > => {
    const response = await fetch(`${API_BASE_URL}/blog/tags`, {
      headers: createHeaders(),
    });

    const responseData = await handleResponse<any>(response);
    return responseData.tags || [];
  },
};

// =============================================================================
// BLOG AUTHOR API
// =============================================================================

export const blogAuthorApi = {
  // Get posts by author
  getPostsByAuthor: async (
    authorId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{
    posts: BlogPost[];
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
      `${API_BASE_URL}/blog/author/${authorId}?${searchParams}`,
      {
        headers: createHeaders(),
      }
    );

    const responseData = await handleResponse<any>(response);

    return {
      posts: responseData.posts?.map(transformBlogPost) || [],
      pagination: responseData.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
    };
  },
};

// =============================================================================
// BLOG COMMENTS API
// =============================================================================

export const blogCommentsApi = {
  // Get comments for a blog post
  getByPostId: async (
    postId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{
    comments: Comment[];
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
      `${API_BASE_URL}/blog/posts/${postId}/comments?${searchParams}`,
      {
        headers: createHeaders(),
      }
    );

    const responseData = await handleResponse<any>(response);

    return {
      comments: responseData.comments?.map(transformComment) || [],
      pagination: responseData.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
    };
  },

  // Create new comment
  create: async (
    postId: string,
    commentData: {
      content: string;
      parent_id?: string;
    }
  ): Promise<Comment> => {
    const response = await fetch(
      `${API_BASE_URL}/blog/posts/${postId}/comments`,
      {
        method: "POST",
        headers: createHeaders(true),
        body: JSON.stringify(commentData),
      }
    );

    const responseData = await handleResponse<any>(response);
    return transformComment(responseData.comment);
  },

  // Update comment
  update: async (
    commentId: string,
    commentData: {
      content: string;
    }
  ): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/blog/comments/${commentId}`, {
      method: "PUT",
      headers: createHeaders(true),
      body: JSON.stringify(commentData),
    });

    const responseData = await handleResponse<any>(response);
    return transformComment(responseData.comment);
  },

  // Delete comment
  delete: async (commentId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/blog/comments/${commentId}`, {
      method: "DELETE",
      headers: createHeaders(true),
    });

    await handleResponse<any>(response);
  },
};

// =============================================================================
// BLOG API INFO
// =============================================================================

export const blogApi = {
  // Get blog API information
  getInfo: async (): Promise<{
    message: string;
    endpoints: Record<string, string>;
  }> => {
    const response = await fetch(`${API_BASE_URL}/blog`, {
      headers: createHeaders(),
    });

    return handleResponse<any>(response);
  },
};

// =============================================================================
// CONSOLIDATED EXPORT
// =============================================================================

// Export all APIs as a single object for convenience
export const blogApiService = {
  posts: blogPostsApi,
  search: blogSearchApi,
  categories: blogCategoriesApi,
  tags: blogTagsApi,
  author: blogAuthorApi,
  comments: blogCommentsApi,
  info: blogApi,
};

// =============================================================================
// BLOG LIKES API
// =============================================================================

export const blogLikesApi = {
  // Toggle like for a blog post
  toggle: async (
    postId: string
  ): Promise<{ liked: boolean; likeCount: number }> => {
    const response = await fetch(`${API_BASE_URL}/likes`, {
      method: "POST",
      headers: createHeaders(true),
      body: JSON.stringify({
        entity_type: "blog_post",
        entity_id: postId,
      }),
    });

    const responseData = await handleResponse<any>(response);
    return {
      liked: responseData.liked,
      likeCount: responseData.like_count || 0,
    };
  },

  // Check if user has liked a blog post
  check: async (postId: string): Promise<boolean> => {
    const response = await fetch(
      `${API_BASE_URL}/likes/check/blog_post/${postId}`,
      {
        headers: createHeaders(true),
      }
    );

    if (response.status === 401) {
      return false; // User not authenticated
    }

    const responseData = await handleResponse<any>(response);
    return responseData.data?.has_liked || false;
  },

  // Get like statistics for a blog post
  getStats: async (
    postId: string
  ): Promise<{ count: number; recentLikes: any[] }> => {
    const response = await fetch(
      `${API_BASE_URL}/likes/stats/blog_post/${postId}`,
      {
        headers: createHeaders(),
      }
    );

    const responseData = await handleResponse<any>(response);
    return {
      count: responseData.stats?.total_likes || 0,
      recentLikes: responseData.recent_likes || [],
    };
  },
};

// Individual APIs are already exported above

// Default export
export default blogApiService;
