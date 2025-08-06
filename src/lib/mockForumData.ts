// =============================================================================
// Mock Forum Data for Development
// =============================================================================

import {
  ForumCategory,
  ForumThread,
  ForumPost,
  ForumUser,
  ForumReply,
  ForumImage,
} from "@/types/forum";

// Mock Images
export const mockImages: ForumImage[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800&h=600&fit=crop",
    filename: "tesla-model-3.jpg",
    size: 245760,
    mimeType: "image/jpeg",
    alt: "Tesla Model 3 charging",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&h=600&fit=crop",
    filename: "charging-station.jpg",
    size: 189440,
    mimeType: "image/jpeg",
    alt: "EV charging station",
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop",
    filename: "road-trip.jpg",
    size: 312320,
    mimeType: "image/jpeg",
    alt: "Electric car on road trip",
  },
];

// Mock Users
export const mockUsers: ForumUser[] = [
  {
    id: "1",
    username: "evEnthusiast",
    displayName: "EV Enthusiast",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    isVerified: true,
    joinDate: "2023-01-15",
  },
  {
    id: "2",
    username: "teslaOwner2024",
    displayName: "Tesla Owner",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    isVerified: false,
    joinDate: "2024-03-20",
  },
  {
    id: "3",
    username: "chargingExpert",
    displayName: "Charging Expert",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    isVerified: true,
    joinDate: "2022-11-08",
  },
];

// Mock Categories
export const mockCategories: ForumCategory[] = [
  {
    id: "1",
    name: "General Discussion",
    description: "General EV topics and discussions",
    slug: "general",
    color: "#3B82F6",
    icon: "💬",
    threadCount: 156,
    postCount: 1247,
    lastActivity: {
      threadId: "1",
      threadTitle: "Best EV for long road trips?",
      username: "evEnthusiast",
      timestamp: "2024-01-15T10:30:00Z",
    },
  },
  {
    id: "2",
    name: "Tesla",
    description: "All things Tesla - Model S, 3, X, Y, and Cybertruck",
    slug: "tesla",
    color: "#DC2626",
    icon: "🚗",
    threadCount: 89,
    postCount: 892,
    lastActivity: {
      threadId: "2",
      threadTitle: "FSD Beta experiences",
      username: "teslaOwner2024",
      timestamp: "2024-01-15T09:15:00Z",
    },
  },
  {
    id: "3",
    name: "Charging",
    description: "Charging networks, home charging, and infrastructure",
    slug: "charging",
    color: "#059669",
    icon: "⚡",
    threadCount: 67,
    postCount: 543,
    lastActivity: {
      threadId: "3",
      threadTitle: "Home charging setup recommendations",
      username: "chargingExpert",
      timestamp: "2024-01-15T08:45:00Z",
    },
  },
  {
    id: "4",
    name: "Other EVs",
    description: "BMW, Audi, Ford, GM, and other electric vehicles",
    slug: "other-evs",
    color: "#7C3AED",
    icon: "🔋",
    threadCount: 45,
    postCount: 321,
    lastActivity: {
      threadId: "4",
      threadTitle: "BMW iX vs Mercedes EQS comparison",
      username: "evEnthusiast",
      timestamp: "2024-01-14T16:20:00Z",
    },
  },
];

// Mock Threads
export const mockThreads: ForumThread[] = [
  {
    id: "1",
    title: "Best EV for long road trips in 2024?",
    content:
      "I'm planning a cross-country road trip and looking for recommendations on the best EV for long-distance travel. Range, charging network compatibility, and comfort are my main priorities. What are your experiences?",
    author: mockUsers[0],
    category: mockCategories[0],
    isPinned: true,
    isLocked: false,
    viewCount: 1247,
    replyCount: 23,
    createdAt: "2024-01-10T14:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    lastReply: {
      id: "1",
      author: mockUsers[1],
      timestamp: "2024-01-15T10:30:00Z",
    },
  },
  {
    id: "2",
    title: "FSD Beta experiences - worth the upgrade?",
    content:
      "I've been considering upgrading to FSD Beta on my Model 3. For those who have it, what has your experience been like? Is it worth the cost?",
    author: mockUsers[1],
    category: mockCategories[1],
    isPinned: false,
    isLocked: false,
    viewCount: 892,
    replyCount: 15,
    createdAt: "2024-01-12T09:15:00Z",
    updatedAt: "2024-01-15T09:15:00Z",
    lastReply: {
      id: "2",
      author: mockUsers[2],
      timestamp: "2024-01-15T09:15:00Z",
    },
  },
  {
    id: "3",
    title: "Home charging setup recommendations",
    content:
      "Just bought my first EV and need to set up home charging. Looking for recommendations on Level 2 chargers, electrical work needed, and any tips for installation.",
    author: mockUsers[2],
    category: mockCategories[2],
    isPinned: false,
    isLocked: false,
    viewCount: 543,
    replyCount: 12,
    createdAt: "2024-01-13T08:45:00Z",
    updatedAt: "2024-01-15T08:45:00Z",
    lastReply: {
      id: "3",
      author: mockUsers[0],
      timestamp: "2024-01-15T08:45:00Z",
    },
  },
];

// Mock Replies
export const mockReplies: ForumReply[] = [
  {
    id: "1",
    content:
      "I've done several long trips in my Model S and it's been fantastic. The Supercharger network makes it really convenient, and the range is more than adequate for most routes.",
    author: mockUsers[1],
    threadId: "1",
    createdAt: "2024-01-11T10:15:00Z",
    updatedAt: "2024-01-11T10:15:00Z",
    isEdited: false,
    replies: [
      {
        id: "1-1",
        content: "How long do the charging stops typically take on long trips?",
        author: mockUsers[0],
        threadId: "1",
        parentId: "1",
        createdAt: "2024-01-11T11:30:00Z",
        updatedAt: "2024-01-11T11:30:00Z",
        isEdited: false,
      },
      {
        id: "1-2",
        content:
          "Usually 20-30 minutes for 10-80% charge. Perfect time for a meal or restroom break!",
        author: mockUsers[1],
        threadId: "1",
        parentId: "1",
        createdAt: "2024-01-11T12:45:00Z",
        updatedAt: "2024-01-11T12:45:00Z",
        isEdited: false,
      },
    ],
  },
  {
    id: "2",
    content:
      "Consider the Lucid Air Dream if budget isn't a concern. The range is incredible - over 500 miles EPA rating.",
    images: [mockImages[1]],
    author: mockUsers[2],
    threadId: "1",
    createdAt: "2024-01-12T14:20:00Z",
    updatedAt: "2024-01-12T14:20:00Z",
    isEdited: false,
  },
];

// Mock Posts (Full thread with replies)
export const mockPosts: ForumPost[] = [
  {
    id: "1",
    title: "Best EV for long road trips in 2024?",
    content:
      "I'm planning a cross-country road trip and looking for recommendations on the best EV for long-distance travel. Range, charging network compatibility, and comfort are my main priorities. What are your experiences?\n\nI've been looking at:\n- Tesla Model S\n- Lucid Air\n- BMW iX\n- Mercedes EQS\n\nAny insights would be greatly appreciated!",
    images: [mockImages[0], mockImages[2]],
    author: mockUsers[0],
    category: mockCategories[0],
    replies: mockReplies,
    isPinned: true,
    isLocked: false,
    viewCount: 1247,
    createdAt: "2024-01-10T14:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
];

// Helper functions
export const getMockCategories = (): ForumCategory[] => mockCategories;
export const getMockThreads = (categoryId?: string): ForumThread[] => {
  if (categoryId) {
    return mockThreads.filter((thread) => thread.category.id === categoryId);
  }
  return mockThreads;
};
export const getMockPost = (id: string): ForumPost | undefined => {
  return mockPosts.find((post) => post.id === id);
};
export const getMockUser = (id: string): ForumUser | undefined => {
  return mockUsers.find((user) => user.id === id);
};
