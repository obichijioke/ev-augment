import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { getUserFromToken, supabaseAdmin } from "../services/supabaseClient";
import { AuthenticatedRequest } from "../types";

// Middleware to authenticate JWT tokens
const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: "Access token required",
        message: "Please provide a valid authentication token",
      });
      return;
    }

    // Verify token with Supabase
    const { user, error } = await getUserFromToken(token);

    if (error || !user) {
      res.status(403).json({
        error: "Invalid token",
        message: "The provided token is invalid or expired",
      });
      return;
    }

    // Attach user to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(403).json({
      error: "Authentication failed",
      message: "Token verification failed",
    });
    return;
  }
};

// Middleware for optional authentication (doesn't fail if no token)
const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const { user, error } = await getUserFromToken(token);

      if (!error && user) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token verification fails
    next();
  }
};

// Middleware to check if user is admin
const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        message: "Please authenticate to access this resource",
      });
      return;
    }

    // First check user_metadata/app_metadata for backward compatibility
    const metadataAdmin =
      req.user.user_metadata?.role === "admin" ||
      req.user.app_metadata?.role === "admin";

    if (metadataAdmin) {
      next();
      return;
    }

    // Check user_profiles table for admin role
    const { data: userProfile, error } = await supabaseAdmin
      .from("user_profiles")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({
        error: "Authorization check failed",
        message: "Unable to verify user permissions",
      });
      return;
    }

    const isAdmin = userProfile?.role === "admin";

    if (!isAdmin) {
      res.status(403).json({
        error: "Admin access required",
        message: "You do not have permission to access this resource",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({
      error: "Authorization check failed",
      message: "Unable to verify admin permissions",
    });
    return;
  }
};

// Middleware to check if user is moderator or admin
const requireModerator = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        message: "Please authenticate to access this resource",
      });
      return;
    }

    // First check user_metadata/app_metadata for backward compatibility
    const userRole =
      req.user.user_metadata?.role || req.user.app_metadata?.role;
    const metadataModerator = ["admin", "moderator"].includes(userRole);

    if (metadataModerator) {
      next();
      return;
    }

    // Check user_profiles table for moderator/admin role
    const { data: userProfile, error } = await supabaseAdmin
      .from("user_profiles")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);

      // If user_profiles table doesn't exist, deny access
      if (error.code === "42P01" || error.code === "42703") {
        console.log("user_profiles table missing, denying moderator access");
        res.status(403).json({
          error: "Access denied",
          message: "Moderator permissions not configured",
        });
        return;
      }

      res.status(500).json({
        error: "Authorization check failed",
        message: "Unable to verify user permissions",
      });
      return;
    }

    const isModerator = ["admin", "moderator"].includes(userProfile?.role);

    if (!isModerator) {
      res.status(403).json({
        error: "Moderator access required",
        message: "You do not have permission to access this resource",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Moderator check error:", error);
    res.status(500).json({
      error: "Authorization check failed",
      message: "Unable to verify moderator permissions",
    });
    return;
  }
};

// Middleware to check resource ownership
const requireOwnership = (
  resourceIdParam: string = "id",
  userIdField: string = "user_id"
) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: "Authentication required",
          message: "Please authenticate to access this resource",
        });
        return;
      }

      // Admin can access any resource - check metadata first
      const metadataAdmin =
        req.user.user_metadata?.role === "admin" ||
        req.user.app_metadata?.role === "admin";

      if (metadataAdmin) {
        next();
        return;
      }

      // Check user_profiles table for admin role
      const { data: userProfile } = await supabaseAdmin
        .from("user_profiles")
        .select("role")
        .eq("id", req.user.id)
        .single();

      if (userProfile?.role === "admin") {
        next();
        return;
      }

      // Check if resource belongs to user
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;

      // This will be implemented in specific controllers
      // For now, we'll attach the ownership check info to the request
      req.ownershipCheck = {
        resourceId,
        userId,
        userIdField,
      };

      next();
    } catch (error) {
      console.error("Ownership check error:", error);
      res.status(500).json({
        error: "Authorization check failed",
        message: "Unable to verify resource ownership",
      });
      return;
    }
  };
};

// Middleware to check if user account is verified
const requireVerified = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        message: "Please authenticate to access this resource",
      });
      return;
    }

    if (!req.user.email_confirmed_at) {
      res.status(403).json({
        error: "Email verification required",
        message: "Please verify your email address to access this resource",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Verification check error:", error);
    res.status(500).json({
      error: "Verification check failed",
      message: "Unable to verify account status",
    });
    return;
  }
};

// Middleware to extract user info from token without requiring authentication
const extractUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const { user } = await getUserFromToken(token);
      if (user) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Continue without user info if extraction fails
    next();
  }
};

