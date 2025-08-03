"use client";

import { useState, use, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  Filter,
  SortAsc,
  MessageSquare,
  Eye,
  Clock,
  Pin,
  Lock,
  TrendingUp,
  Users,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { getForumCategory, getForumPostsByCategory } from "@/services/forumApi";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const CategoryPage = ({ params }: CategoryPageProps) => {
  const resolvedParams = use(params);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [filterBy, setFilterBy] = useState("all");
  const [category, setCategory] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real data from API
  useEffect(() => {
    const loadCategoryData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use the slug as category ID (assuming slug is the category ID)
        const categoryResponse = await getForumCategory(resolvedParams.slug);
        const postsResponse = await getForumPostsByCategory(
          resolvedParams.slug,
          {
            page: 1,
            limit: 20,
            sort: "desc",
            sortBy: "created_at",
          }
        );

        if (categoryResponse.success) {
          const categoryData = categoryResponse.data.category;
          // Transform API data to match component expectations
          setCategory({
            ...categoryData,
            icon: categoryData.icon || "💬",
            color: categoryData.color || "bg-blue-500",
            subscribers: 0, // Not available in API, set to 0
            threads: categoryData.post_count || 0,
            posts: categoryData.post_count || 0,
          });
        } else {
          // Fallback to mock data if category not found
          setCategory({
            id: resolvedParams.slug,
            name: "General Discussion",
            description: "General EV topics, news, and community discussions",
            icon: "💬",
            color: "bg-blue-500",
            subscribers: 0,
            threads: 0,
            posts: 0,
          });
        }

        if (postsResponse.success) {
          // Transform posts data to match component expectations
          const transformedPosts = postsResponse.data.posts.map(
            (post: any) => ({
              id: post.id,
              title: post.title,
              author:
                post.users?.username || post.users?.full_name || "Unknown User",
              authorAvatar:
                post.users?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  post.users?.username || "U"
                )}&background=random`,
              replies: post.reply_count || 0,
              views: post.view_count || 0,
              lastActivity: post.updated_at
                ? new Date(post.updated_at).toLocaleString()
                : "Unknown",
              lastActivityBy: post.users?.username || "Unknown",
              isPinned: post.is_pinned || false,
              isLocked: post.is_locked || false,
              tags: post.tags || [],
              excerpt: post.content
                ? post.content.substring(0, 150) + "..."
                : "No content available",
            })
          );
          setPosts(transformedPosts);
        } else {
          setPosts([]);
        }
      } catch (err) {
        console.error("Error loading category data:", err);
        setError("Failed to load category data");
        // Set fallback data
        setCategory({
          id: resolvedParams.slug,
          name: "General Discussion",
          description: "General EV topics, news, and community discussions",
          icon: "💬",
          color: "bg-blue-500",
          subscribers: 0,
          threads: 0,
          posts: 0,
        });
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategoryData();
  }, [resolvedParams.slug]);

  // Use real posts data instead of mock threads

  const filteredThreads = posts.filter((thread: any) => {
    const matchesSearch =
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterBy === "pinned") return thread.isPinned && matchesSearch;
    if (filterBy === "locked") return thread.isLocked && matchesSearch;
    if (filterBy === "trending") return thread.views > 2000 && matchesSearch;

    return matchesSearch;
  });

  const sortedThreads = [...filteredThreads].sort((a: any, b: any) => {
    if (sortBy === "latest") {
      // Sort pinned threads first, then by activity
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0; // In real app, sort by actual timestamp
    }
    if (sortBy === "popular") return b.views - a.views;
    if (sortBy === "replies") return b.replies - a.replies;
    return 0;
  });

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading category...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-medium mb-2">
              Error Loading Category
            </h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h3 className="text-gray-800 font-medium mb-2">
              Category Not Found
            </h3>
            <p className="text-gray-600">
              The requested category could not be found.
            </p>
            <Link
              href="/forums"
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Forums
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/forums"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forums
          </Link>
        </div>

        {/* Category Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div
                className={`w-16 h-16 ${category.color} rounded-lg flex items-center justify-center text-2xl`}
              >
                {category.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {category.name}
                </h1>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {category.subscribers.toLocaleString()} subscribers
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{category.threads.toLocaleString()} threads</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{category.posts.toLocaleString()} posts</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Subscribe
              </button>
              <Link href="/forums/new" className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Thread
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search threads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <SortAsc className="h-4 w-4 text-gray-500" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="latest">Latest Activity</option>
                      <option value="popular">Most Popular</option>
                      <option value="replies">Most Replies</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Threads</option>
                      <option value="pinned">Pinned</option>
                      <option value="locked">Locked</option>
                      <option value="trending">Trending</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Threads List */}
            <div className="space-y-4">
              {sortedThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        src={thread.authorAvatar}
                        alt={thread.author}
                        className="w-10 h-10 rounded-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        {thread.isPinned && (
                          <Pin className="h-4 w-4 text-green-600" />
                        )}
                        {thread.isLocked && (
                          <Lock className="h-4 w-4 text-gray-500" />
                        )}
                        <Link
                          href={`/forums/${thread.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600 truncate"
                        >
                          {thread.title}
                        </Link>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {thread.excerpt}
                      </p>

                      <div className="flex items-center space-x-2 mb-3">
                        {thread.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>
                            by{" "}
                            <Link
                              href={`/users/${thread.author}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {thread.author}
                            </Link>
                          </span>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{thread.replies}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{thread.views}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            Last activity {thread.lastActivity} by{" "}
                            <Link
                              href={`/users/${thread.lastActivityBy}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {thread.lastActivityBy}
                            </Link>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <button
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  disabled
                >
                  Previous
                </button>
                <button className="px-3 py-2 bg-blue-600 text-white rounded-lg">
                  1
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  2
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  3
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Category Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Category Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Threads</span>
                    <span className="font-semibold">
                      {category.threads.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Posts</span>
                    <span className="font-semibold">
                      {category.posts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subscribers</span>
                    <span className="font-semibold">
                      {category.subscribers.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Related Categories */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Related Categories
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/forums/category/bmw"
                    className="block p-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm">
                        🚙
                      </div>
                      <span className="text-gray-700">BMW</span>
                    </div>
                  </Link>
                  <Link
                    href="/forums/category/charging"
                    className="block p-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-sm">
                        ⚡
                      </div>
                      <span className="text-gray-700">Charging</span>
                    </div>
                  </Link>
                  <Link
                    href="/forums/category/technology"
                    className="block p-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-sm">
                        🔧
                      </div>
                      <span className="text-gray-700">Technology</span>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Top Contributors */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Top Contributors
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20top%20contributor&image_size=square"
                      alt="TechReviewer"
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <Link
                        href="/users/TechReviewer"
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        TechReviewer
                      </Link>
                      <p className="text-xs text-gray-500">247 posts</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20an%20EV%20expert&image_size=square"
                      alt="EVExpert"
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <Link
                        href="/users/EVExpert"
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        EVExpert
                      </Link>
                      <p className="text-xs text-gray-500">189 posts</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20charging%20expert&image_size=square"
                      alt="ChargingExpert"
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <Link
                        href="/users/ChargingExpert"
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        ChargingExpert
                      </Link>
                      <p className="text-xs text-gray-500">156 posts</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
