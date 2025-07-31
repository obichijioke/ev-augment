// Export all database types
export * from './database';

// Export all API types
export * from './api';

// Re-export commonly used types for convenience
export type {
  User,
  Vehicle,
  MarketplaceListing,
  ForumPost,
  ForumComment,
  ChargingStation,
  BlogPost,
  Notification,
  ApiResponse,
  PaginatedResponse,
  AuthenticatedRequest
} from './database';

export type {
  LoginRequest,
  RegisterRequest,
  CreateVehicleRequest,
  CreateMarketplaceListingRequest,
  CreateForumPostRequest,
  CreateBlogPostRequest,
  JWTPayload,
  ValidationError,
  ApiError,
  PaginationMeta
} from './api';