// =============================================================================
// FORUM-SPECIFIC ROLE MIDDLEWARE
// =============================================================================

// Middleware to check if user can moderate forum content
const requireForumModerator = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        message: "Please authenticate to access this resource",
      });
      return;
    }

    // Check user role from user_profiles table
    const { data: userProfile, error } = await supabaseAdmin
      .from("user_profiles")
      .select("role, permissions")
      .eq("id", req.user.id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({
        error: "Authorization check failed",
        message: "Unable to verify user permissions",
      });
      return;
    }

    const canModerate =
      ["admin", "moderator"].includes(userProfile?.role) ||
      userProfile?.permissions?.includes("forum_moderate");

    if (!canModerate) {
      res.status(403).json({
        error: "Forum moderation access required",
        message: "You do not have permission to moderate forum content",
      });
      return;
    }

    // Attach user role info to request for use in handlers
    req.userRole = userProfile?.role;
    req.userPermissions = userProfile?.permissions || [];

    next();
  } catch (error) {
    console.error("Forum moderator check error:", error);
    res.status(500).json({
      error: "Authorization check failed",
      message: "Unable to verify forum moderation permissions",
    });
    return;
  }
};

// Middleware to check if user can create posts (handles rate limiting, bans, etc.)
const requirePostPermission = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        message: "Please authenticate to create posts",
      });
      return;
    }

    // Check if user is banned or suspended
    const { data: userProfile, error } = await supabaseAdmin
      .from("user_profiles")
      .select("role, is_banned, ban_expires_at, permissions")
      .eq("id", req.user.id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);

      // If user_profiles table doesn't exist or columns are missing, allow posting
      // This provides graceful degradation for development/testing
      if (error.code === "42P01" || error.code === "42703") {
        console.log(
          "user_profiles table or columns missing, allowing post creation"
        );
        next();
        return;
      }

      res.status(500).json({
        error: "Permission check failed",
        message: "Unable to verify posting permissions",
      });
      return;
    }

    // Check if user is banned
    if (userProfile?.is_banned) {
      const banExpired =
        userProfile.ban_expires_at &&
        new Date(userProfile.ban_expires_at) < new Date();

      if (!banExpired) {
        res.status(403).json({
          error: "Account suspended",
          message: "Your account has been suspended from posting",
          banExpiresAt: userProfile.ban_expires_at,
        });
        return;
      }
    }

    // Check if user has posting permissions
    const canPost =
      !userProfile?.permissions?.includes("no_post") &&
      userProfile?.role !== "banned";

    if (!canPost) {
      res.status(403).json({
        error: "Posting permission denied",
        message: "You do not have permission to create posts",
      });
      return;
    }

    // Attach user info to request
    req.userRole = userProfile?.role;
    req.userPermissions = userProfile?.permissions || [];

    next();
  } catch (error) {
    console.error("Post permission check error:", error);
    res.status(500).json({
      error: "Permission check failed",
      message: "Unable to verify posting permissions",
    });
    return;
  }
};

// Middleware to check if user can vote (prevents banned users from voting)
const requireVotePermission = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        message: "Please authenticate to vote",
      });
      return;
    }

    // Check user status (simplified - only check if user exists and has basic role)
    const { data: userProfile, error } = await supabaseAdmin
      .from("user_profiles")
      .select("role, permissions")
      .eq("id", req.user.id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);

      // If user_profiles table doesn't exist, allow voting (graceful degradation)
      if (error.code === "42P01" || error.code === "42703") {
        console.log("user_profiles table missing, allowing vote");
        next();
        return;
      }

      // Allow voting if profile check fails (graceful degradation)
      console.log("Allowing vote due to profile check failure");
      next();
      return;
    }

    // Check if user can vote (simplified check)
    const canVote =
      userProfile?.role !== "banned" &&
      !userProfile?.permissions?.includes("no_vote");

    if (!canVote) {
      res.status(403).json({
        error: "Voting permission denied",
        message: "You do not have permission to vote",
      });
      return;
    }

    req.userRole = userProfile?.role;
    req.userPermissions = userProfile?.permissions || [];

    next();
  } catch (error) {
    console.error("Vote permission check error:", error);
    res.status(500).json({
      error: "Permission check failed",
      message: "Unable to verify voting permissions",
    });
    return;
  }
};

// Re-export types for backward compatibility
export type { AuthenticatedRequest } from "../types";

// Create an alias for OptionalAuthRequest
export interface OptionalAuthRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
> extends AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery> {}

export {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireModerator,
  requireOwnership,
  requireVerified,
  extractUser,
  requireForumModerator,
  requirePostPermission,
  requireVotePermission,
};

export default authenticateToken;
