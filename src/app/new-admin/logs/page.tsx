"use client";

import React, { useEffect, useState } from "react";
import { adminApi } from "@/services/adminApi";
import { AlertTriangle } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export default function NewAdminLogsPage() {
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    adminApi
      .getLogs({ page: 1, limit: 50 })
      .then((res: any) => setLogs(res.data?.logs || []))
      .catch((e) => setError(e?.message || "Failed to load logs"))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isAdmin)
    return (
      <div className="p-6 border border-gray-200 bg-white rounded">
        Admin only
      </div>
    );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Admin Logs</h1>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">When</th>
              <th className="p-2">Admin</th>
              <th className="p-2">Action</th>
              <th className="p-2">Target</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center">
                  Loading…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center">
                  No logs
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="p-2">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="p-2">{l.admin?.username || l.admin_id}</td>
                  <td className="p-2">{l.action_type}</td>
                  <td className="p-2">
                    {l.target_type} · {l.target_id}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
