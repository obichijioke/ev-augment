"use client";

import React, { useState } from "react";
import {
  Reply,
  MessageSquare,
  Clock,
  User,
  CheckCircle,
  Edit,
} from "lucide-react";
import { ForumReply, CreateReplyForm } from "@/types/forum";
import ReplyForm from "./ReplyForm";
import ImageGallery from "./ImageGallery";

interface ReplyItemProps {
  reply: ForumReply;
  threadId: string;
  isOriginalPoster?: boolean;
  nestingLevel?: number;
  maxNestingLevel?: number;
  onReply?: (data: CreateReplyForm) => Promise<void>;
  className?: string;
}

const ReplyItem: React.FC<ReplyItemProps> = ({
  reply,
  threadId,
  isOriginalPoster = false,
  nestingLevel = 0,
  maxNestingLevel = 2,
  onReply,
  className = "",
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

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
    return text
      .split("\n\n")
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .join("\n\n");
  };

  const handleReply = async (data: CreateReplyForm) => {
    if (!onReply) return;

    try {
      setIsReplying(true);
      await onReply({
        ...data,
        parentId: reply.id,
      });
      setShowReplyForm(false);
    } catch (error) {
      throw error; // Let ReplyForm handle the error
    } finally {
      setIsReplying(false);
    }
  };

  const canReply = nestingLevel < maxNestingLevel && onReply;
  const isNested = nestingLevel > 0;

  return (
    <div
      className={`${className} ${
        isNested ? "border-l-4 border-blue-200 pl-4" : ""
      }`}
    >
      {/* Reply Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-3">
            {reply.author.avatar ? (
              <img
                src={reply.author.avatar}
                alt={reply.author.displayName}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">
                  {reply.author.displayName}
                </span>
                {reply.author.isVerified && (
                  <CheckCircle className="h-3 w-3 text-blue-500" />
                )}
                {isOriginalPoster && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    OP
                  </span>
                )}
                {isNested && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    Reply
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatDate(reply.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Edit Indicator */}
          {reply.isEdited && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Edit className="h-3 w-3" />
              <span>
                Edited{" "}
                {reply.editedAt
                  ? formatDate(reply.editedAt)
                  : formatDate(reply.updatedAt)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="prose prose-gray max-w-none">
            {formatContent(reply.content)
              .split("\n\n")
              .map((paragraph, index) => (
                <p
                  key={index}
                  className="mb-3 last:mb-0 text-gray-800 leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
          </div>

          {/* Images */}
          {reply.images && reply.images.length > 0 && (
            <div className="mt-4">
              <ImageGallery images={reply.images} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Reply Button */}
              {canReply && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  disabled={isReplying}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50"
                >
                  <Reply className="h-4 w-4" />
                  <span>Reply</span>
                </button>
              )}

              {/* Nesting Level Indicator */}
              {nestingLevel >= maxNestingLevel && (
                <span className="text-xs text-gray-500">
                  Maximum nesting level reached
                </span>
              )}
            </div>

            <div className="text-xs text-gray-500">
              {reply.replies && reply.replies.length > 0 && (
                <span>
                  {reply.replies.length}{" "}
                  {reply.replies.length === 1 ? "reply" : "replies"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && canReply && (
        <div className="mt-4">
          <ReplyForm
            threadId={threadId}
            parentId={reply.id}
            isNested={true}
            onSubmit={handleReply}
            onCancel={() => setShowReplyForm(false)}
            placeholder={`Reply to ${reply.author.displayName}...`}
          />
        </div>
      )}

      {/* Nested Replies */}
      {reply.replies && reply.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {reply.replies.map((nestedReply) => (
            <ReplyItem
              key={nestedReply.id}
              reply={nestedReply}
              threadId={threadId}
              isOriginalPoster={nestedReply.author.id === reply.author.id}
              nestingLevel={nestingLevel + 1}
              maxNestingLevel={maxNestingLevel}
              onReply={nestingLevel + 1 < maxNestingLevel ? onReply : undefined}
              className="ml-4"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReplyItem;
