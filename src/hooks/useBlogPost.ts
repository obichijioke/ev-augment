"use client";

import { useState, useCallback, useEffect } from "react";
import { BlogPost } from "@/types/blog";
import { blogPostsApi } from "@/services/blogApi";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface CreatePostData {
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
}

interface UpdatePostData {
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

interface UseBlogPostOptions {
  slug?: string;
  id?: string;
  autoLoad?: boolean;
  onCreateSuccess?: (post: BlogPost) => void;
  onUpdateSuccess?: (post: BlogPost) => void;
  onDeleteSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseBlogPostReturn {
  // Data
  post: BlogPost | null;
  relatedPosts: BlogPost[];

  // State
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // Actions
  loadPost: (slug: string) => Promise<void>;
  loadPostById: (id: string) => Promise<void>;
  createPost: (postData: CreatePostData) => Promise<BlogPost | null>;
  updatePost: (
    id: string,
    postData: UpdatePostData
  ) => Promise<BlogPost | null>;
  deletePost: (id: string) => Promise<void>;
  clearError: () => void;
  clearPost: () => void;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export const useBlogPost = (
  options: UseBlogPostOptions = {}
): UseBlogPostReturn => {
  const {
    slug,
    id,
    autoLoad = true,
    onCreateSuccess,
    onUpdateSuccess,
    onDeleteSuccess,
    onError,
  } = options;

  // State
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Error handling
  const handleError = useCallback(
    (err: any) => {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      onError?.(errorMessage);
      console.error("Blog post hook error:", err);
    },
    [onError]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearPost = useCallback(() => {
    setPost(null);
    setRelatedPosts([]);
  }, []);

  // Load single post by slug
  const loadPost = useCallback(
    async (postSlug: string) => {
      try {
        setIsLoading(true);
        clearError();

        const response = await blogPostsApi.getBySlug(postSlug);
        setPost(response.post);
        setRelatedPosts(response.relatedPosts);
      } catch (err) {
        handleError(err);
        setPost(null);
        setRelatedPosts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError]
  );

  // Load single post by ID (for editing)
  const loadPostById = useCallback(
    async (postId: string) => {
      try {
        setIsLoading(true);
        clearError();

        const postData = await blogPostsApi.getById(postId);
        setPost(postData);
        setRelatedPosts([]); // No related posts needed for editing
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError]
  );

  // Create new post
  const createPost = useCallback(
    async (postData: CreatePostData): Promise<BlogPost | null> => {
      try {
        setIsCreating(true);
        clearError();

        const newPost = await blogPostsApi.create(postData);
        onCreateSuccess?.(newPost);
        return newPost;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [handleError, clearError, onCreateSuccess]
  );

  // Update existing post
  const updatePost = useCallback(
    async (id: string, postData: UpdatePostData): Promise<BlogPost | null> => {
      try {
        setIsUpdating(true);
        clearError();

        const updatedPost = await blogPostsApi.update(id, postData);

        // Update local state if this is the currently loaded post
        if (post && post.id === id) {
          setPost(updatedPost);
        }

        onUpdateSuccess?.(updatedPost);
        return updatedPost;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [post, handleError, clearError, onUpdateSuccess]
  );

  // Delete post
  const deletePost = useCallback(
    async (id: string): Promise<void> => {
      try {
        setIsDeleting(true);
        clearError();

        await blogPostsApi.delete(id);

        // Clear local state if this is the currently loaded post
        if (post && post.id === id) {
          clearPost();
        }

        onDeleteSuccess?.();
      } catch (err) {
        handleError(err);
      } finally {
        setIsDeleting(false);
      }
    },
    [post, handleError, clearError, clearPost, onDeleteSuccess]
  );

  // Auto-load post if slug or id is provided
  useEffect(() => {
    if (autoLoad) {
      if (slug) {
        loadPost(slug);
      } else if (id) {
        loadPostById(id);
      }
    }
  }, [autoLoad, slug, id, loadPost, loadPostById]);

  return {
    // Data
    post,
    relatedPosts,

    // State
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,

    // Actions
    loadPost,
    loadPostById,
    createPost,
    updatePost,
    deletePost,
    clearError,
    clearPost,
  };
};

export default useBlogPost;
