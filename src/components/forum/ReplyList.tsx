'use client';

import React, { useState } from 'react';
import { MessageSquare, SortAsc, SortDesc, Filter } from 'lucide-react';
import { ForumReply, CreateReplyForm } from '@/types/forum';
import ReplyItem from './ReplyItem';
import ReplyForm from './ReplyForm';

interface ReplyListProps {
  replies: ForumReply[];
  threadId: string;
  originalPosterId: string;
  isLocked?: boolean;
  onReply?: (data: CreateReplyForm) => Promise<void>;
  className?: string;
}

type SortOption = 'oldest' | 'newest';

const ReplyList: React.FC<ReplyListProps> = ({
  replies,
  threadId,
  originalPosterId,
  isLocked = false,
  onReply,
  className = '',
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOption>('oldest');
  const [isReplying, setIsReplying] = useState(false);

  // Sort replies based on selected order
  const sortedReplies = [...replies].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    
    return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
  });

  const handleMainReply = async (data: CreateReplyForm) => {
    if (!onReply) return;
    
    try {
      setIsReplying(true);
      await onReply(data);
      setShowReplyForm(false);
    } catch (error) {
      throw error; // Let ReplyForm handle the error
    } finally {
      setIsReplying(false);
    }
  };

  const handleNestedReply = async (data: CreateReplyForm) => {
    if (!onReply) return;
    await onReply(data);
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-gray-900">
            Replies ({replies.length})
          </h2>
          <MessageSquare className="h-5 w-5 text-gray-500" />
        </div>

        <div className="flex items-center space-x-4">
          {/* Sort Options */}
          {replies.length > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort:</span>
              <button
                onClick={() => setSortOrder(sortOrder === 'oldest' ? 'newest' : 'oldest')}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {sortOrder === 'oldest' ? (
                  <>
                    <SortAsc className="h-4 w-4" />
                    <span>Oldest first</span>
                  </>
                ) : (
                  <>
                    <SortDesc className="h-4 w-4" />
                    <span>Newest first</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Reply Button */}
          {!isLocked && onReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              disabled={isReplying}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Reply to Thread
            </button>
          )}
        </div>
      </div>

      {/* Main Reply Form */}
      {showReplyForm && !isLocked && onReply && (
        <div className="mb-8">
          <ReplyForm
            threadId={threadId}
            onSubmit={handleMainReply}
            onCancel={() => setShowReplyForm(false)}
            placeholder="Share your thoughts on this thread..."
          />
        </div>
      )}

      {/* Replies */}
      {replies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No replies yet</h3>
          <p className="text-gray-600 mb-4">
            {isLocked 
              ? "This thread is locked and no new replies can be added."
              : "Be the first to reply to this thread!"
            }
          </p>
          {!isLocked && !showReplyForm && onReply && (
            <button
              onClick={() => setShowReplyForm(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start the Discussion
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedReplies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              threadId={threadId}
              isOriginalPoster={reply.author.id === originalPosterId}
              nestingLevel={0}
              maxNestingLevel={2} // Enforce 2-level maximum nesting
              onReply={!isLocked ? handleNestedReply : undefined}
            />
          ))}
        </div>
      )}

      {/* Locked Thread Notice */}
      {isLocked && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-yellow-800">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Thread Locked</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            This thread has been locked by a moderator. No new replies can be added.
          </p>
        </div>
      )}

      {/* Nesting Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Reply System</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• You can reply directly to the thread or to individual comments</p>
          <p>• Maximum nesting depth is 2 levels (comment → reply → reply)</p>
          <p>• Keep discussions focused and respectful</p>
        </div>
      </div>
    </div>
  );
};

export default ReplyList;
