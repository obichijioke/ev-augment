import { ApiError } from "./adminVehicleApi";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return null;
    const authData = JSON.parse(raw);
    return authData?.state?.session?.accessToken || null;
  } catch (e) {
    console.error("Failed to parse auth token", e);
    return null;
  }
}

async function apiGet<T>(endpoint: string): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw {
      success: false,
      message: errorData.message || `HTTP error! status: ${res.status}`,
      error: { status: res.status, code: errorData.code },
    } as ApiError;
  }
  return res.json();
}

async function apiPut<T>(endpoint: string, body?: any): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw {
      success: false,
      message: errorData.message || `HTTP error! status: ${res.status}`,
      error: { status: res.status, code: errorData.code },
    } as ApiError;
  }
  return res.json();
}

async function apiPost<T>(endpoint: string, body?: any): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw {
      success: false,
      message: errorData.message || `HTTP error! status: ${res.status}`,
      error: { status: res.status, code: errorData.code },
    } as ApiError;
  }
  return res.json();
}

export type Timeframe = "7d" | "30d" | "90d" | "1y";

export interface DashboardStatsResponse {
  success: boolean;
  data: {
    stats: {
      users: { total: number; new: number; active: number };
      content: {
        vehicles: { total: number; new: number };
        marketplace_listings: { total: number; new: number };
        forum_posts: { total: number; new: number };
      };
      moderation: {
        pending_listings: number;
        pending_directory: number;
        reported_content: number;
      };
      revenue: { total: number; recent: number };
      timeframe: Timeframe;
    };
  };
}

export const adminApi = {
  getDashboard: (timeframe: Timeframe = "30d") =>
    apiGet<DashboardStatsResponse>(`/admin/dashboard?timeframe=${timeframe}`),

  // Users
  getUsers: (params: Record<string, any>) => {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiGet(`/admin/users${suffix}`);
  },
  getUser: (id: string) => apiGet(`/admin/users/${id}`),
  getUserStats: () => apiGet(`/admin/users/stats`),
  updateUser: (id: string, body: any) => apiPut(`/admin/users/${id}`, body),
  bulkUsers: (body: any) => apiPost(`/admin/users/bulk`, body),

  // Blog (admin)
  getBlogPosts: (params: Record<string, any>) => {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiGet(`/admin/blog/posts${suffix}`);
  },
  updateBlogPost: (id: string, body: any) =>
    apiPut(`/admin/blog/posts/${id}`, body),
  deleteBlogPost: (id: string) =>
    fetch(`${API_BASE_URL}/admin/blog/posts/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(getAccessToken()
          ? { Authorization: `Bearer ${getAccessToken()}` }
          : {}),
      },
    }).then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw {
          success: false,
          message: errorData.message || `HTTP error! status: ${res.status}`,
          error: { status: res.status, code: errorData.code },
        } as ApiError;
      }
      return res.json();
    }),
  bulkBlogPosts: (body: any) => apiPost(`/admin/blog/posts/bulk`, body),

  // EV Listings (admin)
  getEvListings: (params: Record<string, any>) => {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiGet(`/admin/vehicle-listings${suffix}`);
  },
  updateEvListing: (id: string, body: any) =>
    apiPut(`/admin/vehicle-listings/${id}`, body),
  deleteEvListing: (id: string) =>
    fetch(`${API_BASE_URL}/admin/vehicle-listings/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(getAccessToken()
          ? { Authorization: `Bearer ${getAccessToken()}` }
          : {}),
      },
    }).then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw {
          success: false,
          message: errorData.message || `HTTP error! status: ${res.status}`,
          error: { status: res.status, code: errorData.code },
        } as ApiError;
      }
      return res.json();
    }),
  bulkEvListings: (body: any) => apiPost(`/admin/vehicle-listings/bulk`, body),
  bulkUploadEvListings: async (file: File) => {
    const token = getAccessToken();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(
      `${API_BASE_URL}/admin/vehicle-listings/bulk-upload`,
      {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      }
    );
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw {
        success: false,
        message: errorData.message || `HTTP error! status: ${res.status}`,
        error: { status: res.status, code: errorData.code },
      } as ApiError;
    }
    return res.json();
  },

  // Moderation
  getPendingContent: (
    type?: "marketplace" | "directory",
    page?: number,
    limit?: number
  ) => {
    const qs = new URLSearchParams();
    if (type) qs.set("type", type);
    if (page) qs.set("page", String(page));
    if (limit) qs.set("limit", String(limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiGet(`/admin/content/pending${suffix}`);
  },
  approveContent: (type: string, id: string, notes?: string) =>
    apiPut(`/admin/content/${type}/${id}/approve`, { notes }),
  rejectContent: (
    type: string,
    id: string,
    payload: { reason: string; notes?: string }
  ) => apiPut(`/admin/content/${type}/${id}/reject`, payload),

  // Forum
  getForumThreads: (params: Record<string, any>) => {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiGet(`/admin/forum/threads${suffix}`);
  },
  updateForumThread: (id: string, body: any) =>
    apiPut(`/admin/forum/threads/${id}`, body),
  bulkForumThreads: (body: any) => apiPost(`/admin/forum/threads/bulk`, body),

  // Reports
  getReports: (params: Record<string, any>) => {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiGet(`/admin/reports${suffix}`);
  },
  resolveReport: (id: string, body: any) =>
    apiPut(`/admin/reports/${id}/resolve`, body),

  // Admin-only
  getAnalytics: (params: Record<string, any>) => {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiGet(`/admin/analytics${suffix}`);
  },
  getSettings: () => apiGet(`/admin/system/settings`),
  updateSettings: (body: any) => apiPut(`/admin/system/settings`, body),
  getLogs: (params: Record<string, any>) => {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiGet(`/admin/logs${suffix}`);
  },
};
