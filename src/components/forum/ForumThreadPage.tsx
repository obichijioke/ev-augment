'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ForumLayout from '@/components/forum/ForumLayout';
import ThreadHeader from '@/components/forum/ThreadHeader';
import PostContent from '@/components/forum/PostContent';
import ReplyList from '@/components/forum/ReplyList';
import BreadcrumbNavigation from '@/components/forum/BreadcrumbNavigation';
import StructuredData from '@/components/seo/StructuredData';
import { ForumThread, ForumCategory, CreateReplyForm } from '@/types/forum';
import { useForumReplies, useForumImages } from '@/hooks/useForumApi';

interface Props {
  thread: ForumThread;
  category: ForumCategory;
  categorySlug: string;
  threadSlug: string;
}

const ForumThreadPage: React.FC<Props> = ({ 
  thread, 
  category, 
  categorySlug, 
  threadSlug 
}) => {
  const router = useRouter();
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Reply API hook
  const { createReply } = useForumReplies();
  
  // Image upload hook
  const { uploadImage } = useForumImages();

  // Handle edit button click
  const handleEdit = () => {
    router.push(`/forums/${categorySlug}/${threadSlug}/edit`);
  };

  // Handle reply submission
  const handleReplySubmit = async (replyData: CreateReplyForm) => {
    setIsSubmittingReply(true);
    try {
      await createReply({
        ...replyData,
        thread_id: thread.id,
      });
      
      // Refresh the page to show new reply
      router.refresh();
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Check if current user can edit (simplified for now)
  const canEdit = true; // TODO: Check if user is author or has permissions

  // Generate structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: thread.title,
    text: thread.content,
    datePublished: thread.created_at,
    dateModified: thread.updated_at,
    author: {
      '@type': 'Person',
      name: thread.author?.username || 'Anonymous',
      url: thread.author?.username ? `/users/${thread.author.username}` : undefined,
    },
    discussionUrl: `/forums/${categorySlug}/${threadSlug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `/forums/${categorySlug}/${threadSlug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'EV Community Platform',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://evcommunity.com',
    },
    isPartOf: {
      '@type': 'DiscussionForum',
      name: category.name,
      description: category.description,
      url: `/forums/${categorySlug}`,
    },
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ViewAction',
        userInteractionCount: thread.view_count || 0,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ReplyAction',
        userInteractionCount: thread.reply_count || 0,
      },
    ],
    comment: thread.replies?.map(reply => ({
      '@type': 'Comment',
      text: reply.content,
      datePublished: reply.created_at,
      author: {
        '@type': 'Person',
        name: reply.author?.username || 'Anonymous',
      },
    })) || [],
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData data={structuredData} />
      
      <ForumLayout
        title={thread.title}
        showBackButton={true}
        backHref={`/forums/${categorySlug}`}
      >
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation
          items={[
            { label: 'Forums', href: '/forums' },
            { label: category.name, href: `/forums/${categorySlug}` },
            { label: thread.title, href: `/forums/${categorySlug}/${threadSlug}` },
          ]}
          className="mb-6"
        />

        {/* Thread Header */}
        <ThreadHeader
          thread={thread}
          className="mb-6"
          showEditButton={canEdit}
          onEdit={handleEdit}
        />

        {/* Original Post */}
        <div className="mb-8">
          {thread.author && (
            <PostContent
              content={thread.content}
              images={thread.images}
              author={thread.author}
              createdAt={thread.created_at}
              updatedAt={thread.updated_at}
              isOriginalPost={true}
            />
          )}
        </div>

        {/* Replies Section */}
        <ReplyList
          threadId={thread.id}
          replies={thread.replies || []}
          onReplySubmit={handleReplySubmit}
          isSubmitting={isSubmittingReply}
          onImageUpload={uploadImage}
        />
      </ForumLayout>
    </>
  );
};

export default ForumThreadPage;
