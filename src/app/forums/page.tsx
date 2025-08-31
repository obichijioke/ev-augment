"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  Users,
  MessageSquare,
  Activity,
} from "lucide-react";
import ForumLayout from "@/components/forum/ForumLayout";
import CategoryCard from "@/components/forum/CategoryCard";
import ErrorBoundary, {
  ForumLoading,
  ForumError,
} from "@/components/forum/ErrorBoundary";
import { useForumError, FORUM_ERRORS } from "@/hooks/useForumError";
// Removed old loading hook - now using API hook loading state
import { ForumCategory } from "@/types/forum";
import { useForumCategories } from "@/hooks/useForumApi";

const ForumsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Use the forum categories API hook
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useForumCategories();

  const { error, handleError, clearError } = useForumError();

  // Handle API errors
  useEffect(() => {
    if (categoriesError) {
      handleError(new Error(categoriesError));
    } else {
      clearError();
    }
  }, [categoriesError, handleError, clearError]);

  const handleRetry = () => {
    clearError();
    refetchCategories();
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total stats
  const totalThreads = categories.reduce(
    (sum, cat) => sum + cat.thread_count,
    0
  );
  const totalPosts = categories.reduce((sum, cat) => sum + cat.post_count, 0);

  return (
    <ErrorBoundary>
      <ForumLayout
        title="Community Forums"
        subtitle="Connect with fellow EV enthusiasts, share experiences, and get answers to your questions"
        showCreateButton={true}
        createHref="/forums/new"
        createLabel="New Thread"
      >
        {/* Search and Stats Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Forum Stats */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">
                  {totalThreads.toLocaleString()}
                </span>
                <span>threads</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Users className="h-4 w-4" />
                <span className="font-medium">
                  {totalPosts.toLocaleString()}
                </span>
                <span>posts</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Activity className="h-4 w-4" />
                <span className="font-medium">{categories.length}</span>
                <span>categories</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {categoriesLoading ? (
          <ForumLoading message="Loading forum categories..." />
        ) : error ? (
          <ForumError message={error.message} onRetry={handleRetry} />
        ) : (
          <>
            {/* Categories Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
              {filteredCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>

            {/* No Results */}
            {filteredCategories.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No categories found
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Try adjusting your search terms or{" "}
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    clear the search
                  </button>
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    New to the community?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Start by introducing yourself or asking your first question!
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    Community Guidelines
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </ForumLayout>
    </ErrorBoundary>
  );
};

export default ForumsPage;
