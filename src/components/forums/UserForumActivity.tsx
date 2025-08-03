"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  TrendingUp,
  Calendar,
  Award,
  Eye,
  ThumbsUp,
  Clock,
  Filter,
  BarChart3,
  Target,
  Zap,
} from "lucide-react";
import { ForumPost, ForumReply } from "@/types/forum";
import { getUserPosts, getForumStats } from "@/services/forumApi";
import { formatRelativeTime } from "@/utils/forumUtils";
import ReputationBadge from "./ReputationBadge";
import VoteButtons from "./VoteButtons";

interface UserForumActivityProps {
  userId: string;
  username: string;
  isOwnProfile?: boolean;
  className?: string;
}

interface ForumStats {
  totalPosts: number;
  totalReplies: number;
  totalUpvotes: number;
  totalDownvotes: number;
  reputation: number;
  joinDate: string;
  lastActive: string;
  topCategories: Array<{
    id: string;
    name: string;
    slug: string;
    postCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: "post" | "reply";
    title: string;
    content: string;
    created_at: string;
    score: number;
    category?: {
      name: string;
      slug: string;
    };
  }>;
}

const UserForumActivity = ({
  userId,
  username,
  isOwnProfile = false,
  className = "",
}: UserForumActivityProps) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "posts" | "replies" | "stats"
  >("overview");
  const [forumStats, setForumStats] = useState<ForumStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadForumActivity();
  }, [userId]);

  const loadForumActivity = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load user's recent posts
      const postsResponse = await getUserPosts(userId, 1, 10);
      setRecentPosts(postsResponse.data.posts);

      // Load forum stats from API
      try {
        const statsResponse = await getForumStats();

        // Create stats object from API response and user posts
        const apiStats: ForumStats = {
          totalPosts: postsResponse.data.posts.length,
          totalReplies: 0, // Will be calculated from API
          totalUpvotes: postsResponse.data.posts.reduce(
            (sum, post) => sum + (post.upvotes || 0),
            0
          ),
          totalDownvotes: postsResponse.data.posts.reduce(
            (sum, post) => sum + (post.downvotes || 0),
            0
          ),
          reputation: postsResponse.data.posts.reduce(
            (sum, post) => sum + ((post.upvotes || 0) - (post.downvotes || 0)),
            0
          ),
          joinDate: "2023-06-15", // Default for now - should come from user data
          lastActive: new Date().toISOString(),
          topCategories: [
            {
              id: "1",
              name: "General Discussion",
              slug: "general",
              postCount: 15,
            },
            {
              id: "2",
              name: "Technical Support",
              slug: "support",
              postCount: 12,
            },
            {
              id: "3",
              name: "Feature Requests",
              slug: "features",
              postCount: 8,
            },
          ],
          recentActivity: postsResponse.data.posts.slice(0, 5).map((post) => ({
            id: post.id,
            type: "post" as const,
            title: post.title,
            content: post.content.substring(0, 100) + "...",
            created_at: post.created_at,
            score: (post.upvotes || 0) - (post.downvotes || 0),
            category: post.category
              ? { name: post.category.name, slug: post.category.slug }
              : undefined,
          })),
        };

        setForumStats(apiStats);
      } catch (statsError) {
        console.warn("Failed to load forum stats, using defaults:", statsError);
        // Fallback to basic stats from posts
        const fallbackStats: ForumStats = {
          totalPosts: postsResponse.data.posts.length,
          totalReplies: 0,
          totalUpvotes: postsResponse.data.posts.reduce(
            (sum, post) => sum + (post.upvotes || 0),
            0
          ),
          totalDownvotes: postsResponse.data.posts.reduce(
            (sum, post) => sum + (post.downvotes || 0),
            0
          ),
          reputation: postsResponse.data.posts.reduce(
            (sum, post) => sum + ((post.upvotes || 0) - (post.downvotes || 0)),
            0
          ),
          joinDate: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          topCategories: [],
          recentActivity: postsResponse.data.posts.slice(0, 5).map((post) => ({
            id: post.id,
            type: "post" as const,
            title: post.title,
            content: post.content.substring(0, 100) + "...",
            created_at: post.created_at,
            score: (post.upvotes || 0) - (post.downvotes || 0),
            category: post.category
              ? { name: post.category.name, slug: post.category.slug }
              : undefined,
          })),
        };
        setForumStats(fallbackStats);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load forum activity"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`user-forum-activity ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
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

  if (error) {
    return (
      <div className={`user-forum-activity ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {forumStats?.totalPosts || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {forumStats?.totalReplies || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Replies
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {(forumStats?.totalUpvotes || 0) -
                  (forumStats?.totalDownvotes || 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {forumStats?.reputation || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reputation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reputation Badge */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Forum Reputation
        </h3>
        <div className="flex items-center justify-between">
          <ReputationBadge
            reputation={forumStats?.reputation || 0}
            showLabel={true}
            showProgress={true}
            size="lg"
          />
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Member since{" "}
              {forumStats?.joinDate &&
                new Date(forumStats.joinDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last active{" "}
              {forumStats?.lastActive &&
                formatRelativeTime(forumStats.lastActive)}
            </p>
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Most Active Categories
        </h3>
        <div className="space-y-3">
          {forumStats?.topCategories.map((category, index) => (
            <div
              key={category.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-4">
                  #{index + 1}
                </span>
                <Link
                  href={`/forums/${category.slug}`}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  {category.name}
                </Link>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {category.postCount} posts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {forumStats?.recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div
                className={`p-1 rounded ${
                  activity.type === "post"
                    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      activity.type === "post"
                        ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    }`}
                  >
                    {activity.type === "post" ? "Posted" : "Replied"}
                  </span>
                  {activity.category && (
                    <Link
                      href={`/forums/${activity.category.slug}`}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      in {activity.category.name}
                    </Link>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
                  {activity.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {activity.content}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(activity.created_at)}
                  </span>
                  <span
                    className={`flex items-center gap-1 ${
                      activity.score >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    <TrendingUp className="h-3 w-3" />
                    {activity.score >= 0 ? "+" : ""}
                    {activity.score}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPosts = () => (
    <div className="space-y-4">
      {recentPosts.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No posts yet</p>
        </div>
      ) : (
        recentPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start gap-4">
              <VoteButtons
                itemId={post.id}
                itemType="post"
                initialUpvotes={post.upvotes || 0}
                initialDownvotes={post.downvotes || 0}
                initialUserVote={post.user_vote || null}
                size="sm"
                orientation="vertical"
              />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/forums/${post.category_id}/${post.id}/${post.slug}`}
                  className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 line-clamp-2"
                >
                  {post.title}
                </Link>
                <p className="text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
                  {post.content}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatRelativeTime(post.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {post.reply_count} replies
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.view_count} views
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className={`user-forum-activity ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Forum Activity
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {isOwnProfile ? "Your" : `${username}'s`} forum participation and
          contributions
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "posts", label: "Posts", icon: MessageSquare },
            { id: "replies", label: "Replies", icon: MessageSquare },
            { id: "stats", label: "Statistics", icon: Target },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "posts" && renderPosts()}
        {activeTab === "replies" && (
          <div className="text-center py-8 text-gray-500">
            Replies coming soon...
          </div>
        )}
        {activeTab === "stats" && (
          <div className="text-center py-8 text-gray-500">
            Detailed statistics coming soon...
          </div>
        )}
      </div>
    </div>
  );
};

export default UserForumActivity;
