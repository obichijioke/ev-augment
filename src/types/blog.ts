export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author: {
    id?: string;
    name: string;
    avatar: string;
    username: string;
    bio?: string;
  };
  publishedAt: string;
  updatedAt?: string;
  readTime: number;
  category: string;
  tags: string[];
  featuredImage: string;
  views: number;
  likes: number;
  bookmarks: number;
  comments: Comment[];
  status?: "draft" | "published" | "archived";
}

export interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
    username: string;
  };
  content: string;
  publishedAt: string;
  likes: number;
  replies?: Comment[];
}
