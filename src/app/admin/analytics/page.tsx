"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  BarChart3,
  TrendingUp,
  Users,
  Car,
  MessageSquare,
  Package,
  Building2,
  Eye,
  Calendar,
  Activity,
  DollarSign,
  Globe,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalVehicles: number;
    totalForumPosts: number;
    totalMarketplaceListings: number;
    totalDirectoryBusinesses: number;
    totalBlogPosts: number;
  };
  userGrowth: {
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
  contentStats: {
    publishedBlogs: number;
    pendingBlogs: number;
    activeForumThreads: number;
    approvedMarketplace: number;
    verifiedBusinesses: number;
  };
  engagement: {
    totalViews: number;
    totalLikes: number;
    avgSessionDuration: string;
    bounceRate: number;
  };
}

export default function AnalyticsPage() {
  const { session } = useAuthStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState("30d");

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";
  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let token = session?.accessToken;

      // Fallback: get token from localStorage if session is not yet hydrated
      if (!token && typeof window !== "undefined") {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          try {
            const authData = JSON.parse(authStorage);
            token = authData?.state?.session?.accessToken;
          } catch (e) {
            console.error("Error parsing auth storage:", e);
          }
        }
      }

      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/analytics?timeframe=${timeframe}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const data = await response.json();
      setAnalytics(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive platform analytics and insights
            </p>
          </div>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>

        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>

        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Analytics Unavailable
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Analytics backend API is not yet implemented
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive platform analytics and insights
          </p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.overview?.totalUsers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Car className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Vehicle Listings
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.overview?.totalVehicles || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Forum Posts</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.overview?.totalForumPosts || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Marketplace</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.overview?.totalMarketplaceListings || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Directory</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.overview?.totalDirectoryBusinesses || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Globe className="w-8 h-8 text-teal-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Blog Posts</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.overview?.totalBlogPosts || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Growth */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          User Growth
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600">This Month</p>
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.userGrowth?.thisMonth || 0}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Last Month</p>
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.userGrowth?.lastMonth || 0}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Growth Rate</p>
            <p
              className={`text-2xl font-bold ${
                (analytics?.userGrowth?.percentChange || 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {analytics?.userGrowth?.percentChange || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Content Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Content Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Published Blogs</p>
            <p className="text-xl font-bold text-gray-900">
              {analytics?.contentStats?.publishedBlogs || 0}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Pending Blogs</p>
            <p className="text-xl font-bold text-gray-900">
              {analytics?.contentStats?.pendingBlogs || 0}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Active Threads</p>
            <p className="text-xl font-bold text-gray-900">
              {analytics?.contentStats?.activeForumThreads || 0}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">
              Approved Marketplace
            </p>
            <p className="text-xl font-bold text-gray-900">
              {analytics?.contentStats?.approvedMarketplace || 0}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">
              Verified Businesses
            </p>
            <p className="text-xl font-bold text-gray-900">
              {analytics?.contentStats?.verifiedBusinesses || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          Engagement Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Views</p>
            <p className="text-xl font-bold text-gray-900">
              {analytics?.engagement?.totalViews?.toLocaleString() || 0}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Likes</p>
            <p className="text-xl font-bold text-gray-900">
              {analytics?.engagement?.totalLikes?.toLocaleString() || 0}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Avg Session</p>
            <p className="text-xl font-bold text-gray-900">
              {analytics?.engagement?.avgSessionDuration || "0m"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
            <p className="text-xl font-bold text-gray-900">
              {analytics?.engagement?.bounceRate || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <Users className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">User Management</p>
            <p className="text-sm text-gray-500">Manage user accounts</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <Car className="w-6 h-6 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">Vehicle Listings</p>
            <p className="text-sm text-gray-500">Manage EV listings</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <MessageSquare className="w-6 h-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">Forum Management</p>
            <p className="text-sm text-gray-500">Moderate discussions</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <Package className="w-6 h-6 text-orange-600 mb-2" />
            <p className="font-medium text-gray-900">Content Review</p>
            <p className="text-sm text-gray-500">Review pending content</p>
          </button>
        </div>
      </div>
    </div>
  );
}
