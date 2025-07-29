'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Car, 
  Plus, 
  Search,
  Filter,
  Users,
  Eye,
  Heart,
  Share2,
  MapPin,
  Calendar,
  Battery,
  Zap,
  Grid3X3,
  List
} from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  color: string;
  range: number;
  image: string;
  owner: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    location: string;
  };
  stats: {
    mileage: number;
    efficiency: string;
    co2Saved: number;
  };
  isLiked: boolean;
  likes: number;
  addedDate: string;
}

const GaragePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMake, setSelectedMake] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data - all users' vehicles
  const allVehicles: Vehicle[] = [
    {
      id: '1',
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      trim: 'Long Range',
      color: 'Pearl White',
      range: 358,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20Pearl%20White%20electric%20car%20side%20view%20modern%20clean%20background&image_size=landscape_4_3',
      owner: {
        id: '1',
        name: 'John Smith',
        username: 'johnsmith',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20male%20avatar%20friendly%20smile&image_size=square',
        location: 'San Francisco, CA'
      },
      stats: {
        mileage: 15420,
        efficiency: '4.2',
        co2Saved: 13724
      },
      isLiked: true,
      likes: 24,
      addedDate: '2023-03-15'
    },
    {
      id: '2',
      make: 'Ford',
      model: 'Mustang Mach-E',
      year: 2022,
      trim: 'GT Performance',
      color: 'Grabber Blue',
      range: 270,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Ford%20Mustang%20Mach-E%20GT%20Grabber%20Blue%20electric%20SUV%20sporty%20design&image_size=landscape_4_3',
      owner: {
        id: '2',
        name: 'Sarah Johnson',
        username: 'sarahj',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20female%20avatar%20friendly%20smile&image_size=square',
        location: 'Austin, TX'
      },
      stats: {
        mileage: 28750,
        efficiency: '3.8',
        co2Saved: 25588
      },
      isLiked: false,
      likes: 18,
      addedDate: '2022-08-20'
    },
    {
      id: '3',
      make: 'BMW',
      model: 'iX',
      year: 2024,
      trim: 'xDrive50',
      color: 'Storm Bay',
      range: 324,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=BMW%20iX%20Storm%20Bay%20luxury%20electric%20SUV%20modern%20design&image_size=landscape_4_3',
      owner: {
        id: '3',
        name: 'Michael Chen',
        username: 'mchen',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20asian%20male%20avatar%20friendly%20smile&image_size=square',
        location: 'Seattle, WA'
      },
      stats: {
        mileage: 8950,
        efficiency: '3.5',
        co2Saved: 7966
      },
      isLiked: true,
      likes: 31,
      addedDate: '2024-01-10'
    },
    {
      id: '4',
      make: 'Rivian',
      model: 'R1T',
      year: 2023,
      trim: 'Adventure Package',
      color: 'Forest Green',
      range: 314,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Rivian%20R1T%20Forest%20Green%20electric%20pickup%20truck%20adventure%20outdoor&image_size=landscape_4_3',
      owner: {
        id: '4',
        name: 'Emily Rodriguez',
        username: 'emilyrod',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20latina%20female%20avatar%20friendly%20smile&image_size=square',
        location: 'Denver, CO'
      },
      stats: {
        mileage: 22100,
        efficiency: '2.8',
        co2Saved: 19669
      },
      isLiked: false,
      likes: 42,
      addedDate: '2023-06-12'
    },
    {
      id: '5',
      make: 'Lucid',
      model: 'Air',
      year: 2024,
      trim: 'Dream Edition',
      color: 'Stellar White',
      range: 516,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Lucid%20Air%20Dream%20Edition%20Stellar%20White%20luxury%20electric%20sedan&image_size=landscape_4_3',
      owner: {
        id: '5',
        name: 'David Park',
        username: 'davidpark',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20korean%20male%20avatar%20friendly%20smile&image_size=square',
        location: 'Los Angeles, CA'
      },
      stats: {
        mileage: 12300,
        efficiency: '4.8',
        co2Saved: 10947
      },
      isLiked: true,
      likes: 67,
      addedDate: '2024-02-28'
    }
  ];

  const makes = ['all', ...Array.from(new Set(allVehicles.map(v => v.make))).sort()];

  const filteredVehicles = allVehicles
    .filter(vehicle => {
      const matchesSearch = searchTerm === '' || 
        vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.owner.username.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMake = selectedMake === 'all' || vehicle.make === selectedMake;
      
      return matchesSearch && matchesMake;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        case 'oldest':
          return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
        case 'most-liked':
          return b.likes - a.likes;
        case 'make':
          return a.make.localeCompare(b.make);
        default:
          return 0;
      }
    });

  const handleLike = (vehicleId: string) => {
    // In a real app, this would make an API call
    console.log('Liked vehicle:', vehicleId);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900">Community Garage</h1>
            <p className="text-gray-600 mt-2">Discover electric vehicles from our community members</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/garage/my-garage"
              className="btn-secondary"
            >
              <Users className="h-4 w-4 mr-2" />
              My Garage
            </Link>
            <Link
              href="/garage/add"
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{allVehicles.length}</p>
                <p className="text-gray-600">Total Vehicles</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{new Set(allVehicles.map(v => v.owner.id)).size}</p>
                <p className="text-gray-600">Community Members</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Battery className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{Math.round(allVehicles.reduce((sum, v) => sum + v.range, 0) / allVehicles.length)}</p>
                <p className="text-gray-600">Avg Range (mi)</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{allVehicles.reduce((sum, v) => sum + v.stats.co2Saved, 0).toLocaleString()}</p>
                <p className="text-gray-600">CO₂ Saved (lbs)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search vehicles, owners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                />
              </div>

              {/* Make Filter */}
              <select
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {makes.map(make => (
                  <option key={make} value={make}>
                    {make === 'all' ? 'All Makes' : make}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most-liked">Most Liked</option>
                <option value="make">By Make</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredVehicles.length} of {allVehicles.length} vehicles
          </p>
        </div>

        {/* Vehicle Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={vehicle.image}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => handleLike(vehicle.id)}
                    className={`absolute top-3 right-3 p-2 rounded-full ${
                      vehicle.isLiked
                        ? 'bg-red-100 text-red-600'
                        : 'bg-white/80 text-gray-600 hover:bg-white'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${vehicle.isLiked ? 'fill-current' : ''}`} />
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-gray-600">{vehicle.trim} • {vehicle.color}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{vehicle.likes}</span>
                    </div>
                  </div>

                  {/* Owner Info */}
                  <Link
                    href={`/garage/${vehicle.owner.username}`}
                    className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <img
                      src={vehicle.owner.avatar}
                      alt={vehicle.owner.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{vehicle.owner.name}</p>
                      <p className="text-xs text-gray-600 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {vehicle.owner.location}
                      </p>
                    </div>
                  </Link>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-semibold text-gray-900">{vehicle.range} mi</div>
                      <div className="text-xs text-gray-600">Range</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-semibold text-gray-900">{vehicle.stats.efficiency}</div>
                      <div className="text-xs text-gray-600">mi/kWh</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/garage/vehicle/${vehicle.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Link>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center space-x-6">
                    <img
                      src={vehicle.image}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      className="w-24 h-16 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h3>
                          <p className="text-gray-600">{vehicle.trim} • {vehicle.color}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{vehicle.likes}</span>
                          </div>
                          <button
                            onClick={() => handleLike(vehicle.id)}
                            className={`p-2 rounded-full ${
                              vehicle.isLiked
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${vehicle.isLiked ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <Link
                          href={`/garage/${vehicle.owner.username}`}
                          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          <img
                            src={vehicle.owner.avatar}
                            alt={vehicle.owner.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span>{vehicle.owner.name}</span>
                          <MapPin className="h-3 w-3" />
                          <span>{vehicle.owner.location}</span>
                        </Link>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <span>{vehicle.range} mi range</span>
                          <span>{vehicle.stats.efficiency} mi/kWh</span>
                          <span>{vehicle.stats.mileage.toLocaleString()} miles</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/garage/vehicle/${vehicle.id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                          <button className="text-gray-400 hover:text-gray-600">
                            <Share2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredVehicles.length === 0 && (
          <div className="text-center py-12">
            <Car className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GaragePage;