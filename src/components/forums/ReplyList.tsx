"use client";

import Reply from "./Reply";
import ReplyForm from "../ReplyForm";

interface ReplyListProps {
  replies: any[];
  replyingTo: number | null;
  isSubmitting: boolean;
  formatDate: (dateString: string) => string;
  handleReply: (
    content: string,
    attachments?: File[],
    isInlineReply?: boolean
  ) => void;
  handleCancelReply: () => void;
  setReplyingTo: (id: number | null) => void;
  onEditReply?: (replyId: string, content: string) => void;
  onDeleteReply?: (replyId: string) => void;
  currentUserId?: string;
  editingReplyId?: string | null;
  setEditingReplyId?: (replyId: string | null) => void;
}

const ReplyList = ({
  replies,
  replyingTo,
  isSubmitting,
  formatDate,
  handleReply,
  handleCancelReply,
  setReplyingTo,
  onEditReply,
  onDeleteReply,
  currentUserId,
  editingReplyId,
  setEditingReplyId,
}: ReplyListProps) => {
  // Count total replies including nested ones
  const countTotalReplies = (replies: any[]): number => {
    return replies.reduce((total, reply) => {
      return (
        total + 1 + (reply.children ? countTotalReplies(reply.children) : 0)
      );
    }, 0);
  };

  // Render nested replies recursively with maximum depth of 2
  const renderReply = (reply: any, depth: number = 0) => {
    const maxDepth = 2; // Maximum nesting depth: 0 (root), 1 (first level), 2 (second level)
    const currentDepth = Math.min(depth, maxDepth);
    const marginLeft = currentDepth * 24; // 24px per level of nesting
    const canReply = depth < maxDepth; // Only allow replies if we haven't reached max depth

    return (
      <div key={reply.id} style={{ marginLeft: `${marginLeft}px` }}>
        <div
          className={`${
            currentDepth > 0 ? "border-l-2 border-gray-200 pl-4" : ""
          }`}
        >
          <Reply
            reply={reply}
            formatDate={formatDate}
            onReply={canReply ? setReplyingTo : undefined} // Disable reply if max depth reached
            depth={currentDepth}
            canReply={canReply}
            onEdit={
              onEditReply ? () => setEditingReplyId?.(reply.id) : undefined
            }
            onDelete={onDeleteReply}
            currentUserId={currentUserId}
          />

          {/* Inline reply form - only show if we can reply */}
          {replyingTo === reply.id && canReply && (
            <div className="mt-2">
              <ReplyForm
                onSubmit={(content, attachmentIds) =>
                  handleReply(content, attachmentIds, true)
                }
                onCancel={handleCancelReply}
                isSubmitting={isSubmitting}
                replyingTo={{
                  id: reply.id,
                  author: reply.author.name,
                  content: reply.content,
                }}
              />
            </div>
          )}

          {/* Edit form - only show if editing this reply */}
          {editingReplyId === reply.id && onEditReply && (
            <div className="mt-2">
              <ReplyForm
                onSubmit={(content) => {
                  onEditReply(reply.id, content);
                  setEditingReplyId?.(null);
                }}
                onCancel={() => setEditingReplyId?.(null)}
                isSubmitting={isSubmitting}
                isEditing={true}
                initialContent={reply.content}
                editingReplyId={reply.id}
              />
            </div>
          )}

          {/* Render nested replies - but limit to max depth */}
          {reply.children && reply.children.length > 0 && depth < maxDepth && (
            <div className="mt-2">
              {reply.children.map((childReply: any) =>
                renderReply(childReply, depth + 1)
              )}
            </div>
          )}

          {/* Show flattened replies at max depth */}
          {reply.children && reply.children.length > 0 && depth >= maxDepth && (
            <div className="mt-2 pl-4 border-l-2 border-orange-200 bg-orange-50 rounded p-2">
              <p className="text-sm text-orange-700 mb-2 font-medium">
                Additional replies (shown at same level due to depth limit):
              </p>
              {reply.children.map(
                (childReply: any) => renderReply(childReply, depth) // Keep at same depth instead of going deeper
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const totalReplies = countTotalReplies(replies);

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Replies ({totalReplies})
      </h2>
      <div className="space-y-4">
        {replies.map((reply) => renderReply(reply, 0))}
      </div>
    </div>
  );
};

export default ReplyList;
