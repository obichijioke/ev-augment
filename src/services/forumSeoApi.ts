/**
 * Server-side API functions for forum SEO
 * These functions are used for server-side rendering and metadata generation
 */

import { ForumThread, ForumCategory } from "@/types/forum";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

// Server-side fetch function with error handling
async function serverFetch(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      // Disable caching for development, enable for production
      cache: process.env.NODE_ENV === "production" ? "force-cache" : "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server fetch error response:", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Server fetch error:", error);
    throw error;
  }
}

/**
 * Get forum thread by category slug and thread slug
 */
export async function getForumThread(
  categorySlug: string,
  threadSlug: string
): Promise<ForumThread | null> {
  try {
    // First get the category to find its ID
    const category = await getForumCategory(categorySlug);
    if (!category) {
      return null;
    }

    // Get threads for this category and find by slug
    const response = await serverFetch(
      `${API_BASE_URL}/forum/threads?category_id=${category.id}&limit=100`
    );

    if (!response.success || !response.data) {
      return null;
    }

    // Find thread by slug

    const thread = response.data.find(
      (t: ForumThread) => t.slug === threadSlug
    );

    if (!thread) {
      return null;
    }

    // Get full thread details with replies
    const threadResponse = await serverFetch(
      `${API_BASE_URL}/forum/threads/${thread.id}`
    );

    if (!threadResponse.success || !threadResponse.data) {
      return null;
    }

    const fullThread = threadResponse.data;

    const finalThread = {
      ...fullThread,
      category, // Ensure category is always attached
      replies: fullThread.replies || [],
      slug: fullThread.slug || thread.slug || threadSlug, // Ensure slug is available with fallbacks
    };

    return finalThread;
  } catch (error) {
    console.error("Error fetching forum thread:", error);
    return null;
  }
}

/**
 * Get forum category by slug
 */
export async function getForumCategory(
  slug: string
): Promise<ForumCategory | null> {
  try {
    const response = await serverFetch(`${API_BASE_URL}/forum/categories`);

    if (!response.success || !response.data) {
      return null;
    }

    return (
      response.data.find((category: ForumCategory) => category.slug === slug) ||
      null
    );
  } catch (error) {
    console.error("Error fetching forum category:", error);
    return null;
  }
}

/**
 * Get all forum categories for sitemap generation
 */
export async function getAllForumCategories(): Promise<ForumCategory[]> {
  try {
    const response = await serverFetch(`${API_BASE_URL}/forum/categories`);

    if (!response.success || !response.data) {
      return [];
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching all forum categories:", error);
    return [];
  }
}

/**
 * Get all forum threads for sitemap generation
 */
export async function getAllForumThreads(): Promise<ForumThread[]> {
  try {
    const categories = await getAllForumCategories();
    const allThreads: ForumThread[] = [];

    // Get threads for each category
    for (const category of categories) {
      try {
        const response = await serverFetch(
          `${API_BASE_URL}/forum/threads?category_id=${category.id}&limit=100`
        );

        if (response.success && response.data) {
          const threadsWithCategory = response.data.map(
            (thread: ForumThread) => ({
              ...thread,
              category,
            })
          );
          allThreads.push(...threadsWithCategory);
        }
      } catch (error) {
        console.error(
          `Error fetching threads for category ${category.slug}:`,
          error
        );
      }
    }

    return allThreads;
  } catch (error) {
    console.error("Error fetching all forum threads:", error);
    return [];
  }
}

/**
 * Get forum thread by ID (for backward compatibility)
 */
export async function getForumThreadById(
  id: string
): Promise<ForumThread | null> {
  try {
    const response = await serverFetch(`${API_BASE_URL}/forum/threads/${id}`);

    if (!response.success || !response.data) {
      return null;
    }

    const thread = response.data;

    // Try to get the category if we have a category_id
    let category = null;
    if (thread.category_id) {
      try {
        const categories = await getAllForumCategories();
        category = categories.find((cat) => cat.id === thread.category_id);
      } catch (error) {
        console.error("Error fetching category for thread:", error);
      }
    }

    return {
      ...thread,
      category,
      replies: thread.replies || [],
      slug: thread.slug || `thread-${id}`, // Ensure slug is available with fallback
    };
  } catch (error) {
    console.error("Error fetching forum thread by ID:", error);
    return null;
  }
}
