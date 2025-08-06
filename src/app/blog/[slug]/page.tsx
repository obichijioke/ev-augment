"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BlogPost } from "../../../types/blog";
import { useBlogPost } from "../../../hooks/useBlogPost";
import { useBlogComments } from "../../../hooks/useBlogComments";
import { useBlogLikes } from "../../../hooks/useBlogLikes";
import { useBlogError } from "../../../hooks/useBlogError";
import { useAuthStore } from "../../../store/authStore";
import PostHeader from "../../../components/blog/PostHeader";
import PostBody from "../../../components/blog/PostBody";
import PostActions from "../../../components/blog/PostActions";
import CommentSection from "../../../components/blog/CommentSection";
import RelatedPosts from "../../../components/blog/RelatedPosts";
import {
  BlogLoading,
  BlogPostLoading,
  BlogError,
  BlogPostNotFound,
} from "../../../components/blog/BlogErrorBoundary";

import React from "react";

const BlogPostPage = ({ params }: { params: { slug: string } }) => {
  const resolvedParams = React.use(params);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Auth
  const { user, isAuthenticated } = useAuthStore();

  // Blog post hooks
  const {
    post,
    relatedPosts,
    isLoading,
    error: postError,
  } = useBlogPost({
    slug: resolvedParams.slug,
    autoLoad: true,
  });

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

  // Loading state
  if (isLoading) {
    return <BlogPostLoading />;
  }

  // Error state
  if (postError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <BlogError
          message={formatErrorMessage(postError)}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Not found state
  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <BlogPostNotFound />
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PostHeader post={post} />
        <PostBody post={post} />
        <div className="mt-8 border-t border-b border-gray-200 py-6">
          <PostActions
            isLiked={isLiked}
            isBookmarked={isBookmarked}
            onLike={handleLike}
            onBookmark={handleBookmark}
            likeCount={likeCount}
            isLikeLoading={isLikeLoading}
            post={post}
            currentUser={user}
          />
        </div>
        <CommentSection
          comments={comments}
          onCommentSubmit={handleCommentSubmit}
          isLoading={isCreatingComment}
          error={commentsError ? formatErrorMessage(commentsError) : null}
        />
        <RelatedPosts posts={relatedPosts} />
      </div>
    </div>
  );
};

export default BlogPostPage;
