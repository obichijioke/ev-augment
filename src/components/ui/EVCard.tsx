import Link from "next/link";
import {
  Heart,
  Eye,
  Zap,
  Battery,
  Clock,
  Gauge,
  Car,
  TrendingUp,
  Star,
  DollarSign,
  Shield,
} from "lucide-react";
import { EV, VehicleListing } from "@/types/vehicle";

interface EVCardProps {
  vehicle: EV | VehicleListing;
  isSelected: boolean;
  onSelect: (id: string) => void;
  getAvailabilityColor: (availability: string) => string;
}

// Type guard to check if vehicle is VehicleListing
function isVehicleListing(
  vehicle: EV | VehicleListing
): vehicle is VehicleListing {
  return "model" in vehicle && "performanceSpecs" in vehicle;
}

const EVCard: React.FC<EVCardProps> = ({
  vehicle,
  isSelected,
  onSelect,
  getAvailabilityColor,
}) => {
  // Extract data based on vehicle type
  const isListing = isVehicleListing(vehicle);

  // Get data with fallbacks for both types
  const vehicleData = {
    id: vehicle.id,
    name: vehicle.name,
    year: vehicle.year,
    image: isListing
      ? vehicle.primary_image_url ||
        vehicle.image_urls?.[0] ||
        "/placeholder-car.jpg"
      : (vehicle as EV).image || "/placeholder-car.jpg",
    brand: isListing
      ? vehicle.model?.manufacturer?.name || "Unknown"
      : (vehicle as EV).brand,
    bodyType: isListing
      ? vehicle.model?.body_type || "Unknown"
      : (vehicle as EV).bodyType,
    availability: isListing
      ? vehicle.availability_status
      : (vehicle as EV).availability,
    views: isListing ? vehicle.view_count : (vehicle as EV).views,
    likes: isListing ? vehicle.like_count : (vehicle as EV).likes,
    range: isListing
      ? vehicle.performanceSpecs?.[0]?.range_epa || 0
      : (vehicle as EV).range,
    acceleration: isListing
      ? vehicle.performanceSpecs?.[0]?.acceleration_0_60
        ? `${vehicle.performanceSpecs[0].acceleration_0_60}s`
        : "Unknown"
      : (vehicle as EV).acceleration,
    chargingSpeed: isListing
      ? vehicle.batterySpecs?.[0]?.charging_speed_dc_max
        ? `${vehicle.batterySpecs[0].charging_speed_dc_max}kW`
        : "Unknown"
      : (vehicle as EV).chargingSpeed,
    motorPower: isListing
      ? vehicle.performanceSpecs?.[0]?.motor_power_hp
        ? `${vehicle.performanceSpecs[0].motor_power_hp}hp`
        : "Unknown"
      : (vehicle as EV).motorPower,
    efficiency: isListing
      ? vehicle.performanceSpecs?.[0]?.efficiency_epa
        ? `${vehicle.performanceSpecs[0].efficiency_epa} mi/kWh`
        : "Unknown"
      : (vehicle as EV).efficiency,
    batteryCapacity: isListing
      ? vehicle.batterySpecs?.[0]?.battery_capacity_kwh
        ? `${vehicle.batterySpecs[0].battery_capacity_kwh}kWh`
        : "Unknown"
      : (vehicle as EV).batteryCapacity,
    msrp:
      isListing && vehicle.msrp_base
        ? `$${vehicle.msrp_base.toLocaleString()}`
        : null,
    rating:
      isListing && vehicle.rating_average
        ? vehicle.rating_average.toFixed(1)
        : `4.${((vehicle.id.length * 7) % 9) + 1}`,
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-blue-300">
      <Link href={`/ev-listings/${vehicleData.id}`} className="block">
        <div className="relative">
          <img
            src={vehicleData.image}
            alt={vehicleData.name}
            className="w-full h-48 object-cover"
          />
          <div
            className={`absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${getAvailabilityColor(
              vehicleData.availability
            )}`}
          >
            {vehicleData.availability}
          </div>
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
            {vehicleData.bodyType}
          </div>
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-800">
            {vehicleData.year}
          </div>
          {vehicleData.msrp && (
            <div className="absolute bottom-3 right-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
              {vehicleData.msrp}
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500 font-medium">
              {vehicleData.brand}
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Eye className="w-3 h-3 mr-1" />
              {vehicleData.views?.toLocaleString() || 0}
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 truncate mb-3">
            {vehicleData.name}
          </h3>

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="flex items-center text-blue-600 mb-1">
                <Battery className="w-3 h-3 mr-1" />
                <span className="text-xs font-medium">Range</span>
              </div>
              <div className="text-sm font-bold text-gray-900">
                {vehicleData.range} mi
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <div className="flex items-center text-green-600 mb-1">
                <Gauge className="w-3 h-3 mr-1" />
                <span className="text-xs font-medium">0-60 mph</span>
              </div>
              <div className="text-sm font-bold text-gray-900">
                {vehicleData.acceleration}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center">
                <Zap className="w-3 h-3 mr-1" />
                <span>{vehicleData.chargingSpeed}</span>
              </div>
              <div className="flex items-center">
                <Car className="w-3 h-3 mr-1" />
                <span>{vehicleData.motorPower}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>{vehicleData.efficiency}</span>
              </div>
              <div className="flex items-center">
                <Battery className="w-3 h-3 mr-1" />
                <span>{vehicleData.batteryCapacity}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4 border-t border-gray-100 pt-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-sm text-gray-500">
            <Heart className="w-4 h-4 mr-1 text-red-400" />
            <span>{vehicleData.likes}</span>
          </div>
          <div className="flex items-center text-xs text-yellow-500">
            <Star className="w-3 h-3 mr-1 fill-current" />
            <span>{vehicleData.rating}</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            onSelect(vehicleData.id);
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isSelected
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {isSelected ? "Selected" : "Compare"}
        </button>
      </div>
    </div>
  );
};

export default EVCard;
