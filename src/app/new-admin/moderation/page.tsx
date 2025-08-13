"use client";

import React, { useEffect, useState } from "react";
import { adminApi } from "@/services/adminApi";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

type QueueType = "marketplace" | "directory";

export default function NewAdminModerationPage() {
  const [tab, setTab] = useState<QueueType>("marketplace");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi
      .getPendingContent(tab, 1, 20)
      .then((res: any) => {
        const key =
          tab === "marketplace" ? "marketplace_listings" : "directory_listings";
        setItems(res.data?.pending_content?.[key]?.items || []);
      })
      .catch((e) => setError(e?.message || "Failed to load queue"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const approve = async (id: string) => {
    try {
      await adminApi.approveContent(tab, id);
      load();
    } catch (e) {
      setError((e as any).message || "Approve failed");
    }
  };

  const reject = async (id: string) => {
    const reason = prompt("Reason for rejection?") || "Not specified";
    try {
      await adminApi.rejectContent(tab, id, { reason });
      load();
    } catch (e) {
      setError((e as any).message || "Reject failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          className={`px-3 py-1.5 rounded-md border border-gray-200 text-sm ${
            tab === "marketplace" ? "bg-blue-600 text-white" : "bg-white"
          }`}
          onClick={() => setTab("marketplace")}
        >
          Marketplace
        </button>
        <button
          className={`px-3 py-1.5 rounded-md border border-gray-200 text-sm ${
            tab === "directory" ? "bg-blue-600 text-white" : "bg-white"
          }`}
          onClick={() => setTab("directory")}
        >
          Directory
        </button>
      </div>

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
              <th className="p-2">Title/Name</th>
              <th className="p-2">Created</th>
              <th className="p-2">Owner</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center">
                  No pending items
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2">{it.title || it.name}</td>
                  <td className="p-2">
                    {new Date(it.created_at).toLocaleString()}
                  </td>
                  <td className="p-2">
                    {it.seller?.username || it.owner?.username || "—"}
                  </td>
                  <td className="p-2 flex items-center gap-2">
                    <button
                      className="px-2 py-1 border border-gray-200 rounded text-xs flex items-center gap-1"
                      onClick={() => approve(it.id)}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button
                      className="px-2 py-1 border border-gray-200 rounded text-xs flex items-center gap-1"
                      onClick={() => reject(it.id)}
                    >
                      <XCircle className="w-4 h-4" /> Reject
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
