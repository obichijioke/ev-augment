// =============================================================================
// Voting Hook
// =============================================================================

import { useState, useCallback } from 'react';
import { VoteType } from '@/types/forum';
import { voteOnPost, voteOnReply } from '@/services/forumApi';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface VoteData {
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: VoteType | null;
}

interface UseVotingOptions {
  itemId: string;
  itemType: 'post' | 'reply';
  initialVoteData?: Partial<VoteData>;
  onVoteSuccess?: (voteData: VoteData) => void;
  onVoteError?: (error: string) => void;
}

interface UseVotingReturn {
  // State
  voteData: VoteData;
  isVoting: boolean;
  error: string | null;
  
  // Actions
  vote: (voteType: VoteType) => Promise<void>;
  clearError: () => void;
  updateVoteData: (newData: Partial<VoteData>) => void;
  
  // Computed values
  score: number;
  votePercentage: number;
  hasVoted: boolean;
  canVote: boolean;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useVoting(options: UseVotingOptions): UseVotingReturn {
  const {
    itemId,
    itemType,
    initialVoteData = {},
    onVoteSuccess,
    onVoteError,
  } = options;

  const [voteData, setVoteData] = useState<VoteData>({
    upvotes: initialVoteData.upvotes || 0,
    downvotes: initialVoteData.downvotes || 0,
    score: initialVoteData.score || 0,
    userVote: initialVoteData.userVote || null,
  });

  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vote action
  const vote = useCallback(async (voteType: VoteType) => {
    if (isVoting) return;

    setIsVoting(true);
    setError(null);

    try {
      let response;
      
      if (itemType === 'post') {
        response = await voteOnPost(itemId, voteType);
      } else {
        response = await voteOnReply(itemId, voteType);
      }

      const newVoteData: VoteData = {
        upvotes: response.data.upvotes,
        downvotes: response.data.downvotes,
        score: response.data.score,
        userVote: response.data.userVote,
      };

      setVoteData(newVoteData);
      onVoteSuccess?.(newVoteData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to vote';
      setError(errorMessage);
      onVoteError?.(errorMessage);
      console.error('Vote error:', err);
    } finally {
      setIsVoting(false);
    }
  }, [itemId, itemType, isVoting, onVoteSuccess, onVoteError]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Update vote data (for external updates)
  const updateVoteData = useCallback((newData: Partial<VoteData>) => {
    setVoteData(prev => ({ ...prev, ...newData }));
  }, []);

  // Computed values
  const score = voteData.upvotes - voteData.downvotes;
  const totalVotes = voteData.upvotes + voteData.downvotes;
  const votePercentage = totalVotes > 0 ? Math.round((voteData.upvotes / totalVotes) * 100) : 0;
  const hasVoted = voteData.userVote !== null;
  const canVote = !isVoting; // Add more conditions as needed (user permissions, etc.)

  return {
    // State
    voteData,
    isVoting,
    error,
    
    // Actions
    vote,
    clearError,
    updateVoteData,
    
    // Computed values
    score,
    votePercentage,
    hasVoted,
    canVote,
  };
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

// Hook for post voting
export function usePostVoting(
  postId: string,
  initialVoteData?: Partial<VoteData>,
  callbacks?: {
    onVoteSuccess?: (voteData: VoteData) => void;
    onVoteError?: (error: string) => void;
  }
) {
  return useVoting({
    itemId: postId,
    itemType: 'post',
    initialVoteData,
    onVoteSuccess: callbacks?.onVoteSuccess,
    onVoteError: callbacks?.onVoteError,
  });
}

// Hook for reply voting
export function useReplyVoting(
  replyId: string,
  initialVoteData?: Partial<VoteData>,
  callbacks?: {
    onVoteSuccess?: (voteData: VoteData) => void;
    onVoteError?: (error: string) => void;
  }
) {
  return useVoting({
    itemId: replyId,
    itemType: 'reply',
    initialVoteData,
    onVoteSuccess: callbacks?.onVoteSuccess,
    onVoteError: callbacks?.onVoteError,
  });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function calculateVoteScore(upvotes: number, downvotes: number): number {
  return upvotes - downvotes;
}

export function calculateVotePercentage(upvotes: number, downvotes: number): number {
  const total = upvotes + downvotes;
  return total > 0 ? Math.round((upvotes / total) * 100) : 0;
}

export function formatVoteCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export function getVoteColor(voteType: VoteType | null): string {
  switch (voteType) {
    case 'upvote':
      return 'text-green-600 dark:text-green-400';
    case 'downvote':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

export function getScoreColor(score: number): string {
  if (score > 0) return 'text-green-600 dark:text-green-400';
  if (score < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
}

// Vote trend analysis
export function getVoteTrend(
  currentScore: number,
  previousScore?: number
): 'up' | 'down' | 'stable' {
  if (previousScore === undefined) return 'stable';
  
  if (currentScore > previousScore) return 'up';
  if (currentScore < previousScore) return 'down';
  return 'stable';
}

// Vote quality indicators
export function getVoteQuality(upvotes: number, downvotes: number): {
  quality: 'excellent' | 'good' | 'mixed' | 'poor' | 'controversial';
  description: string;
} {
  const total = upvotes + downvotes;
  const percentage = total > 0 ? (upvotes / total) * 100 : 0;
  const score = upvotes - downvotes;

  if (total < 5) {
    return { quality: 'mixed', description: 'Not enough votes' };
  }

  if (percentage >= 90) {
    return { quality: 'excellent', description: 'Highly upvoted' };
  }

  if (percentage >= 70) {
    return { quality: 'good', description: 'Well received' };
  }

  if (percentage >= 40 && percentage <= 60) {
    return { quality: 'controversial', description: 'Mixed reactions' };
  }

  if (percentage < 30) {
    return { quality: 'poor', description: 'Poorly received' };
  }

  return { quality: 'mixed', description: 'Mixed feedback' };
}
