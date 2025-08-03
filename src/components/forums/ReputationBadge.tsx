'use client';

import { Star, Award, Crown, Shield, Zap, TrendingUp } from 'lucide-react';

interface ReputationBadgeProps {
  reputation: number;
  showLabel?: boolean;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface ReputationLevel {
  name: string;
  minReputation: number;
  maxReputation: number;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const REPUTATION_LEVELS: ReputationLevel[] = [
  {
    name: 'New Member',
    minReputation: 0,
    maxReputation: 49,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: Star,
    description: 'Just getting started',
  },
  {
    name: 'Active Member',
    minReputation: 50,
    maxReputation: 199,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    icon: TrendingUp,
    description: 'Regular contributor',
  },
  {
    name: 'Valued Member',
    minReputation: 200,
    maxReputation: 499,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    icon: Award,
    description: 'Helpful community member',
  },
  {
    name: 'Expert',
    minReputation: 500,
    maxReputation: 999,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    icon: Zap,
    description: 'Knowledgeable expert',
  },
  {
    name: 'Guru',
    minReputation: 1000,
    maxReputation: 2499,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    icon: Shield,
    description: 'Community leader',
  },
  {
    name: 'Legend',
    minReputation: 2500,
    maxReputation: Infinity,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    icon: Crown,
    description: 'Legendary contributor',
  },
];

const ReputationBadge = ({
  reputation,
  showLabel = true,
  showProgress = false,
  size = 'md',
  className = '',
}: ReputationBadgeProps) => {
  // Find current reputation level
  const currentLevel = REPUTATION_LEVELS.find(
    level => reputation >= level.minReputation && reputation <= level.maxReputation
  ) || REPUTATION_LEVELS[0];

  // Find next level for progress calculation
  const nextLevel = REPUTATION_LEVELS.find(
    level => level.minReputation > reputation
  );

  // Calculate progress to next level
  const progressPercentage = nextLevel
    ? Math.min(
        ((reputation - currentLevel.minReputation) / 
         (nextLevel.minReputation - currentLevel.minReputation)) * 100,
        100
      )
    : 100;

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'text-xs',
      icon: 'h-3 w-3',
      badge: 'px-2 py-1',
      progress: 'h-1',
    },
    md: {
      container: 'text-sm',
      icon: 'h-4 w-4',
      badge: 'px-3 py-1.5',
      progress: 'h-1.5',
    },
    lg: {
      container: 'text-base',
      icon: 'h-5 w-5',
      badge: 'px-4 py-2',
      progress: 'h-2',
    },
  };

  const config = sizeConfig[size];
  const IconComponent = currentLevel.icon;

  return (
    <div className={`reputation-badge ${config.container} ${className}`}>
      {/* Main Badge */}
      <div className={`inline-flex items-center gap-1.5 rounded-full ${config.badge} ${currentLevel.bgColor} ${currentLevel.color} font-medium`}>
        <IconComponent className={config.icon} />
        
        {showLabel && (
          <span className="whitespace-nowrap">
            {currentLevel.name}
          </span>
        )}
        
        <span className="font-semibold tabular-nums">
          {formatReputation(reputation)}
        </span>
      </div>

      {/* Progress Bar */}
      {showProgress && nextLevel && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>{currentLevel.name}</span>
            <span>{nextLevel.name}</span>
          </div>
          
          <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${config.progress}`}>
            <div
              className={`${config.progress} rounded-full transition-all duration-500 ${currentLevel.color.replace('text-', 'bg-')}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{reputation}</span>
            <span>{nextLevel.minReputation}</span>
          </div>
        </div>
      )}

      {/* Tooltip/Description */}
      {size === 'lg' && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          {currentLevel.description}
        </div>
      )}
    </div>
  );
};

// Utility function to format reputation numbers
function formatReputation(reputation: number): string {
  if (reputation >= 1000000) {
    return `${(reputation / 1000000).toFixed(1)}M`;
  }
  if (reputation >= 1000) {
    return `${(reputation / 1000).toFixed(1)}k`;
  }
  return reputation.toString();
}

// Export utility functions for use elsewhere
export { REPUTATION_LEVELS, formatReputation };

// Component for displaying reputation change
interface ReputationChangeProps {
  change: number;
  reason?: string;
  className?: string;
}

export const ReputationChange = ({ 
  change, 
  reason, 
  className = '' 
}: ReputationChangeProps) => {
  if (change === 0) return null;

  const isPositive = change > 0;
  const colorClass = isPositive 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400';

  return (
    <div className={`inline-flex items-center gap-1 text-sm ${colorClass} ${className}`}>
      <span className="font-medium">
        {isPositive ? '+' : ''}{change}
      </span>
      {reason && (
        <span className="text-xs opacity-75">
          ({reason})
        </span>
      )}
    </div>
  );
};

// Component for reputation leaderboard entry
interface ReputationLeaderboardEntryProps {
  rank: number;
  username: string;
  reputation: number;
  avatar?: string;
  isCurrentUser?: boolean;
  className?: string;
}

export const ReputationLeaderboardEntry = ({
  rank,
  username,
  reputation,
  avatar,
  isCurrentUser = false,
  className = '',
}: ReputationLeaderboardEntryProps) => {
  const currentLevel = REPUTATION_LEVELS.find(
    level => reputation >= level.minReputation && reputation <= level.maxReputation
  ) || REPUTATION_LEVELS[0];

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 dark:text-yellow-400';
      case 2: return 'text-gray-500 dark:text-gray-400';
      case 3: return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'} ${className}`}>
      {/* Rank */}
      <div className={`text-lg font-bold ${getRankColor(rank)} min-w-[2rem] text-center`}>
        #{rank}
      </div>

      {/* Avatar */}
      {avatar ? (
        <img
          src={avatar}
          alt={username}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {username.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium truncate ${isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
            {username}
            {isCurrentUser && <span className="text-xs ml-1">(You)</span>}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {currentLevel.name}
        </div>
      </div>

      {/* Reputation */}
      <ReputationBadge
        reputation={reputation}
        showLabel={false}
        size="sm"
      />
    </div>
  );
};

export default ReputationBadge;
