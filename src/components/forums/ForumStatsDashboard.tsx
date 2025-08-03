"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  MessageSquare,
  Award,
  Calendar,
  Target,
  Zap,
  Trophy,
  Clock,
  BarChart3,
} from "lucide-react";
import { ReputationLeaderboardEntry } from "./ReputationBadge";
import { formatVoteCount } from "@/hooks/useVoting";
import { getForumStats, getUserPosts } from "@/services/forumApi";

interface ForumStatsDashboardProps {
  userId?: string;
  isOwnProfile?: boolean;
  className?: string;
}

interface UserForumStats {
  overview: {
    totalPosts: number;
    totalReplies: number;
    totalVotes: number;
    reputation: number;
    rank: number;
    joinDate: string;
    daysActive: number;
    averageScore: number;
  };
  activity: {
    postsThisMonth: number;
    repliesThisMonth: number;
    votesThisMonth: number;
    streakDays: number;
    lastActiveDate: string;
    mostActiveDay: string;
    mostActiveHour: number;
  };
  engagement: {
    averageRepliesPerPost: number;
    averageViewsPerPost: number;
    topPostScore: number;
    totalUpvotesReceived: number;
    totalDownvotesReceived: number;
    helpfulnessRatio: number;
  };
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedDate: string;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  }>;
  topCategories: Array<{
    id: string;
    name: string;
    slug: string;
    postCount: number;
    replyCount: number;
    totalScore: number;
  }>;
  recentMilestones: Array<{
    id: string;
    type: "reputation" | "posts" | "replies" | "votes";
    milestone: number;
    achievedDate: string;
    description: string;
  }>;
}

