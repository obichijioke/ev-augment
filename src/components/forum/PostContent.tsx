"use client";

import React from "react";
import { User, CheckCircle, Clock, Edit } from "lucide-react";
import { ForumUser, ForumImage } from "@/types/forum";
import ImageGallery from "./ImageGallery";

interface PostContentProps {
  content: string;
  images?: ForumImage[];
  author: ForumUser;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  editedAt?: string;
  isOriginalPost?: boolean;
  className?: string;
}

const PostContent: React.FC<PostContentProps> = ({
  content,
  images,
  author,
  createdAt,
  updatedAt,
  isEdited = false,
  editedAt,
  isOriginalPost = false,
  className = "",
}) => {
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
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year:
            date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
      }
    }
  };

  const formatContent = (text: string): string => {
    // Simple formatting - convert line breaks to paragraphs
    return text
      .split("\n\n")
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .join("\n\n");
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Author Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 rounded-t-lg">
        <div className="flex items-center space-x-3">
          {author.avatar ? (
            <img
              src={author.avatar}
              alt={author.displayName}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </div>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {author.displayName}
              </span>
              {author.isVerified && (
                <CheckCircle className="h-3 w-3 text-blue-500" />
              )}
              {isOriginalPost && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  Original Poster
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>{formatDate(createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Edit Indicator */}
        {isEdited && (
          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
            <Edit className="h-3 w-3" />
            <span>
              Edited{" "}
              {editedAt
                ? formatDate(editedAt)
                : formatDate(updatedAt || createdAt)}
            </span>
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="p-6">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          {formatContent(content)
            .split("\n\n")
            .map((paragraph, index) => (
              <p
                key={index}
                className="mb-4 last:mb-0 text-gray-800 dark:text-gray-200 leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
        </div>

        {/* Images */}
        {images && images.length > 0 && (
          <div className="mt-4">
            <ImageGallery images={images} />
          </div>
        )}
      </div>

      {/* Footer Actions (placeholder for future features like voting, reporting) */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Placeholder for voting buttons */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {/* Future: Vote buttons, report, etc. */}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Placeholder for action buttons */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {/* Future: Reply, Quote, etc. */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostContent;
