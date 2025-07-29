'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Wrench, Camera, Edit, Trash2, Battery, Zap, Gauge, Clock } from 'lucide-react';

interface VehicleDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function VehicleDetailsPage({ params }: VehicleDetailsPageProps) {
  const resolvedParams = React.use(params);
  const vehicleId = resolvedParams.id;

  // Mock vehicle data - in a real app, this would come from an API
  const vehicle = {
    id: vehicleId,
    nickname: "Lightning Bolt",
    make: "Tesla",
    model: "Model 3",
    year: 2023,
    trim: "Performance",
    color: "Pearl White Multi-Coat",
    vin: "5YJ3E1EA8PF123456",
    purchaseDate: "2023-03-15",
    purchasePrice: 58990,
    currentMileage: 12500,
    owner: {
      username: "evlover2023",
      name: "Alex Johnson",
      avatar: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%20friendly%20person&image_size=square"
    },
    specifications: {
      batteryCapacity: "75 kWh",
      range: "358 miles",
      acceleration: "3.1s (0-60 mph)",
      topSpeed: "162 mph",
      chargingSpeed: "250 kW DC Fast Charging",
      drivetrain: "Dual Motor AWD",
      seating: "5 passengers",
      cargoSpace: "15 cu ft"
    },
    photos: [
      "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=white%20Tesla%20Model%203%20exterior%20front%20view%20modern%20electric%20car&image_size=landscape_16_9",
      "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20interior%20dashboard%20minimalist%20design%20touchscreen&image_size=landscape_16_9",
      "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20side%20profile%20white%20car%20sleek%20design&image_size=landscape_16_9",
      "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20rear%20view%20taillights%20modern%20electric%20vehicle&image_size=landscape_16_9"
    ],
    maintenanceRecords: [
      {
        id: 1,
        date: "2024-01-15",
        type: "Software Update",
        description: "Updated to version 2024.2.7",
        cost: 0,
        mileage: 12000
      },
      {
        id: 2,
        date: "2023-12-10",
        type: "Tire Rotation",
        description: "Rotated all four tires",
        cost: 80,
        mileage: 10500
      },
      {
        id: 3,
        date: "2023-09-20",
        type: "Cabin Air Filter",
        description: "Replaced cabin air filter",
        cost: 45,
        mileage: 8000
      }
    ],
    modifications: [
      "Performance Pedals",
      "All-Weather Floor Mats",
      "Tinted Windows (35%)",
      "Chrome Delete Kit"
    ]
  };

  const [selectedPhoto, setSelectedPhoto] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState('overview');

  const isOwner = true; // In a real app, check if current user owns this vehicle

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/garage"
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Garage
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">
                {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              </h1>
            </div>
            {isOwner && (
              <div className="flex items-center space-x-3">
                <button className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Vehicle
                </button>
                <button className="flex items-center px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Photo Gallery */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="aspect-video bg-gray-100">
                <img
                  src={vehicle.photos[selectedPhoto]}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex space-x-2 overflow-x-auto">
                  {vehicle.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPhoto(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedPhoto === index ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`View ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'specifications', label: 'Specifications' },
                    { id: 'maintenance', label: 'Maintenance' },
                    { id: 'modifications', label: 'Modifications' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Make & Model:</span>
                            <span className="font-medium">{vehicle.make} {vehicle.model}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Year:</span>
                            <span className="font-medium">{vehicle.year}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Trim:</span>
                            <span className="font-medium">{vehicle.trim}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Color:</span>
                            <span className="font-medium">{vehicle.color}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">VIN:</span>
                            <span className="font-medium font-mono text-sm">{vehicle.vin}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Ownership Details</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Purchase Date:</span>
                            <span className="font-medium">{new Date(vehicle.purchaseDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Purchase Price:</span>
                            <span className="font-medium">${vehicle.purchasePrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Current Mileage:</span>
                            <span className="font-medium">{vehicle.currentMileage.toLocaleString()} miles</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'specifications' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Technical Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(vehicle.specifications).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {key === 'batteryCapacity' && <Battery className="w-5 h-5 text-blue-600" />}
                            {key === 'range' && <MapPin className="w-5 h-5 text-green-600" />}
                            {key === 'acceleration' && <Zap className="w-5 h-5 text-yellow-600" />}
                            {key === 'topSpeed' && <Gauge className="w-5 h-5 text-red-600" />}
                            {!['batteryCapacity', 'range', 'acceleration', 'topSpeed'].includes(key) && (
                              <div className="w-5 h-5 bg-gray-400 rounded-full" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="font-medium text-gray-900">{value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'maintenance' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Maintenance Records</h3>
                      {isOwner && (
                        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          <Wrench className="w-4 h-4 mr-2" />
                          Add Record
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {vehicle.maintenanceRecords.map((record) => (
                        <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{record.type}</h4>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(record.date).toLocaleDateString()}
                            </div>
                          </div>
                          <p className="text-gray-600 mb-2">{record.description}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              Mileage: {record.mileage.toLocaleString()} miles
                            </span>
                            <span className="font-medium text-gray-900">
                              {record.cost > 0 ? `$${record.cost}` : 'Free'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'modifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Modifications & Accessories</h3>
                      {isOwner && (
                        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          <Edit className="w-4 h-4 mr-2" />
                          Add Modification
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vehicle.modifications.map((mod, index) => (
                        <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          <span className="font-medium text-gray-900">{mod}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner</h3>
              <div className="flex items-center space-x-3">
                <img
                  src={vehicle.owner.avatar}
                  alt={vehicle.owner.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <Link
                    href={`/users/${vehicle.owner.username}`}
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {vehicle.owner.name}
                  </Link>
                  <p className="text-sm text-gray-600">@{vehicle.owner.username}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Days Owned</span>
                  <span className="font-medium">
                    {Math.floor((new Date().getTime() - new Date(vehicle.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avg. Miles/Day</span>
                  <span className="font-medium">
                    {Math.round(vehicle.currentMileage / Math.floor((new Date().getTime() - new Date(vehicle.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Maintenance Records</span>
                  <span className="font-medium">{vehicle.maintenanceRecords.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Modifications</span>
                  <span className="font-medium">{vehicle.modifications.length}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <Link
                  href={`/garage/${vehicle.owner.username}`}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Owner's Garage
                </Link>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Camera className="w-4 h-4 mr-2" />
                  View All Photos
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Share Vehicle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}