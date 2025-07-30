'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { 
  Car, 
  ArrowLeft,
  MapPin,
  Calendar,
  Battery,
  Zap,
  Heart,
  Share2,
  Eye,
  Award,
  TrendingUp,
  Users
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
  stats: {
    mileage: number;
    efficiency: string;
    co2Saved: number;
  };
  isLiked: boolean;
  likes: number;
  addedDate: string;
}

interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  location: string;
  joinDate: string;
  bio: string;
  stats: {
    totalVehicles: number;
    totalMiles: number;
    avgEfficiency: string;
    co2Saved: number;
  };
}

interface UserGaragePageProps {
  params: Promise<{
    username: string;
  }>;
}

const UserGaragePage = ({ params }: UserGaragePageProps) => {
  const { username } = use(params);
  const [likedVehicles, setLikedVehicles] = useState<string[]>([]);

  // Mock user data - in real app, fetch based on username
  const userProfile: UserProfile = {
    id: '1',
    name: 'John Smith',
    username: username,
    avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20male%20avatar%20friendly%20smile&image_size=square',
    location: 'San Francisco, CA',
    joinDate: '2023-01-15',
    bio: 'EV enthusiast and early adopter. Love sharing my experience with electric vehicles and helping others make the switch to sustainable transportation.',
    stats: {
      totalVehicles: 2,
      totalMiles: 43170,
      avgEfficiency: '4.0',
      co2Saved: 38412
    }
  };

  // Mock vehicles for this user
  const userVehicles: Vehicle[] = [
    {
      id: '1',
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      trim: 'Long Range',
      color: 'Pearl White',
      range: 358,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20Pearl%20White%20electric%20car%20side%20view%20modern%20clean%20background&image_size=landscape_4_3',
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
      id: '6',
      make: 'Tesla',
      model: 'Model Y',
      year: 2024,
      trim: 'Performance',
      color: 'Midnight Silver',
      range: 303,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%20Y%20Performance%20Midnight%20Silver%20electric%20SUV%20sporty&image_size=landscape_4_3',
      stats: {
        mileage: 27750,
        efficiency: '3.8',
        co2Saved: 24688
      },
      isLiked: false,
      likes: 19,
      addedDate: '2024-01-20'
    }
  ];

  const handleLike = (vehicleId: string) => {
    setLikedVehicles(prev => 
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const isCurrentUser = username === 'current-user'; // In real app, check against authenticated user

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/garage"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community Garage
          </Link>
        </div>

        {/* User Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-24 h-24 rounded-full mx-auto md:mx-0 mb-4 md:mb-0"
              />
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{userProfile.name}</h1>
                <p className="text-gray-600 mb-2">@{userProfile.username}</p>
                <div className="flex items-center justify-center md:justify-start text-gray-600 mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{userProfile.location}</span>
                  <span className="mx-2">•</span>
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Joined {new Date(userProfile.joinDate).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 max-w-2xl">{userProfile.bio}</p>
              </div>

              {!isCurrentUser && (
                <div className="flex items-center space-x-3 mt-4 md:mt-0">
                  <button className="btn-secondary">
                    <Users className="h-4 w-4 mr-2" />
                    Follow
                  </button>
                  <button className="btn-primary">
                    Message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{userProfile.stats.totalVehicles}</p>
                <p className="text-gray-600">Vehicles</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{userProfile.stats.totalMiles.toLocaleString()}</p>
                <p className="text-gray-600">Total Miles</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Battery className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{userProfile.stats.avgEfficiency}</p>
                <p className="text-gray-600">Avg Efficiency</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{userProfile.stats.co2Saved.toLocaleString()}</p>
                <p className="text-gray-600">CO₂ Saved (lbs)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isCurrentUser ? 'My Vehicles' : `${userProfile.name}'s Vehicles`}
            </h2>
            <span className="text-gray-600">{userVehicles.length} vehicles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={vehicle.image}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-full h-48 object-cover"
                  />
                  {!isCurrentUser && (
                    <button
                      onClick={() => handleLike(vehicle.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full ${
                        likedVehicles.includes(vehicle.id)
                          ? 'bg-red-100 text-red-600'
                          : 'bg-white/80 text-gray-600 hover:bg-white'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${likedVehicles.includes(vehicle.id) ? 'fill-current' : ''}`} />
                    </button>
                  )}
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

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-sm font-semibold text-gray-900">{vehicle.range} mi</div>
                      <div className="text-xs text-gray-600">Range</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-sm font-semibold text-gray-900">{vehicle.stats.efficiency}</div>
                      <div className="text-xs text-gray-600">mi/kWh</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-sm font-semibold text-gray-900">{vehicle.stats.mileage.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Miles</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-sm font-semibold text-gray-900">{vehicle.stats.co2Saved.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">CO₂ Saved</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/garage/vehicle/${vehicle.id}`}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {userVehicles.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isCurrentUser ? 'No vehicles yet' : `${userProfile.name} hasn't added any vehicles yet`}
            </h3>
            <p className="text-gray-600 mb-6">
              {isCurrentUser 
                ? 'Add your first electric vehicle to get started!' 
                : 'Check back later to see their EV collection.'
              }
            </p>
            {isCurrentUser && (
              <Link href="/garage/add" className="btn-primary">
                Add Your First Vehicle
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserGaragePage;