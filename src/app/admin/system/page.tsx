"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Activity,
  Database,
  Shield,
  Clock,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Server,
  Loader2,
  Eye,
  Download,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    full_name?: string;
  };
}

const AdminSystemPage: React.FC = () => {
  const { session } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    "settings" | "audit" | "analytics"
  >("settings");
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(
    null
  );

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

  useEffect(() => {
    if (activeTab === "settings") {
      fetchSettings();
    } else if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
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

      const response = await fetch(`${API_BASE_URL}/admin/system/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch system settings");
      }

      const data = await response.json();
      setSettings(data.data.settings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
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

      const response = await fetch(
        `${API_BASE_URL}/admin/system/audit-logs?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await response.json();
      setAuditLogs(data.data.logs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingUpdate = async (settingId: string, newValue: string) => {
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

      const response = await fetch(`${API_BASE_URL}/admin/system/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          settings: [{ id: settingId, value: newValue }],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update setting");
      }

      fetchSettings();
      setEditingSetting(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const systemStats = [
    {
      title: "System Uptime",
      value: "99.9%",
      icon: Server,
      color: "green",
      description: "Last 30 days",
    },
    {
      title: "Database Size",
      value: "2.4 GB",
      icon: Database,
      color: "blue",
      description: "Total storage used",
    },
    {
      title: "Active Sessions",
      value: "1,247",
      icon: Activity,
      color: "purple",
      description: "Current user sessions",
    },
    {
      title: "Security Events",
      value: "3",
      icon: Shield,
      color: "red",
      description: "Last 24 hours",
    },
  ];

  const tabs = [
    { id: "settings", name: "Settings", icon: Settings },
    { id: "audit", name: "Audit Logs", icon: FileText },
    { id: "analytics", name: "Analytics", icon: TrendingUp },
  ];

  const getActionIcon = (action: string) => {
    switch (action) {
      case "user_created":
      case "user_updated":
        return User;
      case "blog_post_created":
      case "blog_post_updated":
      case "blog_post_deleted":
        return FileText;
      case "login":
      case "logout":
        return Shield;
      default:
        return Activity;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("created")) return "text-green-600";
    if (action.includes("updated")) return "text-blue-600";
    if (action.includes("deleted")) return "text-red-600";
    if (action.includes("login")) return "text-purple-600";
    return "text-gray-600";
  };

  if (loading && settings.length === 0 && auditLogs.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading system data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Settings className="w-8 h-8 mr-3 text-blue-600" />
          System Management
        </h1>
        <p className="text-gray-600 mt-2">
          Configure system settings, view audit logs, and monitor analytics
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

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {systemStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              System Settings
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure platform-wide settings and preferences
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {settings.map((setting) => (
              <div key={setting.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {setting.key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {setting.description}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className="text-xs text-gray-500">
                        Updated:{" "}
                        {new Date(setting.updated_at).toLocaleDateString()}
                      </span>
                      {setting.is_public && (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Public
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {editingSetting?.id === setting.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          defaultValue={setting.value}
                          className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSettingUpdate(
                                setting.id,
                                e.currentTarget.value
                              );
                            } else if (e.key === "Escape") {
                              setEditingSetting(null);
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => setEditingSetting(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          {setting.value}
                        </span>
                        <button
                          onClick={() => setEditingSetting(setting)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Audit Logs</h2>
              <p className="text-sm text-gray-600 mt-1">
                Track all administrative actions and system events
              </p>
            </div>
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>

          <div className="divide-y divide-gray-200">
            {auditLogs.length === 0 ? (
              <div className="text-center p-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No audit logs found
                </h3>
                <p className="text-gray-600">
                  Audit logs will appear here as actions are performed
                </p>
              </div>
            ) : (
              auditLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                return (
                  <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <ActionIcon
                          className={`w-4 h-4 ${getActionColor(log.action)}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {log.action
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                          <span className="text-xs text-gray-500">
                            {log.entity_type && `on ${log.entity_type}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {log.user?.full_name ||
                              log.user?.username ||
                              "System"}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                          {log.ip_address && <span>IP: {log.ip_address}</span>}
                        </div>
                        {log.details && (
                          <div className="mt-2">
                            <details className="text-xs text-gray-600">
                              <summary className="cursor-pointer hover:text-gray-800">
                                View details
                              </summary>
                              <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Advanced Analytics
            </h3>
            <p className="text-gray-600 mb-4">
              Detailed analytics and reporting features coming soon
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  User Analytics
                </h4>
                <p className="text-sm text-gray-600">
                  Track user engagement, registration trends, and activity
                  patterns
                </p>
              </div>
              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Content Analytics
                </h4>
                <p className="text-sm text-gray-600">
                  Monitor content performance, views, and user interactions
                </p>
              </div>
              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  System Performance
                </h4>
                <p className="text-sm text-gray-600">
                  Monitor system health, response times, and resource usage
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystemPage;
