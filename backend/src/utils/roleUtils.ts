import { supabaseAdmin } from "../services/supabaseClient";

// User role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  banned: 0,
  user: 1,
  verified: 2,
  moderator: 3,
  admin: 4,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

// Forum-specific permissions
export const FORUM_PERMISSIONS = {
  // Basic permissions
  VIEW_POSTS: "view_posts",
  CREATE_POSTS: "create_posts",
  EDIT_OWN_POSTS: "edit_own_posts",
  DELETE_OWN_POSTS: "delete_own_posts",
  VOTE: "vote",
  REPORT: "report",
  
  // Moderation permissions
  MODERATE_POSTS: "moderate_posts",
  MODERATE_REPLIES: "moderate_replies",
  PIN_POSTS: "pin_posts",
  LOCK_POSTS: "lock_posts",
  FEATURE_POSTS: "feature_posts",
  DELETE_ANY_POSTS: "delete_any_posts",
  EDIT_ANY_POSTS: "edit_any_posts",
  
  // Admin permissions
  MANAGE_CATEGORIES: "manage_categories",
  MANAGE_USERS: "manage_users",
  VIEW_REPORTS: "view_reports",
  MANAGE_REPORTS: "manage_reports",
  BAN_USERS: "ban_users",
} as const;

export type ForumPermission = typeof FORUM_PERMISSIONS[keyof typeof FORUM_PERMISSIONS];

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, ForumPermission[]> = {
  banned: [],
  user: [
    FORUM_PERMISSIONS.VIEW_POSTS,
    FORUM_PERMISSIONS.CREATE_POSTS,
    FORUM_PERMISSIONS.EDIT_OWN_POSTS,
    FORUM_PERMISSIONS.DELETE_OWN_POSTS,
    FORUM_PERMISSIONS.VOTE,
    FORUM_PERMISSIONS.REPORT,
  ],
  verified: [
    FORUM_PERMISSIONS.VIEW_POSTS,
    FORUM_PERMISSIONS.CREATE_POSTS,
    FORUM_PERMISSIONS.EDIT_OWN_POSTS,
    FORUM_PERMISSIONS.DELETE_OWN_POSTS,
    FORUM_PERMISSIONS.VOTE,
    FORUM_PERMISSIONS.REPORT,
  ],
  moderator: [
    FORUM_PERMISSIONS.VIEW_POSTS,
    FORUM_PERMISSIONS.CREATE_POSTS,
    FORUM_PERMISSIONS.EDIT_OWN_POSTS,
    FORUM_PERMISSIONS.DELETE_OWN_POSTS,
    FORUM_PERMISSIONS.VOTE,
    FORUM_PERMISSIONS.REPORT,
    FORUM_PERMISSIONS.MODERATE_POSTS,
    FORUM_PERMISSIONS.MODERATE_REPLIES,
    FORUM_PERMISSIONS.PIN_POSTS,
    FORUM_PERMISSIONS.LOCK_POSTS,
    FORUM_PERMISSIONS.FEATURE_POSTS,
    FORUM_PERMISSIONS.DELETE_ANY_POSTS,
    FORUM_PERMISSIONS.EDIT_ANY_POSTS,
    FORUM_PERMISSIONS.VIEW_REPORTS,
    FORUM_PERMISSIONS.MANAGE_REPORTS,
  ],
  admin: Object.values(FORUM_PERMISSIONS),
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userRole: string | undefined,
  userPermissions: string[] | undefined,
  requiredPermission: ForumPermission
): boolean {
  // Check role-based permissions
  if (userRole && userRole in DEFAULT_ROLE_PERMISSIONS) {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[userRole as UserRole];
    if (rolePermissions.includes(requiredPermission)) {
      return true;
    }
  }

  // Check custom permissions
  if (userPermissions && userPermissions.includes(requiredPermission)) {
    return true;
  }

  return false;
}

/**
 * Check if a user has a role with sufficient hierarchy level
 */
export function hasRoleLevel(userRole: string | undefined, minimumRole: UserRole): boolean {
  if (!userRole || !(userRole in ROLE_HIERARCHY)) {
    return false;
  }

  const userLevel = ROLE_HIERARCHY[userRole as UserRole];
  const requiredLevel = ROLE_HIERARCHY[minimumRole];

  return userLevel >= requiredLevel;
}

/**
 * Get user's effective permissions (role + custom permissions)
 */
export function getEffectivePermissions(
  userRole: string | undefined,
  userPermissions: string[] = []
): ForumPermission[] {
  const rolePermissions = userRole && userRole in DEFAULT_ROLE_PERMISSIONS
    ? DEFAULT_ROLE_PERMISSIONS[userRole as UserRole]
    : [];

  const customPermissions = userPermissions.filter(p => 
    Object.values(FORUM_PERMISSIONS).includes(p as ForumPermission)
  ) as ForumPermission[];

  // Combine and deduplicate
  return Array.from(new Set([...rolePermissions, ...customPermissions]));
}

/**
 * Check if user can moderate content
 */
export function canModerate(userRole: string | undefined, userPermissions: string[] = []): boolean {
  return hasPermission(userRole, userPermissions, FORUM_PERMISSIONS.MODERATE_POSTS) ||
         hasPermission(userRole, userPermissions, FORUM_PERMISSIONS.MODERATE_REPLIES);
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: string | undefined): boolean {
  return userRole === "admin";
}

/**
 * Check if user is moderator or admin
 */
export function isModerator(userRole: string | undefined): boolean {
  return userRole === "moderator" || userRole === "admin";
}

/**
 * Get user role and permissions from database
 */
export async function getUserRoleAndPermissions(userId: string): Promise<{
  role: string | null;
  permissions: string[];
  isBanned: boolean;
  banExpiresAt: string | null;
}> {
  try {
    const { data: userProfile, error } = await supabaseAdmin
      .from("user_profiles")
      .select("role, permissions, is_banned, ban_expires_at")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user role:", error);
      return {
        role: "user",
        permissions: [],
        isBanned: false,
        banExpiresAt: null,
      };
    }

    return {
      role: userProfile?.role || "user",
      permissions: userProfile?.permissions || [],
      isBanned: userProfile?.is_banned || false,
      banExpiresAt: userProfile?.ban_expires_at || null,
    };
  } catch (error) {
    console.error("Error in getUserRoleAndPermissions:", error);
    return {
      role: "user",
      permissions: [],
      isBanned: false,
      banExpiresAt: null,
    };
  }
}

/**
 * Check if user's ban has expired
 */
export function isBanExpired(banExpiresAt: string | null): boolean {
  if (!banExpiresAt) return false;
  return new Date(banExpiresAt) < new Date();
}

/**
 * Validate role assignment (prevent privilege escalation)
 */
export function canAssignRole(
  assignerRole: string | undefined,
  targetRole: UserRole
): boolean {
  if (!assignerRole || !(assignerRole in ROLE_HIERARCHY)) {
    return false;
  }

  const assignerLevel = ROLE_HIERARCHY[assignerRole as UserRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];

  // Can only assign roles at or below your level
  // Admins can assign any role except admin (to prevent accidental lockout)
  if (assignerRole === "admin") {
    return targetRole !== "admin";
  }

  return assignerLevel > targetLevel;
}
