"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Edit3,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Search,
  Filter,
  MoreVertical,
  Send,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useBlog } from "../../../hooks/useBlog";
import { useBlogPost } from "../../../hooks/useBlogPost";
import { useAuthStore } from "../../../store/authStore";
import { BlogPost } from "../../../types/blog";
import AccessControl from "../../../components/auth/AccessControl";
import { useBlogPermissions } from "../../../hooks/useBlogPermissions";

interface DraftStats {
  total: number;
  recentlyModified: number;
  oldDrafts: number;
  autoSaved: number;
}

const BlogDraftsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { canViewAllDrafts, userId } = useBlogPermissions();

  // Filter drafts based on user permissions
  const draftFilters = canViewAllDrafts
    ? { status: "draft" }
    : { status: "draft", author_id: userId };

  const { posts, isLoading, error, loadPosts, setFilters } = useBlog({
    initialFilters: draftFilters,
    autoLoad: true,
  });
  const { updatePost, isUpdating } = useBlogPost();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [sortBy, setSortBy] = useState<"updated_at" | "created_at" | "title">(
    "updated_at"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Calculate draft statistics
  const draftStats: DraftStats = React.useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: posts.length,
      recentlyModified: posts.filter(
        (post) => new Date(post.updatedAt || post.publishedAt) > oneDayAgo
      ).length,
      oldDrafts: posts.filter(
        (post) => new Date(post.updatedAt || post.publishedAt) < oneWeekAgo
      ).length,
      autoSaved: posts.filter(
        (post) => post.status === "draft" && post.updatedAt !== post.publishedAt
      ).length,
    };
  }, [posts]);

  // Filter and sort drafts
  const filteredDrafts = React.useMemo(() => {
    let filtered = posts;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          (post.excerpt && post.excerpt.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "created_at":
          aValue = new Date(a.publishedAt).getTime();
          bValue = new Date(b.publishedAt).getTime();
          break;
        case "updated_at":
        default:
          aValue = new Date(a.updatedAt || a.publishedAt).getTime();
          bValue = new Date(b.updatedAt || b.publishedAt).getTime();
          break;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [posts, searchQuery, sortBy, sortOrder]);

  // Handle draft actions
  const handleEditDraft = (draftId: string) => {
    router.push(`/blog/edit/${draftId}`);
  };

  const handlePreviewDraft = (draft: BlogPost) => {
    // Open preview in new tab
    window.open(`/blog/${draft.slug}?preview=true`, "_blank");
  };

  const handlePublishDraft = async (draftId: string) => {
    try {
      await updatePost(draftId, {
        status: "published",
        published_at: new Date().toISOString(),
      });

      // Refresh the drafts list
      await loadPosts();
    } catch (error) {
      console.error("Failed to publish draft:", error);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    // TODO: Implement soft delete functionality
    console.log("Delete draft:", draftId);
    setShowDeleteConfirm(null);
  };

  const handleBulkAction = async (action: "publish" | "delete") => {
    if (selectedDrafts.length === 0) return;

    try {
      if (action === "publish") {
        // Publish selected drafts
        await Promise.all(
          selectedDrafts.map((id) =>
            updatePost(id, {
              status: "published",
              published_at: new Date().toISOString(),
            })
          )
        );
      } else if (action === "delete") {
        // TODO: Implement bulk delete
        console.log("Bulk delete:", selectedDrafts);
      }

      setSelectedDrafts([]);
      await loadPosts();
    } catch (error) {
      console.error(`Failed to ${action} drafts:`, error);
    }
  };

  const toggleDraftSelection = (draftId: string) => {
    setSelectedDrafts((prev) =>
      prev.includes(draftId)
        ? prev.filter((id) => id !== draftId)
        : [...prev, draftId]
    );
  };

  const selectAllDrafts = () => {
    setSelectedDrafts(
      selectedDrafts.length === filteredDrafts.length
        ? []
        : filteredDrafts.map((draft) => draft.id)
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) {
      // 7 days
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getWordCount = (content: string) => {
    return content.trim().split(/\s+/).length;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You need to be logged in to view drafts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AccessControl requireAuth={true} requireDraftAccess={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Draft Management
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage your unpublished blog posts and drafts
                </p>
              </div>
              <button
                onClick={() => router.push("/blog/create")}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                <span>New Draft</span>
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Drafts
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {draftStats.total}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Recently Modified
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {draftStats.recentlyModified}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-amber-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Old Drafts
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {draftStats.oldDrafts}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Save className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Auto-saved
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {draftStats.autoSaved}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search drafts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="updated_at">Last Modified</option>
                  <option value="created_at">Date Created</option>
                  <option value="title">Title</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedDrafts.length > 0 && (
              <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">
                  {selectedDrafts.length} draft
                  {selectedDrafts.length !== 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAction("publish")}
                    disabled={isUpdating}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    <span>Publish</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction("delete")}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Drafts List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading drafts...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => loadPosts()}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No drafts found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery
                    ? "No drafts match your search criteria."
                    : "You haven't created any drafts yet."}
                </p>
                <button
                  onClick={() => router.push("/blog/create")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Your First Draft
                </button>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedDrafts.length === filteredDrafts.length &&
                        filteredDrafts.length > 0
                      }
                      onChange={selectAllDrafts}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Select All
                    </span>
                  </div>
                </div>

                {/* Drafts List */}
                <div className="divide-y divide-gray-200">
                  {filteredDrafts.map((draft) => (
                    <div key={draft.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedDrafts.includes(draft.id)}
                            onChange={() => toggleDraftSelection(draft.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-lg font-medium text-gray-900 truncate">
                                {draft.title || "Untitled Draft"}
                              </h3>
                              {draft.updatedAt !== draft.publishedAt && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Auto-saved
                                </span>
                              )}
                            </div>

                            {draft.excerpt && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {draft.excerpt}
                              </p>
                            )}

                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Created {formatDate(draft.publishedAt)}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Modified{" "}
                                {formatDate(
                                  draft.updatedAt || draft.publishedAt
                                )}
                              </span>
                              <span>{getWordCount(draft.content)} words</span>
                              {draft.category && (
                                <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                                  {draft.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditDraft(draft.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Draft"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handlePreviewDraft(draft)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Preview Draft"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handlePublishDraft(draft.id)}
                            disabled={isUpdating}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Publish Draft"
                          >
                            <Send className="h-4 w-4" />
                          </button>

                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowDeleteConfirm(
                                  showDeleteConfirm === draft.id
                                    ? null
                                    : draft.id
                                )
                              }
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="More Actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {showDeleteConfirm === draft.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                <div className="p-3">
                                  <p className="text-sm text-gray-700 mb-3">
                                    Delete this draft permanently?
                                  </p>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() =>
                                        handleDeleteDraft(draft.id)
                                      }
                                      className="flex-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      onClick={() => setShowDeleteConfirm(null)}
                                      className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick Tips */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              💡 Draft Management Tips
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>
                • Drafts are automatically saved every 5 seconds while editing
              </li>
              <li>
                • Use bulk actions to publish or delete multiple drafts at once
              </li>
              <li>
                • Old drafts (older than 7 days) are highlighted for review
              </li>
              <li>
                • Preview drafts before publishing to ensure they look perfect
              </li>
              <li>
                • You can convert published posts back to drafts for further
                editing
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AccessControl>
  );
};

export default BlogDraftsPage;
