"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import { adminApi } from "@/services/adminApi";
import { useUserRole } from "@/hooks/useUserRole";

type Post = any;

export default function AdminBlogPage() {
  const { isModerator, isAdmin } = useUserRole();
  const canModerate = isModerator || isAdmin;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<any>({
    search: "",
    status: "",
    category: "",
    author: "",
    sort_by: "updated_at",
    sort_order: "desc",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // initialize filters from URL
  useEffect(() => {
    const sp = searchParams;
    if (!sp) return;
    const nextFilters: any = { ...filters };
    ["search", "status", "category", "author", "sort_by", "sort_order"].forEach(
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

  // push to URL when filters change
  useEffect(() => {
    const sp = new URLSearchParams();
    Object.entries({ ...filters, page, limit }).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
    });
    router.replace(`${pathname}?${sp.toString()}`);
  }, [filters, page, limit, pathname, router]);

  const loadPosts = () => {
    setLoading(true);
    setError(null);
    adminApi
      .getBlogPosts({ ...filters, page, limit })
      .then((res: any) => {
        setPosts(res.data.posts || []);
        setTotalPages(
          res.data.pagination?.totalPages || res.data.pagination?.pages || 1
        );
      })
      .catch((e) => {
        const msg = e?.message || "Failed to load posts";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!canModerate) {
      setLoading(false);
      return;
    }
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canModerate,
    page,
    limit,
    filters.status,
    filters.search,
    filters.sort_by,
    filters.sort_order,
    filters.category,
    filters.author,
  ]);

  const onBulk = async (action: string) => {
    if (!isModerator || selectedIds.length === 0) return;
    try {
      if (!confirm(`Confirm ${action} on ${selectedIds.length} posts?`)) return;
      await adminApi.bulkBlogPosts({ post_ids: selectedIds, action });
      setSelectedIds([]);
      toast.success("Bulk action completed");
      loadPosts();
    } catch (e: any) {
      const msg = e.message || "Bulk action failed";
      setError(msg);
      toast.error(msg);
    }
  };

  const onUpdatePost = async (id: string, updates: any) => {
    if (!isModerator) return;
    try {
      await adminApi.updateBlogPost(id, updates);
      toast.success("Post updated");
      loadPosts();
    } catch (e: any) {
      const msg = e.message || "Update failed";
      setError(msg);
      toast.error(msg);
    }
  };

  const onDeletePost = async (id: string) => {
    if (!isAdmin) return;
    try {
      if (!confirm("Delete this post? This cannot be undone.")) return;
      await adminApi.deleteBlogPost(id);
      toast.success("Post deleted");
      loadPosts();
    } catch (e: any) {
      const msg = e.message || "Delete failed";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-semibold">Blog Posts</h1>
        {canModerate && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                className="pl-3 pr-3 py-2 border border-gray-200 rounded-md text-sm"
                placeholder="Search title, content, excerpt"
                value={filters.search}
                onChange={(e) =>
                  setFilters((f: any) => ({ ...f, search: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && loadPosts()}
              />
            </div>
            <button
              className="px-3 py-2 border border-gray-200 rounded-md text-sm"
              onClick={() => loadPosts()}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {canModerate && (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="border border-gray-200 rounded-md px-2 py-1 text-sm"
            value={filters.status}
            onChange={(e) =>
              setFilters((f: any) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="">Any status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <select
            className="border border-gray-200 rounded-md px-2 py-1 text-sm"
            value={filters.sort_by}
            onChange={(e) =>
              setFilters((f: any) => ({ ...f, sort_by: e.target.value }))
            }
          >
            <option value="updated_at">Updated</option>
            <option value="created_at">Created</option>
            <option value="published_at">Published</option>
            <option value="title">Title</option>
            <option value="views">Views</option>
          </select>
          <select
            className="border border-gray-200 rounded-md px-2 py-1 text-sm"
            value={filters.sort_order}
            onChange={(e) =>
              setFilters((f: any) => ({ ...f, sort_order: e.target.value }))
            }
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 w-8">
                {canModerate ? (
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === posts.length && posts.length > 0
                    }
                    onChange={(e) =>
                      setSelectedIds(
                        e.target.checked ? posts.map((p: any) => p.id) : []
                      )
                    }
                  />
                ) : null}
              </th>
              <th className="p-2">Title</th>
              <th className="p-2">Status</th>
              <th className="p-2">Category</th>
              <th className="p-2">Author</th>
              <th className="p-2">Updated</th>
              <th className="p-2">Views</th>
              {canModerate && <th className="p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-gray-500">
                  No posts found
                </td>
              </tr>
            ) : (
              posts.map((p: any) => (
                <tr key={p.id} className="border-t border-gray-200">
                  <td className="p-2">
                    {canModerate ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={(e) =>
                          setSelectedIds((prev) =>
                            e.target.checked
                              ? [...prev, p.id]
                              : prev.filter((id) => id !== p.id)
                          )
                        }
                      />
                    ) : null}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col">
                      <Link
                        href={`/blog/${p.slug}`}
                        className="font-medium text-blue-600 hover:underline"
                        target="_blank"
                      >
                        {p.title}
                      </Link>
                      <span className="text-xs text-gray-500">{p.slug}</span>
                    </div>
                  </td>
                  <td className="p-2">{p.status}</td>
                  <td className="p-2">{p.category || "—"}</td>
                  <td className="p-2">{p.users?.username || "—"}</td>
                  <td className="p-2">
                    {new Date(p.updated_at || p.created_at).toLocaleString()}
                  </td>
                  <td className="p-2">{p.views ?? p.view_count ?? 0}</td>
                  {canModerate && (
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <select
                          className="border border-gray-200 rounded-md px-2 py-1 text-xs"
                          value={p.status}
                          onChange={(e) =>
                            onUpdatePost(p.id, { status: e.target.value })
                          }
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                        <button
                          className="text-xs px-2 py-1 border border-gray-200 rounded-md"
                          onClick={() =>
                            onUpdatePost(p.id, { is_featured: !p.is_featured })
                          }
                        >
                          {p.is_featured ? "Unfeature" : "Feature"}
                        </button>
                        {isAdmin && (
                          <button
                            className="text-xs px-2 py-1 border border-gray-200 rounded-md"
                            onClick={() => onDeletePost(p.id)}
                          >
                            Delete
                          </button>
                        )}
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
            Prev
          </button>
          <button
            className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {canModerate && (
        <div className="border border-gray-200 rounded-lg p-3 bg-white">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Bulk actions:</span>
            <button
              disabled={selectedIds.length === 0}
              className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50"
              onClick={() => onBulk("publish")}
            >
              Publish
            </button>
            <button
              disabled={selectedIds.length === 0}
              className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50"
              onClick={() => onBulk("unpublish")}
            >
              Unpublish
            </button>
            <button
              disabled={selectedIds.length === 0}
              className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50"
              onClick={() => onBulk("archive")}
            >
              Archive
            </button>
            <button
              disabled={selectedIds.length === 0}
              className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50"
              onClick={() => onBulk("feature")}
            >
              Feature
            </button>
            <button
              disabled={selectedIds.length === 0}
              className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50"
              onClick={() => onBulk("unfeature")}
            >
              Unfeature
            </button>
            {isAdmin && (
              <button
                disabled={selectedIds.length === 0}
                className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50"
                onClick={() => onBulk("delete")}
              >
                Delete
              </button>
            )}
            <span className="ml-auto text-gray-600">
              Selected: {selectedIds.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
