"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Upload,
  X,
  Bold,
  Italic,
  Code,
  Link2,
  List,
  ListOrdered,
  Quote,
  Image,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  Tag,
  Folder,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useBlogPost } from "../../../../hooks/useBlogPost";
import { useBlog } from "../../../../hooks/useBlog";
import { useToast, formatApiError } from "@/hooks/useToast";
import { useBlogError } from "../../../../hooks/useBlogError";
import { useAuthStore } from "../../../../store/authStore";
import { blogPostsApi } from "../../../../services/blogApi";
import { BlogPost } from "../../../../types/blog";
import PostBody from "../../../../components/blog/PostBody";
import { useDraftAutoSave } from "../../../../hooks/useDraftAutoSave";
import DraftRecovery from "../../../../components/blog/DraftRecovery";
import AutoSaveStatus from "../../../../components/blog/AutoSaveStatus";
import AccessControl from "../../../../components/auth/AccessControl";

interface BlogEditFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string;
  featured_image: string;
  status: "draft" | "published";
}

interface ValidationErrors {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  tags?: string;
  featured_image?: string;
}

const BlogEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const { user, isAuthenticated } = useAuthStore();
  const { handleError } = useBlogError();
  const toast = useToast();

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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  // Enhanced auto-save with recovery
  const autoSaveHook = useDraftAutoSave(
    {
      title: formData.title,
      content: formData.content,
      excerpt: formData.excerpt,
      category: formData.category,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      featured_image: formData.featured_image,
    },
    {
      postId: post?.id,
      autoSaveInterval: 5000,
      enableLocalStorage: true,
      onAutoSaveSuccess: () => {
        console.log("Auto-save successful");
      },
      onAutoSaveError: (error) => {
        console.error("Auto-save failed:", error);
      },
    }
  );

  // Extract auto-save state for compatibility
  const {
    isAutoSaving,
    lastSaved,
    hasUnsavedChanges,
    autoSaveError,
    saveNow,
    clearAutoSaveError,
    getAutoSaveStatus,
    hasLocalStorageData,
    recoverFromLocalStorage,
  } = autoSaveHook;

  // Draft recovery state
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Refs
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Validation function
  const validateForm = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.length > 200) {
      errors.title = "Title must be less than 200 characters";
    }

    if (!formData.content.trim()) {
      errors.content = "Content is required";
    } else if (formData.content.length < 100) {
      errors.content = "Content must be at least 100 characters";
    }

    if (formData.excerpt && formData.excerpt.length > 300) {
      errors.excerpt = "Excerpt must be less than 300 characters";
    }

    if (formData.featured_image && !isValidUrl(formData.featured_image)) {
      errors.featured_image = "Please enter a valid URL";
    }

    return errors;
  }, [formData]);

  // Helper function to validate URLs
  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Check for draft recovery on mount
  useEffect(() => {
    if (hasLocalStorageData()) {
      setShowDraftRecovery(true);
    }
  }, [hasLocalStorageData]);

  // Update word and character counts
  const updateCounts = useCallback((content: string) => {
    setCharCount(content.length);
    const words = content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
  }, []);

  // Populate form when post loads
  useEffect(() => {
    if (post) {
      const newFormData = {
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || "",
        category: post.category,
        tags: post.tags.join(", "),
        featured_image: post.featuredImage,
        status: post.status || "draft",
      };
      setFormData(newFormData);
      updateCounts(newFormData.content);
    }
  }, [post, updateCounts]);

  // Handle draft recovery
  const handleDraftRecover = (recoveredData: any) => {
    setFormData({
      title: recoveredData.title,
      content: recoveredData.content,
      excerpt: recoveredData.excerpt,
      category: recoveredData.category,
      tags: recoveredData.tags.join(", "),
      featured_image: recoveredData.featured_image,
      status: "draft",
    });
    updateCounts(recoveredData.content);
    setShowDraftRecovery(false);
  };

  // Validation effect
  useEffect(() => {
    const errors = validateForm();
    setValidationErrors(errors);
  }, [validateForm]);

  // Authorization is now handled by AccessControl component

  // Show toast notification for post loading errors
  useEffect(() => {
    if (postError) {
      const errorMessage = formatApiError(postError);
      toast.error(errorMessage);
    }
  }, [postError, toast]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setUpdateError(null);

    // Update counts for content field
    if (name === "content") {
      updateCounts(value);
    }
  };

  // Markdown toolbar functions
  const insertTextAtCursor = (text: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content;
    const newContent =
      currentContent.substring(0, start) + text + currentContent.substring(end);

    setFormData((prev) => ({ ...prev, content: newContent }));
    updateCounts(newContent);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const wrapSelectedText = (before: string, after: string = before) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const newText = before + selectedText + after;

    insertTextAtCursor(newText);
  };

  const insertMarkdown = (type: string) => {
    switch (type) {
      case "bold":
        wrapSelectedText("**");
        break;
      case "italic":
        wrapSelectedText("*");
        break;
      case "code":
        wrapSelectedText("`");
        break;
      case "link":
        wrapSelectedText("[", "](url)");
        break;
      case "image":
        insertTextAtCursor("![alt text](image-url)");
        break;
      case "quote":
        insertTextAtCursor("\n> ");
        break;
      case "list":
        insertTextAtCursor("\n- ");
        break;
      case "orderedList":
        insertTextAtCursor("\n1. ");
        break;
      case "heading":
        insertTextAtCursor("\n## ");
        break;
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!post) return;

    // Validate form before submission
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setUpdateError("Please fix the validation errors before saving.");
      toast.error("Please fix the validation errors before saving.");
      return;
    }

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

      // Show success message
      const statusText = isDraft ? "saved as draft" : "published";
      toast.success(`Blog post ${statusText} successfully!`);

      // Redirect to the updated post
      router.push(`/blog/${post.slug}`);
    } catch (error) {
      console.error("Failed to update post:", error);
      const errorMessage = formatApiError(error);
      setUpdateError(errorMessage);
      toast.error(errorMessage);
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
    <AccessControl
      requireAuth={true}
      requireBlogEdit={true}
      postAuthorId={post.authorId}
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Draft Recovery */}
          {showDraftRecovery && (
            <DraftRecovery
              postId={post?.id}
              currentData={{
                title: formData.title,
                content: formData.content,
                excerpt: formData.excerpt,
                category: formData.category,
                tags: formData.tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
                featured_image: formData.featured_image,
              }}
              onRecover={handleDraftRecover}
              onDismiss={() => setShowDraftRecovery(false)}
              className="mb-6"
            />
          )}
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/blog/${post.slug}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Post
            </Link>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Edit Blog Post
                </h1>
                <p className="text-gray-600 mt-2">
                  Update your blog post content and settings
                </p>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center space-x-4">
                {/* Enhanced Auto-save status */}
                <AutoSaveStatus
                  isAutoSaving={isAutoSaving}
                  lastSaved={lastSaved}
                  hasUnsavedChanges={hasUnsavedChanges}
                  autoSaveError={autoSaveError}
                  saveCount={autoSaveHook.saveCount}
                  onSaveNow={saveNow}
                  onClearError={clearAutoSaveError}
                  showSaveButton={true}
                  showSaveCount={false}
                />

                {/* Word count */}
                <div className="text-sm text-gray-500">
                  {wordCount} words • {charCount} characters
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {updateError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-700">{updateError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Edit Form */}
            <div className="xl:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <FileText className="h-5 w-5 text-gray-400 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Basic Information
                  </h2>
                </div>

                <div className="space-y-6">
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
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        validationErrors.title
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter blog post title"
                      required
                    />
                    {validationErrors.title && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.title}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.title.length}/200 characters
                    </p>
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
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        validationErrors.excerpt
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Brief description of your post (optional)"
                    />
                    {validationErrors.excerpt && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.excerpt}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.excerpt.length}/300 characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Editor */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <Code className="h-5 w-5 text-gray-400 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Content
                  </h2>
                </div>

                {/* Markdown Toolbar */}
                <div className="border border-gray-200 rounded-t-lg p-3 bg-gray-50">
                  <div className="flex items-center space-x-1 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => insertMarkdown("bold")}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                      title="Bold"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("italic")}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                      title="Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("code")}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                      title="Code"
                    >
                      <Code className="h-4 w-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("heading")}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                      title="Heading"
                    >
                      <span className="text-sm font-bold">H</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("quote")}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                      title="Quote"
                    >
                      <Quote className="h-4 w-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("list")}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                      title="Bullet List"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("orderedList")}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                      title="Numbered List"
                    >
                      <ListOrdered className="h-4 w-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("link")}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                      title="Link"
                    >
                      <Link2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("image")}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                      title="Image"
                    >
                      <Image className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Content Textarea */}
                <div>
                  <textarea
                    ref={contentTextareaRef}
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={20}
                    className={`w-full px-3 py-3 border-x border-b border-gray-200 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none ${
                      validationErrors.content ? "border-red-300 bg-red-50" : ""
                    }`}
                    placeholder="Write your blog post content here using Markdown..."
                    required
                  />
                  {validationErrors.content && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {validationErrors.content}
                    </p>
                  )}
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>
                      Supports Markdown: **bold**, *italic*, `code`, etc.
                    </span>
                    <span>
                      {wordCount} words • {charCount} characters
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Metadata */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <Tag className="h-5 w-5 text-gray-400 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Metadata
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Category */}
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      <Folder className="h-4 w-4 inline mr-1" />
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a category</option>
                      {availableCategories.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
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
                      <Tag className="h-4 w-4 inline mr-1" />
                      Tags
                    </label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="tag1, tag2, tag3"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Separate tags with commas
                    </p>
                  </div>

                  {/* Featured Image */}
                  <div>
                    <label
                      htmlFor="featured_image"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      <Image className="h-4 w-4 inline mr-1" />
                      Featured Image URL
                    </label>
                    <input
                      type="url"
                      id="featured_image"
                      name="featured_image"
                      value={formData.featured_image}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.featured_image
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="https://example.com/image.jpg"
                    />
                    {validationErrors.featured_image && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.featured_image}
                      </p>
                    )}
                    {formData.featured_image &&
                      isValidUrl(formData.featured_image) && (
                        <div className="mt-2">
                          <img
                            src={formData.featured_image}
                            alt="Featured image preview"
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                  </div>

                  {/* Status */}
                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.status === "draft"
                        ? "Only you can see this post"
                        : "Visible to everyone"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Actions
                </h3>

                <div className="space-y-3">
                  {/* Preview Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsPreview(!isPreview)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {isPreview ? "Hide Preview" : "Show Preview"}
                  </button>

                  {/* Save as Draft */}
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    disabled={
                      isUpdating || Object.keys(validationErrors).length > 0
                    }
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isUpdating ? "Saving..." : "Save as Draft"}
                  </button>

                  {/* Publish */}
                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={
                      isUpdating || Object.keys(validationErrors).length > 0
                    }
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isUpdating ? "Publishing..." : "Update & Publish"}
                  </button>
                </div>

                {Object.keys(validationErrors).length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Please fix validation errors before saving
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Modal/Section */}
          {isPreview && (
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
                <button
                  onClick={() => setIsPreview(false)}
                  className="flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Close Preview</span>
                </button>
              </div>

              <div className="prose max-w-none">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {formData.title || "Untitled Post"}
                </h1>

                {formData.excerpt && (
                  <p className="text-lg text-gray-600 mb-6 italic">
                    {formData.excerpt}
                  </p>
                )}

                {formData.featured_image &&
                  isValidUrl(formData.featured_image) && (
                    <img
                      src={formData.featured_image}
                      alt="Featured image"
                      className="w-full h-64 object-cover rounded-lg mb-6"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}

                <PostBody
                  post={{
                    ...post,
                    title: formData.title,
                    content: formData.content,
                    excerpt: formData.excerpt,
                    featuredImage: formData.featured_image,
                    category: formData.category,
                    tags: formData.tags,
                    status: formData.status as "draft" | "published",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AccessControl>
  );
};

export default BlogEditPage;
