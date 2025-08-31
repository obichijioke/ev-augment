"use client";

import React from "react";
import Link from "next/link";
import {
  MessageSquare,
  Eye,
  Clock,
  Pin,
  Lock,
  User,
  CheckCircle,
} from "lucide-react";
import { ForumThread } from "@/types/forum";

interface ThreadCardProps {
  thread: ForumThread;
  showCategory?: boolean;
  className?: string;
  href?: string; // Allow custom href for SEO-friendly URLs
}

const ThreadCard: React.FC<ThreadCardProps> = ({
  thread,
  showCategory = false,
  className = "",
  href,
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  };

  const truncateContent = (
    content: string,
    maxLength: number = 150
  ): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {/* Thread Title */}
          <div className="flex items-center space-x-2 mb-2">
            {thread.is_pinned && (
              <Pin className="h-4 w-4 text-blue-600 flex-shrink-0" />
            )}
            {thread.is_locked && (
              <Lock className="h-4 w-4 text-gray-500 flex-shrink-0" />
            )}
            <Link
              href={
                href ||
                `/forums/${thread.category?.slug || "general"}/${
                  thread.slug || thread.id
                }`
              }
              className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
            >
              {thread.title}
            </Link>
          </div>

          {/* Category Badge (if shown) */}
          {showCategory && thread.category && (
            <Link
              href={`/forums/${thread.category.slug}`}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white mb-2 hover:opacity-80 transition-opacity"
              style={{ backgroundColor: thread.category.color }}
            >
              <span className="mr-1">{thread.category.icon}</span>
              {thread.category.name}
            </Link>
          )}

          {/* Content Preview */}
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
            {truncateContent(thread.content)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Author Info */}
        <div className="flex items-center space-x-3">
          {thread.author && (
            <div className="flex items-center space-x-2">
              {thread.author.avatar ? (
                <img
                  src={thread.author.avatar}
                  alt={thread.author.displayName}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                </div>
              )}
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {thread.author.displayName}
                </span>
                {thread.author.isVerified && (
                  <CheckCircle className="h-3 w-3 text-blue-500" />
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{formatDate(thread.created_at)}</span>
          </div>
        </div>

        {/* Thread Stats */}
        <div className="flex items-center space-x-4">
          {/* View Count */}
          <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
            <Eye className="h-4 w-4" />
            <span>{formatNumber(thread.view_count)}</span>
          </div>

          {/* Reply Count */}
          <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-4 w-4" />
            <span>{formatNumber(thread.reply_count)}</span>
          </div>

          {/* Last Reply */}
          {thread.last_reply_at && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
              <div>Last reply</div>
              <div>{formatDate(thread.last_reply_at)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreadCard;
