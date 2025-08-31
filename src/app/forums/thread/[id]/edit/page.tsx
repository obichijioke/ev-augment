"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, X, AlertCircle } from "lucide-react";
import ForumLayout from "@/components/forum/ForumLayout";
import ErrorBoundary, {
  ForumLoading,
  ForumError,
} from "@/components/forum/ErrorBoundary";
import { useForumError } from "@/hooks/useForumError";
import { useForumThread, useForumThreads } from "@/hooks/useForumApi";

const EditThreadPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const threadId = params.id as string;

  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get thread data
  const {
    thread,
    loading: threadLoading,
    error: threadError,
  } = useForumThread(threadId);

  // Get thread update function
  const { updateThread } = useForumThreads();

  const { error, handleError, clearError } = useForumError();

  // Initialize form data when thread loads
  useEffect(() => {
    if (thread) {
      setFormData({
        title: thread.title,
        content: thread.content,
      });
    }
  }, [thread]);

  // Handle API errors
  useEffect(() => {
    if (threadError) {
      handleError(new Error(threadError));
    } else {
      clearError();
    }
  }, [threadError, handleError, clearError]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      handleError("Thread title is required");
      return;
    }

    if (!formData.content.trim()) {
      handleError("Thread content is required");
      return;
    }

    try {
      setIsSubmitting(true);
      clearError();

      // Update the thread
      await updateThread(threadId, {
        title: formData.title,
        content: formData.content,
      });

      // Redirect back to the thread
      router.push(`/forums/thread/${threadId}`);
    } catch (err) {
      handleError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/forums/thread/${threadId}`);
  };

  if (threadLoading) {
    return (
      <ForumLayout title="Edit Thread" showBackButton={true}>
        <ForumLoading message="Loading thread..." />
      </ForumLayout>
    );
  }

  if (error || !thread) {
    return (
      <ForumLayout title="Edit Thread" showBackButton={true}>
        <ForumError
          message={error || "Thread not found"}
          onRetry={() => window.location.reload()}
        />
      </ForumLayout>
    );
  }

  return (
    <ErrorBoundary>
      <ForumLayout
        title="Edit Thread"
        showBackButton={true}
        backHref={`/forums/thread/${threadId}`}
      >
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Thread Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Thread Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter thread title..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
                maxLength={200}
              />
              <div className="mt-1 text-xs text-gray-500">
                {formData.title.length}/200 characters
              </div>
            </div>

            {/* Thread Content */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Content *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Write your thread content..."
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
                maxLength={10000}
              />
              <div className="mt-1 text-xs text-gray-500">
                {formData.content.length}/10,000 characters
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700 dark:text-red-300">
                    {error}
                  </span>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                * Required fields
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.title.trim() ||
                    !formData.content.trim()
                  }
                  className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </ForumLayout>
    </ErrorBoundary>
  );
};

export default EditThreadPage;
