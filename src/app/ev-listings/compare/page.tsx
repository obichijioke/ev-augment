"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  X,
  Star,
  Zap,
  Battery,
  Gauge,
  DollarSign,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { VehicleListing } from "@/types/vehicle";
import {
  fetchVehicleDetails,
  fetchVehicleListings,
} from "@/services/vehicleApi";

interface ComparisonVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  price: number;
  rating: number;
  image: string;
  specs: {
    range: string;
    acceleration: string;
    topSpeed: string;
    batteryCapacity: string;
    chargingSpeed: string;
    efficiency: string;
    drivetrain: string;
    seating: string;
    cargoSpace: string;
    warranty: string;
  };
}

// Helper function to convert VehicleListing to ComparisonVehicle
const convertToComparisonVehicle = (
  listing: VehicleListing
): ComparisonVehicle => {
  const performanceSpec = listing.performanceSpecs?.[0];
  const batterySpec = listing.batterySpecs?.[0];
  const dimensionSpec = listing.dimensionSpecs?.[0];
  const environmentalSpec = listing.environmentalSpecs?.[0];

  return {
    id: listing.id,
    make: listing.model?.manufacturer?.name || "Unknown",
    model: listing.model?.name || "Unknown",
    year: listing.year,
    trim: listing.trim || "",
    price: listing.msrp_base || 0,
    rating: listing.average_rating || 0,
    image:
      listing.primary_image_url ||
      listing.image_urls?.[0] ||
      "/placeholder-car.jpg",
    specs: {
      range: performanceSpec?.range_epa
        ? `${performanceSpec.range_epa} miles`
        : "Unknown",
      acceleration: performanceSpec?.acceleration_0_60
        ? `${performanceSpec.acceleration_0_60}s`
        : "Unknown",
      topSpeed: performanceSpec?.top_speed
        ? `${performanceSpec.top_speed} mph`
        : "Unknown",
      batteryCapacity: batterySpec?.battery_capacity_kwh
        ? `${batterySpec.battery_capacity_kwh} kWh`
        : "Unknown",
      chargingSpeed: batterySpec?.charging_speed_dc_max
        ? `${batterySpec.charging_speed_dc_max} kW`
        : "Unknown",
      efficiency: environmentalSpec?.efficiency_epa
        ? `${environmentalSpec.efficiency_epa} MPGe`
        : "Unknown",
      drivetrain: performanceSpec?.drivetrain || "Unknown",
      seating: dimensionSpec?.seating_capacity
        ? `${dimensionSpec.seating_capacity} passengers`
        : "Unknown",
      cargoSpace: dimensionSpec?.cargo_volume
        ? `${dimensionSpec.cargo_volume} cu ft`
        : "Unknown",
      warranty: batterySpec?.warranty_years
        ? `${batterySpec.warranty_years} years`
        : "Unknown",
    },
  };
};

