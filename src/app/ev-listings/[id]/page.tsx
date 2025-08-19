"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  Zap,
  Battery,
  Gauge,
  Calendar,
  MapPin,
  Users,
  Car,
  Shield,
  Wifi,
  Plus,
  Minus,
  Bookmark,
  BarChart3,
  Leaf,
  Loader2,
  Edit,
  Calculator,
  Navigation,
  Clock,
  DollarSign,
  TrendingUp,
  Eye,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Phone,
  Mail,
  Download,
} from "lucide-react";
import { VehicleListing } from "@/types/vehicle";
import {
  fetchVehicleDetails,
  recordVehicleView,
  toggleVehicleLike,
  ApiError,
} from "@/services/vehicleApi";
import { useAuthStore } from "@/store/authStore";
import VehicleReviews from "@/components/VehicleReviews";

interface VehicleDetailsProps {
  params: Promise<{ id: string }>;
}

const VehicleDetailsPage: React.FC<VehicleDetailsProps> = ({ params }) => {
  const { id } = React.use(params);
  const { userProfile, isAuthenticated } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeSpecCategory, setActiveSpecCategory] = useState("performance");
  const [vehicle, setVehicle] = useState<VehicleListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enhanced features state
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [showRangeCalculator, setShowRangeCalculator] = useState(false);
  const [showCostCalculator, setShowCostCalculator] = useState(false);
  const [showChargingCalculator, setShowChargingCalculator] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [rangeConditions, setRangeConditions] = useState({
    temperature: 70,
    drivingStyle: "normal",
    terrain: "mixed",
    hvacUsage: "moderate",
  });
  const [costInputs, setCostInputs] = useState({
    milesPerYear: 12000,
    electricityRate: 0.13,
    gasPrice: 3.5,
    homeCharging: 80,
  });

  // Check if user is admin
  const isAdmin = isAuthenticated && userProfile?.role === "admin";

  // Enhanced feature helper functions
  const calculateRealWorldRange = () => {
    if (!vehicle?.performanceSpecs?.[0]?.range_epa) return 0;

    let baseRange = vehicle.performanceSpecs[0].range_epa;
    let multiplier = 1;

    // Temperature adjustment
    if (rangeConditions.temperature < 32) multiplier *= 0.7;
    else if (rangeConditions.temperature < 50) multiplier *= 0.85;
    else if (rangeConditions.temperature > 90) multiplier *= 0.9;

    // Driving style adjustment
    if (rangeConditions.drivingStyle === "aggressive") multiplier *= 0.8;
    else if (rangeConditions.drivingStyle === "eco") multiplier *= 1.1;

    // Terrain adjustment
    if (rangeConditions.terrain === "hilly") multiplier *= 0.85;
    else if (rangeConditions.terrain === "highway") multiplier *= 1.05;

    // HVAC adjustment
    if (rangeConditions.hvacUsage === "heavy") multiplier *= 0.85;
    else if (rangeConditions.hvacUsage === "minimal") multiplier *= 1.05;

    return Math.round(baseRange * multiplier);
  };

  const calculateAnnualCosts = () => {
    const electricCost =
      (costInputs.milesPerYear /
        (vehicle?.performanceSpecs?.[0]?.efficiency_combined || 3)) *
      costInputs.electricityRate;
    const gasCost = (costInputs.milesPerYear / 25) * costInputs.gasPrice; // Assuming 25 MPG for gas car
    const savings = gasCost - electricCost;

    return {
      electricCost: Math.round(electricCost),
      gasCost: Math.round(gasCost),
      savings: Math.round(savings),
    };
  };

  const calculateChargingTime = (chargerType: string) => {
    if (!vehicle?.batterySpecs?.[0]?.battery_capacity_kwh) return "N/A";

    const batteryCapacity = vehicle.batterySpecs[0].battery_capacity_kwh;
    let chargingSpeed = 0;

    switch (chargerType) {
      case "level1":
        chargingSpeed = 1.4;
        break;
      case "level2":
        chargingSpeed = 7.2;
        break;
      case "dcfast":
        chargingSpeed = vehicle.batterySpecs[0].charging_speed_dc_max || 50;
        break;
    }

    const timeHours = (batteryCapacity * 0.8) / chargingSpeed; // 80% charge
    return timeHours < 1
      ? `${Math.round(timeHours * 60)} min`
      : `${timeHours.toFixed(1)} hrs`;
  };

  // Load vehicle details from API
  const loadVehicleDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchVehicleDetails(id);
      setVehicle(response.data);

      // Record view
      await recordVehicleView(id);
    } catch (err) {
      console.error("Failed to load vehicle details:", err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load vehicle details. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load vehicle on component mount
  useEffect(() => {
    loadVehicleDetails();
  }, [id]);

  // Handle share functionality
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: vehicle?.name || "Vehicle Details",
        text: vehicle?.description || "Check out this electric vehicle",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-800 mb-4">{error || "Vehicle not found"}</p>
          <button
            onClick={() => loadVehicleDetails()}
            className="btn-primary mr-4"
          >
            Try Again
          </button>
          <Link href="/ev-listings" className="btn-secondary">
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  // Get images for display
  const images =
    vehicle.image_urls || [vehicle.primary_image_url].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/ev-listings"
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Vehicle Listings
            </Link>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <h1 className="text-xl font-semibold text-gray-900">
                  {vehicle.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {vehicle.model?.manufacturer?.name} • {vehicle.year}
                </p>
              </div>

              {/* Admin Edit Button */}
              {isAdmin && (
                <Link
                  href={`/admin/vehicles?edit=${vehicle.id}`}
                  className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm"
                  title="Edit Vehicle (Admin)"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Image Gallery */}
            <div className="bg-white rounded-lg overflow-hidden shadow-lg">
              <div className="aspect-video relative group">
                <img
                  src={images[selectedImageIndex]}
                  alt={vehicle.name}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => setShowImageZoom(true)}
                />

                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSelectedImageIndex(
                          selectedImageIndex > 0
                            ? selectedImageIndex - 1
                            : images.length - 1
                        )
                      }
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImageIndex(
                          selectedImageIndex < images.length - 1
                            ? selectedImageIndex + 1
                            : 0
                        )
                      }
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {selectedImageIndex + 1} / {images.length}
                  </div>
                )}

                <div className="absolute top-4 left-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {vehicle.year} Model
                  </span>
                </div>
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={() => setShowImageZoom(true)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:bg-white transition-colors"
                    title="Zoom image"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsFavorited(!isFavorited)}
                    className={`p-2 rounded-full backdrop-blur-sm ${
                      isFavorited
                        ? "bg-red-100 text-red-600"
                        : "bg-white/90 text-gray-600"
                    } hover:bg-white transition-colors`}
                  >
                    <Heart
                      className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:bg-white transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex space-x-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === index
                          ? "border-blue-500"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`View ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {vehicle.name}
                  </h1>
                  <p className="text-lg text-gray-600">
                    {vehicle.model?.manufacturer?.name} • {vehicle.year}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center mb-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="ml-1 text-lg font-semibold">
                      {vehicle.ratingAverage?.toFixed(1) || "N/A"}
                    </span>
                    <span className="ml-1 text-gray-600">
                      ({vehicle.ratingCount || 0} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-6">{vehicle.description}</p>

              {/* Key Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Range</div>
                  <div className="font-semibold">
                    {vehicle.performanceSpecs?.[0]?.range_epa
                      ? `${vehicle.performanceSpecs[0].range_epa} miles`
                      : "N/A"}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Gauge className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">0-60 mph</div>
                  <div className="font-semibold">
                    {vehicle.performanceSpecs?.[0]?.acceleration_0_60
                      ? `${vehicle.performanceSpecs[0].acceleration_0_60}s`
                      : "N/A"}
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Battery className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Battery</div>
                  <div className="font-semibold">
                    {vehicle.batterySpecs?.[0]?.battery_capacity_kwh
                      ? `${vehicle.batterySpecs[0].battery_capacity_kwh} kWh`
                      : "N/A"}
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Charging</div>
                  <div className="font-semibold">
                    {vehicle.batterySpecs?.[0]?.charging_speed_dc_max
                      ? `${vehicle.batterySpecs[0].charging_speed_dc_max} kW`
                      : "N/A"}
                  </div>
                </div>
              </div>

              {/* Enhanced Interactive Tools */}
              <div className="mt-8 border-t pt-6">
                <div className="flex flex-wrap gap-4 mb-6">
                  <button
                    onClick={() => setShowRangeCalculator(!showRangeCalculator)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Range Calculator
                  </button>
                  <button
                    onClick={() => setShowCostCalculator(!showCostCalculator)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Cost Calculator
                  </button>
                  <button
                    onClick={() =>
                      setShowChargingCalculator(!showChargingCalculator)
                    }
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Charging Times
                  </button>
                </div>

                {/* Range Calculator */}
                {showRangeCalculator && (
                  <div className="bg-blue-50 rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                      Real-World Range Calculator
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Temperature (°F)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={rangeConditions.temperature}
                          onChange={(e) =>
                            setRangeConditions({
                              ...rangeConditions,
                              temperature: parseInt(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                        <span className="text-sm text-gray-600">
                          {rangeConditions.temperature}°F
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Driving Style
                        </label>
                        <select
                          value={rangeConditions.drivingStyle}
                          onChange={(e) =>
                            setRangeConditions({
                              ...rangeConditions,
                              drivingStyle: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                          <option value="eco">Eco</option>
                          <option value="normal">Normal</option>
                          <option value="aggressive">Aggressive</option>
                        </select>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {calculateRealWorldRange()}
                        </div>
                        <div className="text-sm text-gray-600">
                          Estimated Real-World Range (miles)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cost Calculator */}
                {showCostCalculator && (
                  <div className="bg-green-50 rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                      Annual Cost Calculator
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Miles per Year
                        </label>
                        <input
                          type="number"
                          value={costInputs.milesPerYear}
                          onChange={(e) =>
                            setCostInputs({
                              ...costInputs,
                              milesPerYear: parseInt(e.target.value),
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Electricity Rate ($/kWh)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={costInputs.electricityRate}
                          onChange={(e) =>
                            setCostInputs({
                              ...costInputs,
                              electricityRate: parseFloat(e.target.value),
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(() => {
                        const costs = calculateAnnualCosts();
                        return (
                          <>
                            <div className="bg-white rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-green-600">
                                ${costs.electricCost}
                              </div>
                              <div className="text-sm text-gray-600">
                                Annual Electric Cost
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-red-600">
                                ${costs.gasCost}
                              </div>
                              <div className="text-sm text-gray-600">
                                Equivalent Gas Cost
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                ${costs.savings}
                              </div>
                              <div className="text-sm text-gray-600">
                                Annual Savings
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Charging Calculator */}
                {showChargingCalculator && (
                  <div className="bg-purple-50 rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-purple-600" />
                      Charging Time Calculator
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <Battery className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <div className="text-lg font-bold">Level 1 (120V)</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {calculateChargingTime("level1")}
                        </div>
                        <div className="text-sm text-gray-600">to 80%</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-lg font-bold">Level 2 (240V)</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {calculateChargingTime("level2")}
                        </div>
                        <div className="text-sm text-gray-600">to 80%</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-lg font-bold">DC Fast</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {calculateChargingTime("dcfast")}
                        </div>
                        <div className="text-sm text-gray-600">to 80%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Specifications */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Detailed Specifications
                </h3>

                {/* Specification Categories */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {["performance", "battery", "dimensions", "safety"].map(
                    (category) => (
                      <button
                        key={category}
                        onClick={() => setActiveSpecCategory(category)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          activeSpecCategory === category
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    )
                  )}
                </div>

                {/* Active Category Specifications */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeSpecCategory === "performance" &&
                      vehicle.performanceSpecs?.[0] &&
                      Object.entries(vehicle.performanceSpecs[0])
                        .filter(
                          ([key]) =>
                            ![
                              "id",
                              "listing_id",
                              "created_at",
                              "updated_at",
                            ].includes(key)
                        )
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between py-2 border-b border-gray-200"
                          >
                            <span className="text-gray-600 capitalize">
                              {key
                                .replace(/_/g, " ")
                                .replace(/([0-9]+)/g, " $1")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                            <span className="font-medium">
                              {typeof value === "number"
                                ? key.includes("range")
                                  ? `${value} miles`
                                  : key.includes("speed") ||
                                    key.includes("top_speed")
                                  ? `${value} mph`
                                  : key.includes("acceleration")
                                  ? `${value}s`
                                  : key.includes("power") && key.includes("hp")
                                  ? `${value} hp`
                                  : key.includes("power") && key.includes("kw")
                                  ? `${value} kW`
                                  : key.includes("torque") &&
                                    key.includes("lb_ft")
                                  ? `${value} lb-ft`
                                  : key.includes("torque") && key.includes("nm")
                                  ? `${value} Nm`
                                  : key.includes("efficiency")
                                  ? `${value} mi/kWh`
                                  : value
                                : value || "N/A"}
                            </span>
                          </div>
                        ))}
                    {activeSpecCategory === "battery" &&
                      vehicle.batterySpecs?.[0] &&
                      Object.entries(vehicle.batterySpecs[0])
                        .filter(
                          ([key]) =>
                            ![
                              "id",
                              "listing_id",
                              "created_at",
                              "updated_at",
                            ].includes(key)
                        )
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between py-2 border-b border-gray-200"
                          >
                            <span className="text-gray-600 capitalize">
                              {key
                                .replace(/_/g, " ")
                                .replace(/([0-9]+)/g, " $1")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                            <span className="font-medium">
                              {typeof value === "number"
                                ? key.includes("capacity") ||
                                  key.includes("kwh")
                                  ? `${value} kWh`
                                  : key.includes("speed") && key.includes("dc")
                                  ? `${value} kW DC`
                                  : key.includes("speed") && key.includes("ac")
                                  ? `${value} kW AC`
                                  : key.includes("time")
                                  ? `${value} min`
                                  : key.includes("efficiency")
                                  ? `${value} mi/kWh`
                                  : key.includes("years")
                                  ? `${value} years`
                                  : key.includes("miles")
                                  ? `${(
                                      value as number
                                    ).toLocaleString()} miles`
                                  : value
                                : value || "N/A"}
                            </span>
                          </div>
                        ))}
                    {activeSpecCategory === "dimensions" &&
                      vehicle.dimensionSpecs?.[0] &&
                      Object.entries(vehicle.dimensionSpecs[0])
                        .filter(
                          ([key]) =>
                            ![
                              "id",
                              "listing_id",
                              "created_at",
                              "updated_at",
                            ].includes(key)
                        )
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between py-2 border-b border-gray-200"
                          >
                            <span className="text-gray-600 capitalize">
                              {key
                                .replace(/_/g, " ")
                                .replace(/in$/, " (in)")
                                .replace(/lbs$/, " (lbs)")
                                .replace(/cu ft$/, " (cu ft)")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                            <span className="font-medium">
                              {typeof value === "number"
                                ? key.includes("lbs")
                                  ? `${(value as number).toLocaleString()} lbs`
                                  : key.includes("_in")
                                  ? `${value}"`
                                  : key.includes("cu_ft")
                                  ? `${value} cu ft`
                                  : key.includes("seating") ||
                                    key.includes("capacity")
                                  ? `${value} passengers`
                                  : value
                                : value || "N/A"}
                            </span>
                          </div>
                        ))}
                    {activeSpecCategory === "safety" &&
                      vehicle.safetySpecs?.[0] &&
                      Object.entries(vehicle.safetySpecs[0])
                        .filter(
                          ([key]) =>
                            ![
                              "id",
                              "listing_id",
                              "created_at",
                              "updated_at",
                            ].includes(key)
                        )
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between py-2 border-b border-gray-200"
                          >
                            <span className="text-gray-600 capitalize">
                              {key
                                .replace(/_/g, " ")
                                .replace(/has /gi, "")
                                .replace(/nhtsa/gi, "NHTSA")
                                .replace(/iihs/gi, "IIHS")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                            <span className="font-medium">
                              {typeof value === "boolean"
                                ? value
                                  ? "Yes"
                                  : "No"
                                : typeof value === "number" &&
                                  key.includes("rating")
                                ? `${value} stars`
                                : value || "N/A"}
                            </span>
                          </div>
                        ))}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Features & Equipment
                </h3>

                {/* Feature Categories */}
                <div className="space-y-6">
                  {vehicle.features &&
                    Object.entries(vehicle.features).map(
                      ([category, features]) => (
                        <div
                          key={category}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            {category === "technology" && (
                              <Wifi className="w-5 h-5 mr-2 text-blue-600" />
                            )}
                            {category === "safety" && (
                              <Shield className="w-5 h-5 mr-2 text-green-600" />
                            )}
                            {category === "comfort" && (
                              <Users className="w-5 h-5 mr-2 text-purple-600" />
                            )}
                            {category === "charging" && (
                              <Battery className="w-5 h-5 mr-2 text-orange-600" />
                            )}
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}{" "}
                            Features
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {features.map((feature, index) => (
                              <div key={index} className="flex items-center">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                                <span className="text-sm text-gray-700">
                                  {feature.feature?.name || "Unknown Feature"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Vehicle Information */}
          <div className="space-y-6">
            {/* Quick Facts Card */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Quick Facts</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Range</span>
                  <span className="font-medium">
                    {vehicle.performanceSpecs?.[0]?.range_epa
                      ? `${vehicle.performanceSpecs[0].range_epa} mi`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">0-60 mph</span>
                  <span className="font-medium">
                    {vehicle.performanceSpecs?.[0]?.acceleration_0_60
                      ? `${vehicle.performanceSpecs[0].acceleration_0_60}s`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Top Speed</span>
                  <span className="font-medium">
                    {vehicle.performanceSpecs?.[0]?.top_speed
                      ? `${vehicle.performanceSpecs[0].top_speed} mph`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Battery</span>
                  <span className="font-medium">
                    {vehicle.batterySpecs?.[0]?.battery_capacity_kwh
                      ? `${vehicle.batterySpecs[0].battery_capacity_kwh} kWh`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Drivetrain</span>
                  <span className="font-medium">
                    {vehicle.performanceSpecs?.[0]?.drivetrain || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Seating</span>
                  <span className="font-medium">
                    {vehicle.dimensionSpecs?.[0]?.seating_capacity
                      ? `${vehicle.dimensionSpecs[0].seating_capacity} seats`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Environmental Impact */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Leaf className="w-5 h-5 mr-2 text-green-600" />
                Environmental Impact
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">CO₂ Emissions</span>
                  <span className="font-medium text-green-600">
                    {vehicle.environmentalSpecs?.[0]?.co2_emissions_g_mi
                      ? `${vehicle.environmentalSpecs[0].co2_emissions_g_mi} g/mi`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">MPG Equivalent</span>
                  <span className="font-medium">
                    {vehicle.environmentalSpecs?.[0]?.mpge_combined
                      ? `${vehicle.environmentalSpecs[0].mpge_combined} MPGe`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Annual Fuel Cost</span>
                  <span className="font-medium">
                    {vehicle.environmentalSpecs?.[0]?.annual_fuel_cost
                      ? `$${vehicle.environmentalSpecs[0].annual_fuel_cost}`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fuel Savings</span>
                  <span className="font-medium text-green-600">
                    {vehicle.environmentalSpecs?.[0]?.fuel_savings_vs_gas
                      ? `$${vehicle.environmentalSpecs[0].fuel_savings_vs_gas}`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Green Score</span>
                  <span className="font-medium">
                    {vehicle.environmentalSpecs?.[0]?.green_score
                      ? `${vehicle.environmentalSpecs[0].green_score}/10`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Pricing Information */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Pricing & Incentives
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">MSRP</span>
                  <span className="font-bold text-lg">
                    ${vehicle.price?.toLocaleString() || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Federal Tax Credit</span>
                  <span className="font-medium text-green-600">
                    Up to $7,500
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Est. After Incentives</span>
                  <span className="font-bold text-green-600">
                    ${((vehicle.price || 0) - 7500).toLocaleString()}
                  </span>
                </div>
                <div className="pt-3 border-t">
                  <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center">
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate My Price
                  </button>
                </div>
              </div>
            </div>

            {/* Charging Network Compatibility */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-600" />
                Charging Compatibility
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tesla Supercharger</span>
                  <span className="text-green-600 font-medium">
                    {vehicle.model?.manufacturer?.name
                      ?.toLowerCase()
                      .includes("tesla")
                      ? "✓ Native"
                      : "✓ Adapter"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">CCS/SAE</span>
                  <span className="text-green-600 font-medium">
                    ✓ Compatible
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">CHAdeMO</span>
                  <span className="text-gray-400 font-medium">
                    {vehicle.model?.manufacturer?.name
                      ?.toLowerCase()
                      .includes("nissan")
                      ? "✓ Native"
                      : "○ Adapter Req."}
                  </span>
                </div>
                <div className="pt-3 border-t">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Find Nearby Chargers
                  </button>
                </div>
              </div>
            </div>

            {/* User Actions */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Add to Garage
                </button>
                <button className="w-full border border-blue-600 text-blue-600 py-3 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Compare Vehicle
                </button>
                <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Schedule Test Drive
                </button>
                <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <Download className="w-4 h-4 mr-2" />
                  Download Brochure
                </button>
                <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Vehicle
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Related</h3>
              <div className="space-y-3">
                <Link
                  href="/ev-listings/compare"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span>Compare with other EVs</span>
                  <BarChart3 className="w-4 h-4" />
                </Link>
                <Link
                  href="/charging"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span>Find charging stations</span>
                  <MapPin className="w-4 h-4" />
                </Link>
                <Link
                  href="/forums"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span>Owner discussions</span>
                  <Users className="w-4 h-4" />
                </Link>
                <Link
                  href={`/ev-listings?make=${
                    vehicle.model?.manufacturer?.name || ""
                  }`}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span>
                    More {vehicle.model?.manufacturer?.name || "manufacturer"}{" "}
                    vehicles
                  </span>
                  <Car className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <VehicleReviews vehicleId={id} vehicleName={vehicle.name} />
        </div>

        {/* Image Zoom Modal */}
        {showImageZoom && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-7xl max-h-full">
              <button
                onClick={() => setShowImageZoom(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <img
                src={images[selectedImageIndex]}
                alt={vehicle.name}
                className="max-w-full max-h-full object-contain"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImageIndex(
                        selectedImageIndex > 0
                          ? selectedImageIndex - 1
                          : images.length - 1
                      )
                    }
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                  >
                    <ChevronLeft className="w-12 h-12" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImageIndex(
                        selectedImageIndex < images.length - 1
                          ? selectedImageIndex + 1
                          : 0
                      )
                    }
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                  >
                    <ChevronRight className="w-12 h-12" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
                    {selectedImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleDetailsPage;
