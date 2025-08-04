"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  Quote,
  Code,
  Image,
  Eye,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { createForumPost, getForumCategories } from "@/services/forumApi";
import { ForumCategory } from "@/types/forum";
import { useForumPostUpload } from "@/hooks/useFileUpload";
import FileUploadZone from "@/components/forums/FileUploadZone";
import AttachmentDisplay from "@/components/forums/AttachmentDisplay";

// Get authentication token from localStorage
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (!authStorage) return null;

    const authData = JSON.parse(authStorage);
    return authData?.state?.session?.accessToken || null;
  } catch (error) {
    console.error("Error parsing auth token:", error);
    return null;
  }
}

const NewThreadPage = () => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);

  // File upload hook - we'll upload without entity_id initially
  const {
    files: uploadedFiles,
    isUploading,
    uploadProgress,
    error: uploadError,
    uploadFiles,
    removeFile,
    clearError,
  } = useForumPostUpload(undefined); // No entity_id initially

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await getForumCategories();
        setCategories(response.data.categories);
      } catch (err) {
        console.error("Failed to load categories:", err);
        setError("Failed to load categories. Please refresh the page.");
        // Fallback categories
        setCategories([
          {
            id: "general",
            name: "General Discussion",
            slug: "general",
            description: "General EV discussions",
            color: "#6B7280",
            is_active: true,
            sort_order: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            post_count: 0,
          },
        ]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !category) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Parse tags from comma-separated string
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Create the post
      const postData = {
        title: title.trim(),
        content: content.trim(),
        category_id: category,
        tags: tagArray.length > 0 ? tagArray : undefined,
      };

      const response = await createForumPost(postData);
      const createdPostId = response.data.post.id;

      // Update uploaded files to associate them with the real post ID
      if (uploadedFiles.length > 0) {
        try {
          // Update each file's entity_id from tempPostId to the real post ID
          await Promise.all(
            uploadedFiles.map(async (file) => {
              const updateResponse = await fetch(
                `${
                  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4005/api"
                }/upload/files/${file.id}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                  },
                  body: JSON.stringify({
                    entity_id: createdPostId,
                  }),
                }
              );

              if (!updateResponse.ok) {
                console.warn(`Failed to update file ${file.id} association`);
              }
            })
          );
        } catch (fileUpdateError) {
          console.warn("Failed to update file associations:", fileUpdateError);
          // Don't fail the entire post creation for file association errors
        }
      }

      // Redirect to the created thread
      router.push(`/forums/${createdPostId}`);
    } catch (err: any) {
      console.error("Failed to create thread:", err);
      setError(err.message || "Failed to create thread. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    setContent(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const renderPreview = (text: string) => {
    // Simple markdown-like rendering for preview
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, "<br />");
  };

  return (
    <ProtectedRoute>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/forums"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forums
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Thread
            </h1>
            <p className="text-gray-600 mt-2">
              Share your thoughts, questions, or experiences with the EV
              community.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Thread Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Thread Details
              </h2>

              <div className="space-y-4">
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
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a descriptive title for your thread"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Category *
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isLoadingCategories}
                  >
                    <option value="">
                      {isLoadingCategories
                        ? "Loading categories..."
                        : "Select a category"}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
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
                    Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Enter tags separated by commas (e.g., FSD, Autopilot, Review)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Tags help others find your thread more easily
                  </p>
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Content</h2>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsPreview(false)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      !isPreview
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Edit className="h-4 w-4 inline mr-1" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreview(true)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      isPreview
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Eye className="h-4 w-4 inline mr-1" />
                    Preview
                  </button>
                </div>
              </div>

              {!isPreview ? (
                <div>
                  {/* Toolbar */}
                  <div className="flex items-center space-x-2 p-2 border border-gray-300 rounded-t-lg bg-gray-50">
                    <button
                      type="button"
                      onClick={() => insertMarkdown("**", "**")}
                      className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                      title="Bold"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("*", "*")}
                      className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                      title="Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("`", "`")}
                      className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                      title="Code"
                    >
                      <Code className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("[", "](url)")}
                      className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                      title="Link"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("\n- ")}
                      className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                      title="List"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("\n> ")}
                      className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                      title="Quote"
                    >
                      <Quote className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Text Area */}
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your thread content here... You can use Markdown formatting."
                    rows={12}
                    className="w-full px-3 py-2 border-l border-r border-b border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 min-h-[300px] bg-white">
                  {content ? (
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: renderPreview(content),
                      }}
                    />
                  ) : (
                    <p className="text-gray-500 italic">
                      Nothing to preview yet. Start writing your content!
                    </p>
                  )}
                </div>
              )}

              <div className="mt-2 text-sm text-gray-500">
                <p>
                  Supported formatting: **bold**, *italic*, `code`,
                  [links](url), lists, and quotes
                </p>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Images</h2>
                <button
                  type="button"
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <Image className="h-4 w-4 inline mr-1" />
                  {showImageUpload ? "Hide Upload" : "Add Images"}
                </button>
              </div>

              {/* Upload Error */}
              {uploadError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{uploadError}</p>
                  <button
                    onClick={clearError}
                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* File Upload Zone */}
              {showImageUpload && (
                <div className="mb-4">
                  <FileUploadZone
                    onFilesUploaded={(files) => {
                      console.log("Files uploaded:", files);
                      // Files are automatically managed by the hook
                    }}
                    uploadType="image"
                    entityType="forum_post"
                    maxFiles={5}
                    disabled={isSubmitting || isUploading}
                  />
                </div>
              )}

              {/* Uploaded Files Display */}
              {uploadedFiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Attached Images ({uploadedFiles.length})
                  </h4>
                  <AttachmentDisplay
                    attachments={uploadedFiles.map((file) => ({
                      id: file.id,
                      filename: file.filename,
                      original_filename: file.original_name,
                      file_path: file.file_path,
                      file_size: file.file_size,
                      mime_type: file.mime_type,
                      is_image: file.mime_type.startsWith("image/"),
                      alt_text: file.alt_text,
                      uploader_id: "", // Not needed for display
                      created_at: "", // Not needed for display
                    }))}
                    showRemove={true}
                    onRemove={(attachment) => removeFile(attachment.id)}
                  />
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Uploading images...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="mt-2 text-sm text-gray-500">
                <p>
                  Upload images to include in your thread. Supported formats:
                  JPEG, PNG, WebP, GIF. Max 10MB per image.
                </p>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Community Guidelines
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Be respectful and constructive in your discussions</li>
                <li>• Search existing threads before creating a new one</li>
                <li>• Use descriptive titles and appropriate categories</li>
                <li>
                  • Share accurate information and cite sources when possible
                </li>
                <li>• Keep discussions relevant to electric vehicles</li>
              </ul>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-between">
              <Link
                href="/forums"
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Link>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  disabled={
                    !title.trim() ||
                    !content.trim() ||
                    !category ||
                    isSubmitting ||
                    isLoadingCategories
                  }
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating Thread..." : "Create Thread"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default NewThreadPage;
