"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  User,
  Clock,
  Tag,
  Filter,
  Grid,
  List,
  ChevronDown,
} from "lucide-react";
import { BlogPost } from "@/types/blog";
import { useBlog } from "@/hooks/useBlog";
import { useBlogError } from "@/hooks/useBlogError";
import {
  BlogLoading,
  BlogListLoading,
  BlogError,
  BlogEmpty,
} from "@/components/blog/BlogErrorBoundary";

const BlogPage = () => {
  // Local UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("latest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Blog data and operations
  const {
    posts,
    categories,
    tags,
    pagination,
    isLoading,
    isSearching,
    error,
    filters,
    sortOptions,
    loadPosts,
    searchPosts,
    setFilters,
    setSortOptions,
    setPage,
    clearError,
  } = useBlog({
    initialSort: { sort: "desc", sortBy: "published_at" },
    autoLoad: true,
  });

  // Error handling
  const { handleError, formatErrorMessage } = useBlogError();

  // Derived data for UI
  const allCategories = useMemo(() => {
    const categoryOptions = ["all", ...categories.map((cat) => cat.name)];
    return categoryOptions;
  }, [categories]);

  const allTags = useMemo(() => {
    return tags.map((tag) => tag.name);
  }, [tags]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchPosts(searchQuery);
      } else if (searchQuery === "") {
        // Clear search and reload posts
        loadPosts();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchPosts, loadPosts]);

  // Handle filter changes
  useEffect(() => {
    const newFilters: any = {};

    if (selectedCategory !== "all") {
      newFilters.category = selectedCategory;
    }

    if (selectedTag) {
      newFilters.tag = selectedTag;
    }

    setFilters(newFilters);
  }, [selectedCategory, selectedTag, setFilters]);

  // Handle sort changes
  useEffect(() => {
    const sortMapping: Record<string, { sort: string; sortBy: string }> = {
      latest: { sort: "desc", sortBy: "published_at" },
      popular: { sort: "desc", sortBy: "view_count" },
      liked: { sort: "desc", sortBy: "like_count" },
    };

    const newSort = sortMapping[sortBy] || sortMapping.latest;
    setSortOptions(newSort);
  }, [sortBy, setSortOptions]);

  // Handle pagination
  const handleLoadMore = () => {
    if (pagination.page < pagination.pages) {
      setPage(pagination.page + 1);
    }
  };

  // Format date utility
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Show loading state
  if (isLoading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                EV Community Blog
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Stay updated with the latest news, reviews, and insights from
                the electric vehicle world
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BlogListLoading />
        </div>
      </div>
    );
  }

  // Show error state
  if (error && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                EV Community Blog
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Stay updated with the latest news, reviews, and insights from
                the electric vehicle world
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BlogError
            message={formatErrorMessage(error)}
            onRetry={() => {
              clearError();
              loadPosts();
            }}
          />
        </div>
      </div>
    );
  }

  // Show empty state if no posts and not loading
  if (!isLoading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                EV Community Blog
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Stay updated with the latest news, reviews, and insights from
                the electric vehicle world
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BlogEmpty
            title="No blog posts yet"
            message="Be the first to share your insights with the EV community!"
            actionLabel="Create First Post"
            actionHref="/blog/create"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              EV Community Blog
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Stay updated with the latest news, reviews, and insights from the
              electric vehicle world
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {allCategories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="latest">Latest</option>
                <option value="popular">Most Popular</option>
                <option value="liked">Most Liked</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag("")}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    !selectedTag
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Tags
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTag === tag
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            Showing {posts.length} of {pagination.total} articles
            {searchQuery && ` for "${searchQuery}"`}
            {(isLoading || isSearching) && (
              <span className="ml-2 text-blue-600">
                {isSearching ? "Searching..." : "Loading..."}
              </span>
            )}
          </p>
          {error && (
            <button
              onClick={() => {
                clearError();
                loadPosts();
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Retry
            </button>
          )}
        </div>

        {/* Blog Posts */}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              : "space-y-8"
          }
        >
          {posts.map((post) => (
            <article
              key={post.id}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 ${
                viewMode === "list" ? "flex" : ""
              }`}
            >
              {/* Featured Image */}
              <div
                className={`relative ${
                  viewMode === "list" ? "w-1/3 flex-shrink-0" : "aspect-video"
                }`}
              >
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {post.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span>{post.author.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime} min read</span>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {post.title}
                  </Link>
                </h2>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{post.views} views</span>
                    <span>{post.likes} likes</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Empty State for Search/Filter Results */}
        {!isLoading &&
          posts.length === 0 &&
          (searchQuery || selectedCategory !== "all" || selectedTag) && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No articles found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedTag("");
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}

        {/* Load More Button */}
        {posts.length > 0 && pagination.page < pagination.pages && (
          <div className="text-center mt-12">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "Load More Articles"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
