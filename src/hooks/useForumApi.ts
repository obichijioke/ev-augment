// React hooks for forum API operations
import { useState, useEffect, useCallback } from "react";
import { forumApi } from "@/services/forumApi";
import {
  ForumCategory,
  ForumThread,
  ForumReply,
  ForumImage,
  CreateThreadRequest,
  CreateReplyRequest,
} from "@/types/forum";

// =============================================================================
// CATEGORIES HOOKS
// =============================================================================

export const useForumCategories = () => {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await forumApi.categories.getAll();
      setCategories(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch categories"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = useCallback(
    async (categoryData: {
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      slug: string;
      sort_order?: number;
    }) => {
      try {
        const newCategory = await forumApi.categories.create(categoryData);
        setCategories((prev) => [...prev, newCategory]);
        return newCategory;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "Failed to create category"
        );
      }
    },
    []
  );

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    createCategory,
  };
};

// =============================================================================
// THREADS HOOKS
// =============================================================================

export const useForumThreads = (params?: {
  q?: string;
  category_id?: string;
  author_id?: string;
  sort?: "newest" | "oldest" | "most_replies" | "most_views";
  page?: number;
  limit?: number;
}) => {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    // Don't fetch if no category_id provided
    if (!params?.category_id) {
      setLoading(false);
      setThreads([]);
      setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await forumApi.threads.getAll(params);
      setThreads(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch threads");
    } finally {
      setLoading(false);
    }
  }, [
    params?.category_id,
    params?.q,
    params?.author_id,
    params?.sort,
    params?.page,
    params?.limit,
  ]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const createThread = useCallback(async (threadData: CreateThreadRequest) => {
    try {
      const newThread = await forumApi.threads.create(threadData);
      setThreads((prev) => [newThread, ...prev]);
      return newThread;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to create thread"
      );
    }
  }, []);

  const updateThread = useCallback(
    async (
      id: string,
      threadData: Partial<{
        title: string;
        content: string;
        is_pinned: boolean;
        is_locked: boolean;
      }>
    ) => {
      try {
        const updatedThread = await forumApi.threads.update(id, threadData);
        setThreads((prev) =>
          prev.map((thread) => (thread.id === id ? updatedThread : thread))
        );
        return updatedThread;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "Failed to update thread"
        );
      }
    },
    []
  );

  const deleteThread = useCallback(async (id: string) => {
    try {
      await forumApi.threads.delete(id);
      setThreads((prev) => prev.filter((thread) => thread.id !== id));
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to delete thread"
      );
    }
  }, []);

  return {
    threads,
    pagination,
    loading,
    error,
    refetch: fetchThreads,
    createThread,
    updateThread,
    deleteThread,
  };
};

// =============================================================================
// SINGLE THREAD HOOK
// =============================================================================

export const useForumThread = (threadId: string | null) => {
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThread = useCallback(async () => {
    if (!threadId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await forumApi.threads.getById(threadId);
      setThread(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch thread");
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  const updateThread = useCallback(
    async (
      threadData: Partial<{
        title: string;
        content: string;
        is_pinned: boolean;
        is_locked: boolean;
      }>
    ) => {
      if (!threadId) return;

      try {
        const updatedThread = await forumApi.threads.update(
          threadId,
          threadData
        );
        setThread(updatedThread);
        return updatedThread;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "Failed to update thread"
        );
      }
    },
    [threadId]
  );

  return {
    thread,
    loading,
    error,
    refetch: fetchThread,
    updateThread,
  };
};

// =============================================================================
// REPLIES HOOKS
// =============================================================================

export const useForumReplies = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReply = useCallback(async (replyData: CreateReplyRequest) => {
    try {
      setLoading(true);
      setError(null);
      const newReply = await forumApi.replies.create(replyData);
      return newReply;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create reply");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReply = useCallback(async (id: string, content: string) => {
    try {
      setLoading(true);
      setError(null);
      const updatedReply = await forumApi.replies.update(id, { content });
      return updatedReply;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update reply");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReply = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await forumApi.replies.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete reply");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createReply,
    updateReply,
    deleteReply,
  };
};

// =============================================================================
// IMAGES HOOKS
// =============================================================================

export const useForumImages = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(
    async (
      file: File,
      threadId?: string,
      replyId?: string,
      altText?: string
    ) => {
      try {
        setLoading(true);
        setError(null);
        const image = await forumApi.images.upload(
          file,
          threadId,
          replyId,
          altText
        );
        return image;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload image");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteImage = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await forumApi.images.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    uploadImage,
    deleteImage,
  };
};

// =============================================================================
// MODERATION HOOKS
// =============================================================================

export const useForumModeration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moderateThread = useCallback(
    async (
      threadId: string,
      action: "pin" | "unpin" | "lock" | "unlock" | "delete" | "restore",
      reason?: string
    ) => {
      try {
        setLoading(true);
        setError(null);
        const result = await forumApi.moderation.moderateThread(
          threadId,
          action,
          reason
        );
        return result;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to moderate thread"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const moderateReply = useCallback(
    async (replyId: string, action: "delete" | "restore", reason?: string) => {
      try {
        setLoading(true);
        setError(null);
        const result = await forumApi.moderation.moderateReply(
          replyId,
          action,
          reason
        );
        return result;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to moderate reply"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateUserRole = useCallback(
    async (userId: string, forumRole: "user" | "moderator" | "admin") => {
      try {
        setLoading(true);
        setError(null);
        const result = await forumApi.moderation.updateUserRole(
          userId,
          forumRole
        );
        return result;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update user role"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    moderateThread,
    moderateReply,
    updateUserRole,
  };
};
