"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Car,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import VehicleManagementForm from "@/components/admin/VehicleManagementForm";
import {
  getAdminVehicleListings,
  deleteVehicleListing,
  AdminVehicleListingsQuery,
} from "@/services/adminVehicleApi";
import { VehicleListing } from "@/types/vehicle";

interface AdminVehiclesPageState {
  vehicles: VehicleListing[];
  loading: boolean;
  error: string | null;
  showForm: boolean;
  editingVehicle: VehicleListing | null;
  searchQuery: string;
  filters: {
    manufacturer: string;
    year: string;
    status: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  deleteConfirm: {
    show: boolean;
    vehicle: VehicleListing | null;
    loading: boolean;
  };
  message: {
    type: "success" | "error";
    text: string;
  } | null;
}

const AdminVehiclesPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<AdminVehiclesPageState>({
    vehicles: [],
    loading: true,
    error: null,
    showForm: false,
    editingVehicle: null,
    searchQuery: "",
    filters: {
      manufacturer: "",
      year: "",
      status: "",
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    deleteConfirm: {
      show: false,
      vehicle: null,
      loading: false,
    },
    message: null,
  });

  // Load vehicles
  const loadVehicles = async (query: AdminVehicleListingsQuery = {}) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const searchParams: AdminVehicleListingsQuery = {
        page: state.pagination.page,
        limit: state.pagination.limit,
        ...query,
      };

      if (state.searchQuery.trim()) {
        searchParams.search = state.searchQuery.trim();
      }

      if (state.filters.manufacturer) {
        searchParams.manufacturer = state.filters.manufacturer;
      }

      if (state.filters.year) {
        searchParams.year = parseInt(state.filters.year);
      }

      if (state.filters.status) {
        searchParams.status = state.filters.status;
      }

      const response = await getAdminVehicleListings(searchParams);

      setState((prev) => ({
        ...prev,
        vehicles: response.data,
        pagination: response.pagination,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || "Failed to load vehicles",
        loading: false,
      }));
    }
  };

  // Initial load
  useEffect(() => {
    loadVehicles();
  }, []);

  // Reload when search/filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadVehicles();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [state.searchQuery, state.filters]);

  // Handle edit parameter from URL
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && state.vehicles.length > 0 && !state.showForm) {
      const vehicleToEdit = state.vehicles.find((v) => v.id === editId);
      if (vehicleToEdit) {
        handleEditVehicle(vehicleToEdit);
      }
    }
  }, [searchParams, state.vehicles, state.showForm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({
      ...prev,
      searchQuery: e.target.value,
      pagination: { ...prev.pagination, page: 1 },
    }));
  };

  const handleFilterChange = (
    filterType: keyof typeof state.filters,
    value: string
  ) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, [filterType]: value },
      pagination: { ...prev.pagination, page: 1 },
    }));
  };

  const handlePageChange = (newPage: number) => {
    setState((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, page: newPage },
    }));
    loadVehicles({ page: newPage });
  };

  const handleAddVehicle = () => {
    setState((prev) => ({
      ...prev,
      showForm: true,
      editingVehicle: null,
    }));
  };

  const handleEditVehicle = (vehicle: VehicleListing) => {
    setState((prev) => ({
      ...prev,
      showForm: true,
      editingVehicle: vehicle,
    }));

    // Clear edit parameter from URL if it exists
    const editId = searchParams.get("edit");
    if (editId) {
      router.replace("/admin/vehicles");
    }
  };

  const handleDeleteVehicle = (vehicle: VehicleListing) => {
    setState((prev) => ({
      ...prev,
      deleteConfirm: {
        show: true,
        vehicle,
        loading: false,
      },
    }));
  };

  const confirmDelete = async () => {
    if (!state.deleteConfirm.vehicle) return;

    try {
      setState((prev) => ({
        ...prev,
        deleteConfirm: { ...prev.deleteConfirm, loading: true },
      }));

      await deleteVehicleListing(state.deleteConfirm.vehicle.id);

      setState((prev) => ({
        ...prev,
        deleteConfirm: { show: false, vehicle: null, loading: false },
        message: {
          type: "success",
          text: "Vehicle deleted successfully",
        },
      }));

      // Reload vehicles
      loadVehicles();
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        deleteConfirm: { ...prev.deleteConfirm, loading: false },
        message: {
          type: "error",
          text: error.message || "Failed to delete vehicle",
        },
      }));
    }
  };

  const handleFormSuccess = (vehicle: VehicleListing) => {
    setState((prev) => ({
      ...prev,
      showForm: false,
      editingVehicle: null,
      message: {
        type: "success",
        text: prev.editingVehicle
          ? "Vehicle updated successfully"
          : "Vehicle created successfully",
      },
    }));
    loadVehicles();
  };

  const handleFormCancel = () => {
    setState((prev) => ({
      ...prev,
      showForm: false,
      editingVehicle: null,
    }));
  };

  const clearMessage = () => {
    setState((prev) => ({ ...prev, message: null }));
  };

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (state.message) {
      const timeoutId = setTimeout(clearMessage, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [state.message]);

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Car className="w-8 h-8 mr-3 text-blue-600" />
                  Vehicle Management
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage EV listings, specifications, and availability
                </p>
              </div>
              <button
                onClick={handleAddVehicle}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Vehicle
              </button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {state.message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
                state.message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              <div className="flex items-center">
                {state.message.type === "success" ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                {state.message.text}
              </div>
              <button
                onClick={clearMessage}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Show Form */}
          {state.showForm && (
            <div className="mb-8">
              <VehicleManagementForm
                vehicle={state.editingVehicle || undefined}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          )}

          {/* Search and Filters */}
          {!state.showForm && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    value={state.searchQuery}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Manufacturer Filter */}
                <select
                  value={state.filters.manufacturer}
                  onChange={(e) =>
                    handleFilterChange("manufacturer", e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Manufacturers</option>
                  <option value="tesla">Tesla</option>
                  <option value="bmw">BMW</option>
                  <option value="audi">Audi</option>
                  <option value="mercedes">Mercedes</option>
                  <option value="volkswagen">Volkswagen</option>
                </select>

                {/* Year Filter */}
                <select
                  value={state.filters.year}
                  onChange={(e) => handleFilterChange("year", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Years</option>
                  {Array.from(
                    { length: 10 },
                    (_, i) => new Date().getFullYear() - i
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={state.filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="coming_soon">Coming Soon</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
            </div>
          )}

          {/* Vehicle List */}
          {!state.showForm && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {state.loading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">
                    Loading vehicles...
                  </span>
                </div>
              ) : state.error ? (
                <div className="flex items-center justify-center p-12 text-red-600">
                  <AlertCircle className="w-6 h-6 mr-2" />
                  {state.error}
                </div>
              ) : state.vehicles.length === 0 ? (
                <div className="text-center p-12">
                  <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No vehicles found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {state.searchQuery ||
                    Object.values(state.filters).some((f) => f)
                      ? "Try adjusting your search or filters"
                      : "Get started by adding your first vehicle"}
                  </p>
                  <button
                    onClick={handleAddVehicle}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Vehicle
                  </button>
                </div>
              ) : (
                <>
                  {/* Table Header */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                      <div className="col-span-4">Vehicle</div>
                      <div className="col-span-2">Year</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">MSRP</div>
                      <div className="col-span-2">Actions</div>
                    </div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-gray-200">
                    {state.vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="px-6 py-4 hover:bg-gray-50"
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Vehicle Info */}
                          <div className="col-span-4">
                            <div className="flex items-center">
                              {vehicle.primary_image_url ? (
                                <img
                                  src={vehicle.primary_image_url}
                                  alt={vehicle.name}
                                  className="w-12 h-12 rounded-lg object-cover mr-4"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                                  <Car className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">
                                  {vehicle.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {vehicle.model?.manufacturer?.name} •{" "}
                                  {vehicle.trim || "Base"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Year */}
                          <div className="col-span-2">
                            <span className="text-sm text-gray-900">
                              {vehicle.year}
                            </span>
                          </div>

                          {/* Status */}
                          <div className="col-span-2">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                vehicle.availability_status === "available"
                                  ? "bg-green-100 text-green-800"
                                  : vehicle.availability_status ===
                                    "coming_soon"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {vehicle.availability_status.replace("_", " ")}
                            </span>
                          </div>

                          {/* MSRP */}
                          <div className="col-span-2">
                            <div className="text-sm text-gray-900">
                              {vehicle.msrp_base ? (
                                <>
                                  ${vehicle.msrp_base.toLocaleString()}
                                  {vehicle.msrp_max &&
                                    vehicle.msrp_max !== vehicle.msrp_base && (
                                      <span className="text-gray-500">
                                        - ${vehicle.msrp_max.toLocaleString()}
                                      </span>
                                    )}
                                </>
                              ) : (
                                <span className="text-gray-500">TBD</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-2">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  window.open(
                                    `/ev-listings/${vehicle.id}`,
                                    "_blank"
                                  )
                                }
                                className="text-gray-400 hover:text-gray-600"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditVehicle(vehicle)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteVehicle(vehicle)}
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
                  {state.pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Showing{" "}
                          {(state.pagination.page - 1) *
                            state.pagination.limit +
                            1}{" "}
                          to{" "}
                          {Math.min(
                            state.pagination.page * state.pagination.limit,
                            state.pagination.total
                          )}{" "}
                          of {state.pagination.total} results
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handlePageChange(state.pagination.page - 1)
                            }
                            disabled={!state.pagination.hasPrev}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-gray-700">
                            Page {state.pagination.page} of{" "}
                            {state.pagination.totalPages}
                          </span>
                          <button
                            onClick={() =>
                              handlePageChange(state.pagination.page + 1)
                            }
                            disabled={!state.pagination.hasNext}
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
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {state.deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Delete Vehicle
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "
                {state.deleteConfirm.vehicle?.name}"? This action cannot be
                undone.
              </p>
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      deleteConfirm: {
                        show: false,
                        vehicle: null,
                        loading: false,
                      },
                    }))
                  }
                  disabled={state.deleteConfirm.loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={state.deleteConfirm.loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {state.deleteConfirm.loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminProtectedRoute>
  );
};

export default AdminVehiclesPage;
