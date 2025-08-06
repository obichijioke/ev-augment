'use client';

import { useState, useCallback, useEffect } from 'react';
import { Comment } from '@/types/blog';
import { blogCommentsApi } from '@/services/blogApi';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface CreateCommentData {
  content: string;
  parent_id?: string;
}

interface UpdateCommentData {
  content: string;
}

interface CommentPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UseBlogCommentsOptions {
  postId?: string;
  autoLoad?: boolean;
  initialPage?: number;
  initialLimit?: number;
  onCreateSuccess?: (comment: Comment) => void;
  onUpdateSuccess?: (comment: Comment) => void;
  onDeleteSuccess?: (commentId: string) => void;
  onError?: (error: string) => void;
}

interface UseBlogCommentsReturn {
  // Data
  comments: Comment[];
  pagination: CommentPagination;
  
  // State
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // Actions
  loadComments: (postId: string, page?: number) => Promise<void>;
  createComment: (postId: string, commentData: CreateCommentData) => Promise<Comment | null>;
  updateComment: (commentId: string, commentData: UpdateCommentData) => Promise<Comment | null>;
  deleteComment: (commentId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  setPage: (page: number) => void;
  clearError: () => void;
  clearComments: () => void;
  
  // Utilities
  getCommentById: (commentId: string) => Comment | null;
  getCommentReplies: (parentId: string) => Comment[];
  getTotalComments: () => number;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export const useBlogComments = (options: UseBlogCommentsOptions = {}): UseBlogCommentsReturn => {
  const {
    postId,
    autoLoad = true,
    initialPage = 1,
    initialLimit = 20,
    onCreateSuccess,
    onUpdateSuccess,
    onDeleteSuccess,
    onError,
  } = options;

  // State
  const [comments, setComments] = useState<Comment[]>([]);
  const [pagination, setPagination] = useState<CommentPagination>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Error handling
  const handleError = useCallback((err: any) => {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    setError(errorMessage);
    onError?.(errorMessage);
    console.error('Blog comments hook error:', err);
  }, [onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearComments = useCallback(() => {
    setComments([]);
    setPagination({
      page: 1,
      limit: initialLimit,
      total: 0,
      pages: 0,
    });
  }, [initialLimit]);

  // Load comments for a post
  const loadComments = useCallback(async (targetPostId: string, page: number = 1) => {
    try {
      setIsLoading(true);
      clearError();

      const response = await blogCommentsApi.getByPostId(targetPostId, {
        page,
        limit: pagination.limit,
      });

      if (page === 1) {
        setComments(response.comments);
      } else {
        // Append for pagination
        setComments(prev => [...prev, ...response.comments]);
      }
      
      setPagination(response.pagination);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit, handleError, clearError]);

  // Create new comment
  const createComment = useCallback(async (
    targetPostId: string, 
    commentData: CreateCommentData
  ): Promise<Comment | null> => {
    try {
      setIsCreating(true);
      clearError();

      const newComment = await blogCommentsApi.create(targetPostId, commentData);
      
      // Add to local state
      if (commentData.parent_id) {
        // Handle nested reply
        setComments(prev => prev.map(comment => {
          if (comment.id === commentData.parent_id) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment],
            };
          }
          return comment;
        }));
      } else {
        // Add as top-level comment
        setComments(prev => [newComment, ...prev]);
        setPagination(prev => ({ ...prev, total: prev.total + 1 }));
      }
      
      onCreateSuccess?.(newComment);
      return newComment;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [handleError, clearError, onCreateSuccess]);

  // Update comment
  const updateComment = useCallback(async (
    commentId: string, 
    commentData: UpdateCommentData
  ): Promise<Comment | null> => {
    try {
      setIsUpdating(true);
      clearError();

      const updatedComment = await blogCommentsApi.update(commentId, commentData);
      
      // Update local state
      const updateCommentInList = (commentsList: Comment[]): Comment[] => {
        return commentsList.map(comment => {
          if (comment.id === commentId) {
            return updatedComment;
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: updateCommentInList(comment.replies),
            };
          }
          return comment;
        });
      };
      
      setComments(prev => updateCommentInList(prev));
      onUpdateSuccess?.(updatedComment);
      return updatedComment;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [handleError, clearError, onUpdateSuccess]);

  // Delete comment
  const deleteComment = useCallback(async (commentId: string): Promise<void> => {
    try {
      setIsDeleting(true);
      clearError();

      await blogCommentsApi.delete(commentId);
      
      // Remove from local state
      const removeCommentFromList = (commentsList: Comment[]): Comment[] => {
        return commentsList.filter(comment => {
          if (comment.id === commentId) {
            return false;
          }
          if (comment.replies) {
            comment.replies = removeCommentFromList(comment.replies);
          }
          return true;
        });
      };
      
      setComments(prev => removeCommentFromList(prev));
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      onDeleteSuccess?.(commentId);
    } catch (err) {
      handleError(err);
    } finally {
      setIsDeleting(false);
    }
  }, [handleError, clearError, onDeleteSuccess]);

  // Load more comments (pagination)
  const loadMore = useCallback(async () => {
    if (!postId || pagination.page >= pagination.pages) return;
    
    await loadComments(postId, pagination.page + 1);
  }, [postId, pagination.page, pagination.pages, loadComments]);

  // Set page
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // Utility functions
  const getCommentById = useCallback((commentId: string): Comment | null => {
    const findComment = (commentsList: Comment[]): Comment | null => {
      for (const comment of commentsList) {
        if (comment.id === commentId) {
          return comment;
        }
        if (comment.replies) {
          const found = findComment(comment.replies);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findComment(comments);
  }, [comments]);

  const getCommentReplies = useCallback((parentId: string): Comment[] => {
    const parentComment = getCommentById(parentId);
    return parentComment?.replies || [];
  }, [getCommentById]);

  const getTotalComments = useCallback((): number => {
    const countComments = (commentsList: Comment[]): number => {
      return commentsList.reduce((total, comment) => {
        return total + 1 + (comment.replies ? countComments(comment.replies) : 0);
      }, 0);
    };
    
    return countComments(comments);
  }, [comments]);

  // Auto-load comments if postId is provided
  useEffect(() => {
    if (autoLoad && postId) {
      loadComments(postId);
    }
  }, [autoLoad, postId, loadComments]);

  return {
    // Data
    comments,
    pagination,
    
    // State
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    
    // Actions
    loadComments,
    createComment,
    updateComment,
    deleteComment,
    loadMore,
    setPage,
    clearError,
    clearComments,
    
    // Utilities
    getCommentById,
    getCommentReplies,
    getTotalComments,
  };
};

export default useBlogComments;
