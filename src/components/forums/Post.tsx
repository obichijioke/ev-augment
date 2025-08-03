"use client";

import Image from "next/image";
import VoteButtons from "./VoteButtons";
import ReputationBadge from "./ReputationBadge";
import { ForumPost } from "@/types/forum";

interface PostProps {
  post: ForumPost;
  author: {
    name: string;
    avatar: string;
    joinDate: string;
    posts: number;
    reputation: number;
  };
  content: string;
  showVoting?: boolean;
}

const Post = ({ post, author, content, showVoting = true }: PostProps) => {
  // Safety check for post
  if (!post) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Post not found or failed to load.</p>
        </div>
      </div>
    );
  }

  const handleVoteChange = (voteData: any) => {
    // Handle vote change - could update local state or trigger refetch
    console.log("Vote changed:", voteData);
  };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-start space-x-4">
        {/* Voting Section */}
        {showVoting && (
          <div className="flex-shrink-0">
            <VoteButtons
              itemId={post.id}
              itemType="post"
              initialUpvotes={post.upvotes || 0}
              initialDownvotes={post.downvotes || 0}
              initialUserVote={post.user_vote || null}
              size="md"
              orientation="vertical"
              onVoteChange={handleVoteChange}
            />
          </div>
        )}

        {/* Author Avatar */}
        <div className="flex-shrink-0">
          <Image
            src={author.avatar}
            alt={`${author.name}'s avatar`}
            width={48}
            height={48}
            className="rounded-full"
          />
        </div>

        {/* Post Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {author.name}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <ReputationBadge
                    reputation={author.reputation}
                    showLabel={false}
                    size="sm"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {author.posts} posts
                  </span>
                </div>
              </div>
            </div>

            {/* Post metadata */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <div>Posted {new Date(post.created_at).toLocaleDateString()}</div>
              {post.updated_at !== post.created_at && (
                <div className="mt-1">
                  Edited {new Date(post.updated_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Post Content */}
          <div
            className="prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{
              __html: content.replace(/\n/g, "<br />"),
            }}
          />

          {/* Post Stats */}
          <div className="flex items-center space-x-4 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <span>{post.view_count} views</span>
            <span>{post.reply_count} replies</span>
            {post.score !== undefined && (
              <span
                className={
                  post.score >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }
              >
                {post.score >= 0 ? "+" : ""}
                {post.score} score
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Post;
