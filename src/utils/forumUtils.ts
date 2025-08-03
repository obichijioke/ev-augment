// =============================================================================
// Forum Utility Functions
// =============================================================================

import { ForumPost, ForumReply, ForumCategory, VoteType, ReportReason } from "@/types/forum";

// =============================================================================
// DATE AND TIME UTILITIES
// =============================================================================

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears === 1 ? "" : "s"} ago`;
}

export function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =============================================================================
// TEXT UTILITIES
// =============================================================================

export function truncateText(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

export function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 200);
}

export function highlightSearchTerms(text: string, searchTerm: string): string {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, "gi");
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

export function validatePostTitle(title: string): string | null {
  if (!title.trim()) {
    return "Title is required";
  }
  if (title.length < 5) {
    return "Title must be at least 5 characters long";
  }
  if (title.length > 200) {
    return "Title must be less than 200 characters";
  }
  return null;
}

export function validatePostContent(content: string): string | null {
  if (!content.trim()) {
    return "Content is required";
  }
  if (content.length < 10) {
    return "Content must be at least 10 characters long";
  }
  if (content.length > 10000) {
    return "Content must be less than 10,000 characters";
  }
  return null;
}

export function validateReplyContent(content: string): string | null {
  if (!content.trim()) {
    return "Reply content is required";
  }
  if (content.length < 1) {
    return "Reply must have content";
  }
  if (content.length > 5000) {
    return "Reply must be less than 5,000 characters";
  }
  return null;
}

// =============================================================================
// SORTING AND FILTERING UTILITIES
// =============================================================================

export function sortPosts(posts: ForumPost[], sortBy: string): ForumPost[] {
  const sortedPosts = [...posts];

  switch (sortBy) {
    case "latest":
      return sortedPosts.sort((a, b) => 
        new Date(b.last_activity_at || b.created_at).getTime() - 
        new Date(a.last_activity_at || a.created_at).getTime()
      );
    
    case "oldest":
      return sortedPosts.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    
    case "popular":
      return sortedPosts.sort((a, b) => 
        (b.like_count + b.reply_count) - (a.like_count + a.reply_count)
      );
    
    case "replies":
      return sortedPosts.sort((a, b) => b.reply_count - a.reply_count);
    
    case "views":
      return sortedPosts.sort((a, b) => b.view_count - a.view_count);
    
    case "votes":
      return sortedPosts.sort((a, b) => 
        (b.upvotes || 0) - (b.downvotes || 0) - ((a.upvotes || 0) - (a.downvotes || 0))
      );
    
    default:
      return sortedPosts;
  }
}

export function filterPostsByTimeRange(posts: ForumPost[], timeRange: string): ForumPost[] {
  if (timeRange === "all") return posts;

  const now = new Date();
  let cutoffDate: Date;

  switch (timeRange) {
    case "today":
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "year":
      cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return posts;
  }

  return posts.filter(post => new Date(post.created_at) >= cutoffDate);
}

// =============================================================================
// CATEGORY UTILITIES
// =============================================================================

export function getCategoryColor(category: ForumCategory): string {
  return category.color || "#6B7280";
}

export function getCategoryIcon(category: ForumCategory): string {
  return category.icon || "💬";
}

export function findCategoryBySlug(categories: ForumCategory[], slug: string): ForumCategory | undefined {
  return categories.find(category => category.slug === slug);
}

// =============================================================================
// POST STATUS UTILITIES
// =============================================================================

export function getPostStatusBadges(post: ForumPost): Array<{ label: string; color: string; icon: string }> {
  const badges = [];

  if (post.is_pinned) {
    badges.push({ label: "Pinned", color: "blue", icon: "📌" });
  }

  if (post.is_featured) {
    badges.push({ label: "Featured", color: "purple", icon: "⭐" });
  }

  if (post.is_locked) {
    badges.push({ label: "Locked", color: "red", icon: "🔒" });
  }

  return badges;
}

export function canUserEditPost(post: ForumPost, userId: string, userRole: string): boolean {
  // User can edit their own posts
  if (post.author_id === userId) return true;
  
  // Admins and moderators can edit any post
  if (["admin", "moderator"].includes(userRole)) return true;
  
  return false;
}

export function canUserDeletePost(post: ForumPost, userId: string, userRole: string): boolean {
  // User can delete their own posts
  if (post.author_id === userId) return true;
  
  // Admins and moderators can delete any post
  if (["admin", "moderator"].includes(userRole)) return true;
  
  return false;
}

export function canUserModeratePost(userRole: string): boolean {
  return ["admin", "moderator"].includes(userRole);
}

// =============================================================================
// VOTE UTILITIES
// =============================================================================

export function calculateVoteScore(upvotes: number = 0, downvotes: number = 0): number {
  return upvotes - downvotes;
}

export function getVotePercentage(upvotes: number = 0, downvotes: number = 0): number {
  const total = upvotes + downvotes;
  if (total === 0) return 0;
  return Math.round((upvotes / total) * 100);
}

export function getVoteColor(voteType: VoteType | null): string {
  switch (voteType) {
    case "upvote":
      return "text-green-600 dark:text-green-400";
    case "downvote":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
}

// =============================================================================
// REPORT UTILITIES
// =============================================================================

export function getReportReasons(): Array<{ value: ReportReason; label: string }> {
  return [
    { value: "spam", label: "Spam or unwanted content" },
    { value: "harassment", label: "Harassment or bullying" },
    { value: "inappropriate", label: "Inappropriate content" },
    { value: "off-topic", label: "Off-topic or irrelevant" },
    { value: "misinformation", label: "Misinformation or false claims" },
    { value: "other", label: "Other (please specify)" },
  ];
}

export function getReportStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "yellow";
    case "reviewed":
      return "blue";
    case "resolved":
      return "green";
    case "dismissed":
      return "gray";
    default:
      return "gray";
  }
}

// =============================================================================
// URL UTILITIES
// =============================================================================

export function getPostUrl(post: ForumPost): string {
  return `/forums/${post.category_id}/${post.id}/${post.slug}`;
}

export function getCategoryUrl(category: ForumCategory): string {
  return `/forums/${category.slug}`;
}

export function getUserPostsUrl(userId: string, username: string): string {
  return `/users/${username}/posts`;
}

// =============================================================================
// SEARCH UTILITIES
// =============================================================================

export function buildSearchQuery(
  searchTerm: string,
  categoryId?: string,
  tags?: string[]
): string {
  const params = new URLSearchParams();
  
  if (searchTerm) params.append("q", searchTerm);
  if (categoryId) params.append("category_id", categoryId);
  if (tags && tags.length > 0) {
    tags.forEach(tag => params.append("tags", tag));
  }
  
  return params.toString();
}

export function parseSearchQuery(queryString: string): {
  searchTerm: string;
  categoryId?: string;
  tags: string[];
} {
  const params = new URLSearchParams(queryString);
  
  return {
    searchTerm: params.get("q") || "",
    categoryId: params.get("category_id") || undefined,
    tags: params.getAll("tags"),
  };
}
