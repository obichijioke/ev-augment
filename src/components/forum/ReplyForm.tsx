"use client";

import React, { useState } from "react";
import { Send, X, AlertCircle, Image } from "lucide-react";
import { CreateReplyForm } from "@/types/forum";

interface ReplyFormProps {
  threadId: string;
  parentId?: string;
  isNested?: boolean;
  onSubmit: (data: CreateReplyForm) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
}

const ReplyForm: React.FC<ReplyFormProps> = ({
  threadId,
  parentId,
  isNested = false,
  onSubmit,
  onCancel,
  placeholder = "Write your reply...",
  className = "",
}) => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Reply content cannot be empty");
      return;
    }

    if (content.length < 10) {
      setError("Reply must be at least 10 characters long");
      return;
    }

    if (content.length > 5000) {
      setError("Reply cannot exceed 5000 characters");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await onSubmit({
        content: content.trim(),
        parentId,
        images: images.length > 0 ? images : undefined,
      });

      // Reset form on success
      setContent("");
      setImages([]);
      setImagePreviews([]);
      if (onCancel) {
        onCancel();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent("");
    setImages([]);
    setImagePreviews([]);
    setError(null);
    if (onCancel) {
      onCancel();
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxImages = 3; // Limit for replies
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return false;
      }
      if (file.size > maxSize) {
        setError("Image size must be less than 5MB");
        return false;
      }
      return true;
    });

    if (images.length + validFiles.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed for replies`);
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

  const remainingChars = 5000 - content.length;
  const isNearLimit = remainingChars < 100;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">
            {isNested ? "Reply to comment" : "Reply to thread"}
          </h3>
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4">
          {/* Nesting Warning */}
          {isNested && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Replying to a comment</p>
                  <p>
                    This will be the final level of nesting. No further replies
                    can be added to this comment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Textarea */}
          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[100px]"
              disabled={isSubmitting}
            />

            {/* Character Count */}
            <div className="flex justify-between items-center mt-2 text-sm">
              <div className="text-gray-500">Minimum 10 characters</div>
              <div
                className={`${isNearLimit ? "text-red-600" : "text-gray-500"}`}
              >
                {remainingChars} characters remaining
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-900">
                Images (Optional)
              </label>
              <label className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm">
                <Image className="h-4 w-4 mr-1" />
                <span>Add Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              Maximum 3 images, 5MB each. Supported formats: JPG, PNG, GIF, WebP
            </p>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Reply Guidelines
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Be respectful and constructive in your responses</li>
              <li>• Stay on topic and relevant to the discussion</li>
              <li>• Use clear and concise language</li>
              <li>• Avoid duplicate posts or spam</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="text-sm text-gray-600">
            {isNested
              ? "Final nesting level"
              : "Others can reply to your comment"}
          </div>

          <div className="flex items-center space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !content.trim() || content.length < 10}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post Reply
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReplyForm;
