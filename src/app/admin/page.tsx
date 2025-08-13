"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import {
  Users,
  FileText,
  MessageSquare,
  Car,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Shield,
  Eye,
} from "lucide-react";

interface DashboardStats {
  users: {
    total: number;
    new: number;
    active: number;
  };
  content: {
    vehicles: {
      total: number;
      new: number;
    };
    marketplace_listings: {
      total: number;
      new: number;
    };
    forum_posts: {
      total: number;
      new: number;
    };
  };
  moderation: {
    pending_listings: number;
    pending_directory: number;
    reported_content: number;
  };
  revenue: {
    total: number;
    recent: number;
  };
  timeframe: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState("30d");
  const { session } = useAuthStore();

  useEffect(() => {
    fetchDashboardStats();
  }, [timeframe]);

  const fetchDashboardStats = async () => {
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

      const response = await fetch(
        `http://localhost:4002/api/admin/dashboard?timeframe=${timeframe}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const data = await response.json();
      setStats(data.data.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats?.users.total || 0,
      change: stats?.users.new || 0,
      changeLabel: "new this period",
      icon: Users,
      color: "blue",
      href: "/admin/users",
    },
    {
      title: "Vehicle Listings",
      value: stats?.content.vehicles.total || 0,
      change: stats?.content.vehicles.new || 0,
      changeLabel: "new this period",
      icon: Car,
      color: "green",
      href: "/admin/vehicles",
    },
    {
      title: "Forum Posts",
      value: stats?.content.forum_posts.total || 0,
      change: stats?.content.forum_posts.new || 0,
      changeLabel: "new this period",
      icon: MessageSquare,
      color: "purple",
      href: "/admin/forums",
    },
    {
      title: "Marketplace Items",
      value: stats?.content.marketplace_listings.total || 0,
      change: stats?.content.marketplace_listings.new || 0,
      changeLabel: "new this period",
      icon: FileText,
      color: "yellow",
      href: "/admin/content/marketplace",
    },
  ];

  const moderationCards = [
    {
      title: "Pending Listings",
      value: stats?.moderation.pending_listings || 0,
      icon: Clock,
      color: "orange",
      href: "/admin/moderation?type=listings",
    },
    {
      title: "Pending Directory",
      value: stats?.moderation.pending_directory || 0,
      icon: CheckCircle,
      color: "blue",
      href: "/admin/moderation?type=directory",
    },
    {
      title: "Reported Content",
      value: stats?.moderation.reported_content || 0,
      icon: AlertTriangle,
      color: "red",
      href: "/admin/moderation?type=reports",
    },
  ];

  const quickActions = [
    {
      title: "Add Vehicle Listing",
      description: "Create a new EV listing",
      icon: Car,
      href: "/admin/vehicles?action=create",
      color: "bg-blue-500",
    },
    {
      title: "Review Reports",
      description: "Handle user reports",
      icon: Shield,
      href: "/admin/moderation",
      color: "bg-red-500",
    },
    {
      title: "Manage Users",
      description: "User administration",
      icon: Users,
      href: "/admin/users",
      color: "bg-green-500",
    },
    {
      title: "System Settings",
      description: "Configure platform",
      icon: Activity,
      href: "/admin/system",
      color: "bg-purple-500",
    },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">
              Error loading dashboard: {error}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Overview of your EV Community Platform
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {card.value.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">
                      +{card.change} {card.changeLabel}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-${card.color}-100`}>
                  <Icon className={`w-6 h-6 text-${card.color}-600`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Moderation Queue */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Moderation Queue
              </h2>
              <Link
                href="/admin/moderation"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {moderationCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.title}
                    href={card.href}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {card.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {card.value}
                        </p>
                      </div>
                      <Icon className={`w-5 h-5 text-${card.color}-600`} />
                    </div>
                  </Link>
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
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {action.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
