import Link from 'next/link';
import { Heart, Eye, Zap, Battery, Clock } from 'lucide-react';
import { EV } from '@/types/vehicle';

interface EVCardProps {
  vehicle: EV;
  isSelected: boolean;
  onSelect: (id: number) => void;
  getAvailabilityColor: (availability: string) => string;
}

const EVCard: React.FC<EVCardProps> = ({ vehicle, isSelected, onSelect, getAvailabilityColor }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/ev-listings/${vehicle.id}`} className="block">
        <div className="relative">
          <img src={vehicle.image} alt={vehicle.name} className="w-full h-48 object-cover" />
          <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full ${getAvailabilityColor(vehicle.availability)}`}>
            {vehicle.availability}
          </div>
        </div>
        <div className="p-4">
          <div className="text-sm text-gray-500">{vehicle.brand}</div>
          <h3 className="text-lg font-bold text-gray-900 truncate">{vehicle.name}</h3>
          <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center"><Battery className="w-4 h-4 mr-1" /> {vehicle.range} mi</div>
            <div className="flex items-center"><Zap className="w-4 h-4 mr-1" /> {vehicle.chargingSpeed}</div>
            <div className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {vehicle.year}</div>
          </div>
        </div>
      </Link>
      <div className="p-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center"><Heart className="w-4 h-4 mr-1" /> {vehicle.likes}</div>
          <div className="flex items-center"><Eye className="w-4 h-4 mr-1" /> {vehicle.views}</div>
        </div>
        <button 
          onClick={() => onSelect(vehicle.id)}
          className={`px-3 py-1 rounded-md text-sm font-medium ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          {isSelected ? 'Selected' : 'Compare'}
        </button>
      </div>
    </div>
  );
};

export default EVCard;