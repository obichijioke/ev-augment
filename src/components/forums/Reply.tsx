"use client";

import Image from "next/image";
import { Reply as ReplyIcon, Edit, Trash2 } from "lucide-react";
import VoteButtons from "./VoteButtons";
import ReputationBadge from "./ReputationBadge";
import AttachmentDisplay from "./AttachmentDisplay";
import { ForumReply } from "@/types/forum";

interface ReplyProps {
  reply: ForumReply & {
    author: {
      name: string;
      avatar: string;
      reputation?: number;
      posts?: number;
    };
    createdAt?: string; // Legacy support
    likes?: number; // Legacy support
    dislikes?: number; // Legacy support
    isEdited?: boolean; // Legacy support
    children?: any[]; // For nested replies
  };
  formatDate: (dateString: string) => string;
  onReply?: (replyId: number) => void; // Optional - undefined when replies are disabled
  showVoting?: boolean;
  depth?: number; // For nested reply styling
  canReply?: boolean; // Whether reply button should be shown
  onEdit?: (replyId: string) => void; // Edit handler
  onDelete?: (replyId: string) => void; // Delete handler
  currentUserId?: string; // Current user ID to check permissions
}

const Reply = ({
  reply,
  formatDate,
  onReply,
  showVoting = true,
  depth = 0,
  canReply = true,
  onEdit,
  onDelete,
  currentUserId,
}: ReplyProps) => {
  const handleVoteChange = (voteData: any) => {
    console.log("Reply vote changed:", voteData);
  };

  const isNested = depth > 0;
  const borderColor = isNested ? "border-blue-200" : "border-gray-200";
  const bgColor = isNested ? "bg-blue-50" : "bg-white";

  // Check if current user can edit/delete this reply
  const canEditDelete =
    currentUserId &&
    (currentUserId === reply.author_id || currentUserId === reply.users?.id);

  return (
    <div
      className={`${bgColor} rounded-lg shadow-sm border ${borderColor} p-4 mb-4 ${
        isNested ? "ml-2" : ""
      }`}
    >
      <div className="flex items-start space-x-4">
        {/* Voting Section */}
        {showVoting && (
          <div className="flex-shrink-0">
            <VoteButtons
              itemId={reply.id}
              itemType="reply"
              initialUpvotes={reply.upvotes || reply.likes || 0}
              initialDownvotes={reply.downvotes || reply.dislikes || 0}
              initialUserVote={reply.user_vote || null}
              size="sm"
              orientation="vertical"
              onVoteChange={handleVoteChange}
            />
          </div>
        )}

        <div className="flex-shrink-0">
          <Image
            src={reply.author.avatar}
            alt={`${reply.author.name}'s avatar`}
            width={40}
            height={40}
            className="rounded-full"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold text-gray-900">{reply.author.name}</p>
              <p className="text-sm text-gray-500">
                {formatDate(reply.createdAt)}
                {reply.isEdited && <span> (edited)</span>}
              </p>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <button className="hover:text-gray-700">
                <Edit className="h-4 w-4" />
              </button>
              <button className="hover:text-gray-700">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="text-gray-700 mb-2">{reply.content}</p>
          
          {/* Reply Attachments */}
          {reply.attachments && reply.attachments.length > 0 && (
            <div className="mb-3">
              <AttachmentDisplay 
                attachments={reply.attachments} 
                showDownload={true}
                className="reply-attachments"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {/* Voting is now handled by VoteButtons component */}
              {canReply && onReply ? (
                <button
                  onClick={() => onReply(reply.id)}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <ReplyIcon className="h-4 w-4" />
                  <span>Reply</span>
                </button>
              ) : (
                <span className="flex items-center space-x-1 text-gray-400">
                  <ReplyIcon className="h-4 w-4" />
                  <span>Max depth reached</span>
                </span>
              )}
            </div>

            {/* Edit and Delete buttons - only show for reply author */}
            {canEditDelete && (
              <div className="flex items-center space-x-2">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Edit reply"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(reply.id)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
                    title="Delete reply"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reply;
