"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Pin,
  Lock,
  Flag,
  Users,
  Calendar,
  TrendingUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  Settings,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface ForumCategory {
  id: string;
  name: string;
  description?: string;
  slug: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  thread_count: number;
  post_count: number;
  last_post_at?: string;
  created_at: string;
  updated_at: string;
}

interface ForumThread {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_deleted: boolean;
  view_count: number;
  reply_count: number;
  like_count: number;
  last_reply_at?: string;
  created_at: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  author: {
    id: string;
    username: string;
    full_name?: string;
  };
}

const AdminForumsPage: React.FC = () => {
  const { session } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    "categories" | "threads" | "reports"
  >("categories");
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(
    null
  );

  // Thread management state
  const [selectedThreads, setSelectedThreads] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [threadFilters, setThreadFilters] = useState({
    search: "",
    category: "",
    status: "",
    author: "",
    sort: "created_at",
    order: "desc",
  });
  const [bulkAction, setBulkAction] = useState("");
  const [bulkActionCategory, setBulkActionCategory] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingThread, setEditingThread] = useState<any>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

  useEffect(() => {
    if (activeTab === "categories") {
      fetchCategories();
    } else if (activeTab === "threads") {
      fetchThreads();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "threads") {
      fetchThreads();
    }
  }, [threadFilters]);

  const fetchCategories = async () => {
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

      const response = await fetch(`${API_BASE_URL}/forum/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();
      setCategories(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchThreads = async () => {
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
        page: "1",
        limit: "50",
        ...threadFilters,
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(
        `${API_BASE_URL}/admin/forum/threads?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch threads");
      }

      const data = await response.json();
      setThreads(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryAction = async (
    categoryId: string,
    action: string,
    data?: any
  ) => {
    try {
      const { session } = useAuthStore.getState();
      const token = session?.accessToken;

      if (!token) {
        throw new Error("No authentication token available");
      }

      const endpoint = `${API_BASE_URL}/forum/categories/${categoryId}`;
      let method = "PUT";
      let body = {};

      switch (action) {
        case "toggle_active":
          const category = categories.find((c) => c.id === categoryId);
          body = { is_active: !category?.is_active };
          break;
        case "update":
          body = data;
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
        throw new Error(`Failed to ${action} category`);
      }

      fetchCategories();
      setShowCategoryModal(false);
      setEditingCategory(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateCategory = async (data: any) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/forum/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || "Failed to create category"
        );
      }

      // Refresh categories list
      await fetchCategories();
      setShowCategoryModal(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleThreadAction = async (threadId: string, action: string) => {
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
      let body = {};

      switch (action) {
        case "pin":
          const thread = threads.find((t) => t.id === threadId);
          body = { is_pinned: !thread?.is_pinned };
          break;
        case "lock":
          const lockThread = threads.find((t) => t.id === threadId);
          body = { is_locked: !lockThread?.is_locked };
          break;
        case "delete":
          body = { is_deleted: true };
          break;
        default:
          throw new Error("Unknown action");
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/forum/reports/${threadId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${action} thread`);
      }

      fetchThreads();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleThreadFilterChange = (key: string, value: string) => {
    setThreadFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleThreadSelection = (threadId: string) => {
    setSelectedThreads((prev) =>
      prev.includes(threadId)
        ? prev.filter((id) => id !== threadId)
        : [...prev, threadId]
    );
  };

  const toggleSelectAllThreads = () => {
    if (selectedThreads.length === threads.length) {
      setSelectedThreads([]);
    } else {
      setSelectedThreads(threads.map((thread) => thread.id));
    }
  };

  const handleBulkThreadAction = async () => {
    if (!bulkAction || selectedThreads.length === 0) return;

    try {
      setActionLoading("bulk");
      let token = session?.accessToken;

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

      const requestBody: any = {
        thread_ids: selectedThreads,
        action: bulkAction,
      };

      if (bulkAction === "move_category" && bulkActionCategory) {
        requestBody.category_id = bulkActionCategory;
      }

      const response = await fetch(`${API_BASE_URL}/admin/forum/threads/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to perform bulk action");
      }

      // Reset selections and refresh
      setSelectedThreads([]);
      setBulkAction("");
      setBulkActionCategory("");
      fetchThreads();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditThread = (thread: any) => {
    setEditingThread(thread);
    setShowEditModal(true);
  };

  const handleUpdateThread = async (threadData: any) => {
    try {
      setActionLoading("update");
      let token = session?.accessToken;

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

      const response = await fetch(
        `${API_BASE_URL}/admin/forum/threads/${editingThread.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(threadData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update thread");
      }

      setShowEditModal(false);
      setEditingThread(null);
      fetchThreads();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: "categories", name: "Categories", icon: MessageSquare },
    { id: "threads", name: "Threads", icon: Users },
    { id: "reports", name: "Reports", icon: Flag },
  ];

  if (
    loading &&
    (!categories || categories.length === 0) &&
    (!threads || threads.length === 0)
  ) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading forum data...</span>
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
              <MessageSquare className="w-8 h-8 mr-3 text-blue-600" />
              Forum Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage forum categories, threads, and moderation
            </p>
          </div>
          {activeTab === "categories" && (
            <button
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Category
            </button>
          )}
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

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {!categories || categories.length === 0 ? (
            <div className="text-center p-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No categories found
              </h3>
              <p className="text-gray-600 mb-4">
                Get started by creating your first category
              </p>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Category
              </button>
            </div>
          ) : (
            <>
              {/* Categories Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-4">Category</div>
                  <div className="col-span-2">Threads</div>
                  <div className="col-span-2">Posts</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Actions</div>
                </div>
              </div>

              {/* Categories Body */}
              <div className="divide-y divide-gray-200">
                {(categories || []).map((category) => (
                  <div key={category.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Category Info */}
                      <div className="col-span-4">
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 rounded-full mr-3`}
                            style={{
                              backgroundColor: category.color || "#3B82F6",
                            }}
                          />
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {category.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Thread Count */}
                      <div className="col-span-2">
                        <span className="text-sm text-gray-900">
                          {category.thread_count}
                        </span>
                      </div>

                      {/* Post Count */}
                      <div className="col-span-2">
                        <span className="text-sm text-gray-900">
                          {category.post_count}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            category.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {category.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/forums/${category.slug}`}
                            target="_blank"
                            className="text-gray-400 hover:text-gray-600"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setEditingCategory(category);
                              setShowCategoryModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleCategoryAction(category.id, "toggle_active")
                            }
                            className={`${
                              category.is_active
                                ? "text-red-600 hover:text-red-700"
                                : "text-green-600 hover:text-green-700"
                            }`}
                            title={
                              category.is_active ? "Deactivate" : "Activate"
                            }
                          >
                            {category.is_active ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Threads Tab */}
      {activeTab === "threads" && (
        <div>
          {/* Thread Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search threads..."
                  value={threadFilters.search}
                  onChange={(e) =>
                    handleThreadFilterChange("search", e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={threadFilters.category}
                onChange={(e) =>
                  handleThreadFilterChange("category", e.target.value)
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={threadFilters.status}
                onChange={(e) =>
                  handleThreadFilterChange("status", e.target.value)
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="deleted">Deleted</option>
                <option value="pinned">Pinned</option>
                <option value="locked">Locked</option>
              </select>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <Settings className="w-4 h-4 mr-2" />
                Advanced
                {showAdvancedFilters ? (
                  <ChevronUp className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-1" />
                )}
              </button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Sort By */}
                  <select
                    value={threadFilters.sort}
                    onChange={(e) =>
                      handleThreadFilterChange("sort", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="created_at">Sort by Created</option>
                    <option value="updated_at">Sort by Updated</option>
                    <option value="reply_count">Sort by Replies</option>
                    <option value="view_count">Sort by Views</option>
                    <option value="like_count">Sort by Likes</option>
                  </select>

                  {/* Sort Order */}
                  <select
                    value={threadFilters.order}
                    onChange={(e) =>
                      handleThreadFilterChange("order", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>

                  {/* Clear Filters */}
                  <button
                    onClick={() => {
                      setThreadFilters({
                        search: "",
                        category: "",
                        status: "",
                        author: "",
                        sort: "created_at",
                        order: "desc",
                      });
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-blue-500"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedThreads.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {selectedThreads.length} threads selected
                  </span>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Bulk Actions</option>
                    <option value="pin">Pin</option>
                    <option value="unpin">Unpin</option>
                    <option value="lock">Lock</option>
                    <option value="unlock">Unlock</option>
                    <option value="delete">Delete</option>
                    <option value="restore">Restore</option>
                    <option value="move_category">Move Category</option>
                  </select>

                  {/* Category selector for bulk move */}
                  {bulkAction === "move_category" && (
                    <select
                      value={bulkActionCategory}
                      onChange={(e) => setBulkActionCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    onClick={handleBulkThreadAction}
                    disabled={
                      !bulkAction ||
                      (bulkAction === "move_category" && !bulkActionCategory) ||
                      actionLoading === "bulk"
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {actionLoading === "bulk" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {!threads || threads.length === 0 ? (
              <div className="text-center p-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No threads found
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "No threads available"}
                </p>
              </div>
            ) : (
              <>
                {/* Threads Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={
                          selectedThreads.length === threads.length &&
                          threads.length > 0
                        }
                        onChange={toggleSelectAllThreads}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-4">Thread</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-2">Author</div>
                    <div className="col-span-1">Replies</div>
                    <div className="col-span-2">Actions</div>
                  </div>
                </div>

                {/* Threads Body */}
                <div className="divide-y divide-gray-200">
                  {(threads || []).map((thread) => (
                    <div key={thread.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Checkbox */}
                        <div className="col-span-1">
                          <input
                            type="checkbox"
                            checked={selectedThreads.includes(thread.id)}
                            onChange={() => toggleThreadSelection(thread.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>

                        {/* Thread Info */}
                        <div className="col-span-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                  {thread.title}
                                </h3>
                                {thread.is_pinned && (
                                  <Pin
                                    className="w-4 h-4 text-yellow-500"
                                    title="Pinned"
                                  />
                                )}
                                {thread.is_locked && (
                                  <Lock
                                    className="w-4 h-4 text-red-500"
                                    title="Locked"
                                  />
                                )}
                              </div>
                              <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(
                                    thread.created_at
                                  ).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <Eye className="w-3 h-3 mr-1" />
                                  {thread.view_count} views
                                </span>
                                <span className="flex items-center">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  {thread.like_count} likes
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Category */}
                        <div className="col-span-2">
                          <span className="text-sm text-gray-600">
                            {thread.category.name}
                          </span>
                        </div>

                        {/* Author */}
                        <div className="col-span-2">
                          <span className="text-sm text-gray-900">
                            {thread.author.full_name || thread.author.username}
                          </span>
                        </div>

                        {/* Reply Count */}
                        <div className="col-span-1">
                          <span className="text-sm text-gray-900">
                            {thread.reply_count}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/forums/${thread.category.slug}/${thread.slug}`}
                              target="_blank"
                              className="text-gray-400 hover:text-gray-600"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleEditThread(thread)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleThreadAction(thread.id, "pin")
                              }
                              className={`${
                                thread.is_pinned
                                  ? "text-yellow-600 hover:text-yellow-700"
                                  : "text-gray-400 hover:text-gray-600"
                              }`}
                              title={thread.is_pinned ? "Unpin" : "Pin"}
                            >
                              <Pin className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleThreadAction(thread.id, "lock")
                              }
                              className={`${
                                thread.is_locked
                                  ? "text-red-600 hover:text-red-700"
                                  : "text-gray-400 hover:text-gray-600"
                              }`}
                              title={thread.is_locked ? "Unlock" : "Lock"}
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleThreadAction(thread.id, "delete")
                              }
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
              </>
            )}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Forum Reports
            </h3>
            <p className="text-gray-600 mb-4">
              Forum-specific reports will be displayed here
            </p>
            <Link
              href="/admin/moderation"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Reports
            </Link>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingCategory ? "Edit Category" : "Create Category"}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get("name") as string;
                const data = {
                  name,
                  description: formData.get("description"),
                  color: formData.get("color"),
                  is_active: formData.get("is_active") === "on",
                  // Generate slug from name
                  slug: name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, ""),
                };

                if (editingCategory) {
                  handleCategoryAction(editingCategory.id, "update", data);
                } else {
                  handleCreateCategory(data);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCategory?.name || ""}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={editingCategory?.description || ""}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="color"
                  name="color"
                  defaultValue={editingCategory?.color || "#3B82F6"}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={editingCategory?.is_active ?? true}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">Active</label>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thread Edit Modal */}
      {showEditModal && editingThread && (
        <ThreadEditModal
          thread={editingThread}
          categories={categories}
          onSave={handleUpdateThread}
          onClose={() => {
            setShowEditModal(false);
            setEditingThread(null);
          }}
          loading={actionLoading === "update"}
        />
      )}
    </div>
  );
};

// Thread Edit Modal Component
const ThreadEditModal: React.FC<{
  thread: any;
  categories: ForumCategory[];
  onSave: (data: any) => void;
  onClose: () => void;
  loading: boolean;
}> = ({ thread, categories, onSave, onClose, loading }) => {
  const [formData, setFormData] = useState({
    title: thread.title || "",
    content: thread.content || "",
    category_id: thread.category?.id || "",
    is_pinned: thread.is_pinned || false,
    is_locked: thread.is_locked || false,
    is_deleted: thread.is_deleted || false,
    admin_notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Thread</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category_id}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  category_id: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Thread Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_pinned}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_pinned: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Pinned</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_locked}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_locked: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Locked</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_deleted}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_deleted: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-red-600 focus:ring-red-500 mr-2"
              />
              <span className="text-sm text-gray-700">Deleted</span>
            </label>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes (Optional)
            </label>
            <textarea
              value={formData.admin_notes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  admin_notes: e.target.value,
                }))
              }
              rows={3}
              placeholder="Add notes about this edit..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminForumsPage;
