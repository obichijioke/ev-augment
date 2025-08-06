// =============================================================================
// User Profile API Service
// =============================================================================

import { ForumPost, ForumReply } from "@/types/forum";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface UserForumProfile {
  userId: string;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  joinDate: string;
  lastActive: string;
  reputation: number;
  rank: number;
  stats: {
    totalPosts: number;
    totalReplies: number;
    totalUpvotes: number;
    totalDownvotes: number;
    totalScore: number;
    averageScore: number;
    helpfulnessRatio: number;
    daysActive: number;
    currentStreak: number;
    longestStreak: number;
  };
  activity: {
    postsThisWeek: number;
    postsThisMonth: number;
    repliesThisWeek: number;
    repliesThisMonth: number;
    votesGivenThisMonth: number;
    mostActiveDay: string;
    mostActiveHour: number;
    recentPosts: ForumPost[];
    recentReplies: ForumReply[];
  };
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    earnedDate: string;
    progress?: {
      current: number;
      target: number;
    };
  }>;
  topCategories: Array<{
    id: string;
    name: string;
    slug: string;
    postCount: number;
    replyCount: number;
    totalScore: number;
    averageScore: number;
  }>;
  milestones: Array<{
    id: string;
    type: 'reputation' | 'posts' | 'replies' | 'votes' | 'streak';
    milestone: number;
    achievedDate: string;
    description: string;
  }>;
}

export interface UserProfileUpdate {
  displayName?: string;
  bio?: string;
  avatar?: string;
  preferences?: {
    showEmail?: boolean;
    showLocation?: boolean;
    showStats?: boolean;
    emailNotifications?: boolean;
    forumDigest?: boolean;
  };
}

export interface UserActivityFilters {
  type?: 'posts' | 'replies' | 'votes' | 'all';
  timeRange?: 'week' | 'month' | 'year' | 'all';
  category?: string;
  sortBy?: 'date' | 'score' | 'replies' | 'views';
  page?: number;
  limit?: number;
}

export interface UserActivityResponse {
  success: boolean;
  data: {
    activities: Array<{
      id: string;
      type: 'post' | 'reply' | 'vote';
      title?: string;
      content: string;
      score: number;
      created_at: string;
      category?: {
        id: string;
        name: string;
        slug: string;
      };
      post?: {
        id: string;
        title: string;
        slug: string;
      };
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function makeProfileRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("token");
  
  const response = await fetch(`/api/users${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(errorData.message || `Request failed: ${response.statusText}`);
  }

  return response;
}

export async function getUserForumProfile(username: string): Promise<UserForumProfile> {
  try {
    const response = await makeProfileRequest(`/${username}/forum-profile`);
    const data = await response.json();
    return data.data.profile;
  } catch (error) {
    throw new Error(`Failed to get user forum profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateUserProfile(updates: UserProfileUpdate): Promise<void> {
  try {
    await makeProfileRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    throw new Error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getUserActivity(
  username: string,
  filters: UserActivityFilters = {}
): Promise<UserActivityResponse> {
  try {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `/${username}/activity${queryString ? `?${queryString}` : ''}`;
    
    const response = await makeProfileRequest(endpoint);
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to get user activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getUserPosts(
  username: string,
  page: number = 1,
  limit: number = 20
): Promise<{ success: boolean; data: { posts: ForumPost[]; pagination: any } }> {
  try {
    const response = await makeProfileRequest(`/${username}/posts?page=${page}&limit=${limit}`);
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to get user posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getUserReplies(
  username: string,
  page: number = 1,
  limit: number = 20
): Promise<{ success: boolean; data: { replies: ForumReply[]; pagination: any } }> {
  try {
    const response = await makeProfileRequest(`/${username}/replies?page=${page}&limit=${limit}`);
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to get user replies: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getUserAchievements(username: string): Promise<UserForumProfile['achievements']> {
  try {
    const response = await makeProfileRequest(`/${username}/achievements`);
    const data = await response.json();
    return data.data.achievements;
  } catch (error) {
    throw new Error(`Failed to get user achievements: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getUserStats(
  username: string,
  timeRange: 'week' | 'month' | 'year' | 'all' = 'all'
): Promise<UserForumProfile['stats']> {
  try {
    const response = await makeProfileRequest(`/${username}/stats?timeRange=${timeRange}`);
    const data = await response.json();
    return data.data.stats;
  } catch (error) {
    throw new Error(`Failed to get user stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function followUser(username: string): Promise<void> {
  try {
    await makeProfileRequest(`/${username}/follow`, {
      method: 'POST',
    });
  } catch (error) {
    throw new Error(`Failed to follow user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function unfollowUser(username: string): Promise<void> {
  try {
    await makeProfileRequest(`/${username}/unfollow`, {
      method: 'DELETE',
    });
  } catch (error) {
    throw new Error(`Failed to unfollow user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getFollowStatus(username: string): Promise<{ isFollowing: boolean; followerCount: number; followingCount: number }> {
  try {
    const response = await makeProfileRequest(`/${username}/follow-status`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    throw new Error(`Failed to get follow status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function reportUser(username: string, reason: string, details?: string): Promise<void> {
  try {
    await makeProfileRequest(`/${username}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, details }),
    });
  } catch (error) {
    throw new Error(`Failed to report user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function blockUser(username: string): Promise<void> {
  try {
    await makeProfileRequest(`/${username}/block`, {
      method: 'POST',
    });
  } catch (error) {
    throw new Error(`Failed to block user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function unblockUser(username: string): Promise<void> {
  try {
    await makeProfileRequest(`/${username}/unblock`, {
      method: 'DELETE',
    });
  } catch (error) {
    throw new Error(`Failed to unblock user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function calculateReputationLevel(reputation: number): {
  level: string;
  color: string;
  nextLevel: string;
  progress: number;
} {
  const levels = [
    { name: 'New Member', min: 0, max: 99, color: 'gray' },
    { name: 'Member', min: 100, max: 499, color: 'blue' },
    { name: 'Active Member', min: 500, max: 999, color: 'green' },
    { name: 'Trusted Member', min: 1000, max: 2499, color: 'purple' },
    { name: 'Expert', min: 2500, max: 4999, color: 'orange' },
    { name: 'Legend', min: 5000, max: Infinity, color: 'yellow' },
  ];

  const currentLevel = levels.find(level => reputation >= level.min && reputation <= level.max);
  const nextLevelIndex = levels.findIndex(level => level === currentLevel) + 1;
  const nextLevel = nextLevelIndex < levels.length ? levels[nextLevelIndex] : null;

  const progress = nextLevel 
    ? ((reputation - currentLevel!.min) / (nextLevel.min - currentLevel!.min)) * 100
    : 100;

  return {
    level: currentLevel?.name || 'Unknown',
    color: currentLevel?.color || 'gray',
    nextLevel: nextLevel?.name || 'Max Level',
    progress: Math.min(progress, 100),
  };
}

export function formatActivityDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`;
  } else if (diffInHours < 168) { // 7 days
    return `${Math.floor(diffInHours / 24)} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function getAchievementRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    case 'uncommon': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    case 'rare': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
    case 'epic': return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20';
    case 'legendary': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
    default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
  }
}
