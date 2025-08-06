import { useState, useEffect } from "react";
import { blogLikesApi } from "../services/blogApi";
import { useAuthStore } from "../store/authStore";

interface UseBlogLikesOptions {
  postId?: string;
  autoLoad?: boolean;
}

interface UseBlogLikesReturn {
  isLiked: boolean;
  likeCount: number;
  isLoading: boolean;
  error: string | null;
  toggleLike: () => Promise<void>;
  checkLikeStatus: () => Promise<void>;
}

export const useBlogLikes = (
  options: UseBlogLikesOptions = {}
): UseBlogLikesReturn => {
  const { postId, autoLoad = true } = options;
  const { user, isAuthenticated } = useAuthStore();

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has liked this post and load like count
  const checkLikeStatus = async () => {
    if (!postId) return;

    try {
      setError(null);

      // Always load like count (public API)
      const stats = await blogLikesApi.getStats(postId);
      setLikeCount(stats.count);

      // Only check user's like status if authenticated
      if (isAuthenticated) {
        const liked = await blogLikesApi.check(postId);
        setIsLiked(liked);
      } else {
        setIsLiked(false);
      }
    } catch (err) {
      console.error("Failed to check like status:", err);
      setError("Failed to load like status");
    }
  };

  // Toggle like status
  const toggleLike = async () => {
    if (!postId || !isAuthenticated) {
      setError("Please log in to like posts");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await blogLikesApi.toggle(postId);
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch (err) {
      console.error("Failed to toggle like:", err);
      setError("Failed to update like status");
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial like status and count
  useEffect(() => {
    if (autoLoad && postId) {
      checkLikeStatus();
    }
  }, [postId, isAuthenticated, autoLoad]);

  return {
    isLiked,
    likeCount,
    isLoading,
    error,
    toggleLike,
    checkLikeStatus,
  };
};
