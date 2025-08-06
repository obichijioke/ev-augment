"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Send, Eye, Upload, X } from "lucide-react";
import Link from "next/link";
import { useBlogPost } from "../../../../hooks/useBlogPost";
import { useBlog } from "../../../../hooks/useBlog";
import { useBlogError } from "../../../../hooks/useBlogError";
import { useAuthStore } from "../../../../store/authStore";
import { blogPostsApi } from "../../../../services/blogApi";
import { BlogPost } from "../../../../types/blog";
import PostBody from "../../../../components/blog/PostBody";

interface BlogEditFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string;
  featured_image: string;
  status: "draft" | "published";
}

const BlogEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const { user, isAuthenticated } = useAuthStore();
  const { handleError } = useBlogError();

  // Load existing post data
  const {
    post,
    isLoading: isLoadingPost,
    error: postError,
    updatePost,
  } = useBlogPost({
    id: postId,
    autoLoad: true,
  });

  // Load categories for dropdown
  const { categories } = useBlog({
    autoLoad: true,
  });

  // Form state
  const [formData, setFormData] = useState<BlogEditFormData>({
    title: "",
    content: "",
    excerpt: "",
    category: "",
    tags: "",
    featured_image: "",
    status: "draft",
  });

  const [isPreview, setIsPreview] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Fallback categories
  const defaultCategories = [
    { name: "Technology", post_count: 0 },
    { name: "Reviews", post_count: 0 },
    { name: "News", post_count: 0 },
    { name: "Guides", post_count: 0 },
    { name: "Maintenance", post_count: 0 },
    { name: "Industry", post_count: 0 },
  ];

  const availableCategories =
    categories.length > 0 ? categories : defaultCategories;

  // Populate form when post loads
  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || "",
        category: post.category,
        tags: post.tags.join(", "),
        featured_image: post.featuredImage,
        status: post.status || "draft",
      });
    }
  }, [post]);

  // Authorization check
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (post && user) {
      const userRole = user.user_metadata?.role || user.app_metadata?.role;
      const isModerator = ["admin", "moderator"].includes(userRole);
      const isAuthor = user.id === post.author.id;

      if (!isModerator && !isAuthor) {
        router.push("/blog");
        return;
      }
    }
  }, [isAuthenticated, post, user, router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setUpdateError(null);
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!post) return;

    try {
      setIsUpdating(true);
      setUpdateError(null);

      const updateData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim(),
        category: formData.category,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        featured_image: formData.featured_image,
        status: isDraft ? ("draft" as const) : ("published" as const),
      };

      // Set published_at if publishing for the first time
      if (!isDraft && post.status === "draft") {
        (updateData as any).published_at = new Date().toISOString();
      }

      await updatePost(post.id, updateData);

      // Redirect to the updated post
      router.push(`/blog/${post.slug}`);
    } catch (error) {
      console.error("Failed to update post:", error);
      setUpdateError("Failed to update blog post. Please try again.");
      handleError(error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Loading state
  if (isLoadingPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (postError || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Post Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The blog post you're trying to edit doesn't exist.
          </p>
          <Link href="/blog" className="btn-primary">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Post
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
          <p className="text-gray-600 mt-2">
            Update your blog post content and settings
          </p>
        </div>

        {/* Error Display */}
        {updateError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{updateError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Edit Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Edit Content
            </h2>

            <form className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter blog post title"
                  required
                />
              </div>

              {/* Excerpt */}
              <div>
                <label
                  htmlFor="excerpt"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Excerpt
                </label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of your post (optional)"
                />
              </div>

              {/* Content */}
              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Content *
                  <span className="text-xs text-gray-500 ml-2">
                    (Supports Markdown: **bold**, *italic*, `code`, etc.)
                  </span>
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Write your blog post content here using Markdown..."
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {availableCategories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name} ({category.post_count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label
                  htmlFor="tags"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tags separated by commas (e.g., electric, vehicles, technology)"
                />
              </div>

              {/* Featured Image */}
              <div>
                <label
                  htmlFor="featured_image"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Featured Image URL
                </label>
                <input
                  type="url"
                  id="featured_image"
                  name="featured_image"
                  value={formData.featured_image}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </form>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
              <button
                onClick={() => setIsPreview(!isPreview)}
                className="flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>{isPreview ? "Edit" : "Preview"}</span>
              </button>
            </div>

            {isPreview ? (
              <div className="prose prose-lg max-w-none">
                <PostBody
                  post={{
                    ...post,
                    title: formData.title,
                    content: formData.content,
                  }}
                />
              </div>
            ) : (
              <div className="text-gray-500 text-center py-12">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click "Preview" to see how your post will look</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Last updated:{" "}
            {new Date(post.updatedAt || post.publishedAt).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>{isPreview ? "Edit" : "Preview"}</span>
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={isUpdating}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isUpdating ? "Saving..." : "Save Draft"}</span>
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={
                isUpdating || !formData.title.trim() || !formData.content.trim()
              }
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{isUpdating ? "Updating..." : "Update & Publish"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogEditPage;
