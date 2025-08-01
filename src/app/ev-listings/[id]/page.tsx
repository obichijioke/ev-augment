"use client";

import React, { useState } from "react";
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
} from "lucide-react";

interface VehicleDetailsProps {
  params: Promise<{ id: string }>;
}

const VehicleDetailsPage: React.FC<VehicleDetailsProps> = ({ params }) => {
  const { id } = React.use(params);
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeSpecCategory, setActiveSpecCategory] = useState("performance");

  // Mock data - in real app, fetch based on id
  const vehicle = {
    id: id,
    make: "Tesla",
    model: "Model 3",
    year: 2024,
    trim: "Long Range",
    rating: 4.8,
    reviewCount: 1247,
    images: [
      "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20electric%20car%20front%20view%20modern%20sleek%20design%20blue%20color&image_size=landscape_16_9",
      "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20interior%20dashboard%20touchscreen%20modern%20minimalist&image_size=landscape_16_9",
      "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20side%20profile%20electric%20vehicle%20aerodynamic&image_size=landscape_16_9",
      "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20rear%20view%20taillights%20electric%20car&image_size=landscape_16_9",
    ],
    specifications: {
      performance: {
        range: "358 miles",
        acceleration: "4.2 seconds (0-60 mph)",
        topSpeed: "145 mph",
        motorPower: "283 hp (combined)",
        torque: "317 lb-ft",
        drivetrain: "Dual Motor AWD",
      },
      battery: {
        capacity: "75 kWh",
        chargingSpeed: "250 kW (DC fast)",
        chargingTime: "15-25 min (10-80%)",
        efficiency: "4.1 mi/kWh",
        batteryType: "Lithium-ion",
        warranty: "8 years / 120,000 miles",
      },
      dimensions: {
        length: "184.8 in",
        width: "72.8 in",
        height: "56.8 in",
        wheelbase: "113.2 in",
        groundClearance: "5.5 in",
        curbWeight: "4,034 lbs",
        cargoSpace: "15 cu ft",
        seating: "5 passengers",
      },
      safety: {
        nhtsa: "5-star overall",
        iihs: "Top Safety Pick+",
        autopilot: "Standard",
        emergencyBraking: "Automatic",
        blindSpotMonitoring: "Standard",
        laneKeepAssist: "Standard",
        adaptiveCruiseControl: "Standard",
      },
    },
    features: {
      technology: [
        '15" Touchscreen Display',
        "Over-the-Air Updates",
        "Premium Connectivity",
        "Mobile App Control",
        "Autopilot",
        "Full Self-Driving Capability (Optional)",
        "Voice Commands",
        "Wi-Fi Hotspot",
      ],
      comfort: [
        "Heated Front Seats",
        "Heated Steering Wheel",
        "Premium Audio System",
        "Glass Roof",
        "Automatic Climate Control",
        "Power-Adjustable Seats",
        "Memory Seats",
        "Ambient Lighting",
      ],
      safety: [
        "Forward Collision Warning",
        "Automatic Emergency Braking",
        "Blind Spot Monitoring",
        "Lane Departure Warning",
        "Adaptive Cruise Control",
        "8 Airbags",
        "Electronic Stability Control",
        "Traction Control",
      ],
      charging: [
        "Supercharger Access",
        "Mobile Connector",
        "Wall Connector Compatible",
        "CCS Charging Port",
        "Scheduled Charging",
        "Preconditioning",
        "Charge Port Light",
        "Remote Charging Control",
      ],
    },
    environmental: {
      co2Emissions: "0 g/km",
      mpgEquivalent: "134 MPGe",
      annualFuelCost: "$550",
      fuelSavings: "$1,200/year",
      greenScore: "9.5/10",
    },
    description:
      "The Tesla Model 3 Long Range offers an exceptional blend of performance, efficiency, and technology. With its sleek design and advanced autopilot capabilities, this electric sedan represents the future of sustainable transportation.",
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

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
            <div className="text-right">
              <h1 className="text-xl font-semibold text-gray-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-sm text-gray-600">{vehicle.trim}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={vehicle.images[selectedImageIndex]}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {vehicle.year} Model
                  </span>
                </div>
                <div className="absolute top-4 right-4 flex space-x-2">
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
                  {vehicle.images.map((image, index) => (
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
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h1>
                  <p className="text-lg text-gray-600">{vehicle.trim}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center mb-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="ml-1 text-lg font-semibold">
                      {vehicle.rating}
                    </span>
                    <span className="ml-1 text-gray-600">
                      ({vehicle.reviewCount} reviews)
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
                    {vehicle.specifications.performance.range}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Gauge className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">0-60 mph</div>
                  <div className="font-semibold">
                    {vehicle.specifications.performance.acceleration}
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Battery className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Battery</div>
                  <div className="font-semibold">
                    {vehicle.specifications.battery.capacity}
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Charging</div>
                  <div className="font-semibold">
                    {vehicle.specifications.battery.chargingSpeed}
                  </div>
                </div>
              </div>

              {/* Detailed Specifications */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Detailed Specifications
                </h3>

                {/* Specification Categories */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.keys(vehicle.specifications).map((category) => (
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
                  ))}
                </div>

                {/* Active Category Specifications */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(
                      vehicle.specifications[
                        activeSpecCategory as keyof typeof vehicle.specifications
                      ]
                    ).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between py-2 border-b border-gray-200"
                      >
                        <span className="text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, " $1")}
                        </span>
                        <span className="font-medium">{value}</span>
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
                  {Object.entries(vehicle.features).map(
                    ([category, features]) => (
                      <div key={category} className="bg-gray-50 rounded-lg p-4">
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
                          {category.charAt(0).toUpperCase() + category.slice(1)}{" "}
                          Features
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {features.map((feature, index) => (
                            <div key={index} className="flex items-center">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                              <span className="text-sm text-gray-700">
                                {feature}
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
                    {vehicle.specifications.performance.range}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">0-60 mph</span>
                  <span className="font-medium">
                    {vehicle.specifications.performance.acceleration}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Top Speed</span>
                  <span className="font-medium">
                    {vehicle.specifications.performance.topSpeed}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Battery</span>
                  <span className="font-medium">
                    {vehicle.specifications.battery.capacity}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Drivetrain</span>
                  <span className="font-medium">
                    {vehicle.specifications.performance.drivetrain}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Seating</span>
                  <span className="font-medium">
                    {vehicle.specifications.dimensions.seating}
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
                    {vehicle.environmental.co2Emissions}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">MPG Equivalent</span>
                  <span className="font-medium">
                    {vehicle.environmental.mpgEquivalent}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Annual Fuel Cost</span>
                  <span className="font-medium">
                    {vehicle.environmental.annualFuelCost}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fuel Savings</span>
                  <span className="font-medium text-green-600">
                    {vehicle.environmental.fuelSavings}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Green Score</span>
                  <span className="font-medium">
                    {vehicle.environmental.greenScore}
                  </span>
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
                  href={`/ev-listings?make=${vehicle.make}`}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span>More {vehicle.make} vehicles</span>
                  <Car className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsPage;
