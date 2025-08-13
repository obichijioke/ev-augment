"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Plus,
  Calendar,
  User,
  Tag,
  TrendingUp,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  category?: string;
  tags?: string[];
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface BlogFilters {
  search: string;
  status: string;
  category: string;
  author: string;
}

const AdminBlogPage: React.FC = () => {
  const { session } = useAuthStore();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BlogFilters>({
    search: "",
    status: "",
    category: "",
    author: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

  useEffect(() => {
    fetchBlogPosts();
  }, [filters, pagination.page]);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      let token = session?.accessToken;

      // Fallback: get token from localStorage if session is not yet hydrated
      if (!token) {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            token = parsed.state.session?.accessToken;
          } catch (e) {
            console.error("Error parsing auth storage:", e);
          }
        }
      }

      if (!token) {
        throw new Error("No authentication token available");
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
        ...(filters.author && { author: filters.author }),
      });

      const response = await fetch(
        `${API_BASE_URL}/admin/blog/posts?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch blog posts");
      }

      const data = await response.json();
      setPosts(data.data.posts);
      setPagination((prev) => ({
        ...prev,
        total: data.data.pagination.total,
        totalPages: data.data.pagination.totalPages,
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof BlogFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePostAction = async (postId: string, action: string) => {
    try {
      let token = session?.accessToken;

      // Fallback: get token from localStorage if session is not yet hydrated
      if (!token) {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            token = parsed.state.session?.accessToken;
          } catch (e) {
            console.error("Error parsing auth storage:", e);
          }
        }
      }

      if (!token) {
        throw new Error("No authentication token available");
      }

      const endpoint = `${API_BASE_URL}/admin/blog/posts/${postId}`;
      let method = "PUT";
      let body = {};

      switch (action) {
        case "publish":
          body = {
            status: "published",
            published_at: new Date().toISOString(),
          };
          break;
        case "archive":
          body = { status: "archived" };
          break;
        case "feature":
          const post = posts.find((p) => p.id === postId);
          body = { is_featured: !post?.is_featured };
          break;
        case "delete":
          method = "DELETE";
          break;
        default:
          throw new Error("Unknown action");
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        ...(method !== "DELETE" && { body: JSON.stringify(body) }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} post`);
      }

      fetchBlogPosts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedPosts.length === 0) return;

    try {
      let token = session?.accessToken;

      // Fallback: get token from localStorage if session is not yet hydrated
      if (!token) {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            token = parsed.state.session?.accessToken;
          } catch (e) {
            console.error("Error parsing auth storage:", e);
          }
        }
      }

      if (!token) {
        throw new Error("No authentication token available");
      }
      const promises = selectedPosts.map((postId) =>
        handlePostAction(postId, bulkAction)
      );

      await Promise.all(promises);
      setSelectedPosts([]);
      setBulkAction("");
      fetchBlogPosts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const togglePostSelection = (postId: string) => {
    setSelectedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedPosts((prev) =>
      prev.length === posts.length ? [] : posts.map((post) => post.id)
    );
  };

  if (loading && posts.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading blog posts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="w-8 h-8 mr-3 text-blue-600" />
              Blog Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage blog posts, authors, and content
            </p>
          </div>
          <Link
            href="/blog/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Post
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search posts..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="news">News</option>
            <option value="reviews">Reviews</option>
            <option value="guides">Guides</option>
            <option value="technology">Technology</option>
          </select>

          {/* Author Filter */}
          <input
            type="text"
            placeholder="Filter by author..."
            value={filters.author}
            onChange={(e) => handleFilterChange("author", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Bulk Actions */}
        {selectedPosts.length > 0 && (
          <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              {selectedPosts.length} posts selected
            </span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="">Bulk Actions</option>
              <option value="publish">Publish</option>
              <option value="archive">Archive</option>
              <option value="delete">Delete</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {posts.length === 0 ? (
          <div className="text-center p-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No posts found
            </h3>
            <p className="text-gray-600 mb-4">
              {Object.values(filters).some((f) => f)
                ? "Try adjusting your search or filters"
                : "Get started by creating your first blog post"}
            </p>
            <Link
              href="/blog/create"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Post
            </Link>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedPosts.length === posts.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-5">Post</div>
                <div className="col-span-2">Author</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Stats</div>
                <div className="col-span-2">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {posts.map((post) => (
                <div key={post.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Checkbox */}
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={() => togglePostSelection(post.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    {/* Post Info */}
                    <div className="col-span-5">
                      <div className="flex items-start space-x-3">
                        {post.featured_image ? (
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="w-16 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {post.title}
                            {post.is_featured && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Featured
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {post.excerpt || "No excerpt available"}
                          </p>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                            {post.category && (
                              <span className="flex items-center">
                                <Tag className="w-3 h-3 mr-1" />
                                {post.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Author */}
                    <div className="col-span-2">
                      <div className="flex items-center">
                        {post.author.avatar_url ? (
                          <img
                            src={post.author.avatar_url}
                            alt={post.author.username}
                            className="w-8 h-8 rounded-full mr-2"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {post.author.full_name || post.author.username}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                          post.status
                        )}`}
                      >
                        {post.status}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="col-span-1">
                      <div className="text-xs text-gray-500">
                        <div className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {post.view_count}
                        </div>
                        <div className="flex items-center mt-1">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {post.like_count}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-gray-400 hover:text-gray-600"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/blog/edit/${post.id}`}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {post.status === "draft" && (
                          <button
                            onClick={() => handlePostAction(post.id, "publish")}
                            className="text-green-600 hover:text-green-700"
                            title="Publish"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handlePostAction(post.id, "delete")}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminBlogPage;
