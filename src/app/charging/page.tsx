'use client';

import { useState } from 'react';
import { Search, MapPin, Zap, Clock, Star, Filter, Navigation, Phone, Globe, ChevronDown, Battery, Wifi, CreditCard, Shield } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const ChargingStationMap = dynamic(() => import('../../components/ChargingStationMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-center h-96 text-gray-500">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Loading Map...</h3>
          <p>Please wait while the map loads.</p>
        </div>
      </div>
    </div>
  )
});

const ChargingStationsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedStation, setSelectedStation] = useState(null);

  // Mock charging stations data
  const chargingStations = [
    {
      id: 1,
      name: 'Tesla Supercharger - Downtown Plaza',
      network: 'Tesla',
      address: '123 Main Street, Downtown',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      distance: 0.8,
      rating: 4.8,
      reviews: 124,
      isOpen: true,
      hours: '24/7',
      phone: '(555) 123-4567',
      website: 'https://tesla.com/supercharger',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Supercharger%20station%20modern%20charging%20plaza%20electric%20vehicles&image_size=landscape_16_9',
      connectors: [
        {
          type: 'Tesla Supercharger',
          count: 12,
          power: 250,
          available: 8,
          pricing: '$0.28/kWh'
        }
      ],
      amenities: ['WiFi', 'Restrooms', 'Food', 'Shopping'],
      lastUpdated: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      name: 'Electrify America - Walmart Supercenter',
      network: 'Electrify America',
      address: '456 Commerce Blvd',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94103',
      distance: 1.2,
      rating: 4.5,
      reviews: 89,
      isOpen: true,
      hours: '6:00 AM - 11:00 PM',
      phone: '(555) 234-5678',
      website: 'https://electrifyamerica.com',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Electrify%20America%20charging%20station%20Walmart%20parking%20lot%20CCS%20connectors&image_size=landscape_16_9',
      connectors: [
        {
          type: 'CCS',
          count: 6,
          power: 350,
          available: 4,
          pricing: '$0.31/kWh'
        },
        {
          type: 'CHAdeMO',
          count: 2,
          power: 50,
          available: 2,
          pricing: '$0.31/kWh'
        }
      ],
      amenities: ['WiFi', 'Restrooms', 'Food', 'Shopping', 'Parking'],
      lastUpdated: '2024-01-15T09:15:00Z'
    },
    {
      id: 3,
      name: 'ChargePoint - City Hall',
      network: 'ChargePoint',
      address: '789 Government Plaza',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94104',
      distance: 2.1,
      rating: 4.2,
      reviews: 56,
      isOpen: true,
      hours: '7:00 AM - 7:00 PM',
      phone: '(555) 345-6789',
      website: 'https://chargepoint.com',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=ChargePoint%20charging%20station%20city%20hall%20public%20building%20Level%202&image_size=landscape_16_9',
      connectors: [
        {
          type: 'J1772',
          count: 4,
          power: 7.2,
          available: 3,
          pricing: '$0.25/kWh'
        }
      ],
      amenities: ['WiFi', 'Restrooms'],
      lastUpdated: '2024-01-15T08:45:00Z'
    },
    {
      id: 4,
      name: 'EVgo - Target Shopping Center',
      network: 'EVgo',
      address: '321 Retail Way',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      distance: 3.5,
      rating: 4.0,
      reviews: 73,
      isOpen: false,
      hours: '6:00 AM - 10:00 PM',
      phone: '(555) 456-7890',
      website: 'https://evgo.com',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=EVgo%20fast%20charging%20station%20Target%20shopping%20center%20DC%20fast%20charger&image_size=landscape_16_9',
      connectors: [
        {
          type: 'CCS',
          count: 4,
          power: 100,
          available: 0,
          pricing: '$0.30/kWh'
        },
        {
          type: 'CHAdeMO',
          count: 2,
          power: 50,
          available: 0,
          pricing: '$0.30/kWh'
        }
      ],
      amenities: ['WiFi', 'Food', 'Shopping', 'Parking'],
      lastUpdated: '2024-01-15T07:20:00Z'
    },
    {
      id: 5,
      name: 'Blink Charging - Hotel District',
      network: 'Blink',
      address: '654 Hotel Row',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94106',
      distance: 4.2,
      rating: 3.8,
      reviews: 42,
      isOpen: true,
      hours: '24/7',
      phone: '(555) 567-8901',
      website: 'https://blinkcharging.com',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Blink%20charging%20station%20hotel%20district%20urban%20setting%20Level%202%20charger&image_size=landscape_16_9',
      connectors: [
        {
          type: 'J1772',
          count: 6,
          power: 6.6,
          available: 5,
          pricing: '$0.29/kWh'
        }
      ],
      amenities: ['WiFi', 'Restrooms', 'Valet'],
      lastUpdated: '2024-01-15T11:00:00Z'
    }
  ];

  const networks = ['all', 'Tesla', 'Electrify America', 'ChargePoint', 'EVgo', 'Blink'];
  const connectorTypes = ['all', 'Tesla Supercharger', 'CCS', 'CHAdeMO', 'J1772'];
  const powerLevels = ['all', 'Level 2 (≤22kW)', 'DC Fast (23-99kW)', 'Ultra Fast (≥100kW)'];

  const filteredStations = chargingStations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         station.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         station.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || station.network === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getConnectorIcon = (type: string) => {
    switch (type) {
      case 'Tesla Supercharger':
        return '🔌';
      case 'CCS':
        return '⚡';
      case 'CHAdeMO':
        return '🔋';
      case 'J1772':
        return '🔌';
      default:
        return '⚡';
    }
  };

  const getNetworkColor = (network: string) => {
    switch (network) {
      case 'Tesla':
        return 'bg-red-100 text-red-800';
      case 'Electrify America':
        return 'bg-blue-100 text-blue-800';
      case 'ChargePoint':
        return 'bg-green-100 text-green-800';
      case 'EVgo':
        return 'bg-purple-100 text-purple-800';
      case 'Blink':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Charging Stations</h1>
          <p className="text-gray-600">Find and navigate to EV charging stations near you.</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, address, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Network Filter */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {networks.map(network => (
                  <option key={network} value={network}>
                    {network === 'all' ? 'All Networks' : network}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown className={`h-4 w-4 ml-2 transform transition-transform ${
                  showFilters ? 'rotate-180' : ''
                }`} />
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'map' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Connector Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {connectorTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'all' ? 'All Connectors' : type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Power Level</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {powerLevels.map(level => (
                      <option key={level} value={level}>
                        {level === 'all' ? 'All Power Levels' : level}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="all">All Stations</option>
                    <option value="available">Available Now</option>
                    <option value="open">Open 24/7</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Found {filteredStations.length} charging station{filteredStations.length !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
          </p>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="distance">Sort by Distance</option>
            <option value="rating">Sort by Rating</option>
            <option value="availability">Sort by Availability</option>
            <option value="power">Sort by Power</option>
          </select>
        </div>

        {/* Stations List */}
        {viewMode === 'list' ? (
          <div className="space-y-6">
            {filteredStations.map((station) => (
              <div key={station.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <img
                      src={station.image}
                      alt={station.name}
                      className="w-full h-48 md:h-full object-cover"
                    />
                  </div>
                  <div className="md:w-2/3 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{station.name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            getNetworkColor(station.network)
                          }`}>
                            {station.network}
                          </span>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            station.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {station.isOpen ? 'Open' : 'Closed'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{station.address}, {station.city}, {station.state}</span>
                          </div>
                          <div className="flex items-center">
                            <Navigation className="h-4 w-4 mr-1" />
                            <span>{station.distance} mi</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{station.hours}</span>
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1 text-yellow-400" />
                            <span>{station.rating} ({station.reviews} reviews)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <button className="btn-primary">
                          <Navigation className="h-4 w-4 mr-2" />
                          Navigate
                        </button>
                        <Link href={`/charging/${station.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
                          View Details
                        </Link>
                      </div>
                    </div>

                    {/* Connectors */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Available Connectors</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {station.connectors.map((connector, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getConnectorIcon(connector.type)}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{connector.type}</div>
                                <div className="text-xs text-gray-600">{connector.power}kW • {connector.pricing}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${
                                connector.available > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {connector.available}/{connector.count}
                              </div>
                              <div className="text-xs text-gray-500">available</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {station.amenities.map((amenity, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                            {amenity === 'WiFi' && <Wifi className="h-3 w-3 mr-1" />}
                            {amenity === 'Food' && <span className="mr-1">🍽️</span>}
                            {amenity === 'Shopping' && <span className="mr-1">🛍️</span>}
                            {amenity === 'Restrooms' && <span className="mr-1">🚻</span>}
                            {amenity === 'Parking' && <span className="mr-1">🅿️</span>}
                            {amenity === 'Valet' && <span className="mr-1">🔑</span>}
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        <span>{station.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-1" />
                        <a href={station.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                          Website
                        </a>
                      </div>
                      <div className="text-xs text-gray-500">
                        Updated {new Date(station.lastUpdated).toLocaleDateString('en-US')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ChargingStationMap 
            stations={filteredStations}
            selectedStation={selectedStation}
            onStationSelect={setSelectedStation}
          />
        )}

        {/* No Results */}
        {filteredStations.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No charging stations found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('all');
              }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChargingStationsPage;