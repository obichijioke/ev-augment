// =============================================================================
// Forum Store - Zustand State Management
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ForumPost,
  ForumReply,
  ForumCategory,
  ForumPostsFilter,
  ForumViewMode,
  ForumSortOption,
  ForumUIState,
} from "@/types/forum";

// =============================================================================
// STORE INTERFACES
// =============================================================================

interface ForumState {
  // UI State
  selectedCategory: string | null;
  searchQuery: string;
  currentFilter: ForumPostsFilter;
  viewMode: ForumViewMode;
  sortBy: ForumSortOption;
  
  // Data Cache
  categories: ForumCategory[];
  posts: ForumPost[];
  currentPost: ForumPost | null;
  currentReplies: ForumReply[];
  
  // Loading States
  isLoadingPosts: boolean;
  isLoadingPost: boolean;
  isLoadingCategories: boolean;
  
  // Error States
  postsError: string | null;
  postError: string | null;
  categoriesError: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  
  // User Preferences
  preferences: {
    defaultSortBy: ForumSortOption;
    defaultViewMode: ForumViewMode;
    postsPerPage: number;
    autoRefresh: boolean;
    showPinned: boolean;
    showLocked: boolean;
  };
}

interface ForumActions {
  // UI Actions
  setSelectedCategory: (categoryId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setCurrentFilter: (filter: Partial<ForumPostsFilter>) => void;
  setViewMode: (mode: ForumViewMode) => void;
  setSortBy: (sortBy: ForumSortOption) => void;
  clearFilters: () => void;
  
  // Data Actions
  setCategories: (categories: ForumCategory[]) => void;
  setPosts: (posts: ForumPost[]) => void;
  addPosts: (posts: ForumPost[]) => void;
  updatePost: (postId: string, updates: Partial<ForumPost>) => void;
  removePost: (postId: string) => void;
  setCurrentPost: (post: ForumPost | null) => void;
  setCurrentReplies: (replies: ForumReply[]) => void;
  addReply: (reply: ForumReply) => void;
  updateReply: (replyId: string, updates: Partial<ForumReply>) => void;
  removeReply: (replyId: string) => void;
  
  // Loading Actions
  setLoadingPosts: (loading: boolean) => void;
  setLoadingPost: (loading: boolean) => void;
  setLoadingCategories: (loading: boolean) => void;
  
  // Error Actions
  setPostsError: (error: string | null) => void;
  setPostError: (error: string | null) => void;
  setCategoriesError: (error: string | null) => void;
  clearErrors: () => void;
  
  // Pagination Actions
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  setHasMore: (hasMore: boolean) => void;
  
  // Preference Actions
  updatePreferences: (preferences: Partial<ForumState["preferences"]>) => void;
  resetPreferences: () => void;
  
  // Utility Actions
  reset: () => void;
  getPostById: (postId: string) => ForumPost | undefined;
  getCategoryById: (categoryId: string) => ForumCategory | undefined;
  getFilteredPosts: () => ForumPost[];
}

type ForumStore = ForumState & ForumActions;

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const defaultFilter: ForumPostsFilter = {
  category: undefined,
  author: undefined,
  tags: [],
  timeRange: "all",
  sortBy: "latest",
  showPinned: true,
  showLocked: true,
  showFeatured: true,
};

const defaultPreferences: ForumState["preferences"] = {
  defaultSortBy: "latest",
  defaultViewMode: "list",
  postsPerPage: 20,
  autoRefresh: false,
  showPinned: true,
  showLocked: true,
};

const initialState: ForumState = {
  // UI State
  selectedCategory: null,
  searchQuery: "",
  currentFilter: defaultFilter,
  viewMode: "list",
  sortBy: "latest",
  
  // Data Cache
  categories: [],
  posts: [],
  currentPost: null,
  currentReplies: [],
  
  // Loading States
  isLoadingPosts: false,
  isLoadingPost: false,
  isLoadingCategories: false,
  
  // Error States
  postsError: null,
  postError: null,
  categoriesError: null,
  
  // Pagination
  currentPage: 1,
  totalPages: 1,
  hasMore: false,
  
  // User Preferences
  preferences: defaultPreferences,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useForumStore = create<ForumStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // UI Actions
      setSelectedCategory: (categoryId) =>
        set({ selectedCategory: categoryId, currentPage: 1 }),
      
      setSearchQuery: (query) =>
        set({ searchQuery: query, currentPage: 1 }),
      
      setCurrentFilter: (filter) =>
        set((state) => ({
          currentFilter: { ...state.currentFilter, ...filter },
          currentPage: 1,
        })),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      
      setSortBy: (sortBy) => set({ sortBy, currentPage: 1 }),
      
      clearFilters: () =>
        set({
          selectedCategory: null,
          searchQuery: "",
          currentFilter: defaultFilter,
          currentPage: 1,
        }),

      // Data Actions
      setCategories: (categories) => set({ categories }),
      
      setPosts: (posts) => set({ posts, currentPage: 1 }),
      
      addPosts: (newPosts) =>
        set((state) => ({
          posts: [...state.posts, ...newPosts],
        })),
      
      updatePost: (postId, updates) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId ? { ...post, ...updates } : post
          ),
          currentPost:
            state.currentPost?.id === postId
              ? { ...state.currentPost, ...updates }
              : state.currentPost,
        })),
      
      removePost: (postId) =>
        set((state) => ({
          posts: state.posts.filter((post) => post.id !== postId),
          currentPost:
            state.currentPost?.id === postId ? null : state.currentPost,
        })),
      
      setCurrentPost: (post) => set({ currentPost: post }),
      
      setCurrentReplies: (replies) => set({ currentReplies: replies }),
      
      addReply: (reply) =>
        set((state) => ({
          currentReplies: [...state.currentReplies, reply],
          currentPost: state.currentPost
            ? {
                ...state.currentPost,
                reply_count: state.currentPost.reply_count + 1,
              }
            : null,
        })),
      
      updateReply: (replyId, updates) =>
        set((state) => ({
          currentReplies: state.currentReplies.map((reply) =>
            reply.id === replyId ? { ...reply, ...updates } : reply
          ),
        })),
      
      removeReply: (replyId) =>
        set((state) => ({
          currentReplies: state.currentReplies.filter(
            (reply) => reply.id !== replyId
          ),
          currentPost: state.currentPost
            ? {
                ...state.currentPost,
                reply_count: Math.max(0, state.currentPost.reply_count - 1),
              }
            : null,
        })),

      // Loading Actions
      setLoadingPosts: (loading) => set({ isLoadingPosts: loading }),
      setLoadingPost: (loading) => set({ isLoadingPost: loading }),
      setLoadingCategories: (loading) => set({ isLoadingCategories: loading }),

      // Error Actions
      setPostsError: (error) => set({ postsError: error }),
      setPostError: (error) => set({ postError: error }),
      setCategoriesError: (error) => set({ categoriesError: error }),
      clearErrors: () =>
        set({
          postsError: null,
          postError: null,
          categoriesError: null,
        }),

      // Pagination Actions
      setCurrentPage: (page) => set({ currentPage: page }),
      setTotalPages: (pages) => set({ totalPages: pages }),
      setHasMore: (hasMore) => set({ hasMore }),

      // Preference Actions
      updatePreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),
      
      resetPreferences: () => set({ preferences: defaultPreferences }),

      // Utility Actions
      reset: () => set(initialState),
      
      getPostById: (postId) => {
        const state = get();
        return state.posts.find((post) => post.id === postId);
      },
      
      getCategoryById: (categoryId) => {
        const state = get();
        return state.categories.find((category) => category.id === categoryId);
      },
      
      getFilteredPosts: () => {
        const state = get();
        let filteredPosts = [...state.posts];

        // Apply category filter
        if (state.selectedCategory) {
          filteredPosts = filteredPosts.filter(
            (post) => post.category_id === state.selectedCategory
          );
        }

        // Apply search filter
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filteredPosts = filteredPosts.filter(
            (post) =>
              post.title.toLowerCase().includes(query) ||
              post.content.toLowerCase().includes(query)
          );
        }

        // Apply additional filters
        const { currentFilter } = state;
        
        if (currentFilter.author) {
          filteredPosts = filteredPosts.filter(
            (post) => post.users?.username === currentFilter.author
          );
        }

        if (currentFilter.tags && currentFilter.tags.length > 0) {
          filteredPosts = filteredPosts.filter((post) =>
            currentFilter.tags!.some((tag) => post.tags?.includes(tag))
          );
        }

        if (!currentFilter.showPinned) {
          filteredPosts = filteredPosts.filter((post) => !post.is_pinned);
        }

        if (!currentFilter.showLocked) {
          filteredPosts = filteredPosts.filter((post) => !post.is_locked);
        }

        if (!currentFilter.showFeatured) {
          filteredPosts = filteredPosts.filter((post) => !post.is_featured);
        }

        // Apply time range filter
        if (currentFilter.timeRange && currentFilter.timeRange !== "all") {
          const now = new Date();
          let cutoffDate: Date;

          switch (currentFilter.timeRange) {
            case "day":
              cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
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
              cutoffDate = new Date(0);
          }

          filteredPosts = filteredPosts.filter(
            (post) => new Date(post.created_at) >= cutoffDate
          );
        }

        return filteredPosts;
      },
    }),
    {
      name: "forum-storage",
      partialize: (state) => ({
        selectedCategory: state.selectedCategory,
        currentFilter: state.currentFilter,
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        preferences: state.preferences,
      }),
    }
  )
);

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

export const useForumCategories = () => useForumStore((state) => state.categories);
export const useForumPosts = () => useForumStore((state) => state.posts);
export const useCurrentForumPost = () => useForumStore((state) => state.currentPost);
export const useCurrentReplies = () => useForumStore((state) => state.currentReplies);
export const useForumUIState = () => useForumStore((state) => ({
  selectedCategory: state.selectedCategory,
  searchQuery: state.searchQuery,
  currentFilter: state.currentFilter,
  viewMode: state.viewMode,
  sortBy: state.sortBy,
}));
export const useForumLoadingState = () => useForumStore((state) => ({
  isLoadingPosts: state.isLoadingPosts,
  isLoadingPost: state.isLoadingPost,
  isLoadingCategories: state.isLoadingCategories,
}));
export const useForumErrors = () => useForumStore((state) => ({
  postsError: state.postsError,
  postError: state.postError,
  categoriesError: state.categoriesError,
}));
export const useForumPreferences = () => useForumStore((state) => state.preferences);
