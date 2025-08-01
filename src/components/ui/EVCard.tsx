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
} from "lucide-react";
import { EV } from "@/types/vehicle";

interface EVCardProps {
  vehicle: EV;
  isSelected: boolean;
  onSelect: (id: number) => void;
  getAvailabilityColor: (availability: string) => string;
}

const EVCard: React.FC<EVCardProps> = ({
  vehicle,
  isSelected,
  onSelect,
  getAvailabilityColor,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-blue-300">
      <Link href={`/ev-listings/${vehicle.id}`} className="block">
        <div className="relative">
          <img
            src={vehicle.image}
            alt={vehicle.name}
            className="w-full h-48 object-cover"
          />
          <div
            className={`absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${getAvailabilityColor(
              vehicle.availability
            )}`}
          >
            {vehicle.availability}
          </div>
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
            {vehicle.bodyType}
          </div>
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-800">
            {vehicle.year}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500 font-medium">
              {vehicle.brand}
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Eye className="w-3 h-3 mr-1" />
              {vehicle.views.toLocaleString()}
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 truncate mb-3">
            {vehicle.name}
          </h3>

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="flex items-center text-blue-600 mb-1">
                <Battery className="w-3 h-3 mr-1" />
                <span className="text-xs font-medium">Range</span>
              </div>
              <div className="text-sm font-bold text-gray-900">
                {vehicle.range} mi
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <div className="flex items-center text-green-600 mb-1">
                <Gauge className="w-3 h-3 mr-1" />
                <span className="text-xs font-medium">0-60 mph</span>
              </div>
              <div className="text-sm font-bold text-gray-900">
                {vehicle.acceleration}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center">
                <Zap className="w-3 h-3 mr-1" />
                <span>{vehicle.chargingSpeed}</span>
              </div>
              <div className="flex items-center">
                <Car className="w-3 h-3 mr-1" />
                <span>{vehicle.motorPower}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>{vehicle.efficiency}</span>
              </div>
              <div className="flex items-center">
                <Battery className="w-3 h-3 mr-1" />
                <span>{vehicle.batteryCapacity}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4 border-t border-gray-100 pt-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-sm text-gray-500">
            <Heart className="w-4 h-4 mr-1 text-red-400" />
            <span>{vehicle.likes}</span>
          </div>
          <div className="flex items-center text-xs text-yellow-500">
            <Star className="w-3 h-3 mr-1 fill-current" />
            <span>4.{((vehicle.id * 7) % 9) + 1}</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            onSelect(vehicle.id);
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
