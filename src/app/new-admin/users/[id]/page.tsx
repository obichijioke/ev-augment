"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/services/adminApi";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function NewAdminUserDetailsPage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    adminApi
      .getUser(id)
      .then((res: any) => setUser(res.data?.user || null))
      .catch((e) => setError(e?.message || "Failed to load user"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/new-admin/users" className="text-sm text-blue-600 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-xl font-semibold">User Details</h1>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-6 border bg-white rounded">Loading…</div>
      ) : !user ? (
        <div className="p-6 border bg-white rounded">User not found</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border bg-white rounded">
              <h2 className="font-medium mb-3">Profile</h2>
              <dl className="text-sm grid grid-cols-2 gap-x-4 gap-y-2">
                <dt className="text-gray-600">ID</dt><dd>{user.id}</dd>
                <dt className="text-gray-600">Username</dt><dd>{user.username}</dd>
                <dt className="text-gray-600">Email</dt><dd>{user.email}</dd>
                <dt className="text-gray-600">Full name</dt><dd>{user.full_name || "—"}</dd>
                <dt className="text-gray-600">Verified</dt><dd>{user.is_verified ? "Yes" : "No"}</dd>
                <dt className="text-gray-600">Business</dt><dd>{user.is_business ? (user.business_name || "Yes") : "No"}</dd>
                <dt className="text-gray-600">Created</dt><dd>{new Date(user.created_at).toLocaleString()}</dd>
                <dt className="text-gray-600">Updated</dt><dd>{new Date(user.updated_at).toLocaleString()}</dd>
                <dt className="text-gray-600">Last Sign In</dt><dd>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "—"}</dd>
              </dl>
            </div>
            <div className="p-4 border bg-white rounded">
              <h2 className="font-medium mb-3">Content Counts</h2>
              <ul className="text-sm space-y-1">
                <li>Vehicles: {user.content_counts?.vehicles ?? 0}</li>
                <li>Marketplace Listings: {user.content_counts?.listings ?? 0}</li>
                <li>Forum Posts: {user.content_counts?.posts ?? 0}</li>
                <li>Reviews: {user.content_counts?.reviews ?? 0}</li>
                <li>Messages: {user.content_counts?.messages ?? 0}</li>
              </ul>
            </div>
          </div>

          <div className="p-4 border bg-white rounded">
            <h2 className="font-medium mb-3">Recent Activity</h2>
            {user.recent_activity?.length ? (
              <ul className="text-sm space-y-2">
                {user.recent_activity.map((a: any) => (
                  <li key={a.id} className="flex justify-between border-b pb-1 last:border-b-0">
                    <span className="text-gray-700">{a.action}</span>
                    <span className="text-gray-500">{new Date(a.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-600">No recent activity</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

