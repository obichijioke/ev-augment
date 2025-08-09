"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showLabel?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = "md",
  readonly = false,
  showLabel = false,
  className = "",
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (!readonly) {
      setHoverRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const getStarColor = (starIndex: number) => {
    const currentRating = hoverRating || rating;
    if (starIndex <= currentRating) {
      return "text-yellow-400 fill-current";
    }
    return "text-gray-300";
  };

  const getRatingLabel = (rating: number) => {
    const labels = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    };
    return labels[rating as keyof typeof labels] || "";
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div
        className="flex items-center space-x-1"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => (
          <button
            key={starIndex}
            type="button"
            className={`${sizeClasses[size]} ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            } transition-all duration-150 ${getStarColor(starIndex)}`}
            onClick={() => handleStarClick(starIndex)}
            onMouseEnter={() => handleStarHover(starIndex)}
            disabled={readonly}
            aria-label={`Rate ${starIndex} star${starIndex !== 1 ? "s" : ""}`}
          >
            <Star className="w-full h-full" />
          </button>
        ))}
      </div>

      {showLabel && (
        <div className="ml-2 text-sm text-gray-600">
          {hoverRating > 0 ? (
            <span className="font-medium text-gray-900">
              {getRatingLabel(hoverRating)}
            </span>
          ) : rating > 0 ? (
            <span>
              {getRatingLabel(rating)} ({rating}/5)
            </span>
          ) : (
            <span className="text-gray-400">No rating</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StarRating;