const EVComparePage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedVehicles, setSelectedVehicles] = useState<ComparisonVehicle[]>(
    []
  );
  const [availableVehicles, setAvailableVehicles] = useState<
    ComparisonVehicle[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Parse vehicle IDs from URL parameters
  const parseVehicleIdsFromUrl = (): string[] => {
    const vehiclesParam = searchParams.get("vehicles");
    if (!vehiclesParam) return [];

    return vehiclesParam.split(",").filter((id) => id.trim().length > 0);
  };

  // Update URL with current vehicle selection
  const updateUrlWithVehicles = (vehicleIds: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (vehicleIds.length > 0) {
      params.set("vehicles", vehicleIds.join(","));
    } else {
      params.delete("vehicles");
    }

    const newUrl = `/ev-listings/compare${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    router.replace(newUrl, { scroll: false });
  };

  // Load vehicles from URL parameters
  const loadVehiclesFromUrl = async () => {
    const vehicleIds = parseVehicleIdsFromUrl();
    if (vehicleIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const vehiclePromises = vehicleIds.map(async (id) => {
        try {
          const response = await fetchVehicleDetails(id);
          return convertToComparisonVehicle(response.data);
        } catch (error) {
          console.error(`Failed to load vehicle ${id}:`, error);
          return null;
        }
      });

      const vehicles = await Promise.all(vehiclePromises);
      const validVehicles = vehicles.filter(
        (v): v is ComparisonVehicle => v !== null
      );

      setSelectedVehicles(validVehicles);

      // Update URL to remove any invalid vehicle IDs
      if (validVehicles.length !== vehicleIds.length) {
        updateUrlWithVehicles(validVehicles.map((v) => v.id));
      }
    } catch (error) {
      console.error("Error loading vehicles from URL:", error);
      setError("Failed to load some vehicles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load available vehicles for selection
  const loadAvailableVehicles = async () => {
    if (availableVehicles.length > 0) return; // Already loaded

    setLoadingVehicles(true);
    try {
      const response = await fetchVehicleListings({ limit: 50 }); // Get more vehicles for selection
      const comparisonVehicles = response.data.map(convertToComparisonVehicle);
      setAvailableVehicles(comparisonVehicles);
    } catch (error) {
      console.error("Error loading available vehicles:", error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Load vehicles on component mount and when URL changes
  useEffect(() => {
    loadVehiclesFromUrl();
  }, [searchParams]);

  // Load available vehicles when selector is opened
  useEffect(() => {
    if (showVehicleSelector) {
      loadAvailableVehicles();
    }
  }, [showVehicleSelector]);

  // Filter available vehicles for selection
  const filteredVehicles = availableVehicles.filter(
    (vehicle) =>
      !selectedVehicles.find((selected) => selected.id === vehicle.id) &&
      (vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addVehicle = (vehicle: ComparisonVehicle) => {
    if (selectedVehicles.length < 3) {
      const newSelectedVehicles = [...selectedVehicles, vehicle];
      setSelectedVehicles(newSelectedVehicles);
      updateUrlWithVehicles(newSelectedVehicles.map((v) => v.id));
      setShowVehicleSelector(false);
      setSearchQuery("");
    }
  };

  const removeVehicle = (vehicleId: string) => {
    const newSelectedVehicles = selectedVehicles.filter(
      (v) => v.id !== vehicleId
    );
    setSelectedVehicles(newSelectedVehicles);
    updateUrlWithVehicles(newSelectedVehicles.map((v) => v.id));
  };

  const specCategories = [
    { key: "range", label: "Range", icon: Zap, unit: "" },
    { key: "acceleration", label: "0-60 mph", icon: Gauge, unit: "" },
    { key: "topSpeed", label: "Top Speed", icon: Gauge, unit: "" },
    { key: "batteryCapacity", label: "Battery", icon: Battery, unit: "" },
    { key: "chargingSpeed", label: "Charging Speed", icon: Zap, unit: "" },
    { key: "efficiency", label: "Efficiency", icon: Zap, unit: "" },
    { key: "drivetrain", label: "Drivetrain", icon: Gauge, unit: "" },
    { key: "seating", label: "Seating", icon: Gauge, unit: "" },
    { key: "cargoSpace", label: "Cargo Space", icon: Gauge, unit: "" },
    { key: "warranty", label: "Warranty", icon: Gauge, unit: "" },
  ];

  // Show loading state while initial vehicles are loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/ev-listings"
                className="flex items-center text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Listings
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Compare Electric Vehicles
              </h1>
              <div></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <span className="text-lg text-gray-600 dark:text-gray-300">
              Loading vehicles...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/ev-listings"
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Listings
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Compare Electric Vehicles
            </h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}
        {/* Vehicle Selection */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Selected Vehicles ({selectedVehicles.length}/3)
            </h2>
            <button
              onClick={() => setShowVehicleSelector(true)}
              disabled={selectedVehicles.length >= 3}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </button>
          </div>

          {selectedVehicles.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-gray-500 mb-4">
                <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No vehicles selected for comparison</p>
                <p className="text-sm">
                  Add up to 3 electric vehicles to compare their specifications
                </p>
              </div>
              <button
                onClick={() => setShowVehicleSelector(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Vehicle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={vehicle.image}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={() => removeVehicle(vehicle.id)}
                      className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-900 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {vehicle.trim}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm">{vehicle.rating}</span>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        ${vehicle.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comparison Table */}
        {selectedVehicles.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Detailed Comparison
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">
                      Specification
                    </th>
                    {selectedVehicles.map((vehicle) => (
                      <th
                        key={vehicle.id}
                        className="px-6 py-4 text-center text-sm font-medium text-gray-900 dark:text-white min-w-48"
                      >
                        <div>
                          <div className="font-semibold">
                            {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {vehicle.year} {vehicle.trim}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Price Row */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                      Starting Price
                    </td>
                    {selectedVehicles.map((vehicle) => (
                      <td
                        key={vehicle.id}
                        className="px-6 py-4 text-center text-sm text-gray-900 dark:text-white font-semibold"
                      >
                        ${vehicle.price.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  {/* Rating Row */}
                  <tr className="bg-gray-50 dark:bg-gray-900/40">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      <Star className="w-4 h-4 mr-2 text-yellow-400" />
                      Rating
                    </td>
                    {selectedVehicles.map((vehicle) => (
                      <td
                        key={vehicle.id}
                        className="px-6 py-4 text-center text-sm text-gray-900 dark:text-white"
                      >
                        <div className="flex items-center justify-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          {vehicle.rating}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Spec Rows */}
                  {specCategories.map((category, index) => (
                    <tr
                      key={category.key}
                      className={index % 2 === 0 ? "bg-gray-50" : ""}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center">
                        <category.icon className="w-4 h-4 mr-2 text-blue-600" />
                        {category.label}
                      </td>
                      {selectedVehicles.map((vehicle) => (
                        <td
                          key={vehicle.id}
                          className="px-6 py-4 text-center text-sm text-gray-900"
                        >
                          {
                            vehicle.specs[
                              category.key as keyof typeof vehicle.specs
                            ]
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Vehicle Selector Modal */}
      {showVehicleSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Add Vehicle to Compare
                </h3>
                <button
                  onClick={() => setShowVehicleSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-64">
              {loadingVehicles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Loading vehicles...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredVehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => addVehicle(vehicle)}
                      className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={vehicle.image}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-16 h-16 object-cover rounded-lg mr-4"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-car.jpg";
                        }}
                      />
                      <div className="flex-1 text-left">
                        <div className="font-medium">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-sm text-gray-600">
                          {vehicle.trim}
                        </div>
                        <div className="text-sm font-semibold text-blue-600">
                          ${vehicle.price.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm">
                          {vehicle.rating.toFixed(1)}
                        </span>
                      </div>
                    </button>
                  ))}
                  {filteredVehicles.length === 0 && !loadingVehicles && (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery
                        ? "No vehicles found matching your search."
                        : "No vehicles available for comparison."}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EVComparePage;
