"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Shield,
  User,
  Mail,
  Calendar,
  MoreVertical,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  UserCheck,
  UserX,
  Clock,
  Building,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface UserData {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: "user" | "moderator" | "admin";
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
}

interface UserFilters {
  search: string;
  role: string;
  status: string;
  verified: string;
  banned: string;
  business: string;
  dateFrom: string;
  dateTo: string;
  lastActiveFrom: string;
  lastActiveTo: string;
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    role: "",
    status: "",
    verified: "",
    banned: "",
    business: "",
    dateFrom: "",
    dateTo: "",
    lastActiveFrom: "",
    lastActiveTo: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkActionRole, setBulkActionRole] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [showStats, setShowStats] = useState(false);
  const { session } = useAuthStore();

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.page]);

  const fetchUsers = async () => {
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
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
        ...(filters.verified && { verified: filters.verified }),
        ...(filters.banned && { banned: filters.banned }),
        ...(filters.business && { business: filters.business }),
        ...(filters.dateFrom && { date_from: filters.dateFrom }),
        ...(filters.dateTo && { date_to: filters.dateTo }),
        ...(filters.lastActiveFrom && {
          last_active_from: filters.lastActiveFrom,
        }),
        ...(filters.lastActiveTo && { last_active_to: filters.lastActiveTo }),
      });

      const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.data.users);
      setPagination((prev) => ({
        ...prev,
        total: data.data.pagination.total,
        totalPages: data.data.pagination.totalPages,
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedUsers((prev) =>
      prev.length === users.length ? [] : users.map((user) => user.id)
    );
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;

    try {
      setActionLoading("bulk");
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

      const requestBody: any = {
        user_ids: selectedUsers,
        action: bulkAction,
      };

      if (bulkAction === "change_role" && bulkActionRole) {
        requestBody.role = bulkActionRole;
      }

      const response = await fetch(`${API_BASE_URL}/admin/users/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to perform bulk action");
      }

      // Reset selections and refresh
      setSelectedUsers([]);
      setBulkAction("");
      setBulkActionRole("");
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportUsers = async () => {
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

      const params = new URLSearchParams({
        format: "csv",
        filters: JSON.stringify(filters),
      });

      const response = await fetch(
        `${API_BASE_URL}/admin/users/export?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export users");
      }

      // Download the CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchStats = async () => {
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

      const response = await fetch(`${API_BASE_URL}/admin/users/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user statistics");
      }

      const result = await response.json();
      setStats(result.data.stats);
    } catch (err: any) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleUserAction = async (
    userId: string,
    action: string,
    data?: any
  ) => {
    try {
      setActionLoading(userId);
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

      const endpoint = `${API_BASE_URL}/admin/users/${userId}`;
      const method = "PUT";
      let body = {};

      switch (action) {
        case "toggle_status":
          body = { is_active: !users.find((u) => u.id === userId)?.is_active };
          break;
        case "change_role":
          body = { role: data.role };
          break;
        case "verify":
          body = { is_verified: true };
          break;
        default:
          throw new Error("Unknown action");
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      // Refresh users list
      fetchUsers();
      setShowUserModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "moderator":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  if (loading && users.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              User Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {pagination.total} total users
            </div>
            <button
              onClick={() => {
                setShowStats(!showStats);
                if (!showStats && !stats) {
                  fetchStats();
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showStats ? "Hide Stats" : "Show Stats"}
            </button>
            <button
              onClick={handleExportUsers}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Users className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {showStats && stats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            User Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.total_users}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <UserCheck className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">
                    Active Users
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {stats.active_users}
                  </p>
                  <p className="text-xs text-green-600">
                    {stats.activity_rate}% active
                  </p>
                </div>
              </div>
            </div>

            {/* Verified Users */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">
                    Verified
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.verified_users}
                  </p>
                  <p className="text-xs text-purple-600">
                    {stats.verification_rate}% verified
                  </p>
                </div>
              </div>
            </div>

            {/* New This Week */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600">
                    New This Week
                  </p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {stats.new_users_this_week}
                  </p>
                </div>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-indigo-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-indigo-600">Admins</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {stats.admin_users}
                  </p>
                </div>
              </div>
            </div>

            {/* Moderators */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <User className="w-8 h-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-600">
                    Moderators
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats.moderator_users}
                  </p>
                </div>
              </div>
            </div>

            {/* Business Users */}
            <div className="bg-teal-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Building className="w-8 h-8 text-teal-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-teal-600">Business</p>
                  <p className="text-2xl font-bold text-teal-900">
                    {stats.business_users}
                  </p>
                </div>
              </div>
            </div>

            {/* Banned Users */}
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <UserX className="w-8 h-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">Banned</p>
                  <p className="text-2xl font-bold text-red-900">
                    {stats.banned_users}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange("role", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <Settings className="w-4 h-4 mr-2" />
            Advanced
            {showAdvancedFilters ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1" />
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Verified Filter */}
              <select
                value={filters.verified}
                onChange={(e) => handleFilterChange("verified", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>

              {/* Banned Filter */}
              <select
                value={filters.banned}
                onChange={(e) => handleFilterChange("banned", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Users</option>
                <option value="banned">Banned</option>
                <option value="not_banned">Not Banned</option>
              </select>

              {/* Business Filter */}
              <select
                value={filters.business}
                onChange={(e) => handleFilterChange("business", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Account Types</option>
                <option value="business">Business</option>
                <option value="personal">Personal</option>
              </select>

              {/* Date From */}
              <input
                type="date"
                placeholder="Joined from"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              {/* Date To */}
              <input
                type="date"
                placeholder="Joined to"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setFilters({
                    search: "",
                    role: "",
                    status: "",
                    verified: "",
                    banned: "",
                    business: "",
                    dateFrom: "",
                    dateTo: "",
                    lastActiveFrom: "",
                    lastActiveTo: "",
                  });
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-blue-500"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                Quick Actions:
              </span>
              <button
                onClick={() => {
                  setFilters((prev) => ({ ...prev, status: "inactive" }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200"
              >
                View Inactive Users
              </button>
              <button
                onClick={() => {
                  setFilters((prev) => ({ ...prev, verified: "unverified" }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200"
              >
                View Unverified Users
              </button>
              <button
                onClick={() => {
                  setFilters((prev) => ({ ...prev, banned: "banned" }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200"
              >
                View Banned Users
              </button>
              <button
                onClick={() => {
                  setFilters((prev) => ({ ...prev, role: "admin" }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
              >
                View Admins
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {selectedUsers.length} users selected
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Bulk Actions</option>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="verify">Verify</option>
                <option value="change_role">Change Role</option>
                <option value="ban">Ban</option>
                <option value="unban">Unban</option>
              </select>

              {/* Role selector for bulk role change */}
              {bulkAction === "change_role" && (
                <select
                  value={bulkActionRole}
                  onChange={(e) => setBulkActionRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Role</option>
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              )}

              <button
                onClick={handleBulkAction}
                disabled={
                  !bulkAction ||
                  (bulkAction === "change_role" && !bulkActionRole) ||
                  actionLoading === "bulk"
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {actionLoading === "bulk" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Apply"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {users.length === 0 ? (
          <div className="text-center p-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-600">
              {Object.values(filters).some((f) => f)
                ? "Try adjusting your search or filters"
                : "No users available"}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.length === users.length && users.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-3">User</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-2">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Checkbox */}
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    {/* User Info */}
                    <div className="col-span-3">
                      <div className="flex items-center">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {user.full_name || user.username}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="col-span-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                            user.is_active
                          )}`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                        {user.is_verified && (
                          <CheckCircle
                            className="w-4 h-4 text-green-500"
                            title="Verified"
                          />
                        )}
                        {(user as any).is_banned && (
                          <Ban
                            className="w-4 h-4 text-red-500"
                            title="Banned"
                          />
                        )}
                        {(user as any).is_business && (
                          <Building
                            className="w-4 h-4 text-blue-500"
                            title="Business Account"
                          />
                        )}
                      </div>
                    </div>

                    {/* Joined Date */}
                    <div className="col-span-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Edit className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Edit Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit User: {selectedUser.username}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  defaultValue={selectedUser.role}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) =>
                    handleUserAction(selectedUser.id, "change_role", {
                      role: e.target.value,
                    })
                  }
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Account Status
                </span>
                <button
                  onClick={() =>
                    handleUserAction(selectedUser.id, "toggle_status")
                  }
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedUser.is_active
                      ? "bg-red-100 text-red-800 hover:bg-red-200"
                      : "bg-green-100 text-green-800 hover:bg-green-200"
                  }`}
                >
                  {selectedUser.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>

              {!selectedUser.is_verified && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Verification
                  </span>
                  <button
                    onClick={() => handleUserAction(selectedUser.id, "verify")}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold hover:bg-blue-200"
                  >
                    Verify User
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
