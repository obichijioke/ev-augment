"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Eye,
  Save,
  Send,
  Image as ImageIcon,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Quote,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useBlogPost } from "@/hooks/useBlogPost";
import { useBlog } from "@/hooks/useBlog";
import { useBlogError } from "@/hooks/useBlogError";
import { useBlogImageUpload } from "@/hooks/useFileUpload";
import { BlogLoading, BlogError } from "@/components/blog/BlogErrorBoundary";
import AccessControl from "@/components/auth/AccessControl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github.css";

interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featuredImage: string;
  isDraft: boolean;
}

const CreateBlogPage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Blog hooks
  const { categories } = useBlog({
    autoLoad: true,
  });

  // Fallback categories if API doesn't return any
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
  const {
    createPost,
    isCreating,
    error: postError,
  } = useBlogPost({
    onCreateSuccess: (post) => {
      if (formData.isDraft) {
        alert("Draft saved successfully!");
      } else {
        alert("Blog post published successfully!");
        router.push(`/blog/${post.slug}`);
      }
    },
    onError: (error) => {
      alert(`Failed to save blog post: ${error}`);
    },
  });

  const { handleError } = useBlogError();

  // Image upload hook
  const {
    files: uploadedImages,
    isUploading: imageUploading,
    uploadSingle: uploadImage,
    error: uploadError,
    clearError: clearUploadError,
  } = useBlogImageUpload();

  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: [],
    featuredImage: "",
    isDraft: true,
  });
  const [tagInput, setTagInput] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Redirect if not authenticated (only after hydration)
  React.useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router, isHydrated]);

  // Update form data when image is uploaded
  useEffect(() => {
    if (uploadedImages.length > 0) {
      const latestImage = uploadedImages[uploadedImages.length - 1];
      handleInputChange("featuredImage", latestImage.file_path);
    }
  }, [uploadedImages]);

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  };

  const handleInputChange = (
    field: keyof BlogFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !formData.tags.includes(tag)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tag],
        }));
      }
      setTagInput("");
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear any previous upload errors
    clearUploadError();

    try {
      await uploadImage(file, {
        altText: `Featured image for ${formData.title || "blog post"}`,
        caption: formData.title || undefined,
      });

      // The uploaded image will be available in uploadedImages array
      // We'll update the form data when the upload completes
    } catch (error) {
      console.error("Image upload failed:", error);
      handleError(error);
    }
  };

  const insertTextAtCursor = (text: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content;
    const newContent =
      currentContent.substring(0, start) + text + currentContent.substring(end);

    handleInputChange("content", newContent);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Please fill in the title and content");
      return;
    }

    try {
      // Prepare blog post data for API
      const postData = {
        title: formData.title.trim(),
        slug: generateSlug(formData.title),
        excerpt: formData.excerpt.trim() || undefined,
        content: formData.content.trim(),
        featured_image: formData.featuredImage || undefined,
        category: formData.category || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        status: isDraft ? ("draft" as const) : ("published" as const),
        is_featured: false,
        published_at: isDraft ? undefined : new Date().toISOString(),
      };

      console.log("Creating blog post:", postData);

      const result = await createPost(postData);

      if (result) {
        // Success is handled by the onCreateSuccess callback
        console.log("Blog post created successfully:", result);
      }
    } catch (error) {
      console.error("Failed to save blog post:", error);
      handleError(error);
    }
  };

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  // Show loading during hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Please sign in to create a blog post.
          </p>
          <Link
            href="/auth/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AccessControl requireAuth={true} requireBlogCreate={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/blog"
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Blog
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create New Article
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsPreview(!isPreview)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>{isPreview ? "Edit" : "Preview"}</span>
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isCreating}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isCreating ? "Saving..." : "Save Draft"}</span>
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={
                    isCreating ||
                    !formData.title.trim() ||
                    !formData.content.trim()
                  }
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{isCreating ? "Publishing..." : "Publish"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {postError && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
                <div>
                  <h3 className="text_sm font-medium text-red-800 dark:text-red-300">
                    Error Creating Post
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {postError}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {!isPreview ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  {/* Title */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      placeholder="Enter your article title..."
                      className="w-full text-2xl font-bold border-none outline-none focus:ring-0 p-0 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Excerpt */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Excerpt
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) =>
                        handleInputChange("excerpt", e.target.value)
                      }
                      placeholder="Brief description of your article..."
                      rows={3}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>

                  {/* Featured Image */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Featured Image
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="text"
                        value={formData.featuredImage}
                        onChange={(e) =>
                          handleInputChange("featuredImage", e.target.value)
                        }
                        placeholder="Image URL or upload below..."
                        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageUploading}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors disabled:opacity-50"
                      >
                        <Upload className="h-4 w-4" />
                        <span>
                          {imageUploading ? "Uploading..." : "Upload"}
                        </span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Upload Error */}
                    {uploadError && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                        Upload failed: {uploadError}
                      </div>
                    )}

                    {/* Image Preview */}
                    {formData.featuredImage && (
                      <div className="mt-4">
                        <img
                          src={formData.featuredImage}
                          alt="Featured image preview"
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            console.error(
                              "Image failed to load:",
                              formData.featuredImage
                            );
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Content Editor */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Content *
                      </label>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Markdown supported • Use Preview to see formatted
                        content
                      </span>
                    </div>

                    {/* Toolbar */}
                    <div className="border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-700/30 px-3 py-2 flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => insertTextAtCursor("**Bold text**")}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="Bold"
                      >
                        <Bold className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTextAtCursor("*Italic text*")}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="Italic"
                      >
                        <Italic className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTextAtCursor("\n## Heading\n")}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs font-bold"
                        title="Heading"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertTextAtCursor("\n- List item\n- List item\n")
                        }
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="List"
                      >
                        <List className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTextAtCursor("[Link text](URL)")}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="Link"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTextAtCursor("\n> Quote text\n")}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="Quote"
                      >
                        <Quote className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertTextAtCursor("![Alt text](Image URL)")
                        }
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Image"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertTextAtCursor(
                            "\n```javascript\n// Your code here\n```\n"
                          )
                        }
                        className="p-1 hover:bg-gray-200 rounded text-xs font-mono"
                        title="Code Block"
                      >
                        {"</>"}
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTextAtCursor("`inline code`")}
                        className="p-1 hover:bg-gray-200 rounded text-xs font-mono"
                        title="Inline Code"
                      >
                        {"`code`"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertTextAtCursor(
                            "\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n"
                          )
                        }
                        className="p-1 hover:bg-gray-200 rounded text-xs"
                        title="Table"
                      >
                        ⊞
                      </button>
                    </div>

                    <textarea
                      ref={contentTextareaRef}
                      value={formData.content}
                      onChange={(e) =>
                        handleInputChange("content", e.target.value)
                      }
                      placeholder="Write your article content here using Markdown..."
                      rows={20}
                      className="w-full border-l border-r border-b border-gray-300 dark:border-gray-600 rounded-b-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Supports Markdown formatting. Estimated read time:{" "}
                      {estimateReadTime(formData.content)} min
                    </p>
                  </div>
                </div>
              ) : (
                /* Preview Mode */
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {formData.featuredImage && (
                    <div className="aspect-video">
                      <img
                        src={formData.featuredImage}
                        alt={formData.title}
                        className="w-full h-full object_cover"
                      />
                    </div>
                  )}
                  <div className="p-8">
                    <div className="mb-4">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {formData.category || "Uncategorized"}
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      {formData.title || "Article Title"}
                    </h1>
                    {formData.excerpt && (
                      <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                        {formData.excerpt}
                      </p>
                    )}
                    <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:text-pink-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight, rehypeRaw]}
                      >
                        {formData.content ||
                          "*No content yet. Start writing to see the preview.*"}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Article Settings
                </h3>

                {/* Category */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagAdd}
                    placeholder="Add tags (press Enter or comma)"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  {formData.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-2 py-1 rounded text-sm flex items-center space-x-1"
                        >
                          <span>#{tag}</span>
                          <button
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            onClick={() => handleTagRemove(tag)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Article Stats
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Word count:</span>
                      <span>
                        {
                          formData.content
                            .trim()
                            .split(/\s+/)
                            .filter((word) => word.length > 0).length
                        }
                      </span>
                    </div>
                    <div className="flex justify_between">
                      <span>Character count:</span>
                      <span>{formData.content.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Read time:</span>
                      <span>{estimateReadTime(formData.content)} min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccessControl>
  );
};

export default CreateBlogPage;
