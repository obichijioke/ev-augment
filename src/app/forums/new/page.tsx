"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, X, Image, AlertCircle } from "lucide-react";
import ForumLayout from "@/components/forum/ForumLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary, {
  ForumLoading,
  ForumError,
} from "@/components/forum/ErrorBoundary";
import { useForumError } from "@/hooks/useForumError";
import { ForumCategory, CreateThreadForm } from "@/types/forum";
import {
  useForumCategories,
  useForumThreads,
  useForumImages,
} from "@/hooks/useForumApi";

const NewThreadPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCategoryId = searchParams.get("category");

  const [formData, setFormData] = useState<CreateThreadForm>({
    title: "",
    content: "",
    categoryId: preselectedCategoryId || "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get categories from API
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useForumCategories();

  // Get thread creation function
  const { createThread } = useForumThreads();

  // Get image upload function
  const { uploadImage } = useForumImages();

  const { error, handleError, clearError } = useForumError();

  // Handle API errors
  useEffect(() => {
    if (categoriesError) {
      handleError(new Error(categoriesError));
    } else {
      clearError();
    }
  }, [categoriesError, handleError, clearError]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      handleError("Thread title is required");
      return;
    }

    if (!formData.content.trim()) {
      handleError("Thread content is required");
      return;
    }

    if (!formData.categoryId) {
      handleError("Please select a category");
      return;
    }

    try {
      setIsSubmitting(true);
      clearError();

      // Create the thread first
      const newThread = await createThread({
        category_id: formData.categoryId,
        title: formData.title,
        content: formData.content,
      });

      // Upload images after thread creation if any
      const uploadedImageIds: string[] = [];
      for (const image of images) {
        try {
          const uploadedImage = await uploadImage(image, newThread.id);
          uploadedImageIds.push(uploadedImage.id);
        } catch (err) {
          console.error("Failed to upload image:", err);
          // Continue with other images, don't fail the whole submission
        }
      }

      // Redirect to the new thread
      router.push(`/forums/thread/${newThread.id}`);
    } catch (err) {
      handleError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxImages = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        handleError("Only image files are allowed");
        return false;
      }
      if (file.size > maxSize) {
        handleError("Image size must be less than 5MB");
        return false;
      }
      return true;
    });

    if (images.length + validFiles.length > maxImages) {
      handleError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setImages((prev) => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    router.back();
  };

  if (categoriesLoading) {
    return (
      <ForumLayout title="Create New Thread" showBackButton={true}>
        <ForumLoading message="Loading categories..." />
      </ForumLayout>
    );
  }

  if (error && categories.length === 0) {
    return (
      <ForumLayout title="Create New Thread" showBackButton={true}>
        <ForumError
          message={error.message}
          onRetry={() => window.location.reload()}
        />
      </ForumLayout>
    );
  }

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <ForumLayout
          title="Create New Thread"
          subtitle="Start a new discussion in the community"
          showBackButton={true}
        >
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800">{error.message}</span>
                  </div>
                </div>
              )}

              {/* Category Selection */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categoryId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Thread Title */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Thread Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter a descriptive title for your thread"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={200}
                  required
                />
                <div className="mt-2 text-sm text-gray-500">
                  {formData.title.length}/200 characters
                </div>
              </div>

              {/* Thread Content */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="Write your thread content here..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  maxLength={10000}
                  required
                />
                <div className="mt-2 text-sm text-gray-500">
                  {formData.content.length}/10,000 characters
                </div>
              </div>

              {/* Image Upload */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Images (Optional)
                </label>

                {/* Upload Button */}
                <div className="mb-4">
                  <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Image className="h-4 w-4 mr-2" />
                    <span>Add Images</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Maximum 5 images, 5MB each. Supported formats: JPG, PNG,
                    GIF, WebP
                  </p>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-sm text-gray-600">
                  <p>• Be respectful and follow community guidelines</p>
                  <p>• Use clear, descriptive titles</p>
                  <p>• Search existing threads before posting</p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !formData.title.trim() ||
                      !formData.content.trim() ||
                      !formData.categoryId
                    }
                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Thread
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </ForumLayout>
      </ErrorBoundary>
    </ProtectedRoute>
  );
};

export default NewThreadPage;
