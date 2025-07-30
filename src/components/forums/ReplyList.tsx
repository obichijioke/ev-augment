'use client';

import Reply from './Reply';
import ReplyForm from '../ReplyForm';

interface ReplyListProps {
  replies: any[];
  replyingTo: number | null;
  isSubmitting: boolean;
  formatDate: (dateString: string) => string;
  handleReply: (content: string, attachments?: File[], isInlineReply?: boolean) => void;
  handleCancelReply: () => void;
  setReplyingTo: (id: number | null) => void;
}

const ReplyList = ({ replies, replyingTo, isSubmitting, formatDate, handleReply, handleCancelReply, setReplyingTo }: ReplyListProps) => {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Replies ({replies.length})</h2>
      <div className="space-y-4">
        {replies.map((reply) => (
          <div key={reply.id}>
            <Reply reply={reply} formatDate={formatDate} onReply={setReplyingTo} />
            {replyingTo === reply.id && (
              <div className="ml-12 mt-2">
                <ReplyForm
                  onSubmit={(content, attachments) => handleReply(content, attachments, true)}
                  onCancel={handleCancelReply}
                  isSubmitting={isSubmitting}
                  isInline={true}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReplyList;