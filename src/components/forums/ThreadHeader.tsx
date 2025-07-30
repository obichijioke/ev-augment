'use client';

import { useState } from 'react';
import { Pin, Heart, Share2, Flag, Clock, Users } from 'lucide-react';

interface ThreadHeaderProps {
  thread: {
    title: string;
    isPinned: boolean;
    category: string;
    tags: string[];
    createdAt: string;
    views: number;
    likes: number;
  };
  formatDate: (dateString: string) => string;
}

const ThreadHeader = ({ thread, formatDate }: ThreadHeaderProps) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {thread.isPinned && <Pin className="h-4 w-4 text-green-600" />}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {thread.category}
            </span>
            {thread.tags.map((tag, index) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                #{tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{thread.title}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2 rounded-lg ${isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} hover:bg-red-200`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
            <Share2 className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
            <Flag className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{formatDate(thread.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{thread.views} views</span>
          </div>
          <div className="flex items-center space-x-1">
            <Heart className="h-4 w-4" />
            <span>{thread.likes} likes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadHeader;