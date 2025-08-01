"use client";

import { useState, use } from "react";
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

  // Mock category data - in real app, fetch based on resolvedParams.slug
  const categoryData = {
    tesla: {
      name: "Tesla",
      description:
        "Discussions about Tesla vehicles, software updates, and experiences",
      icon: "🚗",
      color: "bg-red-500",
      subscribers: 15420,
      threads: 2847,
      posts: 18392,
    },
    charging: {
      name: "Charging Infrastructure",
      description:
        "Everything about EV charging stations, home charging, and infrastructure",
      icon: "⚡",
      color: "bg-yellow-500",
      subscribers: 8932,
      threads: 1456,
      posts: 9823,
    },
    general: {
      name: "General Discussion",
      description: "General EV topics, news, and community discussions",
      icon: "💬",
      color: "bg-blue-500",
      subscribers: 12045,
      threads: 3201,
      posts: 21456,
    },
  };

  const category =
    categoryData[resolvedParams.slug as keyof typeof categoryData] ||
    categoryData.general;

  // Mock threads data
  const threads = [
    {
      id: 1,
      title: "Tesla FSD Beta vs Autopilot: Real World Comparison",
      author: "TechReviewer",
      authorAvatar:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20tech%20reviewer&image_size=square",
      replies: 23,
      views: 2847,
      lastActivity: "2 hours ago",
      lastActivityBy: "EVExpert",
      isPinned: true,
      isLocked: false,
      tags: ["FSD", "Autopilot", "Comparison"],
      excerpt:
        "I've been testing both Tesla's FSD Beta and standard Autopilot for the past 6 months...",
    },
    {
      id: 2,
      title: "Model Y vs Model 3: Which Should I Choose?",
      author: "NewBuyer2024",
      authorAvatar:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20new%20car%20buyer&image_size=square",
      replies: 45,
      views: 1923,
      lastActivity: "4 hours ago",
      lastActivityBy: "TeslaOwner",
      isPinned: false,
      isLocked: false,
      tags: ["Model Y", "Model 3", "Buying Guide"],
      excerpt:
        "I'm torn between the Model Y and Model 3. Looking for real owner experiences...",
    },
    {
      id: 3,
      title: "Supercharger Network Expansion 2024",
      author: "ChargingExpert",
      authorAvatar:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20charging%20expert&image_size=square",
      replies: 67,
      views: 4521,
      lastActivity: "6 hours ago",
      lastActivityBy: "RoadTripper",
      isPinned: false,
      isLocked: false,
      tags: ["Supercharger", "Infrastructure", "News"],
      excerpt:
        "Tesla announced major expansion plans for the Supercharger network...",
    },
    {
      id: 4,
      title: "Winter Driving Tips for Tesla Owners",
      author: "WinterDriver",
      authorAvatar:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20winter%20driver&image_size=square",
      replies: 34,
      views: 1876,
      lastActivity: "1 day ago",
      lastActivityBy: "ColdWeatherPro",
      isPinned: false,
      isLocked: false,
      tags: ["Winter", "Tips", "Battery"],
      excerpt:
        "Here are some essential tips for driving your Tesla in winter conditions...",
    },
    {
      id: 5,
      title: "Software Update 2024.2.7 Discussion",
      author: "UpdateTracker",
      authorAvatar:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20software%20update%20tracker&image_size=square",
      replies: 89,
      views: 6234,
      lastActivity: "1 day ago",
      lastActivityBy: "BetaTester",
      isPinned: false,
      isLocked: true,
      tags: ["Software Update", "Features", "Bug Fixes"],
      excerpt:
        "The latest software update brings several new features and improvements...",
    },
  ];

  const filteredThreads = threads.filter((thread) => {
    const matchesSearch =
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterBy === "pinned") return thread.isPinned && matchesSearch;
    if (filterBy === "locked") return thread.isLocked && matchesSearch;
    if (filterBy === "trending") return thread.views > 2000 && matchesSearch;

    return matchesSearch;
  });

  const sortedThreads = [...filteredThreads].sort((a, b) => {
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

  return (
    <div className=" min-h-screen py-8">
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
        <div className="rounded-lg shadow-sm border p-6 mb-8">
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
                        {thread.tags.map((tag, index) => (
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
