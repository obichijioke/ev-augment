"use client";

import React, { useEffect, useState } from "react";
import { adminApi } from "@/services/adminApi";
import { useToast } from "@/hooks/useToast";
import { AlertTriangle, Check } from "lucide-react";

export default function NewAdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const toast = useToast();

  const load = (params: any = { page: 1, limit: 20, status: "pending" }) => {
    setLoading(true);
    setError(null);
    adminApi
      .getReports(params)
      .then((res: any) => setReports(res.data?.reports || []))
      .catch((e) => {
        const msg = e?.message || "Failed to load reports";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resolve = async (id: string) => {
    const action_taken = prompt("Action taken?") || "Reviewed";
    try {
      await adminApi.resolveReport(id, { action_taken });
      load();
    } catch (e: any) {
      const msg = e.message || "Resolve failed";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Reports</h1>

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
              <th className="p-2">Type</th>
              <th className="p-2">Priority</th>
              <th className="p-2">Reporter</th>
              <th className="p-2">Created</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center">
                  Loading…
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center">
                  No reports
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.content_type}</td>
                  <td className="p-2">{r.priority}</td>
                  <td className="p-2">{r.reporter?.username || "—"}</td>
                  <td className="p-2">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="p-2">
                    <button
                      className="px-2 py-1 border border-gray-200 rounded text-xs flex items-center gap-1"
                      onClick={() => resolve(r.id)}
                    >
                      <Check className="w-4 h-4" /> Resolve
                    </button>
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
