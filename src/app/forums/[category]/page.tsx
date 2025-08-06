"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MessageSquare, Users, TrendingUp } from "lucide-react";
import ForumLayout from "@/components/forum/ForumLayout";
import ThreadCard from "@/components/forum/ThreadCard";
import ForumFilters from "@/components/forum/ForumFilters";
import ErrorBoundary, {
  ForumLoading,
  ForumError,
  ForumEmpty,
} from "@/components/forum/ErrorBoundary";
import { ForumCategory, ForumThread, ThreadFilters } from "@/types/forum";
import { useForumCategories, useForumThreads } from "@/hooks/useForumApi";

const CategoryPage: React.FC = () => {
  const params = useParams();
  const categorySlug = params.category as string;

  const [filteredThreads, setFilteredThreads] = useState<ForumThread[]>([]);
  const [filters, setFilters] = useState<ThreadFilters>({
    sort: "latest",
    filter: "all",
    search: "",
  });

  // Get categories to find the current category
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useForumCategories();

  // Find the current category
  const category = categories.find((cat) => cat.slug === categorySlug);

  // Get threads for this category
  const {
    threads,
    loading: threadsLoading,
    error: threadsError,
    refetch: refetchThreads,
  } = useForumThreads({
    category_id: category?.id,
    sort:
      filters.sort === "latest"
        ? "newest"
        : filters.sort === "oldest"
        ? "oldest"
        : filters.sort === "popular"
        ? "most_views"
        : "newest",
  });

  const isLoading = categoriesLoading || threadsLoading;
  const error = categoriesError || threadsError;

  // Apply filters and sorting
  useEffect(() => {
    // Ensure threads is an array before processing
    if (!threads || !Array.isArray(threads)) {
      setFilteredThreads([]);
      return;
    }

    let filtered = [...threads];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (thread) =>
          thread.title.toLowerCase().includes(searchLower) ||
          thread.content.toLowerCase().includes(searchLower) ||
          (thread.author?.displayName || "").toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    switch (filters.filter) {
      case "pinned":
        filtered = filtered.filter((thread) => thread.is_pinned);
        break;
      case "locked":
        filtered = filtered.filter((thread) => thread.is_locked);
        break;
      case "unanswered":
        filtered = filtered.filter((thread) => thread.reply_count === 0);
        break;
      // 'all' doesn't filter anything
    }

    // Apply sorting
    switch (filters.sort) {
      case "latest":
        filtered.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case "popular":
        filtered.sort((a, b) => b.view_count - a.view_count);
        break;
      case "replies":
        filtered.sort((a, b) => b.reply_count - a.reply_count);
        break;
    }

    // Pinned threads always come first (unless filtering for non-pinned)
    if (filters.filter !== "locked" && filters.filter !== "unanswered") {
      const pinned = filtered.filter((thread) => thread.is_pinned);
      const regular = filtered.filter((thread) => !thread.is_pinned);
      filtered = [...pinned, ...regular];
    }

    setFilteredThreads(filtered);
  }, [threads, filters]);

  const handleRetry = () => {
    refetchThreads();
  };

  if (isLoading) {
    return (
      <ForumLayout title="Loading..." showBackButton={true}>
        <ForumLoading message="Loading category threads..." />
      </ForumLayout>
    );
  }

  if (error || !category) {
    return (
      <ForumLayout title="Error" showBackButton={true}>
        <ForumError
          message={error || "Category not found"}
          onRetry={handleRetry}
        />
      </ForumLayout>
    );
  }

  return (
    <ErrorBoundary>
      <ForumLayout
        title={category.name}
        subtitle={category.description}
        showBackButton={true}
        showCreateButton={true}
        createHref={`/forums/new?category=${category.id}`}
        createLabel="New Thread"
      >
        {/* Category Stats */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-semibold"
                style={{ backgroundColor: category.color }}
              >
                {category.icon}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {category.name}
                </h2>
                <p className="text-gray-600 mt-1">{category.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {category.thread_count}
                </div>
                <div className="text-sm text-gray-600">Threads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {category.post_count}
                </div>
                <div className="text-sm text-gray-600">Posts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <ForumFilters
          filters={filters}
          onFiltersChange={setFilters}
          className="mb-6"
        />

        {/* Threads List */}
        {filteredThreads.length === 0 ? (
          <ForumEmpty
            title="No threads found"
            message={
              filters.search || filters.filter !== "all"
                ? "No threads match your current filters. Try adjusting your search or filter criteria."
                : "This category doesn't have any threads yet. Be the first to start a discussion!"
            }
            actionLabel="Start New Thread"
            actionHref={`/forums/new?category=${category.id}`}
          />
        ) : (
          <div className="space-y-4">
            {filteredThreads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        )}

        {/* Results Summary */}
        {filteredThreads.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600">
            Showing {filteredThreads.length} of {threads.length} threads
          </div>
        )}
      </ForumLayout>
    </ErrorBoundary>
  );
};

export default CategoryPage;
