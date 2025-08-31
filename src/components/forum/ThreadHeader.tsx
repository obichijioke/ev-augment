"use client";

import React from "react";
import Link from "next/link";
import {
  Pin,
  Lock,
  Eye,
  MessageSquare,
  Clock,
  User,
  CheckCircle,
  Edit,
} from "lucide-react";
import { ForumThread } from "@/types/forum";

interface ThreadHeaderProps {
  thread: ForumThread;
  className?: string;
  showEditButton?: boolean;
  onEdit?: () => void;
}

const ThreadHeader: React.FC<ThreadHeaderProps> = ({
  thread,
  className = "",
  showEditButton = false,
  onEdit,
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      {/* Category Badge */}
      {thread.category && (
        <div className="mb-4">
          <Link
            href={`/forums/${thread.category.slug}`}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white hover:opacity-80 transition-opacity"
            style={{ backgroundColor: thread.category.color }}
          >
            <span className="mr-2">{thread.category.icon}</span>
            {thread.category.name}
          </Link>
        </div>
      )}

      {/* Thread Title */}
      <div className="mb-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 flex items-center space-x-2">
            {thread.is_pinned && (
              <div className="flex items-center space-x-1 text-blue-600">
                <Pin className="h-4 w-4" />
                <span className="text-xs font-medium">PINNED</span>
              </div>
            )}
            {thread.is_locked && (
              <div className="flex items-center space-x-1 text-gray-500">
                <Lock className="h-4 w-4" />
                <span className="text-xs font-medium">LOCKED</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start justify-between mt-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight flex-1">
            {thread.title}
          </h1>

          {/* Edit Button */}
          {showEditButton && onEdit && (
            <button
              onClick={onEdit}
              className="ml-4 inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Author and Meta Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Author Info */}
        {thread.author && (
          <div className="flex items-center space-x-3">
            {thread.author.avatar ? (
              <img
                src={thread.author.avatar}
                alt={thread.author.displayName}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {thread.author.displayName}
                </span>
                {thread.author.isVerified && (
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-3 w-3" />
                <span>Posted {formatDate(thread.created_at)}</span>
                {thread.updated_at !== thread.created_at && (
                  <>
                    <span>•</span>
                    <span>Updated {formatDate(thread.updated_at)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Thread Stats */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">
              {formatNumber(thread.view_count)}
            </span>
            <span className="text-sm">views</span>
          </div>

          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">
              {formatNumber(thread.reply_count)}
            </span>
            <span className="text-sm">replies</span>
          </div>
        </div>
      </div>

      {/* Thread Status Indicators */}
      {(thread.is_pinned || thread.is_locked) && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 text-sm">
            {thread.is_pinned && (
              <div className="flex items-center space-x-1 text-blue-600">
                <Pin className="h-3 w-3" />
                <span>This thread is pinned to the top of the category</span>
              </div>
            )}
            {thread.is_locked && (
              <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                <Lock className="h-3 w-3" />
                <span>This thread is locked - no new replies can be added</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreadHeader;
