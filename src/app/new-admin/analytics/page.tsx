"use client";

import React, { useEffect, useState } from "react";
import { adminApi } from "@/services/adminApi";
import { BarChart3, AlertTriangle } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export default function NewAdminAnalyticsPage() {
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    adminApi
      .getAnalytics({ timeframe: "30d" })
      .then((res: any) => setAnalytics(res.data?.analytics || null))
      .catch((e) => setError(e?.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-6 border bg-white rounded">Admin only</div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Analytics</h1>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="p-4 border bg-white rounded">
        {loading ? (
          <div className="h-40 bg-gray-100 animate-pulse rounded" />
        ) : (
          <pre className="text-sm overflow-auto">{JSON.stringify(analytics, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

