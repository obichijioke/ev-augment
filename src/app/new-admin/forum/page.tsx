"use client";

import React, { useEffect, useState } from "react";
import { adminApi } from "@/services/adminApi";
import { useToast } from "@/hooks/useToast";
import {
  AlertTriangle,
  Pin,
  PinOff,
  Lock,
  Unlock,
  Trash2,
  RotateCcw,
} from "lucide-react";

export default function NewAdminForumPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const toast = useToast();

  const load = (params: any = { page: 1, limit: 20 }) => {
    setLoading(true);
    setError(null);
    adminApi
      .getForumThreads(params)
      .then((res: any) => setThreads(res.data?.threads || []))
      .catch((e) => {
        const msg = e?.message || "Failed to load threads";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (id: string, body: any) => {
    try {
      await adminApi.updateForumThread(id, body);
      load();
    } catch (e: any) {
      const msg = e.message || "Update failed";
      setError(msg);
      toast.error(msg);
    }
  };

  const toggle = (
    flag: "is_pinned" | "is_locked" | "is_deleted",
    current: boolean
  ) => {
    return { [flag]: !current } as Record<string, boolean>;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Forum Moderation</h1>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">Title</th>
              <th className="p-2">Category</th>
              <th className="p-2">Author</th>
              <th className="p-2">Stats</th>
              <th className="p-2">Flags</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center">
                  Loading…
                </td>
              </tr>
            ) : threads.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center">
                  No threads
                </td>
              </tr>
            ) : (
              threads.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-2">{t.title}</td>
                  <td className="p-2">{t.category?.name}</td>
                  <td className="p-2">{t.author?.username}</td>
                  <td className="p-2">
                    {t.reply_count} replies · {t.view_count} views
                  </td>
                  <td className="p-2 text-xs">
                    {t.is_pinned ? "Pinned" : ""}
                    {t.is_locked ? (t.is_pinned ? ", " : "") + "Locked" : ""}
                    {t.is_deleted
                      ? (t.is_pinned || t.is_locked ? ", " : "") + "Deleted"
                      : ""}
                  </td>
                  <td className="p-2 flex items-center gap-2">
                    <button
                      className="px-2 py-1 border rounded text-xs flex items-center gap-1"
                      onClick={() =>
                        update(t.id, toggle("is_pinned", t.is_pinned))
                      }
                    >
                      {t.is_pinned ? (
                        <PinOff className="w-4 h-4" />
                      ) : (
                        <Pin className="w-4 h-4" />
                      )}{" "}
                      {t.is_pinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      className="px-2 py-1 border rounded text-xs flex items-center gap-1"
                      onClick={() =>
                        update(t.id, toggle("is_locked", t.is_locked))
                      }
                    >
                      {t.is_locked ? (
                        <Unlock className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}{" "}
                      {t.is_locked ? "Unlock" : "Lock"}
                    </button>
                    <button
                      className="px-2 py-1 border rounded text-xs flex items-center gap-1"
                      onClick={() =>
                        update(t.id, toggle("is_deleted", t.is_deleted))
                      }
                    >
                      {t.is_deleted ? (
                        <RotateCcw className="w-4 h-4" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}{" "}
                      {t.is_deleted ? "Restore" : "Delete"}
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
