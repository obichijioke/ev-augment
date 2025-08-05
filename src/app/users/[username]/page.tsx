"use client";

import { useState, use } from "react";
import {
  ArrowLeft,
  MessageSquare,
  Heart,
  Award,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Mail,
  Shield,
  Star,
  TrendingUp,
  Clock,
  Eye,
} from "lucide-react";
import Link from "next/link";

import { useFullUserProfile } from "@/hooks/useUserProfile";

interface UserProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

const UserProfilePage = ({ params }: UserProfilePageProps) => {
  const resolvedParams = use(params);
  const [activeTab, setActiveTab] = useState("posts");

  // Mock user data - in real app, fetch based on resolvedParams.username
  const user = {
    username: resolvedParams.username,
    displayName: "Tech Reviewer",
    avatar:
      "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20tech%20reviewer&image_size=square",
    bio: "Passionate EV enthusiast and technology reviewer. I love sharing my experiences with the latest electric vehicles and helping others make informed decisions.",
    joinDate: "2023-03-15",
    location: "San Francisco, CA",
    website: "https://techreviewer.blog",
    email: "contact@techreviewer.blog",
    isVerified: true,
    isModerator: false,
    stats: {
      posts: 247,
      threads: 45,
      reputation: 1850,
      likes: 892,
      views: 15420,
    },
    badges: [
      {
        name: "Early Adopter",
        icon: "🚀",
        description: "Joined in the first month",
      },
      {
        name: "Helpful Contributor",
        icon: "🤝",
        description: "Received 100+ likes",
      },
      {
        name: "Tesla Expert",
        icon: "⚡",
        description: "Active in Tesla discussions",
      },
      {
        name: "Review Master",
        icon: "⭐",
        description: "Posted 10+ detailed reviews",
      },
    ],
    vehicles: [
      {
        make: "Tesla",
        model: "Model Y",
        year: 2023,
        trim: "Long Range",
        color: "Pearl White",
      },
      {
        make: "BMW",
        model: "iX",
        year: 2022,
        trim: "xDrive50",
        color: "Storm Bay",
      },
    ],
  };

  const recentPosts = [
    {
      id: 1,
      title: "Tesla FSD Beta vs Autopilot: Real World Comparison",
      category: "Tesla",
      type: "thread",
      createdAt: "2024-01-15T10:30:00Z",
      replies: 23,
      views: 2847,
      likes: 156,
      excerpt:
        "I've been testing both Tesla's FSD Beta and standard Autopilot for the past 6 months...",
    },
    {
      id: 2,
      title: "BMW iX Long Term Review - 6 Month Update",
      category: "BMW",
      type: "thread",
      createdAt: "2024-01-10T14:20:00Z",
      replies: 34,
      views: 1923,
      likes: 89,
      excerpt:
        "After 6 months with the BMW iX, here are my thoughts on daily driving...",
    },
    {
      id: 3,
      title: "Great comparison! I've had similar experiences...",
      category: "Tesla",
      type: "reply",
      createdAt: "2024-01-08T09:15:00Z",
      threadTitle: "Model Y vs Model 3: Which Should I Choose?",
      likes: 12,
      excerpt:
        "Great comparison! I've had similar experiences with both models. The Model Y definitely...",
    },
    {
      id: 4,
      title: "Charging Infrastructure in California - My Experience",
      category: "Charging Infrastructure",
      type: "thread",
      createdAt: "2024-01-05T16:45:00Z",
      replies: 18,
      views: 1456,
      likes: 67,
      excerpt:
        "Living in California, I've had extensive experience with various charging networks...",
    },
    {
      id: 5,
      title: "Winter driving tips are spot on!",
      category: "General Discussion",
      type: "reply",
      createdAt: "2024-01-03T11:30:00Z",
      threadTitle: "Winter Driving Tips for EV Owners",
      likes: 8,
      excerpt:
        "These winter driving tips are spot on! I've been following similar practices...",
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              {/* Avatar and Basic Info */}
              <div className="text-center mb-6">
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  className="w-24 h-24 rounded-full mx-auto mb-4"
                />
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    {user.displayName}
                  </h1>
                  {user.isVerified && (
                    <Shield
                      className="h-5 w-5 text-blue-600"
                      title="Verified User"
                    />
                  )}
                  {user.isModerator && (
                    <Star
                      className="h-5 w-5 text-yellow-600"
                      title="Moderator"
                    />
                  )}
                </div>
                <p className="text-gray-600">@{user.username}</p>
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="mb-6">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {user.bio}
                  </p>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(user.joinDate)}</span>
                </div>
                {user.location && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center space-x-2 text-sm">
                    <LinkIcon className="h-4 w-4 text-gray-600" />
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {user.website.replace("https://", "")}
                    </a>
                  </div>
                )}
                {user.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <a
                      href={`mailto:${user.email}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {user.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {user.stats.posts}
                  </div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {user.stats.threads}
                  </div>
                  <div className="text-sm text-gray-600">Threads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {user.stats.reputation}
                  </div>
                  <div className="text-sm text-gray-600">Reputation</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {user.stats.likes}
                  </div>
                  <div className="text-sm text-gray-600">Likes</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button className="w-full btn-primary">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Follow
                </button>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Badges
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {user.badges.map((badge, index) => (
                  <div
                    key={index}
                    className="text-center p-3 bg-gray-50 rounded-lg"
                    title={badge.description}
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <div className="text-xs font-medium text-gray-700">
                      {badge.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicles */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                My Vehicles
              </h3>
              <div className="space-y-3">
                {user.vehicles.map((vehicle, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-sm text-gray-600">
                      {vehicle.trim} • {vehicle.color}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab("posts")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "posts"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Recent Posts
                  </button>
                  <button
                    onClick={() => setActiveTab("threads")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "threads"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Threads Created
                  </button>

                  <button
                    onClick={() => setActiveTab("achievements")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "achievements"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Achievements
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "posts" && (
                  <div className="space-y-6">
                    {recentPosts.map((post) => (
                      <div
                        key={post.id}
                        className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                post.type === "thread"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {post.type === "thread" ? "Thread" : "Reply"}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {post.category}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {getTimeAgo(post.createdAt)}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {post.type === "thread" ? (
                            <span className="text-gray-900">{post.title}</span>
                          ) : (
                            <div>
                              <div className="text-sm text-gray-600 mb-1">
                                Reply to:{" "}
                                <span className="text-gray-900">
                                  {post.threadTitle}
                                </span>
                              </div>
                              <div className="text-base">{post.title}</div>
                            </div>
                          )}
                        </h3>

                        <p className="text-gray-600 mb-3">{post.excerpt}</p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {post.type === "thread" && (
                            <>
                              <div className="flex items-center space-x-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{post.replies} replies</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>{post.views} views</span>
                              </div>
                            </>
                          )}
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4" />
                            <span>{post.likes} likes</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "threads" && (
                  <div className="space-y-6">
                    {recentPosts
                      .filter((post) => post.type === "thread")
                      .map((post) => (
                        <div
                          key={post.id}
                          className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {post.category}
                            </span>
                            <span className="text-sm text-gray-500">
                              {getTimeAgo(post.createdAt)}
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            <span className="text-gray-900">{post.title}</span>
                          </h3>

                          <p className="text-gray-600 mb-3">{post.excerpt}</p>

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{post.replies} replies</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="h-4 w-4" />
                              <span>{post.views} views</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="h-4 w-4" />
                              <span>{post.likes} likes</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {activeTab === "achievements" && (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        User Achievements
                      </h3>
                      <p className="text-gray-600">
                        Achievement system coming soon!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
