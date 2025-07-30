'use client';

import Image from 'next/image';
import { ThumbsUp, ThumbsDown, Reply as ReplyIcon, Edit, Trash2 } from 'lucide-react';

interface ReplyProps {
  reply: {
    id: number;
    content: string;
    author: {
      name: string;
      avatar: string;
    };
    createdAt: string;
    likes: number;
    dislikes: number;
    isEdited: boolean;
  };
  formatDate: (dateString: string) => string;
  onReply: (replyId: number) => void;
}

const Reply = ({ reply, formatDate, onReply }: ReplyProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-start space-x-4">
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
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <button className="flex items-center space-x-1 hover:text-blue-600">
              <ThumbsUp className="h-4 w-4" />
              <span>{reply.likes}</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-red-600">
              <ThumbsDown className="h-4 w-4" />
              <span>{reply.dislikes}</span>
            </button>
            <button onClick={() => onReply(reply.id)} className="flex items-center space-x-1 hover:text-gray-700">
              <ReplyIcon className="h-4 w-4" />
              <span>Reply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reply;