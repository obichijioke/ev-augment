'use client';

import { useState, useEffect } from 'react';
import { BlogPost } from '../../../types/blog';
import { mockPost, relatedPosts } from '../../../lib/mock-data';
import PostHeader from '../../../components/blog/PostHeader';
import PostBody from '../../../components/blog/PostBody';
import PostActions from '../../../components/blog/PostActions';
import CommentSection from '../../../components/blog/CommentSection';
import RelatedPosts from '../../../components/blog/RelatedPosts';

import React from 'react';

const BlogPostPage = ({ params }: { params: { id: string } }) => {
  const resolvedParams = React.use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    // In a real app, you'd fetch this data from an API
    setPost(mockPost);
  }, [resolvedParams.id]);

  const handleLike = () => setIsLiked(!isLiked);
  const handleBookmark = () => setIsBookmarked(!isBookmarked);

  const handleCommentSubmit = (comment: string) => {
    console.log('New comment:', comment);
    // Here you would typically send the comment to your backend
  };

  if (!post) {
    return <div>Loading...</div>;
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
          />
        </div>
        <CommentSection comments={post.comments} onCommentSubmit={handleCommentSubmit} />
        <RelatedPosts posts={relatedPosts} />
      </div>
    </div>
  );
};

export default BlogPostPage;