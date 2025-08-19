"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { adminApi } from "@/services/adminApi";
import {
  AlertTriangle,
  Search,
  Download,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export default function NewAdminUsersPage() {
  const { isAdmin } = useUserRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<any>({
    search: "",
    role: "",
    status: "",
    verified: "",
    banned: "",
    business: "",
  });

  // initialize state from URL
  useEffect(() => {
    const sp = searchParams;
    if (!sp) return;
    const nextFilters: any = { ...filters };
    ["search", "role", "status", "verified", "banned", "business"].forEach(
      (k) => {
        const v = sp.get(k);
        if (v !== null) nextFilters[k] = v;
      }
    );
    const p = sp.get("page");
    const l = sp.get("limit");
    setFilters(nextFilters);
    if (p) setPage(parseInt(p, 10) || 1);
    if (l) setLimit(parseInt(l, 10) || 20);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // push state to URL when filters/page/limit change
  useEffect(() => {
    const sp = new URLSearchParams();
    Object.entries({ ...filters, page, limit }).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
    });
    router.replace(`${pathname}?${sp.toString()}`);
  }, [filters, page, limit, pathname, router]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadUsers = () => {
    setLoading(true);
    setError(null);
    adminApi
      .getUsers({ ...filters, page, limit })
      .then((res: any) => {
        setUsers(res.data.users || []);
        setTotalPages(res.data.pagination?.pages || 1);
      })
      .catch((e) => {
        const msg = e?.message || "Failed to load users";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const canBulk = isAdmin && selectedIds.length > 0;

  const onExport = async (format: "csv" | "json") => {
    try {
      const params = new URLSearchParams({ ...filters, format });
      const base =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";
      const tokenRaw = localStorage.getItem("auth-storage");
      const token = tokenRaw
        ? JSON.parse(tokenRaw)?.state?.session?.accessToken
        : null;
      const url = `${base}/admin/users/export?${params.toString()}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Export failed");
      toast.success("Export ready");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `users-export.${format === "csv" ? "csv" : "json"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      const msg = e.message || "Export failed";
      setError(msg);
      toast.error(msg);
    }
  };

  const onBulk = async (action: string, role?: string) => {
    if (!isAdmin) return;
    try {
      if (!confirm(`Confirm ${action} on ${selectedIds.length} users?`)) return;
      await adminApi.bulkUsers({ user_ids: selectedIds, action, role });
      setSelectedIds([]);
      toast.success("Bulk action completed");
      loadUsers();
    } catch (e: any) {
      const msg = e.message || "Bulk action failed";
      setError(msg);
      toast.error(msg);
    }
  };

  const onUpdateUser = async (id: string, updates: any) => {
    if (!isAdmin) return;
    try {
      await adminApi.updateUser(id, updates);
      toast.success("User updated");
      loadUsers();
    } catch (e: any) {
      const msg = e.message || "Update failed";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-semibold">Users</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
            <input
              className="pl-7 pr-3 py-2 border border-gray-200 rounded-md text-sm"
              placeholder="Search username, email, name"
              value={filters.search}
              onChange={(e) =>
                setFilters((f: any) => ({ ...f, search: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && loadUsers()}
            />
          </div>
          <button
            className="px-3 py-2 border border-gray-200 rounded-md text-sm"
            onClick={() => loadUsers()}
          >
            Apply
          </button>
          {isAdmin && (
            <>
              <button
                className="px-3 py-2 border border-gray-200 rounded-md text-sm flex items-center gap-1"
                onClick={() => onExport("csv")}
              >
                <Download className="w-4 h-4" /> CSV
              </button>
              <button
                className="px-3 py-2 border border-gray-200 rounded-md text-sm"
                onClick={() => onExport("json")}
              >
                JSON
              </button>
            </>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="border border-gray-200 rounded-md px-2 py-1 text-sm"
            value={filters.role}
            onChange={(e) =>
              setFilters((f: any) => ({ ...f, role: e.target.value }))
            }
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="user">User</option>
          </select>
          <select
            className="border border-gray-200 rounded-md px-2 py-1 text-sm"
            value={filters.status}
            onChange={(e) =>
              setFilters((f: any) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className="border border-gray-200 rounded-md px-2 py-1 text-sm"
            value={filters.verified}
            onChange={(e) =>
              setFilters((f: any) => ({ ...f, verified: e.target.value }))
            }
          >
            <option value="">Any verification</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
          <select
            className="border border-gray-200 rounded-md px-2 py-1 text-sm"
            value={filters.banned}
            onChange={(e) =>
              setFilters((f: any) => ({ ...f, banned: e.target.value }))
            }
          >
            <option value="">Any ban</option>
            <option value="banned">Banned</option>
            <option value="not_banned">Not banned</option>
          </select>
          <select
            className="border border-gray-200 rounded-md px-2 py-1 text-sm"
            value={filters.business}
            onChange={(e) =>
              setFilters((f: any) => ({ ...f, business: e.target.value }))
            }
          >
            <option value="">Any account</option>
            <option value="business">Business</option>
            <option value="personal">Personal</option>
          </select>
        </div>
      )}

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
              <th className="p-2 w-8">
                {isAdmin ? (
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === users.length && users.length > 0
                    }
                    onChange={(e) =>
                      setSelectedIds(
                        e.target.checked ? users.map((u) => u.id) : []
                      )
                    }
                  />
                ) : null}
              </th>
              <th className="p-2">User</th>
              <th className="p-2">Role</th>
              <th className="p-2">Status</th>
              <th className="p-2">Verified</th>
              <th className="p-2">Banned</th>
              <th className="p-2">Business</th>
              <th className="p-2">Created</th>
              <th className="p-2">Last Sign In</th>
              {isAdmin && <th className="p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-gray-200">
                  <td className="p-2">
                    {isAdmin ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(u.id)}
                        onChange={(e) =>
                          setSelectedIds((prev) =>
                            e.target.checked
                              ? [...prev, u.id]
                              : prev.filter((id) => id !== u.id)
                          )
                        }
                      />
                    ) : null}
                  </td>
                  <td className="p-2">
                    <div>
                      <Link
                        href={`/new-admin/users/${u.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {u.username}
                      </Link>
                      <div className="text-gray-500 text-xs">{u.email}</div>
                    </div>
                  </td>
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">{u.is_active ? "Active" : "Inactive"}</td>
                  <td className="p-2">{u.is_verified ? "Yes" : "No"}</td>
                  <td className="p-2">{u.is_banned ? "Yes" : "No"}</td>
                  <td className="p-2">
                    {u.is_business ? u.business_name || "Yes" : "No"}
                  </td>
                  <td className="p-2">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-2">
                    {u.last_sign_in_at
                      ? new Date(u.last_sign_in_at).toLocaleString()
                      : "—"}
                  </td>
                  {isAdmin && (
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <select
                          className="border border-gray-200 rounded-md px-2 py-1 text-xs"
                          value={u.role}
                          onChange={(e) =>
                            onUpdateUser(u.id, { role: e.target.value })
                          }
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          className="text-xs px-2 py-1 border border-gray-200 rounded-md"
                          onClick={() =>
                            onUpdateUser(u.id, { is_active: !u.is_active })
                          }
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="text-xs px-2 py-1 border border-gray-200 rounded-md"
                          onClick={() =>
                            onUpdateUser(u.id, { is_verified: !u.is_verified })
                          }
                        >
                          {u.is_verified ? "Unverify" : "Verify"}
                        </button>
                        <button
                          className="text-xs px-2 py-1 border border-gray-200 rounded-md"
                          onClick={() =>
                            onUpdateUser(u.id, { is_banned: !u.is_banned })
                          }
                        >
                          {u.is_banned ? "Unban" : "Ban"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="border border-gray-200 rounded-lg p-3 bg-white">
          <div className="flex items-center gap-2 text-sm">
            <Settings2 className="w-4 h-4" />
            <span className="font-medium">Bulk actions:</span>
            <button
              disabled={!canBulk}
              className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50"
              onClick={() => onBulk("activate")}
            >
              Activate
            </button>
            <button
              disabled={!canBulk}
              className="px-2 py-1 border rounded disabled:opacity-50"
              onClick={() => onBulk("deactivate")}
            >
              Deactivate
            </button>
            <button
              disabled={!canBulk}
              className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50"
              onClick={() => onBulk("verify")}
            >
              Verify
            </button>
            <button
              disabled={!canBulk}
              className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50"
              onClick={() => onBulk("ban")}
            >
              Ban
            </button>
            <button
              disabled={!canBulk}
              className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50"
              onClick={() => onBulk("unban")}
            >
              Unban
            </button>
            <span className="ml-auto text-gray-600">
              Selected: {selectedIds.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
