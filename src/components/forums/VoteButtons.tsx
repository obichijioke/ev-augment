'use client';

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, TrendingUp } from 'lucide-react';
import { VoteType } from '@/types/forum';
import { voteOnPost, voteOnReply } from '@/services/forumApi';

interface VoteButtonsProps {
  itemId: string;
  itemType: 'post' | 'reply';
  initialUpvotes?: number;
  initialDownvotes?: number;
  initialUserVote?: VoteType | null;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  onVoteChange?: (voteData: {
    upvotes: number;
    downvotes: number;
    score: number;
    userVote: VoteType | null;
  }) => void;
  className?: string;
}

const VoteButtons = ({
  itemId,
  itemType,
  initialUpvotes = 0,
  initialDownvotes = 0,
  initialUserVote = null,
  showScore = true,
  size = 'md',
  orientation = 'vertical',
  disabled = false,
  onVoteChange,
  className = '',
}: VoteButtonsProps) => {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<VoteType | null>(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update state when props change
  useEffect(() => {
    setUpvotes(initialUpvotes);
    setDownvotes(initialDownvotes);
    setUserVote(initialUserVote);
  }, [initialUpvotes, initialDownvotes, initialUserVote]);

  const score = upvotes - downvotes;

  const handleVote = async (voteType: VoteType) => {
    if (disabled || isVoting) return;

    setIsVoting(true);
    setError(null);

    try {
      let response;
      
      if (itemType === 'post') {
        response = await voteOnPost(itemId, voteType);
      } else {
        response = await voteOnReply(itemId, voteType);
      }

      const voteData = {
        upvotes: response.data.upvotes,
        downvotes: response.data.downvotes,
        score: response.data.score,
        userVote: response.data.userVote,
      };

      setUpvotes(voteData.upvotes);
      setDownvotes(voteData.downvotes);
      setUserVote(voteData.userVote);

      onVoteChange?.(voteData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to vote';
      setError(errorMessage);
      console.error('Vote error:', err);
    } finally {
      setIsVoting(false);
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'p-1',
      icon: 'h-4 w-4',
      text: 'text-xs',
      gap: 'gap-1',
    },
    md: {
      button: 'p-2',
      icon: 'h-5 w-5',
      text: 'text-sm',
      gap: 'gap-2',
    },
    lg: {
      button: 'p-3',
      icon: 'h-6 w-6',
      text: 'text-base',
      gap: 'gap-3',
    },
  };

  const config = sizeConfig[size];

  // Button styles
  const getButtonStyle = (voteType: VoteType, isActive: boolean) => {
    const baseStyle = `${config.button} rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`;
    
    if (disabled) {
      return `${baseStyle} text-gray-400 dark:text-gray-600`;
    }

    if (isActive) {
      return voteType === 'upvote'
        ? `${baseStyle} text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30`
        : `${baseStyle} text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30`;
    }

    return `${baseStyle} text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800`;
  };

  // Score color based on value
  const getScoreColor = () => {
    if (score > 0) return 'text-green-600 dark:text-green-400';
    if (score < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  // Layout classes
  const containerClass = orientation === 'vertical' 
    ? `flex flex-col items-center ${config.gap}` 
    : `flex items-center ${config.gap}`;

  return (
    <div className={`vote-buttons ${containerClass} ${className}`}>
      {/* Upvote Button */}
      <button
        onClick={() => handleVote('upvote')}
        disabled={disabled || isVoting}
        className={getButtonStyle('upvote', userVote === 'upvote')}
        title={`Upvote${userVote === 'upvote' ? ' (active)' : ''}`}
        aria-label={`Upvote this ${itemType}`}
      >
        <ChevronUp className={config.icon} />
      </button>

      {/* Score Display */}
      {showScore && (
        <div className={`font-medium ${config.text} ${getScoreColor()} min-w-0 text-center`}>
          {orientation === 'horizontal' && (
            <TrendingUp className={`${config.icon} inline mr-1`} />
          )}
          <span className="tabular-nums">
            {Math.abs(score) >= 1000 
              ? `${(score / 1000).toFixed(1)}k` 
              : score.toString()
            }
          </span>
        </div>
      )}

      {/* Downvote Button */}
      <button
        onClick={() => handleVote('downvote')}
        disabled={disabled || isVoting}
        className={getButtonStyle('downvote', userVote === 'downvote')}
        title={`Downvote${userVote === 'downvote' ? ' (active)' : ''}`}
        aria-label={`Downvote this ${itemType}`}
      >
        <ChevronDown className={config.icon} />
      </button>

      {/* Loading Indicator */}
      {isVoting && (
        <div className={`${config.text} text-gray-500 dark:text-gray-400`}>
          <div className="animate-spin h-3 w-3 border border-gray-400 border-t-transparent rounded-full mx-auto"></div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={`${config.text} text-red-600 dark:text-red-400 text-center max-w-20`}>
          <span className="text-xs">Error</span>
        </div>
      )}

      {/* Vote Breakdown (for larger sizes) */}
      {size === 'lg' && orientation === 'vertical' && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center space-y-1">
          <div className="flex items-center justify-center gap-1">
            <ChevronUp className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span>{upvotes}</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <ChevronDown className="h-3 w-3 text-red-600 dark:text-red-400" />
            <span>{downvotes}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoteButtons;
