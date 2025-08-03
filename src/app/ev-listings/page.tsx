"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Grid,
  List,
  Heart,
  Eye,
  Zap,
  Battery,
  Clock,
  DollarSign,
  CheckSquare,
  Square,
  BarChart3,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { EV, VehicleListing, VehicleListingsQuery } from "@/types/vehicle";
import { fetchVehicleListings, ApiError } from "@/services/vehicleApi";
import EVCard from "@/components/ui/EVCard";

const EVListingsPage = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [vehicles, setVehicles] = useState<(EV | VehicleListing)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState({
    brand: "all",
    range: [0, 500],
    bodyType: "all",
    year: "all",
    availability: "all",
  });

  // Load vehicles from API
  const loadVehicles = async (query: VehicleListingsQuery = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchVehicleListings({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        manufacturer: filters.brand !== "all" ? [filters.brand] : undefined,
        bodyType: filters.bodyType !== "all" ? [filters.bodyType] : undefined,
        year: filters.year !== "all" ? [parseInt(filters.year)] : undefined,
        minRange: filters.range[0] > 0 ? filters.range[0] : undefined,
        maxRange: filters.range[1] < 500 ? filters.range[1] : undefined,
        ...query,
      });

      // Use VehicleListing directly for enhanced features, fallback to EV conversion if needed
      // For now, we'll use the raw VehicleListing data to take advantage of enhanced EVCard features
      setVehicles(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error("Failed to load vehicles:", err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load vehicles. Please try again.");
      }

      // Fallback to mock data for development
      setVehicles(getMockVehicles());
      setPagination({
        page: 1,
        limit: 20,
        total: getMockVehicles().length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // Load vehicles on component mount and when filters change
  useEffect(() => {
    loadVehicles();
  }, [searchQuery, filters, pagination.page]);

  // Helper function to extract filter data from either EV or VehicleListing
  const getVehicleFilterData = (vehicle: EV | VehicleListing) => {
    const isListing = "model" in vehicle && "performanceSpecs" in vehicle;

    if (isListing) {
      const listing = vehicle as VehicleListing;
      return {
        brand: listing.model?.manufacturer?.name || "Unknown",
        range: listing.performanceSpecs?.[0]?.range_epa || 0,
        bodyType: listing.model?.body_type || "Unknown",
        availability: listing.availability_status,
      };
    } else {
      const ev = vehicle as EV;
      return {
        brand: ev.brand,
        range: ev.range,
        bodyType: ev.bodyType,
        availability: ev.availability,
      };
    }
  };

  // Mock data fallback for development
  const getMockVehicles = (): EV[] => [
    {
      id: "1",
      name: "Tesla Model 3",
      brand: "Tesla",
      year: 2024,
      range: 358,
      chargingSpeed: "250kW",
      bodyType: "Sedan",
      batteryCapacity: "75kWh",
      motorPower: "283hp",
      acceleration: "5.8s",
      topSpeed: "140mph",
      efficiency: "4.1 mi/kWh",
      availability: "Available",
      image:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%202024%20electric%20sedan%20side%20view%20modern%20design&image_size=landscape_16_9",
      views: 3421,
      likes: 156,
    },
    {
      id: "2",
      name: "BMW i4 M50",
      brand: "BMW",
      year: 2024,
      range: 270,
      chargingSpeed: "200kW",
      bodyType: "Sedan",
      batteryCapacity: "83.9kWh",
      motorPower: "536hp",
      acceleration: "3.7s",
      topSpeed: "155mph",
      efficiency: "3.2 mi/kWh",
      availability: "Available",
      image:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=BMW%20i4%20M50%202024%20electric%20sedan%20sporty%20design%20side%20view&image_size=landscape_16_9",
      views: 2156,
      likes: 89,
    },
    {
      id: "3",
      name: "Audi e-tron GT",
      brand: "Audi",
      year: 2024,
      range: 238,
      chargingSpeed: "270kW",
      bodyType: "Coupe",
      batteryCapacity: "93.4kWh",
      motorPower: "469hp",
      acceleration: "3.9s",
      topSpeed: "152mph",
      efficiency: "2.5 mi/kWh",
      availability: "Limited",
      image:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Audi%20e-tron%20GT%202024%20electric%20coupe%20luxury%20design%20side%20view&image_size=landscape_16_9",
      views: 1834,
      likes: 124,
    },
    {
      id: "4",
      name: "Nissan Ariya",
      brand: "Nissan",
      year: 2024,
      range: 304,
      chargingSpeed: "130kW",
      bodyType: "SUV",
      batteryCapacity: "87kWh",
      motorPower: "389hp",
      acceleration: "5.1s",
      topSpeed: "124mph",
      efficiency: "3.5 mi/kWh",
      availability: "Available",
      image:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Nissan%20Ariya%202024%20electric%20SUV%20crossover%20modern%20design&image_size=landscape_16_9",
      views: 1567,
      likes: 67,
    },
    {
      id: "5",
      name: "Ford Mustang Mach-E",
      brand: "Ford",
      year: 2024,
      range: 312,
      chargingSpeed: "150kW",
      bodyType: "SUV",
      batteryCapacity: "88kWh",
      motorPower: "346hp",
      acceleration: "4.8s",
      topSpeed: "124mph",
      efficiency: "3.5 mi/kWh",
      availability: "Available",
      image:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Ford%20Mustang%20Mach-E%202024%20electric%20SUV%20sporty%20design&image_size=landscape_16_9",
      views: 2234,
      likes: 98,
    },
    {
      id: "6",
      name: "Lucid Air Dream",
      brand: "Lucid",
      year: 2024,
      range: 516,
      chargingSpeed: "300kW",
      bodyType: "Sedan",
      batteryCapacity: "118kWh",
      motorPower: "1111hp",
      acceleration: "2.5s",
      topSpeed: "168mph",
      efficiency: "4.4 mi/kWh",
      availability: "Limited",
      image:
        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Lucid%20Air%20Dream%202024%20luxury%20electric%20sedan%20premium%20design&image_size=landscape_16_9",
      views: 3456,
      likes: 234,
    },
  ];

  const brands = ["all", "Tesla", "BMW", "Audi", "Nissan", "Ford", "Lucid"];
  const bodyTypes = ["all", "Sedan", "SUV", "Coupe", "Hatchback"];
  const years = ["all", "2024", "2023", "2022", "2021"];
  const availabilityOptions = ["all", "Available", "Limited", "Pre-order"];

  // Client-side filtering for both EV and VehicleListing types
  const filteredVehicles = vehicles.filter((vehicle) => {
    const vehicleData = getVehicleFilterData(vehicle);

    const matchesSearch =
      vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicleData.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand =
      filters.brand === "all" || vehicleData.brand === filters.brand;

    const matchesRange =
      vehicleData.range >= filters.range[0] &&
      vehicleData.range <= filters.range[1];
    const matchesBodyType =
      filters.bodyType === "all" || vehicleData.bodyType === filters.bodyType;
    const matchesYear =
      filters.year === "all" || vehicle.year.toString() === filters.year;
    const matchesAvailability =
      filters.availability === "all" ||
      vehicleData.availability === filters.availability;

    return (
      matchesSearch &&
      matchesBrand &&
      matchesRange &&
      matchesBodyType &&
      matchesYear &&
      matchesAvailability
    );
  });

  const toggleVehicleSelection = (vehicleId: string) => {
    setSelectedVehicles((prev) => {
      if (prev.includes(vehicleId)) {
        return prev.filter((id) => id !== vehicleId);
      } else if (prev.length < 3) {
        return [...prev, vehicleId];
      }
      return prev;
    });
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "Limited":
        return "bg-yellow-100 text-yellow-800";
      case "Pre-order":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Electric Vehicle Database
          </h1>
          <p className="text-gray-600">
            Explore and compare electric vehicles from all manufacturers. Browse
            specifications, features, and discover the perfect EV for your
            needs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={() =>
                    setFilters({
                      brand: "all",
                      range: [0, 500],
                      bodyType: "all",
                      year: "all",
                      availability: "all",
                    })
                  }
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-6">
                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <select
                    value={filters.brand}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, brand: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand === "all" ? "All Brands" : brand}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Range: {filters.range[0]} - {filters.range[1]} miles
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="10"
                      value={filters.range[0]}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          range: [parseInt(e.target.value), prev.range[1]],
                        }))
                      }
                      className="w-full"
                    />
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="10"
                      value={filters.range[1]}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          range: [prev.range[0], parseInt(e.target.value)],
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Body Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body Type
                  </label>
                  <select
                    value={filters.bodyType}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        bodyType: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {bodyTypes.map((type) => (
                      <option key={type} value={type}>
                        {type === "all" ? "All Types" : type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={filters.year}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, year: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year === "all" ? "All Years" : year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <select
                    value={filters.availability}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        availability: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {availabilityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === "all" ? "All" : option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and View Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg ${
                        viewMode === "grid"
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <Grid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg ${
                        viewMode === "list"
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                  {selectedVehicles.length > 0 && (
                    <Link
                      href={`/ev-listings/compare?vehicles=${selectedVehicles.join(
                        ","
                      )}`}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Compare ({selectedVehicles.length})</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Results Count */}
            {!loading && !error && (
              <div className="mb-6">
                <p className="text-gray-600">
                  Showing {filteredVehicles.length} of {pagination.total}{" "}
                  vehicles
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading vehicles...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-800 mb-4">{error}</p>
                <button onClick={() => loadVehicles()} className="btn-primary">
                  Try Again
                </button>
              </div>
            )}

            {/* Vehicle Grid/List */}
            {!loading && !error && (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                    : "space-y-6"
                }
              >
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map((vehicle, index) => (
                    <EVCard
                      key={`${vehicle.id}-${index}`}
                      vehicle={vehicle}
                      isSelected={selectedVehicles.includes(vehicle.id)}
                      onSelect={toggleVehicleSelection}
                      getAvailabilityColor={getAvailabilityColor}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-600 text-lg mb-4">
                      No vehicles found
                    </p>
                    <p className="text-gray-500">
                      Try adjusting your search or filters
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-4">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EVListingsPage;
