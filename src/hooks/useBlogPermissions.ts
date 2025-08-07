"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useUserRole } from "./useUserRole";
import { BlogPost } from "../types/blog";
import { blogPostsApi } from "../services/blogApi";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface BlogPermissions {
  // Creation permissions
  canCreateBlog: boolean;

  // Viewing permissions
  canViewDrafts: boolean;
  canViewAllDrafts: boolean;
  canViewOwnDrafts: boolean;

  // Editing permissions
  canEditAnyBlog: boolean;
  canEditOwnBlog: boolean;
  canEditBlog: (post: BlogPost) => boolean;

  // Management permissions
  canDeleteAnyBlog: boolean;
  canDeleteOwnBlog: boolean;
  canDeleteBlog: (post: BlogPost) => boolean;
  canPublishBlog: boolean;
  canUnpublishBlog: boolean;

  // Moderation permissions
  canModerateBlog: boolean;
  canManageComments: boolean;

  // Access control
  canAccessBlogCreate: boolean;
  canAccessBlogEdit: (postId?: string, authorId?: string) => boolean;
  canAccessDraftManagement: boolean;
}

export interface UseBlogPermissionsReturn extends BlogPermissions {
  isLoading: boolean;
  error: string | null;
  userRole: string | null;
  userId: string | null;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export const useBlogPermissions = (): UseBlogPermissionsReturn => {
  const { user, isAuthenticated } = useAuthStore();
  const {
    role,
    isAdmin,
    isModerator,
    isModeratorOrAdmin,
    isRegularUser,
    isLoading,
    error,
  } = useUserRole();

  const userId = user?.id || null;
  const [hasAuthoredPosts, setHasAuthoredPosts] = useState(false);
  const [isCheckingPosts, setIsCheckingPosts] = useState(false);

  // Check if user has authored any posts (for regular users)
  useEffect(() => {
    const checkUserPosts = async () => {
      if (!isAuthenticated || !userId || !isRegularUser) {
        setHasAuthoredPosts(false);
        return;
      }

      try {
        setIsCheckingPosts(true);
        const response = await blogPostsApi.getPosts({
          page: 1,
          limit: 1,
          author_id: userId,
        });
        setHasAuthoredPosts(response.data.posts.length > 0);
      } catch (err) {
        console.error("Failed to check user posts:", err);
        setHasAuthoredPosts(false);
      } finally {
        setIsCheckingPosts(false);
      }
    };

    checkUserPosts();
  }, [isAuthenticated, userId, isRegularUser]);

  // Calculate permissions based on role
  const permissions = useMemo((): BlogPermissions => {
    // If not authenticated, no permissions
    if (!isAuthenticated || !user) {
      return {
        canCreateBlog: false,
        canViewDrafts: false,
        canViewAllDrafts: false,
        canViewOwnDrafts: false,
        canEditAnyBlog: false,
        canEditOwnBlog: false,
        canEditBlog: () => false,
        canDeleteAnyBlog: false,
        canDeleteOwnBlog: false,
        canDeleteBlog: () => false,
        canPublishBlog: false,
        canUnpublishBlog: false,
        canModerateBlog: false,
        canManageComments: false,
        canAccessBlogCreate: false,
        canAccessBlogEdit: () => false,
        canAccessDraftManagement: false,
      };
    }

    // Admin permissions (full access)
    if (isAdmin) {
      return {
        canCreateBlog: true,
        canViewDrafts: true,
        canViewAllDrafts: true,
        canViewOwnDrafts: true,
        canEditAnyBlog: true,
        canEditOwnBlog: true,
        canEditBlog: () => true,
        canDeleteAnyBlog: true,
        canDeleteOwnBlog: true,
        canDeleteBlog: () => true,
        canPublishBlog: true,
        canUnpublishBlog: true,
        canModerateBlog: true,
        canManageComments: true,
        canAccessBlogCreate: true,
        canAccessBlogEdit: () => true,
        canAccessDraftManagement: true,
      };
    }

    // Moderator permissions (full blog management)
    if (isModerator) {
      return {
        canCreateBlog: true,
        canViewDrafts: true,
        canViewAllDrafts: true,
        canViewOwnDrafts: true,
        canEditAnyBlog: true,
        canEditOwnBlog: true,
        canEditBlog: () => true,
        canDeleteAnyBlog: true,
        canDeleteOwnBlog: true,
        canDeleteBlog: () => true,
        canPublishBlog: true,
        canUnpublishBlog: true,
        canModerateBlog: true,
        canManageComments: true,
        canAccessBlogCreate: true,
        canAccessBlogEdit: () => true,
        canAccessDraftManagement: true,
      };
    }

    // Regular user permissions (limited to own content)
    return {
      canCreateBlog: false, // Only moderators/admins can create
      canViewDrafts: hasAuthoredPosts, // Can view drafts only if they have authored posts
      canViewAllDrafts: false,
      canViewOwnDrafts: hasAuthoredPosts, // Can view own drafts only if they have authored posts
      canEditAnyBlog: false,
      canEditOwnBlog: true,
      canEditBlog: (post: BlogPost) => post.authorId === userId,
      canDeleteAnyBlog: false,
      canDeleteOwnBlog: true,
      canDeleteBlog: (post: BlogPost) => post.authorId === userId,
      canPublishBlog: false, // Only moderators can publish
      canUnpublishBlog: false,
      canModerateBlog: false,
      canManageComments: false,
      canAccessBlogCreate: false,
      canAccessBlogEdit: (postId?: string, authorId?: string) => {
        // Can access if it's their own post
        return authorId === userId;
      },
      canAccessDraftManagement: hasAuthoredPosts, // Can access draft management only if they have authored posts
    };
  }, [
    isAuthenticated,
    user,
    isAdmin,
    isModerator,
    isModeratorOrAdmin,
    isRegularUser,
    userId,
    hasAuthoredPosts,
  ]);

  return {
    ...permissions,
    isLoading: isLoading || isCheckingPosts,
    error,
    userRole: role,
    userId,
  };
};

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/**
 * Hook to check if user can create blog posts
 */
export const useCanCreateBlog = (): boolean => {
  const { canCreateBlog } = useBlogPermissions();
  return canCreateBlog;
};

/**
 * Hook to check if user can edit a specific blog post
 */
export const useCanEditBlog = (post?: BlogPost): boolean => {
  const { canEditBlog } = useBlogPermissions();
  return post ? canEditBlog(post) : false;
};

/**
 * Hook to check if user can view drafts
 */
export const useCanViewDrafts = (): boolean => {
  const { canViewDrafts } = useBlogPermissions();
  return canViewDrafts;
};

/**
 * Hook to check if user can access blog creation page
 */
export const useCanAccessBlogCreate = (): boolean => {
  const { canAccessBlogCreate } = useBlogPermissions();
  return canAccessBlogCreate;
};

/**
 * Hook to check if user can access blog edit page
 */
export const useCanAccessBlogEdit = (
  postId?: string,
  authorId?: string
): boolean => {
  const { canAccessBlogEdit } = useBlogPermissions();
  return canAccessBlogEdit(postId, authorId);
};

/**
 * Hook to check if user can access draft management
 */
export const useCanAccessDraftManagement = (): boolean => {
  const { canAccessDraftManagement } = useBlogPermissions();
  return canAccessDraftManagement;
};

/**
 * Hook to check if user can moderate blogs
 */
export const useCanModerateBlog = (): boolean => {
  const { canModerateBlog } = useBlogPermissions();
  return canModerateBlog;
};

export default useBlogPermissions;
