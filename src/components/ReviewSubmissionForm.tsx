"use client";

import React, { useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import StarRating from "@/components/ui/StarRating";
import { createReview, CreateReviewData } from "@/services/reviewsApi";

interface ReviewSubmissionFormProps {
  vehicleId: string;
  vehicleName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  rating: number;
  title: string;
  content: string;
  reviewerName: string;
  reviewerEmail: string;
}

interface FormErrors {
  rating?: string;
  title?: string;
  content?: string;
  reviewerName?: string;
  reviewerEmail?: string;
  submit?: string;
}

const ReviewSubmissionForm: React.FC<ReviewSubmissionFormProps> = ({
  vehicleId,
  vehicleName,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>({
    rating: 0,
    title: "",
    content: "",
    reviewerName: "",
    reviewerEmail: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.rating === 0) {
      newErrors.rating = "Please select a rating";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    } else if (formData.title.trim().length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Review content is required";
    } else if (formData.content.trim().length < 10) {
      newErrors.content = "Review must be at least 10 characters";
    } else if (formData.content.trim().length > 2000) {
      newErrors.content = "Review must be less than 2000 characters";
    }

    if (!formData.reviewerName.trim()) {
      newErrors.reviewerName = "Name is required";
    } else if (formData.reviewerName.trim().length > 100) {
      newErrors.reviewerName = "Name must be less than 100 characters";
    }

    if (formData.reviewerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.reviewerEmail)) {
        newErrors.reviewerEmail = "Please enter a valid email address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const reviewData: CreateReviewData = {
        entity_type: "vehicle_listing",
        entity_id: vehicleId,
        rating: formData.rating,
        title: formData.title.trim(),
        content: formData.content.trim(),
        reviewer_name: formData.reviewerName.trim(),
        reviewer_email: formData.reviewerEmail.trim() || undefined,
      };

      await createReview(reviewData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Failed to submit review. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Write a Review
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Share your experience with the {vehicleName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating *
            </label>
            <StarRating
              rating={formData.rating}
              onRatingChange={(rating) => handleInputChange("rating", rating)}
              size="lg"
              showLabel
              className="mb-2"
            />
            {errors.rating && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.rating}
              </p>
            )}
          </div>

          {/* Review Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Review Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Summarize your experience in a few words"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? "border-red-300" : "border-gray-300"
              }`}
              maxLength={200}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.title ? (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.title}
                </p>
              ) : (
                <div></div>
              )}
              <span className="text-xs text-gray-500">
                {formData.title.length}/200
              </span>
            </div>
          </div>

          {/* Review Content */}
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Review *
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              placeholder="Share your detailed experience with this vehicle. What did you like? What could be improved?"
              rows={6}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical ${
                errors.content ? "border-red-300" : "border-gray-300"
              }`}
              maxLength={2000}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.content ? (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.content}
                </p>
              ) : (
                <div></div>
              )}
              <span className="text-xs text-gray-500">
                {formData.content.length}/2000
              </span>
            </div>
          </div>

          {/* Reviewer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="reviewerName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Name *
              </label>
              <input
                type="text"
                id="reviewerName"
                value={formData.reviewerName}
                onChange={(e) =>
                  handleInputChange("reviewerName", e.target.value)
                }
                placeholder="Enter your name"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.reviewerName ? "border-red-300" : "border-gray-300"
                }`}
                maxLength={100}
              />
              {errors.reviewerName && (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.reviewerName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="reviewerEmail"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email (Optional)
              </label>
              <input
                type="email"
                id="reviewerEmail"
                value={formData.reviewerEmail}
                onChange={(e) =>
                  handleInputChange("reviewerEmail", e.target.value)
                }
                placeholder="your@email.com"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.reviewerEmail ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.reviewerEmail && (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.reviewerEmail}
                </p>
              )}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewSubmissionForm;
