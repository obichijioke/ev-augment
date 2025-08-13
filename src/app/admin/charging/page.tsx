"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Zap,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface ChargingStation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  network?: string;
  station_type?: string;
  connector_types?: string[];
  power_levels?: number[];
  pricing_info?: any;
  amenities?: string[];
  hours_of_operation?: any;
  phone?: string;
  website?: string;
  is_operational: boolean;
  last_verified?: string;
  created_at: string;
  updated_at: string;
}

interface ChargingFilters {
  search: string;
  network: string;
  status: string;
  state: string;
}

const AdminChargingPage: React.FC = () => {
  const { session } = useAuthStore();
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ChargingFilters>({
    search: "",
    network: "",
    status: "",
    state: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [showStationModal, setShowStationModal] = useState(false);
  const [editingStation, setEditingStation] = useState<ChargingStation | null>(
    null
  );

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

  useEffect(() => {
    fetchStations();
  }, [filters, pagination.page]);

  const fetchStations = async () => {
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
        ...(filters.network && { network: filters.network }),
        ...(filters.status && { status: filters.status }),
        ...(filters.state && { state: filters.state }),
      });

      const response = await fetch(
        `${API_BASE_URL}/admin/charging/stations?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch charging stations");
      }

      const data = await response.json();
      setStations(data.data.stations);
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

  const handleFilterChange = (key: keyof ChargingFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStationAction = async (
    stationId: string,
    action: string,
    data?: any
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

      const endpoint = `${API_BASE_URL}/admin/charging/stations/${stationId}`;
      let method = "PUT";
      let body = {};

      switch (action) {
        case "toggle_operational":
          const station = stations.find((s) => s.id === stationId);
          body = { is_operational: !station?.is_operational };
          break;
        case "verify":
          body = { last_verified: new Date().toISOString() };
          break;
        case "update":
          body = data;
          break;
        case "delete":
          method = "DELETE";
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
        ...(method !== "DELETE" && { body: JSON.stringify(body) }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} station`);
      }

      fetchStations();
      setShowStationModal(false);
      setEditingStation(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusBadgeColor = (isOperational: boolean) => {
    return isOperational
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const getNetworkColor = (network?: string) => {
    const colors: { [key: string]: string } = {
      Tesla: "bg-red-100 text-red-800",
      ChargePoint: "bg-blue-100 text-blue-800",
      "Electrify America": "bg-green-100 text-green-800",
      EVgo: "bg-purple-100 text-purple-800",
    };
    return colors[network || ""] || "bg-gray-100 text-gray-800";
  };

  if (loading && stations.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">
            Loading charging stations...
          </span>
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
              <MapPin className="w-8 h-8 mr-3 text-blue-600" />
              Charging Station Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage EV charging stations and infrastructure
            </p>
          </div>
          <button
            onClick={() => {
              setEditingStation(null);
              setShowStationModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Station
          </button>
        </div>
      </div>

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
              placeholder="Search stations..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Network Filter */}
          <select
            value={filters.network}
            onChange={(e) => handleFilterChange("network", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Networks</option>
            <option value="Tesla">Tesla</option>
            <option value="ChargePoint">ChargePoint</option>
            <option value="Electrify America">Electrify America</option>
            <option value="EVgo">EVgo</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="operational">Operational</option>
            <option value="non_operational">Non-Operational</option>
          </select>

          {/* State Filter */}
          <select
            value={filters.state}
            onChange={(e) => handleFilterChange("state", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All States</option>
            <option value="CA">California</option>
            <option value="TX">Texas</option>
            <option value="FL">Florida</option>
            <option value="NY">New York</option>
          </select>
        </div>
      </div>

      {/* Stations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {stations.length === 0 ? (
          <div className="text-center p-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No stations found
            </h3>
            <p className="text-gray-600 mb-4">
              {Object.values(filters).some((f) => f)
                ? "Try adjusting your search or filters"
                : "Get started by adding your first charging station"}
            </p>
            <button
              onClick={() => setShowStationModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Station
            </button>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-4">Station</div>
                <div className="col-span-2">Network</div>
                <div className="col-span-2">Location</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {stations.map((station) => (
                <div key={station.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Station Info */}
                    <div className="col-span-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Zap className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {station.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {station.address}
                          </p>
                          <div className="flex items-center mt-1 space-x-2 text-xs text-gray-500">
                            {station.connector_types &&
                              station.connector_types.length > 0 && (
                                <span className="flex items-center">
                                  <Zap className="w-3 h-3 mr-1" />
                                  {station.connector_types.join(", ")}
                                </span>
                              )}
                            {station.power_levels &&
                              station.power_levels.length > 0 && (
                                <span>
                                  {Math.max(...station.power_levels)}kW
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Network */}
                    <div className="col-span-2">
                      {station.network ? (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getNetworkColor(
                            station.network
                          )}`}
                        >
                          {station.network}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Unknown</span>
                      )}
                    </div>

                    {/* Location */}
                    <div className="col-span-2">
                      <div className="text-sm text-gray-900">
                        {station.city}, {station.state}
                      </div>
                      {station.latitude && station.longitude && (
                        <div className="text-xs text-gray-500">
                          {station.latitude.toFixed(4)},{" "}
                          {station.longitude.toFixed(4)}
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                            station.is_operational
                          )}`}
                        >
                          {station.is_operational
                            ? "Operational"
                            : "Non-Operational"}
                        </span>
                        {station.last_verified && (
                          <div className="text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Verified{" "}
                            {new Date(
                              station.last_verified
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            window.open(`/charging/${station.id}`, "_blank")
                          }
                          className="text-gray-400 hover:text-gray-600"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingStation(station);
                            setShowStationModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleStationAction(station.id, "verify")
                          }
                          className="text-green-600 hover:text-green-700"
                          title="Verify"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleStationAction(
                              station.id,
                              "toggle_operational"
                            )
                          }
                          className={`${
                            station.is_operational
                              ? "text-red-600 hover:text-red-700"
                              : "text-green-600 hover:text-green-700"
                          }`}
                          title={
                            station.is_operational
                              ? "Mark Non-Operational"
                              : "Mark Operational"
                          }
                        >
                          {station.is_operational ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleStationAction(station.id, "delete")
                          }
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* Station Modal */}
      {showStationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingStation
                ? "Edit Charging Station"
                : "Add Charging Station"}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  name: formData.get("name"),
                  address: formData.get("address"),
                  city: formData.get("city"),
                  state: formData.get("state"),
                  zip_code: formData.get("zip_code"),
                  network: formData.get("network"),
                  station_type: formData.get("station_type"),
                  phone: formData.get("phone"),
                  website: formData.get("website"),
                  is_operational: formData.get("is_operational") === "on",
                };

                if (editingStation) {
                  handleStationAction(editingStation.id, "update", data);
                } else {
                  // Handle create station
                  console.log("Create station:", data);
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Station Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingStation?.name || ""}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Network
                  </label>
                  <select
                    name="network"
                    defaultValue={editingStation?.network || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Network</option>
                    <option value="Tesla">Tesla</option>
                    <option value="ChargePoint">ChargePoint</option>
                    <option value="Electrify America">Electrify America</option>
                    <option value="EVgo">EVgo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  defaultValue={editingStation?.address || ""}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    defaultValue={editingStation?.city || ""}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    defaultValue={editingStation?.state || ""}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    defaultValue={editingStation?.zip_code || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingStation?.phone || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    defaultValue={editingStation?.website || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Station Type
                </label>
                <select
                  name="station_type"
                  defaultValue={editingStation?.station_type || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Type</option>
                  <option value="DC Fast">DC Fast</option>
                  <option value="Level 2">Level 2</option>
                  <option value="Level 1">Level 1</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_operational"
                  defaultChecked={editingStation?.is_operational ?? true}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Operational
                </label>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowStationModal(false);
                    setEditingStation(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingStation ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChargingPage;
