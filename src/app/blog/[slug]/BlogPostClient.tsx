"use client";

import { useState } from "react";
import { BlogPost } from "../../../types/blog";
import { useBlogComments } from "../../../hooks/useBlogComments";
import { useBlogLikes } from "../../../hooks/useBlogLikes";
import { useBlogError } from "../../../hooks/useBlogError";
import { useAuthStore } from "../../../store/authStore";
import PostHeader from "../../../components/blog/PostHeader";
import PostBody from "../../../components/blog/PostBody";
import PostActions from "../../../components/blog/PostActions";
import CommentSection from "../../../components/blog/CommentSection";
import RelatedPosts from "../../../components/blog/RelatedPosts";

interface BlogPostClientProps {
  post: BlogPost;
}

export default function BlogPostClient({ post }: BlogPostClientProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Auth
  const { user, isAuthenticated } = useAuthStore();

  // Comments hooks
  const {
    comments,
    createComment,
    isCreating: isCreatingComment,
    error: commentsError,
  } = useBlogComments({
    postId: post?.id,
    autoLoad: !!post?.id,
  });

  // Likes hooks
  const {
    isLiked,
    likeCount,
    isLoading: isLikeLoading,
    error: likeError,
    toggleLike,
  } = useBlogLikes({
    postId: post?.id,
    autoLoad: !!post?.id,
  });

  // Error handling
  const { formatErrorMessage } = useBlogError();

  const handleLike = async () => {
    try {
      await toggleLike();
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const handleBookmark = () => setIsBookmarked(!isBookmarked);

  const handleCommentSubmit = async (comment: string) => {
    if (!post?.id) return;

    try {
      await createComment(post.id, { content: comment });
    } catch (error) {
      console.error("Failed to create comment:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PostHeader post={post} />
        <PostBody post={post} />
        <div className="mt-8 border-t border-b border-gray-200 dark:border-gray-700 py-6">
          <PostActions
            isLiked={isLiked}
            isBookmarked={isBookmarked}
            onLike={handleLike}
            onBookmark={handleBookmark}
            likeCount={likeCount}
            isLikeLoading={isLikeLoading}
            post={post}
            currentUser={user}
            isAuthenticated={isAuthenticated}
          />
        </div>
        <CommentSection
          comments={comments}
          onCommentSubmit={handleCommentSubmit}
          isLoading={isCreatingComment}
          error={commentsError ? formatErrorMessage(commentsError) : null}
          isAuthenticated={isAuthenticated}
          currentUser={user}
        />
        <RelatedPosts posts={[]} />
      </div>
    </div>
  );
}
