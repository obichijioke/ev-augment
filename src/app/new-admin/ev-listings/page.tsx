"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { adminApi } from "@/services/adminApi";
import { useUserRole } from "@/hooks/useUserRole";
import VehicleManagementForm from "@/components/admin/VehicleManagementForm";
import { fetchVehicleDetails } from "@/services/vehicleApi";

// helper fetchers for dropdowns
async function fetchManufacturers() {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api"
    }/vehicle-listings/manufacturers`
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

async function fetchModels(manufacturerId: string) {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api"
    }/vehicle-listings/manufacturers/${manufacturerId}/models`
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

type Listing = any;

export default function AdminEvListingsPage() {
  const { isAdmin } = useUserRole();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<any>({
    search: "",
    manufacturer: "",
    model: "",
    year: "",
    status: "",
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("");

  // Create/Edit form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [editingFull, setEditingFull] = useState<any | null>(null);

  // initialize from URL
  useEffect(() => {
    const sp = searchParams;
    if (!sp) return;
    const nextFilters: any = { ...filters };
    [
      "search",
      "manufacturer",
      "manufacturer_id",
      "model",
      "model_id",
      "year",
      "status",
      "sortBy",
      "sortOrder",
    ].forEach((k) => {
      const v = sp.get(k);
      if (v !== null) {
        if (k === "manufacturer_id") nextFilters.manufacturer = v;
        else if (k === "model_id") nextFilters.model = v;
        else nextFilters[k] = v;
      }
    });
    const p = sp.get("page");
    const l = sp.get("limit");
    setFilters(nextFilters);
    if (p) setPage(parseInt(p, 10) || 1);
    if (l) setLimit(parseInt(l, 10) || 20);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync to URL
  useEffect(() => {
    const sp = new URLSearchParams();
    const params: Record<string, any> = { ...filters, page, limit };
    // map to backend-expected keys
    if (params.manufacturer) {
      params.manufacturer_id = params.manufacturer;
      delete params.manufacturer;
    }
    if (params.model) {
      params.model_id = params.model;
      delete params.model;
    }
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
    });
    router.replace(`${pathname}?${sp.toString()}`);
  }, [filters, page, limit, pathname, router]);

  useEffect(() => {
    fetchManufacturers()
      .then(setManufacturers)
      .catch(() => setManufacturers([]));
  }, []);

  useEffect(() => {
    const selected = manufacturers.find((m) => m.id === filters.manufacturer);
    if (filters.manufacturer && selected) {
      fetchModels(filters.manufacturer)
        .then(setModels)
        .catch(() => setModels([]));
    } else {
      setModels([]);
    }
  }, [filters.manufacturer, manufacturers]);

  const loadListings = () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    const params: any = { ...filters, page, limit };
    if (params.manufacturer) {
      params.manufacturer_id = params.manufacturer;
      delete params.manufacturer;
    }
    if (params.model) {
      params.model_id = params.model;
      delete params.model;
    }
    adminApi
      .getEvListings(params)
      .then((res: any) => {
        setListings(res.data || []);
        setSelectedIds([]);
        setTotalPages(res.pagination?.totalPages || res.pagination?.pages || 1);
      })
      .catch((e) => {
        const msg = e?.message || "Failed to load EV listings";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAdmin,
    page,
    limit,
    filters.search,
    filters.manufacturer,
    filters.model,
    filters.year,
    filters.status,
    filters.sortBy,
    filters.sortOrder,
  ]);

  // Prefill specs for editing
  useEffect(() => {
    if (!editing?.id) {
      setEditingFull(null);
      return;
    }
    fetchVehicleDetails(editing.id)
      .then((res) => setEditingFull(res.data))
      .catch(() => setEditingFull(editing));
  }, [editing?.id]);

  const onToggleActive = async (id: string, current: boolean) => {
    try {
      await adminApi.updateEvListing(id, { is_active: !current });
      toast.success(!current ? "Activated" : "Deactivated");
      loadListings();
    } catch (e: any) {
      const msg = e.message || "Failed to update listing";
      setError(msg);
      toast.error(msg);
    }
  };

  const onToggleFeatured = async (id: string, current: boolean) => {
    try {
      await adminApi.updateEvListing(id, { is_featured: !current });
      toast.success(!current ? "Featured" : "Unfeatured");
      loadListings();
    } catch (e: any) {
      const msg = e.message || "Failed to update listing";
      setError(msg);
      toast.error(msg);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this EV listing? This cannot be undone.")) return;
    try {
      await adminApi.deleteEvListing(id);
      toast.success("Listing deleted");
      loadListings();
    } catch (e: any) {
      const msg = e.message || "Failed to delete listing";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-semibold">EV Listings</h1>
        <div className="flex items-center gap-2">
          <input
            className="pl-3 pr-3 py-2 border border-gray-200 rounded-md text-sm"
            placeholder="Search name, description"
            value={filters.search}
            onChange={(e) =>
              setFilters((f: any) => ({ ...f, search: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && loadListings()}
          />
          <button
            className="px-3 py-2 border border-gray-200 rounded-md text-sm"
            onClick={() => loadListings()}
          >
            Apply
          </button>
          <button
            className="px-3 py-2 border border-gray-200 rounded-md text-sm"
            onClick={() => {
              setEditing(null);
              setEditingFull(null);
              setShowForm(true);
            }}
          >
            New listing
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          className="border border-gray-200 rounded-md px-2 py-1 text-sm"
          value={filters.status}
          onChange={(e) =>
            setFilters((f: any) => ({ ...f, status: e.target.value }))
          }
        >
          <option value="">Any status</option>
          <option value="available">Available</option>
          <option value="coming_soon">Coming soon</option>
          <option value="discontinued">Discontinued</option>
        </select>
        {/* Manufacturer dropdown (by id) */}
        <select
          className="border border-gray-200 rounded-md px-2 py-1 text-sm"
          value={filters.manufacturer}
          onChange={(e) =>
            setFilters((f: any) => ({
              ...f,
              manufacturer: e.target.value,
              model: "",
            }))
          }
        >
          <option value="">All manufacturers</option>
          {manufacturers.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {/* Model dropdown (by id) */}
        <select
          className="border border-gray-200 rounded-md px-2 py-1 text-sm"
          value={filters.model}
          onChange={(e) =>
            setFilters((f: any) => ({ ...f, model: e.target.value }))
          }
          disabled={!filters.manufacturer || models.length === 0}
        >
          <option value="">All models</option>
          {models.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          className="border border-gray-200 rounded-md px-2 py-1 text-sm"
          value={filters.sortBy}
          onChange={(e) =>
            setFilters((f: any) => ({ ...f, sortBy: e.target.value }))
          }
        >
          <option value="created_at">Created</option>
          <option value="updated_at">Updated</option>
          <option value="year">Year</option>
        </select>
        <select
          className="border border-gray-200 rounded-md px-2 py-1 text-sm"
          value={filters.sortOrder}
          onChange={(e) =>
            setFilters((f: any) => ({ ...f, sortOrder: e.target.value }))
          }
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      {/* Bulk upload */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
          className="text-sm"
        />
        <button
          className="px-3 py-2 border border-gray-200 rounded-md text-sm"
          disabled={!bulkFile}
          onClick={async () => {
            if (!bulkFile) return;
            try {
              await (adminApi as any).bulkUploadEvListings(bulkFile);
              setBulkFile(null);
              (
                document.querySelector('input[type="file"]') as HTMLInputElement
              ).value = "";
              toast.success("Bulk upload completed");
              loadListings();
            } catch (e: any) {
              toast.error(e?.message || "Bulk upload failed");
            }
          }}
        >
          Upload CSV
        </button>
      </div>

      {/* Bulk action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600">
          Selected: {selectedIds.length}
        </span>
        <button
          disabled={selectedIds.length === 0}
          className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50 text-sm"
          onClick={async () => {
            try {
              await (adminApi as any).bulkEvListings({
                listing_ids: selectedIds,
                action: "activate",
              });
              setSelectedIds([]);
              toast.success("Activated");
              loadListings();
            } catch (e: any) {
              toast.error(e?.message || "Bulk activate failed");
            }
          }}
        >
          Activate
        </button>
        <button
          disabled={selectedIds.length === 0}
          className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50 text-sm"
          onClick={async () => {
            try {
              await (adminApi as any).bulkEvListings({
                listing_ids: selectedIds,
                action: "deactivate",
              });
              setSelectedIds([]);
              toast.success("Deactivated");
              loadListings();
            } catch (e: any) {
              toast.error(e?.message || "Bulk deactivate failed");
            }
          }}
        >
          Deactivate
        </button>
        <button
          disabled={selectedIds.length === 0}
          className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50 text-sm"
          onClick={async () => {
            try {
              await (adminApi as any).bulkEvListings({
                listing_ids: selectedIds,
                action: "feature",
              });
              setSelectedIds([]);
              toast.success("Featured");
              loadListings();
            } catch (e: any) {
              toast.error(e?.message || "Bulk feature failed");
            }
          }}
        >
          Feature
        </button>
        <button
          disabled={selectedIds.length === 0}
          className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50 text-sm"
          onClick={async () => {
            try {
              await (adminApi as any).bulkEvListings({
                listing_ids: selectedIds,
                action: "unfeature",
              });
              setSelectedIds([]);
              toast.success("Unfeatured");
              loadListings();
            } catch (e: any) {
              toast.error(e?.message || "Bulk unfeature failed");
            }
          }}
        >
          Unfeature
        </button>
        <div className="flex items-center gap-2">
          <select
            className="border border-gray-200 rounded-md px-2 py-1 text-sm"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
          >
            <option value="">Set status…</option>
            <option value="available">Available</option>
            <option value="coming_soon">Coming Soon</option>
            <option value="discontinued">Discontinued</option>
          </select>
          <button
            disabled={selectedIds.length === 0 || !bulkStatus}
            className="px-2 py-1 border border-gray-200 rounded disabled:opacity-50 text-sm"
            onClick={async () => {
              try {
                await (adminApi as any).bulkEvListings({
                  listing_ids: selectedIds,
                  action: "set_status",
                  status: bulkStatus,
                });
                setSelectedIds([]);
                setBulkStatus("");
                toast.success("Status updated");
                loadListings();
              } catch (e: any) {
                toast.error(e?.message || "Bulk status update failed");
              }
            }}
          >
            Apply
          </button>
        </div>
      </div>

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
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === listings.length &&
                    listings.length > 0
                  }
                  onChange={(e) =>
                    setSelectedIds(
                      e.target.checked ? listings.map((l: any) => l.id) : []
                    )
                  }
                />
              </th>
              <th className="p-2">Name</th>
              <th className="p-2">Model</th>
              <th className="p-2">Year</th>
              <th className="p-2">Status</th>
              <th className="p-2">Featured</th>
              <th className="p-2">Active</th>
              <th className="p-2">Updated</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-gray-500">
                  No listings found
                </td>
              </tr>
            ) : (
              listings.map((l: any) => (
                <tr key={l.id} className="border-top border-gray-200">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(l.id)}
                      onChange={(e) =>
                        setSelectedIds((prev) =>
                          e.target.checked
                            ? [...prev, l.id]
                            : prev.filter((id) => id !== l.id)
                        )
                      }
                    />
                  </td>
                  <td className="p-2">{l.name}</td>
                  <td className="p-2">
                    {l.model?.manufacturer?.name} {l.model?.name}
                  </td>
                  <td className="p-2">{l.year}</td>
                  <td className="p-2">{l.availability_status}</td>
                  <td className="p-2">{l.is_featured ? "Yes" : "No"}</td>
                  <td className="p-2">{l.is_active ? "Yes" : "No"}</td>
                  <td className="p-2">
                    {new Date(l.updated_at || l.created_at).toLocaleString()}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs px-2 py-1 border border-gray-200 rounded-md"
                        onClick={() => onToggleActive(l.id, l.is_active)}
                      >
                        {l.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className="text-xs px-2 py-1 border border-gray-200 rounded-md"
                        onClick={() => onToggleFeatured(l.id, l.is_featured)}
                      >
                        {l.is_featured ? "Unfeature" : "Feature"}
                      </button>
                      <button
                        className="text-xs px-2 py-1 border border-gray-200 rounded-md"
                        onClick={() => {
                          setEditing(l);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs px-2 py-1 border border-gray-200 rounded-md"
                        onClick={() => onDelete(l.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowForm(false);
              setEditing(null);
              setEditingFull(null);
            }}
          />
          {/* Modal content */}
          <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
            <VehicleManagementForm
              vehicle={editingFull || editing || undefined}
              onSuccess={() => {
                setShowForm(false);
                setEditing(null);
                setEditingFull(null);
                loadListings();
              }}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
                setEditingFull(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
