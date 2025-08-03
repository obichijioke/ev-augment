// =============================================================================
// User Profile Hook
// =============================================================================

import { useState, useCallback, useEffect } from 'react';
import { 
  UserForumProfile, 
  UserProfileUpdate,
  UserActivityFilters,
  UserActivityResponse,
  getUserForumProfile,
  updateUserProfile,
  getUserActivity,
  getUserPosts,
  getUserReplies,
  getUserAchievements,
  getUserStats,
  followUser,
  unfollowUser,
  getFollowStatus,
  reportUser,
  blockUser,
  unblockUser
} from '@/services/userProfileApi';
import { ForumPost, ForumReply } from '@/types/forum';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface UseUserProfileOptions {
  username: string;
  autoLoad?: boolean;
  includeActivity?: boolean;
  includeStats?: boolean;
}

interface UseUserProfileReturn {
  // Profile data
  profile: UserForumProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Activity data
  activity: UserActivityResponse | null;
  posts: ForumPost[];
  replies: ForumReply[];
  
  // Follow status
  followStatus: {
    isFollowing: boolean;
    followerCount: number;
    followingCount: number;
  } | null;
  
  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (updates: UserProfileUpdate) => Promise<void>;
  loadActivity: (filters?: UserActivityFilters) => Promise<void>;
  loadPosts: (page?: number, limit?: number) => Promise<void>;
  loadReplies: (page?: number, limit?: number) => Promise<void>;
  follow: () => Promise<void>;
  unfollow: () => Promise<void>;
  report: (reason: string, details?: string) => Promise<void>;
  block: () => Promise<void>;
  unblock: () => Promise<void>;
  
  // Utilities
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  isOwnProfile: boolean;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useUserProfile(options: UseUserProfileOptions): UseUserProfileReturn {
  const {
    username,
    autoLoad = true,
    includeActivity = true,
    includeStats = true,
  } = options;

  const [profile, setProfile] = useState<UserForumProfile | null>(null);
  const [activity, setActivity] = useState<UserActivityResponse | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [followStatus, setFollowStatus] = useState<{
    isFollowing: boolean;
    followerCount: number;
    followingCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if this is the current user's profile
  const currentUsername = localStorage.getItem('username'); // Assuming username is stored
  const isOwnProfile = currentUsername === username;

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!username) return;

    setIsLoading(true);
    setError(null);

    try {
      const profileData = await getUserForumProfile(username);
      setProfile(profileData);

      // Load follow status if not own profile
      if (!isOwnProfile) {
        try {
          const followData = await getFollowStatus(username);
          setFollowStatus(followData);
        } catch (err) {
          console.warn('Failed to load follow status:', err);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
      console.error('Profile loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [username, isOwnProfile]);

  // Update profile
  const updateProfile = useCallback(async (updates: UserProfileUpdate) => {
    if (!isOwnProfile) {
      throw new Error('Cannot update another user\'s profile');
    }

    setIsLoading(true);
    setError(null);

    try {
      await updateUserProfile(updates);
      await loadProfile(); // Refresh profile data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isOwnProfile, loadProfile]);

  // Load activity
  const loadActivity = useCallback(async (filters: UserActivityFilters = {}) => {
    if (!username) return;

    try {
      const activityData = await getUserActivity(username, filters);
      setActivity(activityData);
    } catch (err) {
      console.error('Failed to load activity:', err);
    }
  }, [username]);

  // Load posts
  const loadPosts = useCallback(async (page: number = 1, limit: number = 20) => {
    if (!username) return;

    try {
      const postsData = await getUserPosts(username, page, limit);
      setPosts(postsData.data.posts);
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  }, [username]);

  // Load replies
  const loadReplies = useCallback(async (page: number = 1, limit: number = 20) => {
    if (!username) return;

    try {
      const repliesData = await getUserReplies(username, page, limit);
      setReplies(repliesData.data.replies);
    } catch (err) {
      console.error('Failed to load replies:', err);
    }
  }, [username]);

  // Follow user
  const follow = useCallback(async () => {
    if (isOwnProfile) {
      throw new Error('Cannot follow yourself');
    }

    try {
      await followUser(username);
      setFollowStatus(prev => prev ? {
        ...prev,
        isFollowing: true,
        followerCount: prev.followerCount + 1,
      } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to follow user';
      setError(errorMessage);
      throw err;
    }
  }, [username, isOwnProfile]);

  // Unfollow user
  const unfollow = useCallback(async () => {
    if (isOwnProfile) {
      throw new Error('Cannot unfollow yourself');
    }

    try {
      await unfollowUser(username);
      setFollowStatus(prev => prev ? {
        ...prev,
        isFollowing: false,
        followerCount: prev.followerCount - 1,
      } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unfollow user';
      setError(errorMessage);
      throw err;
    }
  }, [username, isOwnProfile]);

  // Report user
  const report = useCallback(async (reason: string, details?: string) => {
    if (isOwnProfile) {
      throw new Error('Cannot report yourself');
    }

    try {
      await reportUser(username, reason, details);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to report user';
      setError(errorMessage);
      throw err;
    }
  }, [username, isOwnProfile]);

  // Block user
  const block = useCallback(async () => {
    if (isOwnProfile) {
      throw new Error('Cannot block yourself');
    }

    try {
      await blockUser(username);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to block user';
      setError(errorMessage);
      throw err;
    }
  }, [username, isOwnProfile]);

  // Unblock user
  const unblock = useCallback(async () => {
    if (isOwnProfile) {
      throw new Error('Cannot unblock yourself');
    }

    try {
      await unblockUser(username);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unblock user';
      setError(errorMessage);
      throw err;
    }
  }, [username, isOwnProfile]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    await loadProfile();
    if (includeActivity) {
      await loadActivity();
    }
  }, [loadProfile, loadActivity, includeActivity]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && username) {
      loadProfile();
      
      if (includeActivity) {
        loadActivity();
        loadPosts(1, 5); // Load recent posts
        loadReplies(1, 5); // Load recent replies
      }
    }
  }, [autoLoad, username, includeActivity, loadProfile, loadActivity, loadPosts, loadReplies]);

  return {
    // Profile data
    profile,
    isLoading,
    error,
    
    // Activity data
    activity,
    posts,
    replies,
    
    // Follow status
    followStatus,
    
    // Actions
    loadProfile,
    updateProfile,
    loadActivity,
    loadPosts,
    loadReplies,
    follow,
    unfollow,
    report,
    block,
    unblock,
    
    // Utilities
    refreshProfile,
    clearError,
    isOwnProfile,
  };
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

// Hook for basic profile info only
export function useBasicUserProfile(username: string) {
  return useUserProfile({
    username,
    autoLoad: true,
    includeActivity: false,
    includeStats: false,
  });
}

// Hook for full profile with all data
export function useFullUserProfile(username: string) {
  return useUserProfile({
    username,
    autoLoad: true,
    includeActivity: true,
    includeStats: true,
  });
}

// Hook for current user's own profile
export function useOwnProfile() {
  const currentUsername = localStorage.getItem('username') || '';
  
  return useUserProfile({
    username: currentUsername,
    autoLoad: !!currentUsername,
    includeActivity: true,
    includeStats: true,
  });
}
