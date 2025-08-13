import { ApiResponse, PaginatedResponse } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

export interface Review {
  id: string;
  entity_type: string;
  entity_id: string;
  reviewer_id?: string;
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  is_verified_purchase?: boolean;
  helpful_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  users?: {
    username: string;
    full_name: string;
    avatar_url?: string;
    is_verified: boolean;
  };
}

export interface CreateReviewData {
  entity_type: string;
  entity_id: string;
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  reviewer_name?: string;
  reviewer_email?: string;
}

export interface ReviewsQueryParams {
  page?: number;
  limit?: number;
  rating_filter?: number;
  sort?: "asc" | "desc";
  sortBy?: "created_at" | "rating" | "helpful_count";
}

// Get reviews for a specific entity (e.g., vehicle listing)
export const getEntityReviews = async (
  entityType: string,
  entityId: string,
  params: ReviewsQueryParams = {}
): Promise<PaginatedResponse<Review>> => {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.rating_filter)
    searchParams.append("rating_filter", params.rating_filter.toString());
  if (params.sort) searchParams.append("sort", params.sort);
  if (params.sortBy) searchParams.append("sortBy", params.sortBy);

  const response = await fetch(
    `${API_BASE_URL}/reviews/entity/${entityType}/${entityId}?${searchParams.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch reviews: ${response.statusText}`);
  }

  return response.json();
};

// Get review statistics for an entity
export const getEntityReviewStats = async (
  entityType: string,
  entityId: string
): Promise<
  ApiResponse<{
    total_reviews: number;
    average_rating: number;
    rating_distribution: { [key: string]: number };
  }>
> => {
  const response = await fetch(
    `${API_BASE_URL}/reviews/stats/${entityType}/${entityId}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch review stats: ${response.statusText}`);
  }

  return response.json();
};

// Create a new review (requires authentication)
export const createReview = async (
  reviewData: CreateReviewData,
  token?: string
): Promise<ApiResponse<Review>> => {
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(reviewData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Failed to create review: ${response.statusText}`
    );
  }

  return response.json();
};