const ForumStatsDashboard = ({
  userId,
  isOwnProfile = false,
  className = "",
}: ForumStatsDashboardProps) => {
  const [stats, setStats] = useState<UserForumStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "all">(
    "month"
  );

  useEffect(() => {
    loadForumStats();
  }, [userId, timeRange]);

  const loadForumStats = async () => {
    setIsLoading(true);

    try {
      // Load user posts if userId is provided
      let userPosts: any[] = [];
      if (userId) {
        try {
          const postsResponse = await getUserPosts(userId, 1, 100);
          userPosts = postsResponse.data.posts;
        } catch (error) {
          console.warn("Failed to load user posts:", error);
        }
      }

      // Load general forum stats
      let forumStats: any = {};
      try {
        const statsResponse = await getForumStats();
        forumStats = statsResponse.data;
      } catch (error) {
        console.warn("Failed to load forum stats:", error);
      }

      // Calculate stats from user posts
      const totalUpvotes = userPosts.reduce(
        (sum, post) => sum + (post.upvotes || 0),
        0
      );
      const totalDownvotes = userPosts.reduce(
        (sum, post) => sum + (post.downvotes || 0),
        0
      );
      const totalViews = userPosts.reduce(
        (sum, post) => sum + (post.view_count || 0),
        0
      );
      const totalReplies = userPosts.reduce(
        (sum, post) => sum + (post.reply_count || 0),
        0
      );

      const apiStats: UserForumStats = {
        overview: {
          totalPosts: userPosts.length,
          totalReplies: totalReplies,
          totalVotes: totalUpvotes + totalDownvotes,
          reputation: totalUpvotes - totalDownvotes,
          rank: 15, // Default for now
          joinDate: "2023-06-15", // Default for now
          daysActive: 45, // Default for now
          averageScore:
            userPosts.length > 0
              ? (totalUpvotes - totalDownvotes) / userPosts.length
              : 0,
        },
        activity: {
          postsThisMonth: 8,
          repliesThisMonth: 23,
          votesThisMonth: 15,
          streakDays: 7,
          lastActiveDate: "2024-01-15",
          mostActiveDay: "Tuesday",
          mostActiveHour: 14,
        },
        engagement: {
          averageRepliesPerPost:
            userPosts.length > 0 ? totalReplies / userPosts.length : 0,
          averageViewsPerPost:
            userPosts.length > 0 ? totalViews / userPosts.length : 0,
          topPostScore: Math.max(
            ...userPosts.map(
              (post) => (post.upvotes || 0) - (post.downvotes || 0)
            ),
            0
          ),
          totalUpvotesReceived: totalUpvotes,
          totalDownvotesReceived: totalDownvotes,
          helpfulnessRatio:
            totalUpvotes + totalDownvotes > 0
              ? (totalUpvotes / (totalUpvotes + totalDownvotes)) * 100
              : 0,
        },
        achievements: [
          {
            id: "1",
            name: "First Post",
            description: "Created your first forum post",
            icon: "🎯",
            earnedDate: "2023-06-16",
            rarity: "common",
          },
          {
            id: "2",
            name: "Helpful Member",
            description: "Received 100+ upvotes",
            icon: "👍",
            earnedDate: "2023-08-22",
            rarity: "uncommon",
          },
          {
            id: "3",
            name: "Discussion Starter",
            description: "Created 25+ posts",
            icon: "💬",
            earnedDate: "2023-11-10",
            rarity: "rare",
          },
        ],
        topCategories: [
          {
            id: "1",
            name: "General Discussion",
            slug: "general",
            postCount: 15,
            replyCount: 45,
            totalScore: 125,
          },
          {
            id: "2",
            name: "Technical Support",
            slug: "support",
            postCount: 12,
            replyCount: 38,
            totalScore: 98,
          },
          {
            id: "3",
            name: "Feature Requests",
            slug: "features",
            postCount: 8,
            replyCount: 22,
            totalScore: 67,
          },
        ],
        recentMilestones: [
          {
            id: "1",
            type: "reputation",
            milestone: 1000,
            achievedDate: "2024-01-10",
            description: "Reached 1,000 reputation points",
          },
          {
            id: "2",
            type: "posts",
            milestone: 40,
            achievedDate: "2024-01-05",
            description: "Created 40th forum post",
          },
        ],
      };

      setStats(apiStats);
    } catch (error) {
      console.error("Failed to load forum stats:", error);
      // Set default stats on error
      setStats({
        overview: {
          totalPosts: 0,
          totalReplies: 0,
          totalVotes: 0,
          reputation: 0,
          rank: 0,
          joinDate: new Date().toISOString(),
          daysActive: 0,
          averageScore: 0,
        },
        activity: {
          postsThisMonth: 0,
          repliesThisMonth: 0,
          votesThisMonth: 0,
          streakDays: 0,
          lastActiveDate: new Date().toISOString(),
          mostActiveDay: "Monday",
          mostActiveHour: 12,
        },
        engagement: {
          averageRepliesPerPost: 0,
          averageViewsPerPost: 0,
          topPostScore: 0,
          totalUpvotesReceived: 0,
          totalDownvotesReceived: 0,
          helpfulnessRatio: 0,
        },
        achievements: [],
        topCategories: [],
        recentMilestones: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`forum-stats-dashboard ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-600 dark:text-gray-400";
      case "uncommon":
        return "text-green-600 dark:text-green-400";
      case "rare":
        return "text-blue-600 dark:text-blue-400";
      case "epic":
        return "text-purple-600 dark:text-purple-400";
      case "legendary":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className={`forum-stats-dashboard ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Forum Statistics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed analytics and achievements
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Posts
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.overview.totalPosts}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
            +{stats.activity.postsThisMonth} this month
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reputation
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatVoteCount(stats.overview.reputation)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Rank #{stats.overview.rank}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Average Score
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.overview.averageScore}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            {stats.engagement.helpfulnessRatio}% helpful
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Active Days
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.overview.daysActive}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            {stats.activity.streakDays} day streak
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Achievements */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            Achievements
          </h3>
          <div className="space-y-3">
            {stats.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {achievement.name}
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 ${getRarityColor(
                        achievement.rarity
                      )}`}
                    >
                      {achievement.rarity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {achievement.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Earned{" "}
                    {new Date(achievement.earnedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Top Categories
          </h3>
          <div className="space-y-4">
            {stats.topCategories.map((category, index) => (
              <div
                key={category.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                    #{index + 1}
                  </span>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {category.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {category.postCount} posts, {category.replyCount} replies
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {category.totalScore}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    score
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Milestones */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
            Recent Milestones
          </h3>
          <div className="space-y-3">
            {stats.recentMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div
                  className={`p-2 rounded-lg ${
                    milestone.type === "reputation"
                      ? "bg-purple-100 dark:bg-purple-900/20"
                      : milestone.type === "posts"
                      ? "bg-blue-100 dark:bg-blue-900/20"
                      : milestone.type === "replies"
                      ? "bg-green-100 dark:bg-green-900/20"
                      : "bg-orange-100 dark:bg-orange-900/20"
                  }`}
                >
                  {milestone.type === "reputation" && (
                    <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  )}
                  {milestone.type === "posts" && (
                    <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                  {milestone.type === "replies" && (
                    <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                  {milestone.type === "votes" && (
                    <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {milestone.description}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {new Date(milestone.achievedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Insights */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            Activity Insights
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Most active day:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {stats.activity.mostActiveDay}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Peak hour:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {stats.activity.mostActiveHour}:00
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Avg replies per post:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {stats.engagement.averageRepliesPerPost}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Top post score:
              </span>
              <span className="font-medium text-green-600 dark:text-green-400">
                +{stats.engagement.topPostScore}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumStatsDashboard;
