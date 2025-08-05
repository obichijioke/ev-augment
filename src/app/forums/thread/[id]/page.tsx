"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ForumLayout from "@/components/forum/ForumLayout";
import ThreadHeader from "@/components/forum/ThreadHeader";
import PostContent from "@/components/forum/PostContent";
import ReplyList from "@/components/forum/ReplyList";
import ErrorBoundary, {
  ForumLoading,
  ForumError,
} from "@/components/forum/ErrorBoundary";
import { ForumThread, CreateReplyForm } from "@/types/forum";
import { useForumThread, useForumReplies } from "@/hooks/useForumApi";

const ThreadDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;

  // Load thread data using API hook
  const {
    thread,
    loading: isLoading,
    error,
    refetch,
  } = useForumThread(threadId);

  const handleRetry = () => {
    refetch();
  };

  // Handle edit button click
  const handleEdit = () => {
    router.push(`/forums/thread/${threadId}/edit`);
  };

  // Check if current user can edit (for now, we'll assume they can - in real app, check auth)
  const canEdit = true; // TODO: Check if user is author or has permissions

  const handleReply = async (data: CreateReplyForm) => {
    // Simulate API call to create reply
    console.log("Creating reply:", data);

    // In a real app, this would make an API call
    // For now, we'll just simulate success
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Refresh the page to show the new reply
    // In a real app, you'd update the state instead
    window.location.reload();
  };

  if (isLoading) {
    return (
      <ForumLayout title="Loading..." showBackButton={true}>
        <ForumLoading message="Loading thread..." />
      </ForumLayout>
    );
  }

  if (error || !thread) {
    return (
      <ForumLayout title="Error" showBackButton={true}>
        <ForumError
          message={error || "Thread not found"}
          onRetry={handleRetry}
        />
      </ForumLayout>
    );
  }

  return (
    <ErrorBoundary>
      <ForumLayout
        title={thread.title}
        showBackButton={true}
        backHref={`/forums/${thread.category?.slug || ""}`}
      >
        {/* Thread Header */}
        <ThreadHeader
          thread={thread}
          className="mb-6"
          showEditButton={canEdit}
          onEdit={handleEdit}
        />

        {/* Original Post */}
        <div className="mb-8">
          <PostContent
            content={thread.content}
            images={thread.images}
            author={thread.author}
            createdAt={thread.created_at}
            updatedAt={thread.updated_at}
            isOriginalPost={true}
          />
        </div>

        {/* Replies Section */}
        <ReplyList
          replies={thread.replies || []}
          threadId={thread.id}
          originalPosterId={thread.author?.id || ""}
          isLocked={thread.is_locked}
          onReply={handleReply}
        />
      </ForumLayout>
    </ErrorBoundary>
  );
};

export default ThreadDetailPage;
