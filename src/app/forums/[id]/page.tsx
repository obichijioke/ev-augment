"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ThreadHeader from "@/components/forums/ThreadHeader";
import Post from "@/components/forums/Post";
import ReplyList from "@/components/forums/ReplyList";
import ReplyForm from "@/components/ReplyForm";
import {
  getForumPost,
  createForumReply,
  editForumReply,
  deleteForumReply,
} from "@/services/forumApi";
import { useUser } from "@/store/authStore";
import { ForumPost } from "@/types/forum";

interface ThreadDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Get authentication token from localStorage
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (!authStorage) return null;

    const authData = JSON.parse(authStorage);
    return authData?.state?.session?.accessToken || null;
  } catch (error) {
    return null;
  }
}

const ThreadDetailPage = ({ params }: ThreadDetailPageProps) => {
  const resolvedParams = use(params);
  const user = useUser();

  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thread, setThread] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);

  // Load thread data from API
  useEffect(() => {
    const loadThread = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getForumPost(resolvedParams.id);
        const postData = response.data.post;
        const repliesData = response.data.replies || [];

        // Transform API data to match component expectations
        const transformedThread = {
          ...postData,
          author: {
            name:
              postData.users?.username ||
              postData.users?.full_name ||
              "Unknown User",
            avatar:
              postData.users?.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                postData.users?.username || "U"
              )}&background=random`,
            joinDate: postData.users?.created_at
              ? new Date(postData.users.created_at).toLocaleDateString()
              : "Unknown",
            posts: 0, // This would come from user stats
            reputation: 0, // This would come from user stats
          },
          category: postData.forum_categories?.name || "General",
          createdAt: postData.created_at,
          views: postData.view_count || 0,
          likes: postData.upvotes || 0,
          isPinned: postData.is_pinned || false,
          isLocked: false,
          tags: postData.tags || [],
          attachments: postData.attachments || [], // Preserve attachment data
        };

        // Transform replies data recursively to handle nested structure
        const transformReply = (reply: any): any => ({
          id: reply.id,
          content: reply.content,
          author_id: reply.author_id, // Preserve for permission checking
          users: reply.users, // Preserve for permission checking
          author: {
            name:
              reply.users?.username || reply.users?.full_name || "Unknown User",
            avatar:
              reply.users?.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                reply.users?.username || "U"
              )}&background=random`,
            joinDate: reply.users?.created_at
              ? new Date(reply.users.created_at).toLocaleDateString()
              : "Unknown",
            posts: 0,
            reputation: 0,
          },
          createdAt: reply.created_at,
          likes: reply.like_count || 0,
          dislikes: 0,
          isEdited: reply.is_edited || false,
          attachments: reply.attachments || [], // Preserve attachment data
          children: reply.children ? reply.children.map(transformReply) : [],
        });

        const transformedReplies = repliesData.map(transformReply);

        setThread(transformedThread);
        setReplies(transformedReplies);
      } catch (err) {
        console.error("Failed to load thread:", err);
        setError("Failed to load thread. Please try again.");

        // Set empty data if API fails
        setReplies([]);
        setThread({
          id: resolvedParams.id,
          title: "Tesla FSD Beta vs Autopilot: Real World Comparison",
          content: `I've been testing both Tesla's FSD Beta and standard Autopilot for the past 6 months, and I wanted to share my detailed comparison for anyone considering the upgrade.

**Key Differences I've Noticed:**

1. **City Driving**: FSD Beta handles city streets much better, including traffic lights, stop signs, and turns
2. **Highway Performance**: Both are excellent on highways, but FSD Beta is more confident with lane changes
3. **Parking**: FSD Beta can handle complex parking scenarios that Autopilot cannot

**My Verdict**: If you do a lot of city driving, FSD Beta is worth the upgrade. For highway-only drivers, standard Autopilot might be sufficient.

What has been your experience? I'd love to hear from other Tesla owners!`,
          slug: "tesla-fsd-beta-vs-autopilot-comparison",
          author_id: "default-user",
          category_id: "tesla-category",
          is_pinned: true,
          is_locked: false,
          is_featured: false,
          is_active: true,
          view_count: 2847,
          like_count: 156,
          reply_count: 0,
          last_activity_at: "2024-01-15T10:30:00Z",
          created_at: "2024-01-15T10:30:00Z",
          updated_at: "2024-01-15T10:30:00Z",
          attachments: [],
          author: {
            name: "TechReviewer",
            avatar:
              "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20tech%20reviewer&image_size=square",
            joinDate: "March 2023",
            posts: 247,
            reputation: 1850,
          },
          category: "Tesla",
          createdAt: "2024-01-15T10:30:00Z",
          views: 2847,
          likes: 156,
          isPinned: true,
          isLocked: false,
          tags: ["FSD", "Autopilot", "Comparison"],
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadThread();
  }, [resolvedParams.id]);

  // Replies are now loaded from API and stored in state

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReply = async (
    content: string,
    attachmentIds?: string[],
    isInlineReply = false
  ) => {
    setIsSubmitting(true);
    try {
      if (!thread) {
        throw new Error("Thread not found");
      }

      console.log("Submitting reply:", {
        content,
        attachmentIds,
        replyingTo,
        isInlineReply,
      });

      // Create reply using API
      const replyData = {
        content,
        parent_id:
          isInlineReply && replyingTo ? replyingTo.toString() : undefined,
        // Note: attachment association handled separately via upload API
      };

      const response = await createForumReply(thread.id.toString(), replyData);

      if (response.success) {
        console.log("Reply created successfully:", response.data);

        // Associate uploaded files with the reply (same pattern as forum posts)
        if (attachmentIds && attachmentIds.length > 0) {
          console.log(`🔗 Associating ${attachmentIds.length} files with reply ${response.data.reply.id}`);
          try {
            await Promise.all(
              attachmentIds.map(async (fileId) => {
                const updateResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api"}/upload/files/${fileId}`,
                  {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${getAuthToken()}`,
                    },
                    body: JSON.stringify({
                      entity_id: response.data.reply.id,
                    }),
                  }
                );

                if (!updateResponse.ok) {
                  const errorText = await updateResponse.text();
                  console.error(`Failed to associate file ${fileId} with reply:`, {
                    status: updateResponse.status,
                    error: errorText,
                  });
                } else {
                  console.log(`✅ Successfully associated file ${fileId} with reply ${response.data.reply.id}`);
                }
              })
            );
          } catch (fileAssocError) {
            console.warn("Failed to associate files with reply:", fileAssocError);
          }
        }

        // Reset inline reply form only if it's an inline reply
        if (isInlineReply) {
          setReplyingTo(null);
        }

        // Reload the thread to show the new reply
        const updatedResponse = await getForumPost(resolvedParams.id);
        if (updatedResponse.success) {
          const updatedPostData = updatedResponse.data.post;
          const updatedRepliesData = updatedResponse.data.replies || [];

          const updatedThread = {
            ...updatedPostData,
            author: {
              name:
                updatedPostData.users?.username ||
                updatedPostData.users?.full_name ||
                "Unknown User",
              avatar:
                updatedPostData.users?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  updatedPostData.users?.username || "U"
                )}&background=random`,
              joinDate: updatedPostData.users?.created_at
                ? new Date(
                    updatedPostData.users.created_at
                  ).toLocaleDateString()
                : "Unknown",
              posts: 0,
              reputation: 0,
            },
            category: updatedPostData.forum_categories?.name || "General",
            createdAt: updatedPostData.created_at,
            views: updatedPostData.view_count || 0,
            likes: updatedPostData.upvotes || 0,
            isPinned: updatedPostData.is_pinned || false,
            isLocked: false,
            tags: updatedPostData.tags || [],
            attachments: updatedPostData.attachments || [], // Preserve attachment data
          };

          // Transform updated replies data recursively
          const transformReply = (reply: any): any => ({
            id: reply.id,
            content: reply.content,
            author: {
              name:
                reply.users?.username ||
                reply.users?.full_name ||
                "Unknown User",
              avatar:
                reply.users?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  reply.users?.username || "U"
                )}&background=random`,
              joinDate: reply.users?.created_at
                ? new Date(reply.users.created_at).toLocaleDateString()
                : "Unknown",
              posts: 0,
              reputation: 0,
            },
            createdAt: reply.created_at,
            likes: reply.like_count || 0,
            dislikes: 0,
            isEdited: reply.is_edited || false,
            attachments: reply.attachments || [], // Preserve attachment data
            children: reply.children ? reply.children.map(transformReply) : [],
          });

          const updatedTransformedReplies =
            updatedRepliesData.map(transformReply);

          setThread(updatedThread);
          setReplies(updatedTransformedReplies);
        }

        alert("Reply posted successfully!");
      } else {
        throw new Error("Failed to create reply");
      }
    } catch (error) {
      console.error("Error posting reply:", error);
      alert("Failed to post reply. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleEditReply = async (replyId: string, content: string) => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await editForumReply(replyId, content);

      if (response.success) {
        console.log("Reply updated successfully:", response.data);

        // Reload the thread to show the updated reply
        const updatedResponse = await getForumPost(resolvedParams.id);
        if (updatedResponse.success) {
          const updatedPostData = updatedResponse.data.post;
          const updatedRepliesData = updatedResponse.data.replies || [];

          const updatedThread = {
            ...updatedPostData,
            author: {
              name:
                updatedPostData.users?.username ||
                updatedPostData.users?.full_name ||
                "Unknown User",
              avatar:
                updatedPostData.users?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  updatedPostData.users?.username || "U"
                )}&background=random`,
              joinDate: updatedPostData.users?.created_at
                ? new Date(
                    updatedPostData.users.created_at
                  ).toLocaleDateString()
                : "Unknown",
              posts: 0,
              reputation: 0,
            },
            category: updatedPostData.forum_categories?.name || "General",
          };

          // Transform updated replies data recursively
          const transformReply = (reply: any): any => ({
            id: reply.id,
            content: reply.content,
            author_id: reply.author_id, // Preserve for permission checking
            users: reply.users, // Preserve for permission checking
            author: {
              name:
                reply.users?.username ||
                reply.users?.full_name ||
                "Unknown User",
              avatar:
                reply.users?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  reply.users?.username || "U"
                )}&background=random`,
              joinDate: reply.users?.created_at
                ? new Date(reply.users.created_at).toLocaleDateString()
                : "Unknown",
              posts: 0,
              reputation: 0,
            },
            createdAt: reply.created_at,
            likes: reply.like_count || 0,
            dislikes: 0,
            isEdited: reply.is_edited || false,
            attachments: reply.attachments || [], // Preserve attachment data
            children: reply.children ? reply.children.map(transformReply) : [],
          });

          const updatedTransformedReplies =
            updatedRepliesData.map(transformReply);

          setThread(updatedThread);
          setReplies(updatedTransformedReplies);
        }
              } else {
          console.error("Failed to update reply:", response);
          alert("Failed to update reply. Please try again.");
        }
    } catch (error) {
      console.error("Error updating reply:", error);
      alert("Failed to update reply. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this reply? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await deleteForumReply(replyId);

      if (response.success) {
        console.log("Reply deleted successfully");

        // Reload the thread to remove the deleted reply
        const updatedResponse = await getForumPost(resolvedParams.id);
        if (updatedResponse.success) {
          const updatedPostData = updatedResponse.data.post;
          const updatedRepliesData = updatedResponse.data.replies || [];

          const updatedThread = {
            ...updatedPostData,
            author: {
              name:
                updatedPostData.users?.username ||
                updatedPostData.users?.full_name ||
                "Unknown User",
              avatar:
                updatedPostData.users?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  updatedPostData.users?.username || "U"
                )}&background=random`,
              joinDate: updatedPostData.users?.created_at
                ? new Date(
                    updatedPostData.users.created_at
                  ).toLocaleDateString()
                : "Unknown",
              posts: 0,
              reputation: 0,
            },
            category: updatedPostData.forum_categories?.name || "General",
          };

          // Transform updated replies data recursively
          const transformReply = (reply: any): any => ({
            id: reply.id,
            content: reply.content,
            author_id: reply.author_id, // Preserve for permission checking
            users: reply.users, // Preserve for permission checking
            author: {
              name:
                reply.users?.username ||
                reply.users?.full_name ||
                "Unknown User",
              avatar:
                reply.users?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  reply.users?.username || "U"
                )}&background=random`,
              joinDate: reply.users?.created_at
                ? new Date(reply.users.created_at).toLocaleDateString()
                : "Unknown",
              posts: 0,
              reputation: 0,
            },
            createdAt: reply.created_at,
            likes: reply.like_count || 0,
            dislikes: 0,
            isEdited: reply.is_edited || false,
            attachments: reply.attachments || [], // Preserve attachment data
            children: reply.children ? reply.children.map(transformReply) : [],
          });

          const updatedTransformedReplies =
            updatedRepliesData.map(transformReply);

          setThread(updatedThread);
          setReplies(updatedTransformedReplies);
        }
      } else {
        console.error("Failed to delete reply:", response.error);
        alert("Failed to delete reply. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting reply:", error);
      alert("Failed to delete reply. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <ArrowLeft className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Failed to Load Thread
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Thread not found
  if (!thread) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Thread Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              The thread you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/forums"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Forums
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/forums"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forums
          </Link>
        </div>

        <ThreadHeader 
          thread={{
            title: thread.title,
            isPinned: thread.isPinned || false,
            category: thread.category || "General",
            tags: thread.tags || [],
            createdAt: thread.createdAt || thread.created_at,
            views: thread.views || thread.view_count || 0,
            likes: thread.likes || thread.like_count || 0,
          }} 
          formatDate={formatDate} 
        />

        <Post post={thread} author={thread.author!} content={thread.content} />

        <ReplyList
          replies={replies}
          replyingTo={replyingTo}
          isSubmitting={isSubmitting}
          formatDate={formatDate}
          handleReply={handleReply}
          handleCancelReply={handleCancelReply}
          setReplyingTo={setReplyingTo}
          onEditReply={handleEditReply}
          onDeleteReply={handleDeleteReply}
          currentUserId={user?.id}
          editingReplyId={editingReplyId}
          setEditingReplyId={setEditingReplyId}
        />

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Join the Discussion
          </h3>
                      <ReplyForm
              onSubmit={(content, attachmentIds) => handleReply(content, attachmentIds, false)}
              placeholder="Share your thoughts on this discussion..."
              isSubmitting={isSubmitting}
            />
        </div>
      </div>
    </div>
  );
};

export default ThreadDetailPage;
