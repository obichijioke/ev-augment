"use client";

import React, { useEffect, useState } from "react";
import {
  adminApi,
  type Timeframe,
  type DashboardStatsResponse,
} from "@/services/adminApi";
import {
  BarChart3,
  Users,
  MessageSquare,
  Factory,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  loading,
}: {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon: any;
  loading?: boolean;
}) {
  return (
    <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          {loading ? (
            <div className="mt-2 h-6 w-24 bg-gray-200 animate-pulse rounded" />
          ) : (
            <p className="text-2xl font-semibold">{value}</p>
          )}
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
    </div>
  );
}

export default function NewAdminOverviewPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");
  const [data, setData] = useState<DashboardStatsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminApi
      .getDashboard(timeframe)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setError(e?.message || "Failed to load stats");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold">Overview</h1>
        <div className="flex items-center gap-2">
          {["7d", "30d", "90d", "1y"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as Timeframe)}
              className={`px-3 py-1.5 rounded-md text-sm border border-gray-200 ${
                timeframe === tf
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={data?.stats.users.total}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="New Users"
          value={data?.stats.users.new}
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          title="Active Users"
          value={data?.stats.users.active}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Vehicles"
          value={data?.stats.content.vehicles.total}
          icon={Factory}
          loading={loading}
        />
        <StatCard
          title="New Vehicles"
          value={data?.stats.content.vehicles.new}
          icon={Factory}
          loading={loading}
        />
        <StatCard
          title="Listings"
          value={data?.stats.content.marketplace_listings.total}
          icon={BarChart3}
          loading={loading}
        />
        <StatCard
          title="Forum Posts"
          value={data?.stats.content.forum_posts.total}
          icon={MessageSquare}
          loading={loading}
        />
        <StatCard
          title="Reports (Pending)"
          value={data?.stats.moderation.reported_content}
          icon={AlertTriangle}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 rounded-lg bg-white border border-gray-200">
          <h2 className="font-medium mb-2">Recent Trends</h2>
          <p className="text-sm text-gray-600">
            Analytics preview (expand in Analytics section).
          </p>
          <div className="h-40 mt-4 bg-gray-100 rounded" />
        </div>
        <div className="p-4 rounded-lg bg-white border border-gray-200">
          <h2 className="font-medium mb-2">Moderation Queue</h2>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>
              Pending Listings:{" "}
              {data?.stats.moderation.pending_listings ?? (loading ? "…" : 0)}
            </li>
            <li>
              Pending Directory:{" "}
              {data?.stats.moderation.pending_directory ?? (loading ? "…" : 0)}
            </li>
            <li>
              Reports:{" "}
              {data?.stats.moderation.reported_content ?? (loading ? "…" : 0)}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
