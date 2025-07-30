'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Star, Zap, Battery, Gauge, DollarSign, Search } from 'lucide-react';

interface Vehicle {
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

const EVComparePage: React.FC = () => {
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);

  // Mock vehicle data
  const availableVehicles: Vehicle[] = [
    {
      id: '1',
      make: 'Tesla',
      model: 'Model 3',
      year: 2024,
      trim: 'Long Range',
      price: 47240,
      rating: 4.8,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20electric%20car%20blue%20modern%20sleek&image_size=square',
      specs: {
        range: '358 miles',
        acceleration: '4.2 seconds',
        topSpeed: '145 mph',
        batteryCapacity: '75 kWh',
        chargingSpeed: '250 kW',
        efficiency: '4.1 mi/kWh',
        drivetrain: 'Dual Motor AWD',
        seating: '5 passengers',
        cargoSpace: '15 cu ft',
        warranty: '8 years / 120,000 miles'
      }
    },
    {
      id: '2',
      make: 'BMW',
      model: 'iX',
      year: 2024,
      trim: 'xDrive50',
      price: 87100,
      rating: 4.6,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=BMW%20iX%20electric%20SUV%20luxury%20modern%20design&image_size=square',
      specs: {
        range: '324 miles',
        acceleration: '4.6 seconds',
        topSpeed: '124 mph',
        batteryCapacity: '111.5 kWh',
        chargingSpeed: '195 kW',
        efficiency: '2.9 mi/kWh',
        drivetrain: 'Dual Motor AWD',
        seating: '5 passengers',
        cargoSpace: '35 cu ft',
        warranty: '4 years / 50,000 miles'
      }
    },
    {
      id: '3',
      make: 'Ford',
      model: 'Mustang Mach-E',
      year: 2024,
      trim: 'Premium',
      price: 52400,
      rating: 4.4,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Ford%20Mustang%20Mach-E%20electric%20SUV%20sporty%20red&image_size=square',
      specs: {
        range: '312 miles',
        acceleration: '4.8 seconds',
        topSpeed: '111 mph',
        batteryCapacity: '91 kWh',
        chargingSpeed: '150 kW',
        efficiency: '3.4 mi/kWh',
        drivetrain: 'Dual Motor AWD',
        seating: '5 passengers',
        cargoSpace: '29 cu ft',
        warranty: '8 years / 100,000 miles'
      }
    }
  ];

  const filteredVehicles = availableVehicles.filter(vehicle =>
    !selectedVehicles.find(selected => selected.id === vehicle.id) &&
    (vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
     vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addVehicle = (vehicle: Vehicle) => {
    if (selectedVehicles.length < 3) {
      setSelectedVehicles([...selectedVehicles, vehicle]);
      setShowVehicleSelector(false);
      setSearchQuery('');
    }
  };

  const removeVehicle = (vehicleId: string) => {
    setSelectedVehicles(selectedVehicles.filter(v => v.id !== vehicleId));
  };

  const specCategories = [
    { key: 'range', label: 'Range', icon: Zap, unit: '' },
    { key: 'acceleration', label: '0-60 mph', icon: Gauge, unit: '' },
    { key: 'topSpeed', label: 'Top Speed', icon: Gauge, unit: '' },
    { key: 'batteryCapacity', label: 'Battery', icon: Battery, unit: '' },
    { key: 'chargingSpeed', label: 'Charging Speed', icon: Zap, unit: '' },
    { key: 'efficiency', label: 'Efficiency', icon: Zap, unit: '' },
    { key: 'drivetrain', label: 'Drivetrain', icon: Gauge, unit: '' },
    { key: 'seating', label: 'Seating', icon: Gauge, unit: '' },
    { key: 'cargoSpace', label: 'Cargo Space', icon: Gauge, unit: '' },
    { key: 'warranty', label: 'Warranty', icon: Gauge, unit: '' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/ev-listings" className="flex items-center text-blue-600 hover:text-blue-700">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Listings
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Compare Electric Vehicles</h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vehicle Selection */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Selected Vehicles ({selectedVehicles.length}/3)</h2>
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
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-gray-500 mb-4">
                <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No vehicles selected for comparison</p>
                <p className="text-sm">Add up to 3 electric vehicles to compare their specifications</p>
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
                <div key={vehicle.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="relative">
                    <img src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-48 object-cover" />
                    <button
                      onClick={() => removeVehicle(vehicle.id)}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-50"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                    <p className="text-gray-600 text-sm">{vehicle.trim}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm">{vehicle.rating}</span>
                      </div>
                      <div className="text-lg font-bold text-blue-600">${vehicle.price.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comparison Table */}
        {selectedVehicles.length > 1 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Detailed Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Specification</th>
                    {selectedVehicles.map((vehicle) => (
                      <th key={vehicle.id} className="px-6 py-4 text-center text-sm font-medium text-gray-900 min-w-48">
                        <div>
                          <div className="font-semibold">{vehicle.make} {vehicle.model}</div>
                          <div className="text-xs text-gray-600">{vehicle.year} {vehicle.trim}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Price Row */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                      Starting Price
                    </td>
                    {selectedVehicles.map((vehicle) => (
                      <td key={vehicle.id} className="px-6 py-4 text-center text-sm text-gray-900 font-semibold">
                        ${vehicle.price.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Rating Row */}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center">
                      <Star className="w-4 h-4 mr-2 text-yellow-400" />
                      Rating
                    </td>
                    {selectedVehicles.map((vehicle) => (
                      <td key={vehicle.id} className="px-6 py-4 text-center text-sm text-gray-900">
                        <div className="flex items-center justify-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          {vehicle.rating}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Spec Rows */}
                  {specCategories.map((category, index) => (
                    <tr key={category.key} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center">
                        <category.icon className="w-4 h-4 mr-2 text-blue-600" />
                        {category.label}
                      </td>
                      {selectedVehicles.map((vehicle) => (
                        <td key={vehicle.id} className="px-6 py-4 text-center text-sm text-gray-900">
                          {vehicle.specs[category.key as keyof typeof vehicle.specs]}
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
                <h3 className="text-lg font-semibold">Add Vehicle to Compare</h3>
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
              <div className="space-y-3">
                {filteredVehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => addVehicle(vehicle)}
                    className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <img src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} className="w-16 h-16 object-cover rounded-lg mr-4" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                      <div className="text-sm text-gray-600">{vehicle.trim}</div>
                      <div className="text-sm font-semibold text-blue-600">${vehicle.price.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm">{vehicle.rating}</span>
                    </div>
                  </button>
                ))}
                {filteredVehicles.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No vehicles found matching your search.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EVComparePage;