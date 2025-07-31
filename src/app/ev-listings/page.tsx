'use client';

import { useState } from 'react';
import { Search, Filter, Grid, List, Heart, Eye, Zap, Battery, Clock, DollarSign, CheckSquare, Square, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { EV } from '@/types/vehicle';
import EVCard from '@/components/ui/EVCard';

const EVListingsPage = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<number[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [filters, setFilters] = useState({
    brand: 'all',
    range: [0, 500],
    bodyType: 'all',
    year: 'all',
    availability: 'all'
  });

  const vehicles: EV[] = [
    {
      id: 1,
      name: 'Tesla Model 3',
      brand: 'Tesla',
      year: 2024,
      range: 358,
      chargingSpeed: '250kW',
      bodyType: 'Sedan',
      batteryCapacity: '75kWh',
      motorPower: '283hp',
      acceleration: '5.8s',
      topSpeed: '140mph',
      efficiency: '4.1 mi/kWh',
      availability: 'Available',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%202024%20electric%20sedan%20side%20view%20modern%20design&image_size=landscape_16_9',
      views: 3421,
      likes: 156
    },
    {
      id: 2,
      name: 'BMW i4 M50',
      brand: 'BMW',
      year: 2024,
      range: 270,
      chargingSpeed: '200kW',
      bodyType: 'Sedan',
      batteryCapacity: '83.9kWh',
      motorPower: '536hp',
      acceleration: '3.7s',
      topSpeed: '155mph',
      efficiency: '3.2 mi/kWh',
      availability: 'Available',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=BMW%20i4%20M50%202024%20electric%20sedan%20sporty%20design%20side%20view&image_size=landscape_16_9',
      views: 2156,
      likes: 89
    },
    {
      id: 3,
      name: 'Audi e-tron GT',
      brand: 'Audi',
      year: 2024,
      range: 238,
      chargingSpeed: '270kW',
      bodyType: 'Coupe',
      batteryCapacity: '93.4kWh',
      motorPower: '469hp',
      acceleration: '3.9s',
      topSpeed: '152mph',
      efficiency: '2.5 mi/kWh',
      availability: 'Limited',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Audi%20e-tron%20GT%202024%20electric%20coupe%20luxury%20design%20side%20view&image_size=landscape_16_9',
      views: 1834,
      likes: 124
    },
    {
      id: 4,
      name: 'Nissan Ariya',
      brand: 'Nissan',
      year: 2024,
      range: 304,
      chargingSpeed: '130kW',
      bodyType: 'SUV',
      batteryCapacity: '87kWh',
      motorPower: '389hp',
      acceleration: '5.1s',
      topSpeed: '124mph',
      efficiency: '3.5 mi/kWh',
      availability: 'Available',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Nissan%20Ariya%202024%20electric%20SUV%20crossover%20modern%20design&image_size=landscape_16_9',
      views: 1567,
      likes: 67
    },
    {
      id: 5,
      name: 'Ford Mustang Mach-E',
      brand: 'Ford',
      year: 2024,
      range: 312,
      chargingSpeed: '150kW',
      bodyType: 'SUV',
      batteryCapacity: '88kWh',
      motorPower: '346hp',
      acceleration: '4.8s',
      topSpeed: '124mph',
      efficiency: '3.5 mi/kWh',
      availability: 'Available',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Ford%20Mustang%20Mach-E%202024%20electric%20SUV%20sporty%20design&image_size=landscape_16_9',
      views: 2234,
      likes: 98
    },
    {
      id: 6,
      name: 'Lucid Air Dream',
      brand: 'Lucid',
      year: 2024,
      range: 516,
      chargingSpeed: '300kW',
      bodyType: 'Sedan',
      batteryCapacity: '118kWh',
      motorPower: '1111hp',
      acceleration: '2.5s',
      topSpeed: '168mph',
      efficiency: '4.4 mi/kWh',
      availability: 'Limited',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Lucid%20Air%20Dream%202024%20luxury%20electric%20sedan%20premium%20design&image_size=landscape_16_9',
      views: 3456,
      likes: 234
    }
  ];

  const brands = ['all', 'Tesla', 'BMW', 'Audi', 'Nissan', 'Ford', 'Lucid'];
  const bodyTypes = ['all', 'Sedan', 'SUV', 'Coupe', 'Hatchback'];
  const years = ['all', '2024', '2023', '2022', '2021'];
  const availabilityOptions = ['all', 'Available', 'Limited', 'Pre-order'];

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = filters.brand === 'all' || vehicle.brand === filters.brand;

    const matchesRange = vehicle.range >= filters.range[0] && vehicle.range <= filters.range[1];
    const matchesBodyType = filters.bodyType === 'all' || vehicle.bodyType === filters.bodyType;
    const matchesYear = filters.year === 'all' || vehicle.year.toString() === filters.year;
    const matchesAvailability = filters.availability === 'all' || vehicle.availability === filters.availability;
    
    return matchesSearch && matchesBrand && matchesRange && 
           matchesBodyType && matchesYear && matchesAvailability;
  });

  const toggleVehicleSelection = (vehicleId: number) => {
    setSelectedVehicles(prev => {
      if (prev.includes(vehicleId)) {
        return prev.filter(id => id !== vehicleId);
      } else if (prev.length < 3) {
        return [...prev, vehicleId];
      }
      return prev;
    });
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'Available':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'Limited':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'Pre-order':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Electric Vehicle Database</h1>
          <p className="text-gray-600 dark:text-gray-300">Explore and compare electric vehicles from all manufacturers. Browse specifications, features, and discover the perfect EV for your needs.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button 
                  onClick={() => setFilters({
                    brand: 'all',
                    range: [0, 500],
                    bodyType: 'all',
                    year: 'all',
                    availability: 'all'
                  })}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-6">
                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                  <select
                    value={filters.brand}
                    onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {brands.map(brand => (
                      <option key={brand} value={brand}>
                        {brand === 'all' ? 'All Brands' : brand}
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
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        range: [parseInt(e.target.value), prev.range[1]] 
                      }))}
                      className="w-full"
                    />
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="10"
                      value={filters.range[1]}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        range: [prev.range[0], parseInt(e.target.value)] 
                      }))}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Body Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Body Type</label>
                  <select
                    value={filters.bodyType}
                    onChange={(e) => setFilters(prev => ({ ...prev, bodyType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {bodyTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'all' ? 'All Types' : type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <select
                    value={filters.year}
                    onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year === 'all' ? 'All Years' : year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                  <select
                    value={filters.availability}
                    onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {availabilityOptions.map(option => (
                      <option key={option} value={option}>
                        {option === 'all' ? 'All' : option}
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Grid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                  {selectedVehicles.length > 0 && (
                    <Link
                      href={`/ev-listings/compare?vehicles=${selectedVehicles.join(',')}`}
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
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                Showing {filteredVehicles.length} of {vehicles.length} vehicles
              </p>
            </div>

            {/* Vehicle Grid/List */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}>
              {filteredVehicles.map((vehicle) => (
                <EVCard 
                  key={vehicle.id} 
                  vehicle={vehicle} 
                  isSelected={selectedVehicles.includes(vehicle.id)}
                  onSelect={toggleVehicleSelection}
                  getAvailabilityColor={getAvailabilityColor}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EVListingsPage;