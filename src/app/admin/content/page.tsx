"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  ShoppingBag,
  Building,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface ContentStats {
  blog: { total: number; pending: number; published: number };
  marketplace: { total: number; pending: number; approved: number };
  directory: { total: number; pending: number; verified: number };
}

const AdminContentPage: React.FC = () => {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ContentStats>({
    blog: { total: 0, pending: 0, published: 0 },
    marketplace: { total: 0, pending: 0, approved: 0 },
    directory: { total: 0, pending: 0, verified: 0 },
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

  const fetchContentStats = async () => {
    try {
      setLoading(true);
      let token = session?.accessToken;

      // Fallback: get token from localStorage if session is not yet hydrated
      if (!token) {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            token = parsed.state.session?.accessToken;
          } catch (e) {
            console.error("Error parsing auth storage:", e);
          }
        }
      }

      if (!token) {
        throw new Error("No authentication token available");
      }

      // Fetch blog posts stats - get total count
      const blogTotalResponse = await fetch(
        `${API_BASE_URL}/admin/blog/posts?page=1&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Fetch pending blog posts (drafts)
      const blogPendingResponse = await fetch(
        `${API_BASE_URL}/admin/blog/posts?status=draft&page=1&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Fetch published blog posts
      const blogPublishedResponse = await fetch(
        `${API_BASE_URL}/admin/blog/posts?status=published&page=1&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let blogStats = { total: 0, pending: 0, published: 0 };

      if (blogTotalResponse.ok) {
        const blogTotalData = await blogTotalResponse.json();
        if (blogTotalData.success) {
          blogStats.total = blogTotalData.data.pagination?.total || 0;
        }
      }

      if (blogPendingResponse.ok) {
        const blogPendingData = await blogPendingResponse.json();
        if (blogPendingData.success) {
          blogStats.pending = blogPendingData.data.pagination?.total || 0;
        }
      }

      if (blogPublishedResponse.ok) {
        const blogPublishedData = await blogPublishedResponse.json();
        if (blogPublishedData.success) {
          blogStats.published = blogPublishedData.data.pagination?.total || 0;
        }
      }

      setStats((prev) => ({
        ...prev,
        blog: blogStats,
      }));

      // Fetch pending content for moderation
      const pendingResponse = await fetch(
        `${API_BASE_URL}/admin/content/pending?page=1&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        if (pendingData.success) {
          setRecentActivity(pendingData.data.items || []);
        }
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching content stats:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch content stats"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContentStats();
  }, [session]);

  const contentSections = [
    {
      title: "Blog Posts",
      description: "Manage blog articles and content",
      icon: FileText,
      href: "/admin/content/blog",
      stats: {
        total: stats.blog.total,
        pending: stats.blog.pending,
        published: stats.blog.published,
      },
      color: "blue",
    },
    {
      title: "Marketplace Listings",
      description: "Moderate marketplace items and sellers",
      icon: ShoppingBag,
      href: "/admin/content/marketplace",
      stats: {
        total: stats.marketplace.total,
        pending: stats.marketplace.pending,
        approved: stats.marketplace.approved,
      },
      color: "green",
    },
    {
      title: "Directory Businesses",
      description: "Approve and manage business listings",
      icon: Building,
      href: "/admin/content/directory",
      stats: {
        total: stats.directory.total,
        pending: stats.directory.pending,
        verified: stats.directory.verified,
      },
      color: "purple",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
      case "approved":
      case "verified":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "draft":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "blog":
        return FileText;
      case "marketplace":
        return ShoppingBag;
      case "directory":
        return Building;
      default:
        return FileText;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading content stats...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FileText className="w-8 h-8 mr-3 text-blue-600" />
          Content Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage blog posts, marketplace listings, and directory businesses
        </p>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {contentSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.title}
              href={section.href}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${section.color}-100`}>
                  <Icon className={`w-6 h-6 text-${section.color}-600`} />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {section.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {section.description}
              </p>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {section.stats.total}
                  </p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {section.stats.pending}
                  </p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {Object.values(section.stats)[2]}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Object.keys(section.stats)[2].charAt(0).toUpperCase() +
                      Object.keys(section.stats)[2].slice(1)}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Activity
              </h2>
              <Link
                href="/admin/system/audit-logs"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all activity
              </Link>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const TypeIcon = getTypeIcon(activity.type);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <TypeIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {activity.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          by {activity.author} • {activity.action}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          activity.status
                        )}`}
                      >
                        {activity.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Quick Actions
            </h2>

            <div className="space-y-4">
              <Link
                href="/admin/content/blog?action=create"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="p-2 rounded-lg bg-blue-500 mr-3">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create Blog Post</p>
                  <p className="text-sm text-gray-600">Write new article</p>
                </div>
              </Link>

              <Link
                href="/admin/content/marketplace?filter=pending"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-yellow-300 hover:shadow-sm transition-all"
              >
                <div className="p-2 rounded-lg bg-yellow-500 mr-3">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Review Pending</p>
                  <p className="text-sm text-gray-600">
                    {stats.marketplace.pending} items waiting
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/content/directory?filter=unverified"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
              >
                <div className="p-2 rounded-lg bg-purple-500 mr-3">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Verify Businesses</p>
                  <p className="text-sm text-gray-600">
                    {stats.directory.pending} pending verification
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/moderation"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-sm transition-all"
              >
                <div className="p-2 rounded-lg bg-red-500 mr-3">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Handle Reports</p>
                  <p className="text-sm text-gray-600">
                    {stats.blog.pending +
                      stats.marketplace.pending +
                      stats.directory.pending}{" "}
                    reports pending
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Content Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Content Stats
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Total Content Items
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {stats.blog.total +
                    stats.marketplace.total +
                    stats.directory.total}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Pending Approval
                </span>
                <span className="text-lg font-bold text-yellow-600">
                  {stats.blog.pending +
                    stats.marketplace.pending +
                    stats.directory.pending}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Published Today
                </span>
                <span className="text-lg font-bold text-green-600">
                  {stats.blog.published +
                    stats.marketplace.approved +
                    stats.directory.verified}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Total Views (30d)
                </span>
                <span className="text-lg font-bold text-blue-600">15.2k</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContentPage;
