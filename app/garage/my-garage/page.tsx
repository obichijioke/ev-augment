'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Car, 
  Plus, 
  Zap, 
  Award, 
  Battery, 
  MapPin, 
  Share2, 
  Edit, 
  Trash2,
  Calendar,
  ArrowLeft,
  TrendingUp,
  Clock,
  Eye
} from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  color: string;
  vin: string;
  mileage: number;
  range: number;
  purchaseDate: string;
  image: string;
  notes?: string;
  modifications: string[];
  maintenanceRecords: {
    id: string;
    type: string;
    description: string;
    date: string;
    cost: number;
    mileage: number;
  }[];
}

interface ChargingSession {
  id: string;
  vehicleId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  energyAdded: number;
  peakPower: number;
  cost: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  progress: number;
}

const MyGaragePage = () => {
  const [activeTab, setActiveTab] = useState('vehicles');

  // Mock data - replace with actual data from your backend
  const vehicles: Vehicle[] = [
    {
      id: '1',
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      trim: 'Long Range',
      color: 'Pearl White',
      vin: '5YJ3E1EA8PF123456',
      mileage: 15420,
      range: 358,
      purchaseDate: '2023-03-15',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20Pearl%20White%20electric%20car%20side%20view%20modern%20clean%20background&image_size=landscape_4_3',
      notes: 'Daily driver, excellent efficiency in city driving.',
      modifications: ['Tinted Windows', 'All-Weather Floor Mats', 'Center Console Organizer'],
      maintenanceRecords: [
        {
          id: '1',
          type: 'Tire Rotation',
          description: 'Rotated all four tires',
          date: '2024-01-15',
          cost: 89,
          mileage: 15000
        },
        {
          id: '2',
          type: 'Software Update',
          description: 'Updated to version 2023.44.30',
          date: '2024-01-10',
          cost: 0,
          mileage: 14950
        }
      ]
    },
    {
      id: '2',
      make: 'Ford',
      model: 'Mustang Mach-E',
      year: 2022,
      trim: 'GT Performance',
      color: 'Grabber Blue',
      vin: '3FMTK3SU8NMA12345',
      mileage: 28750,
      range: 270,
      purchaseDate: '2022-08-20',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Ford%20Mustang%20Mach-E%20GT%20Grabber%20Blue%20electric%20SUV%20sporty%20design&image_size=landscape_4_3',
      notes: 'Weekend adventure vehicle, great for road trips.',
      modifications: ['Roof Rack', 'Performance Pedals', 'Custom Floor Mats'],
      maintenanceRecords: [
        {
          id: '3',
          type: 'Brake Inspection',
          description: 'Inspected brake pads and rotors',
          date: '2024-01-20',
          cost: 125,
          mileage: 28500
        }
      ]
    }
  ];

  const chargingSessions: ChargingSession[] = [
    {
      id: '1',
      vehicleId: '1',
      date: '2024-01-25',
      startTime: '2:30 PM',
      endTime: '3:45 PM',
      location: 'Supercharger - Downtown Mall',
      energyAdded: 45.2,
      peakPower: 150,
      cost: 18.08
    },
    {
      id: '2',
      vehicleId: '2',
      date: '2024-01-24',
      startTime: '10:15 AM',
      endTime: '11:30 AM',
      location: 'Electrify America - Highway Rest Stop',
      energyAdded: 52.8,
      peakPower: 175,
      cost: 23.76
    },
    {
      id: '3',
      vehicleId: '1',
      date: '2024-01-22',
      startTime: '6:00 PM',
      endTime: '10:00 PM',
      location: 'Home Charging (Level 2)',
      energyAdded: 68.5,
      peakPower: 11.5,
      cost: 8.22
    }
  ];

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Charge',
      description: 'Complete your first charging session',
      icon: '⚡',
      earned: true,
      earnedDate: '2023-03-16',
      progress: 100
    },
    {
      id: '2',
      title: 'Efficiency Expert',
      description: 'Achieve over 4.5 mi/kWh efficiency',
      icon: '🌱',
      earned: true,
      earnedDate: '2023-04-02',
      progress: 100
    },
    {
      id: '3',
      title: 'Road Warrior',
      description: 'Drive 10,000 miles in your EV',
      icon: '🛣️',
      earned: true,
      earnedDate: '2023-12-15',
      progress: 100
    },
    {
      id: '4',
      title: 'Carbon Saver',
      description: 'Save 5,000 lbs of CO₂ emissions',
      icon: '🌍',
      earned: false,
      progress: 78
    },
    {
      id: '5',
      title: 'Charging Champion',
      description: 'Complete 100 charging sessions',
      icon: '🏆',
      earned: false,
      progress: 45
    },
    {
      id: '6',
      title: 'Long Distance',
      description: 'Complete a 500+ mile trip',
      icon: '🚗',
      earned: false,
      progress: 0
    }
  ];

  const getVehicleStats = (vehicle: Vehicle) => {
    const sessions = chargingSessions.filter(s => s.vehicleId === vehicle.id);
    const totalEnergy = sessions.reduce((sum, s) => sum + s.energyAdded, 0);
    const avgEfficiency = vehicle.mileage > 0 ? (vehicle.mileage / totalEnergy).toFixed(1) : '0.0';
    const co2Saved = Math.round(vehicle.mileage * 0.89); // Rough calculation
    
    return {
      totalEnergy: totalEnergy.toFixed(1),
      avgEfficiency,
      co2Saved: co2Saved.toLocaleString()
    };
  };

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

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Garage</h1>
            <p className="text-gray-600 mt-2">Track your electric vehicles, charging sessions, and achievements.</p>
          </div>
          <Link
            href="/garage/add"
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
                <p className="text-gray-600">Vehicles</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{vehicles.reduce((sum, v) => sum + v.mileage, 0).toLocaleString()}</p>
                <p className="text-gray-600">Total Miles</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{chargingSessions.length}</p>
                <p className="text-gray-600">Charging Sessions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{achievements.filter(a => a.earned).length}</p>
                <p className="text-gray-600">Achievements</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'vehicles'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Car className="h-4 w-4 inline mr-2" />
                My Vehicles
              </button>
              <button
                onClick={() => setActiveTab('charging')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'charging'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Zap className="h-4 w-4 inline mr-2" />
                Charging History
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'achievements'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Award className="h-4 w-4 inline mr-2" />
                Achievements
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'vehicles' && (
          <div className="space-y-6">
            {vehicles.map((vehicle) => {
              const stats = getVehicleStats(vehicle);
              return (
                <div key={vehicle.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="md:flex">
                    <div className="md:w-1/3">
                      <img
                        src={vehicle.image}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="w-full h-48 md:h-full object-cover"
                      />
                    </div>
                    <div className="md:w-2/3 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h3>
                          <p className="text-gray-600">{vehicle.trim} • {vehicle.color}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>VIN: {vehicle.vin}</span>
                            <span>•</span>
                            <span>{vehicle.mileage.toLocaleString()} miles</span>
                            <span>•</span>
                            <span>Owned since {new Date(vehicle.purchaseDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link
                             href={`/garage/vehicle/${vehicle.id}`}
                             className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                           >
                             <Eye className="w-4 h-4 mr-1" />
                             View Details
                           </Link>
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <Share2 className="h-4 w-4" />
                          </button>
                          <Link href={`/garage/edit/${vehicle.id}`} className="p-2 text-gray-400 hover:text-gray-600">
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button className="p-2 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Vehicle Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">{vehicle.range}</div>
                          <div className="text-sm text-gray-600">EPA Range (mi)</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">{stats.avgEfficiency}</div>
                          <div className="text-sm text-gray-600">Efficiency (mi/kWh)</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">{stats.totalEnergy}</div>
                          <div className="text-sm text-gray-600">Total Energy (kWh)</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">{stats.co2Saved}</div>
                          <div className="text-sm text-gray-600">CO₂ Saved (lbs)</div>
                        </div>
                      </div>

                      {/* Notes */}
                      {vehicle.notes && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                          <p className="text-gray-600 text-sm">{vehicle.notes}</p>
                        </div>
                      )}

                      {/* Modifications */}
                      {vehicle.modifications.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Modifications</h4>
                          <div className="flex flex-wrap gap-2">
                            {vehicle.modifications.map((mod, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                {mod}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Maintenance */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Maintenance</h4>
                        <div className="space-y-2">
                          {vehicle.maintenanceRecords.slice(0, 2).map((record, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div>
                                <span className="font-medium text-gray-900">{record.type}</span>
                                <span className="text-gray-500 ml-2">{record.description}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-gray-900">${record.cost}</div>
                                <div className="text-gray-500">{new Date(record.date).toLocaleDateString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'charging' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Charging Sessions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date &amp; Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Energy Added</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peak Power</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chargingSessions.map((session) => {
                    const vehicle = vehicles.find(v => v.id === session.vehicleId);
                    return (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{new Date(session.date).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-500">{session.startTime} - {session.endTime}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{vehicle?.make} {vehicle?.model}</div>
                          <div className="text-sm text-gray-500">{vehicle?.year}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">{session.location}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Battery className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-gray-900">{session.energyAdded} kWh</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm text-gray-900">{session.peakPower} kW</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${session.cost.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <div key={achievement.id} className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
                achievement.earned ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{achievement.icon}</div>
                  {achievement.earned && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Award className="h-4 w-4" />
                      <span className="text-xs font-medium">Earned</span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{achievement.description}</p>
                
                {achievement.earned ? (
                  <div className="text-sm text-green-600">
                    Earned on {new Date(achievement.earnedDate!).toLocaleDateString()}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{achievement.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${achievement.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGaragePage;