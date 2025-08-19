"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Flag,
  Clock,
  User,
  AlertTriangle,
  MessageSquare,
  ShoppingBag,
  Building,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  content_type: string;
  content_id: string;
  reason: string;
  description?: string;
  status: "pending" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high";
  resolved_by?: string;
  resolved_at?: string;
  action_taken?: string;
  moderator_notes?: string;
  created_at: string;
  updated_at: string;
  reporter?: {
    id: string;
    username: string;
    full_name?: string;
  };
  reported_user?: {
    id: string;
    username: string;
    full_name?: string;
  };
}

interface PendingContent {
  id: string;
  type: "marketplace" | "directory" | "blog";
  title: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  author?: {
    id: string;
    username: string;
    full_name?: string;
  };
}

const AdminModerationPage: React.FC = () => {
  const { session } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"reports" | "pending">("reports");
  const [reports, setReports] = useState<Report[]>([]);
  const [pendingContent, setPendingContent] = useState<PendingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    type: "",
  });

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReports();
    } else {
      fetchPendingContent();
    }
  }, [activeTab, filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let token = session?.accessToken;

      // Fallback: get token from localStorage if session is not yet hydrated
      if (!token) {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            token = parsed.state.session?.accessToken;
          } catch (e) {
            console.error("Error parsing auth storage:", e);
          }
        }
      }

      if (!token) {
        throw new Error("No authentication token available");
      }

      const params = new URLSearchParams({
        page: "1",
        limit: "20",
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.type && { type: filters.type }),
      });

      const response = await fetch(`${API_BASE_URL}/admin/reports?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const data = await response.json();
      setReports(data.data.reports);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingContent = async () => {
    try {
      setLoading(true);
      let token = session?.accessToken;

      // Fallback: get token from localStorage if session is not yet hydrated
      if (!token) {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            token = parsed.state.session?.accessToken;
          } catch (e) {
            console.error("Error parsing auth storage:", e);
          }
        }
      }

      if (!token) {
        throw new Error("No authentication token available");
      }

      // Fetch pending content from different sources
      const [marketplaceRes, directoryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/content/marketplace?status=pending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/admin/content/directory?status=pending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const marketplaceData = marketplaceRes.ok
        ? await marketplaceRes.json()
        : { data: { listings: [] } };
      const directoryData = directoryRes.ok
        ? await directoryRes.json()
        : { data: { businesses: [] } };

      const combined = [
        ...marketplaceData.data.listings.map((item: any) => ({
          ...item,
          type: "marketplace",
        })),
        ...directoryData.data.businesses.map((item: any) => ({
          ...item,
          type: "directory",
          title: item.name,
        })),
      ];

      setPendingContent(combined);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (
    reportId: string,
    action: "resolve" | "dismiss",
    actionTaken?: string,
    notes?: string
  ) => {
    try {
      let token = session?.accessToken;

      // Fallback: get token from localStorage if session is not yet hydrated
      if (!token) {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            token = parsed.state.session?.accessToken;
          } catch (e) {
            console.error("Error parsing auth storage:", e);
          }
        }
      }

      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/reports/${reportId}/resolve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action_taken: actionTaken || action,
            notes: notes || "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${action} report`);
      }

      fetchReports();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleContentAction = async (
    contentId: string,
    type: string,
    action: "approve" | "reject",
    notes?: string
  ) => {
    try {
      let token = session?.accessToken;

      // Fallback: get token from localStorage if session is not yet hydrated
      if (!token) {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            token = parsed.state.session?.accessToken;
          } catch (e) {
            console.error("Error parsing auth storage:", e);
          }
        }
      }

      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/content/${type}/${contentId}/${action}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notes: notes || "" }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${action} content`);
      }

      fetchPendingContent();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "marketplace":
        return ShoppingBag;
      case "directory":
        return Building;
      case "forum":
        return MessageSquare;
      default:
        return Flag;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "dismissed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const tabs = [
    {
      id: "reports",
      name: "Reports",
      icon: Flag,
      count: reports.filter((r) => r.status === "pending").length,
    },
    {
      id: "pending",
      name: "Pending Content",
      icon: Clock,
      count: pendingContent.length,
    },
  ];

  if (loading && reports.length === 0 && pendingContent.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">
            Loading moderation queue...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Shield className="w-8 h-8 mr-3 text-blue-600" />
          Moderation Queue
        </h1>
        <p className="text-gray-600 mt-2">
          Review reports and moderate pending content
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                  {tab.count > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          {activeTab === "reports" && (
            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, priority: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          )}

          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, type: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="marketplace">Marketplace</option>
            <option value="directory">Directory</option>
            <option value="forum">Forum</option>
            <option value="blog">Blog</option>
          </select>
        </div>
      </div>

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {reports.length === 0 ? (
            <div className="text-center p-12">
              <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No reports found
              </h3>
              <p className="text-gray-600">
                {Object.values(filters).some((f) => f)
                  ? "Try adjusting your filters"
                  : "All reports have been handled"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reports.map((report) => {
                const TypeIcon = getContentTypeIcon(report.content_type);
                return (
                  <div key={report.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <TypeIcon className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-sm font-medium text-gray-900">
                              {report.reason
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </h3>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                                report.priority
                              )}`}
                            >
                              {report.priority}
                            </span>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                report.status
                              )}`}
                            >
                              {report.status}
                            </span>
                          </div>

                          {report.description && (
                            <p className="text-sm text-gray-600 mb-3">
                              {report.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              Reported by{" "}
                              {report.reporter?.full_name ||
                                report.reporter?.username}
                            </span>
                            <span>
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                            <span className="capitalize">
                              {report.content_type} content
                            </span>
                          </div>

                          {report.reported_user && (
                            <div className="mt-2 text-xs text-gray-500">
                              Target user:{" "}
                              {report.reported_user.full_name ||
                                report.reported_user.username}
                            </div>
                          )}
                        </div>
                      </div>

                      {report.status === "pending" && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleReportAction(
                                report.id,
                                "resolve",
                                "content_removed"
                              )
                            }
                            className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </button>
                          <button
                            onClick={() =>
                              handleReportAction(
                                report.id,
                                "dismiss",
                                "no_action_needed"
                              )
                            }
                            className="flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-sm"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Dismiss
                          </button>
                          <button className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 text-sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pending Content Tab */}
      {activeTab === "pending" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {pendingContent.length === 0 ? (
            <div className="text-center p-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pending content
              </h3>
              <p className="text-gray-600">All content has been reviewed</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingContent.map((content) => {
                const TypeIcon = getContentTypeIcon(content.type);
                return (
                  <div key={content.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <TypeIcon className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-sm font-medium text-gray-900">
                              {content.title}
                            </h3>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {content.type}
                            </span>
                          </div>

                          {content.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {content.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {content.author?.full_name ||
                                content.author?.username ||
                                "Unknown"}
                            </span>
                            <span>
                              {new Date(
                                content.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handleContentAction(
                              content.id,
                              content.type,
                              "approve"
                            )
                          }
                          className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 text-sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleContentAction(
                              content.id,
                              content.type,
                              "reject"
                            )
                          }
                          className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 text-sm"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                        <button className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 text-sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminModerationPage;
