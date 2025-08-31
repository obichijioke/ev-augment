"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Users, Clock, ChevronRight } from "lucide-react";
import { ForumCategory } from "@/types/forum";

interface CategoryCardProps {
  category: ForumCategory;
  className?: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  className = "",
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatLastActivity = (timestamp: string): string => {
    const date = new Date(timestamp);
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
      return `${diffInDays}d ago`;
    }
  };

  return (
    <Link href={`/forums/${category.slug}`}>
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 p-6 group ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Category Icon */}
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-semibold"
              style={{ backgroundColor: category.color }}
            >
              {category.icon}
            </div>

            {/* Category Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {category.description}
              </p>
            </div>
          </div>

          {/* Arrow Icon */}
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Thread Count */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <MessageSquare className="h-4 w-4" />
              <span>{formatNumber(category.thread_count)} threads</span>
            </div>

            {/* Post Count */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Users className="h-4 w-4" />
              <span>{formatNumber(category.post_count)} posts</span>
            </div>
          </div>

          {/* Last Activity */}
          {category.last_activity_at && (
            <div className="text-right">
              <div className="text-sm text-gray-900 dark:text-white font-medium">
                Last activity
              </div>
              <div className="flex items-center justify-end space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                <Clock className="h-3 w-3" />
                <span>{formatLastActivity(category.last_activity_at)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
