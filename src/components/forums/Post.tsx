'use client';

import Image from 'next/image';

interface PostProps {
  author: {
    name: string;
    avatar: string;
    joinDate: string;
    posts: number;
    reputation: number;
  };
  content: string;
}

const Post = ({ author, content }: PostProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <Image
            src={author.avatar}
            alt={`${author.name}'s avatar`}
            width={48}
            height={48}
            className="rounded-full"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold text-gray-900">{author.name}</p>
              <p className="text-sm text-gray-500">Reputation: {author.reputation}</p>
            </div>
          </div>
          <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        </div>
      </div>
    </div>
  );
};

export default Post;