'use client';

import { TrendingUp, TrendingDown, BarChart3, Users, ThumbsUp, ThumbsDown } from 'lucide-react';
import { calculateVotePercentage, getVoteQuality, formatVoteCount } from '@/hooks/useVoting';

interface VoteSummaryProps {
  upvotes: number;
  downvotes: number;
  showDetails?: boolean;
  showTrend?: boolean;
  previousScore?: number;
  className?: string;
}

const VoteSummary = ({
  upvotes,
  downvotes,
  showDetails = false,
  showTrend = false,
  previousScore,
  className = '',
}: VoteSummaryProps) => {
  const totalVotes = upvotes + downvotes;
  const score = upvotes - downvotes;
  const percentage = calculateVotePercentage(upvotes, downvotes);
  const quality = getVoteQuality(upvotes, downvotes);

  // Calculate trend
  const trend = showTrend && previousScore !== undefined
    ? score > previousScore ? 'up' : score < previousScore ? 'down' : 'stable'
    : null;

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default: return null;
    }
  };

  const getQualityColor = () => {
    switch (quality.quality) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'good': return 'text-blue-600 dark:text-blue-400';
      case 'mixed': return 'text-yellow-600 dark:text-yellow-400';
      case 'controversial': return 'text-orange-600 dark:text-orange-400';
      case 'poor': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getScoreColor = () => {
    if (score > 0) return 'text-green-600 dark:text-green-400';
    if (score < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (!showDetails) {
    // Simple summary view
    return (
      <div className={`vote-summary flex items-center gap-2 text-sm ${className}`}>
        <div className={`font-medium ${getScoreColor()}`}>
          {formatVoteCount(Math.abs(score))}
        </div>
        {trend && getTrendIcon()}
        <div className="text-gray-500 dark:text-gray-400">
          ({percentage}% positive)
        </div>
      </div>
    );
  }

  // Detailed summary view
  return (
    <div className={`vote-summary space-y-3 ${className}`}>
      {/* Header with score and trend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`text-lg font-bold ${getScoreColor()}`}>
            {score >= 0 ? '+' : ''}{formatVoteCount(score)}
          </div>
          {trend && getTrendIcon()}
        </div>
        
        <div className={`text-sm font-medium ${getQualityColor()}`}>
          {quality.description}
        </div>
      </div>

      {/* Vote breakdown */}
      <div className="grid grid-cols-2 gap-4">
        {/* Upvotes */}
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <ThumbsUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          <div>
            <div className="font-semibold text-green-600 dark:text-green-400">
              {formatVoteCount(upvotes)}
            </div>
            <div className="text-xs text-green-600/70 dark:text-green-400/70">
              Upvotes
            </div>
          </div>
        </div>

        {/* Downvotes */}
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <ThumbsDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          <div>
            <div className="font-semibold text-red-600 dark:text-red-400">
              {formatVoteCount(downvotes)}
            </div>
            <div className="text-xs text-red-600/70 dark:text-red-400/70">
              Downvotes
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {totalVotes > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Vote Distribution</span>
            <span>{percentage}% positive</span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{formatVoteCount(upvotes)} up</span>
            <span>{formatVoteCount(downvotes)} down</span>
          </div>
        </div>
      )}

      {/* Additional stats */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{formatVoteCount(totalVotes)} total votes</span>
        </div>
        
        <div className="flex items-center gap-1">
          <BarChart3 className="h-3 w-3" />
          <span>Quality: {quality.quality}</span>
        </div>
      </div>
    </div>
  );
};

// Component for vote history/timeline
interface VoteTimelineProps {
  votes: Array<{
    id: string;
    voteType: 'upvote' | 'downvote';
    timestamp: string;
    user?: {
      username: string;
      avatar?: string;
    };
  }>;
  className?: string;
}

export const VoteTimeline = ({ votes, className = '' }: VoteTimelineProps) => {
  const recentVotes = votes.slice(0, 10); // Show last 10 votes

  return (
    <div className={`vote-timeline space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
        Recent Votes
      </h4>
      
      {recentVotes.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No votes yet
        </p>
      ) : (
        <div className="space-y-2">
          {recentVotes.map((vote) => (
            <div
              key={vote.id}
              className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
            >
              {/* Vote icon */}
              <div className={`p-1 rounded ${
                vote.voteType === 'upvote'
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              }`}>
                {vote.voteType === 'upvote' ? (
                  <ThumbsUp className="h-3 w-3" />
                ) : (
                  <ThumbsDown className="h-3 w-3" />
                )}
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                {vote.user ? (
                  <div className="flex items-center gap-2">
                    {vote.user.avatar ? (
                      <img
                        src={vote.user.avatar}
                        alt={vote.user.username}
                        className="w-4 h-4 rounded-full"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {vote.user.username}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Anonymous
                  </span>
                )}
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(vote.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Component for vote analytics
interface VoteAnalyticsProps {
  data: {
    totalVotes: number;
    upvotePercentage: number;
    averageScore: number;
    topVotedContent: Array<{
      id: string;
      title: string;
      score: number;
    }>;
  };
  className?: string;
}

export const VoteAnalytics = ({ data, className = '' }: VoteAnalyticsProps) => {
  return (
    <div className={`vote-analytics space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Vote Analytics
      </h3>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatVoteCount(data.totalVotes)}
          </div>
          <div className="text-sm text-blue-600/70 dark:text-blue-400/70">
            Total Votes
          </div>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {data.upvotePercentage}%
          </div>
          <div className="text-sm text-green-600/70 dark:text-green-400/70">
            Positive Rate
          </div>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {data.averageScore.toFixed(1)}
          </div>
          <div className="text-sm text-purple-600/70 dark:text-purple-400/70">
            Average Score
          </div>
        </div>
      </div>

      {/* Top voted content */}
      {data.topVotedContent.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Top Voted Content
          </h4>
          <div className="space-y-2">
            {data.topVotedContent.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    #{index + 1}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {item.title}
                  </span>
                </div>
                <span className={`text-sm font-medium ${getScoreColor()}`}>
                  +{formatVoteCount(item.score)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoteSummary;
