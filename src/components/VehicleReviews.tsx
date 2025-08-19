"use client";

import React, { useState, useEffect } from "react";
import { Star, User, Calendar, ThumbsUp, Plus } from "lucide-react";
import { getEntityReviews, Review } from "@/services/reviewsApi";
import ReviewSubmissionForm from "@/components/ReviewSubmissionForm";

interface VehicleReviewsProps {
  vehicleId: string;
  vehicleName: string;
}

const VehicleReviews: React.FC<VehicleReviewsProps> = ({
  vehicleId,
  vehicleName,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await getEntityReviews("vehicle_listing", vehicleId, {
          limit: 10,
          sortBy: "created_at",
          sort: "desc",
        });

        setReviews(response.data.reviews || []);
        setTotalReviews(response.data.rating_stats?.total_reviews || 0);
        setAverageRating(response.data.rating_stats?.average_rating || 0);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [vehicleId]);

  const handleReviewSubmitted = () => {
    // Refresh reviews after successful submission
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await getEntityReviews("vehicle_listing", vehicleId, {
          limit: 10,
          sortBy: "created_at",
          sort: "desc",
        });

        setReviews(response.data.reviews || []);
        setTotalReviews(response.data.rating_stats?.total_reviews || 0);
        setAverageRating(response.data.rating_stats?.average_rating || 0);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  };

  const renderStars = (rating: number, size: "sm" | "md" = "sm") => {
    const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-100 pb-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Reviews & Ratings
          </h3>
          <div className="flex items-center space-x-4">
            {totalReviews > 0 && (
              <div className="text-sm text-gray-500">
                {totalReviews} review{totalReviews !== 1 ? "s" : ""}
              </div>
            )}
            <button
              onClick={() => setShowReviewForm(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Write a Review
            </button>
          </div>
        </div>

        {totalReviews > 0 && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(averageRating), "md")}
              <span className="text-lg font-semibold text-gray-900">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-gray-500">
              Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="divide-y divide-gray-100">
        {reviews.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No reviews yet</p>
            <p className="text-sm">Be the first to review the {vehicleName}!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Anonymous User
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(review.created_at)}</span>
                    </div>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>

              <h4 className="font-semibold text-gray-900 mb-2">
                {review.title}
              </h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                {review.content}
              </p>

              {review.helpful_count > 0 && (
                <div className="flex items-center text-sm text-gray-500">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  <span>{review.helpful_count} people found this helpful</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review Submission Modal */}
      {showReviewForm && (
        <ReviewSubmissionForm
          vehicleId={vehicleId}
          vehicleName={vehicleName}
          onClose={() => setShowReviewForm(false)}
          onSuccess={handleReviewSubmitted}
        />
      )}
    </div>
  );
};

export default VehicleReviews;
