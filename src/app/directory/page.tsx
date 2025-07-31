'use client';

import { useState } from 'react';
import { Search, MapPin, Phone, Mail, Globe, Star, Clock, Zap, Wrench, Car, Building, Filter, Grid, List, Navigation, Heart, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const DirectoryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  const businesses = [
    {
      id: 1,
      name: 'Tesla Service Center',
      category: 'service',
      type: 'Authorized Service Center',
      description: 'Official Tesla service center providing maintenance, repairs, and software updates for all Tesla models.',
      address: '123 Electric Ave, San Francisco, CA 94105',
      city: 'San Francisco',
      state: 'CA',
      phone: '(555) 123-4567',
      email: 'service@tesla.com',
      website: 'https://tesla.com/service',
      rating: 4.8,
      reviews: 234,
      hours: {
        monday: '8:00 AM - 6:00 PM',
        tuesday: '8:00 AM - 6:00 PM',
        wednesday: '8:00 AM - 6:00 PM',
        thursday: '8:00 AM - 6:00 PM',
        friday: '8:00 AM - 6:00 PM',
        saturday: '9:00 AM - 4:00 PM',
        sunday: 'Closed'
      },
      services: ['Maintenance', 'Repairs', 'Software Updates', 'Warranty Service'],
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20service%20center%20modern%20building%20electric%20vehicle%20maintenance&image_size=landscape_16_9',
      verified: true,
      featured: true
    },
    {
      id: 2,
      name: 'ElectroCharge Station Network',
      category: 'charging',
      type: 'DC Fast Charging',
      description: 'High-speed DC fast charging network with 350kW chargers. Multiple connector types available.',
      address: '456 Power St, Los Angeles, CA 90210',
      city: 'Los Angeles',
      state: 'CA',
      phone: '(555) 987-6543',
      email: 'support@electrocharge.com',
      website: 'https://electrocharge.com',
      rating: 4.6,
      reviews: 156,
      hours: {
        monday: '24/7',
        tuesday: '24/7',
        wednesday: '24/7',
        thursday: '24/7',
        friday: '24/7',
        saturday: '24/7',
        sunday: '24/7'
      },
      services: ['DC Fast Charging', 'CCS', 'CHAdeMO', 'Tesla Adapter'],
      chargingInfo: {
        maxPower: '350kW',
        connectors: ['CCS', 'CHAdeMO'],
        pricing: '$0.35/kWh',
        availability: '8/8 Available'
      },
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=DC%20fast%20charging%20station%20modern%20electric%20vehicle%20charging&image_size=landscape_16_9',
      verified: true,
      featured: false
    },
    {
      id: 3,
      name: 'EV Specialists Auto Repair',
      category: 'service',
      type: 'Independent Service Shop',
      description: 'Specialized in electric vehicle maintenance and repairs. Certified technicians for all major EV brands.',
      address: '789 Volt Blvd, Austin, TX 78701',
      city: 'Austin',
      state: 'TX',
      phone: '(555) 456-7890',
      email: 'info@evspecialists.com',
      website: 'https://evspecialists.com',
      rating: 4.9,
      reviews: 89,
      hours: {
        monday: '7:00 AM - 6:00 PM',
        tuesday: '7:00 AM - 6:00 PM',
        wednesday: '7:00 AM - 6:00 PM',
        thursday: '7:00 AM - 6:00 PM',
        friday: '7:00 AM - 6:00 PM',
        saturday: '8:00 AM - 4:00 PM',
        sunday: 'Closed'
      },
      services: ['Battery Service', 'Motor Repair', 'Brake Service', 'Tire Service'],
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=electric%20vehicle%20auto%20repair%20shop%20specialized%20service&image_size=landscape_16_9',
      verified: true,
      featured: false
    },
    {
      id: 4,
      name: 'Green Energy Dealership',
      category: 'dealership',
      type: 'Multi-Brand EV Dealer',
      description: 'Authorized dealer for Tesla, BMW, Audi, and Nissan electric vehicles. New and certified pre-owned.',
      address: '321 Green Way, Seattle, WA 98101',
      city: 'Seattle',
      state: 'WA',
      phone: '(555) 234-5678',
      email: 'sales@greenenergy.com',
      website: 'https://greenenergy.com',
      rating: 4.7,
      reviews: 312,
      hours: {
        monday: '9:00 AM - 8:00 PM',
        tuesday: '9:00 AM - 8:00 PM',
        wednesday: '9:00 AM - 8:00 PM',
        thursday: '9:00 AM - 8:00 PM',
        friday: '9:00 AM - 8:00 PM',
        saturday: '9:00 AM - 6:00 PM',
        sunday: '11:00 AM - 5:00 PM'
      },
      services: ['New Vehicle Sales', 'Certified Pre-Owned', 'Financing', 'Trade-Ins'],
      brands: ['Tesla', 'BMW', 'Audi', 'Nissan'],
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=electric%20vehicle%20dealership%20showroom%20modern%20cars&image_size=landscape_16_9',
      verified: true,
      featured: true
    },
    {
      id: 5,
      name: 'PowerUp Home Charging',
      category: 'installation',
      type: 'Charging Installation Service',
      description: 'Professional home charging station installation. Licensed electricians specializing in EV charging.',
      address: '654 Circuit Dr, Denver, CO 80202',
      city: 'Denver',
      state: 'CO',
      phone: '(555) 345-6789',
      email: 'install@poweruphome.com',
      website: 'https://poweruphome.com',
      rating: 4.8,
      reviews: 127,
      hours: {
        monday: '8:00 AM - 5:00 PM',
        tuesday: '8:00 AM - 5:00 PM',
        wednesday: '8:00 AM - 5:00 PM',
        thursday: '8:00 AM - 5:00 PM',
        friday: '8:00 AM - 5:00 PM',
        saturday: '9:00 AM - 3:00 PM',
        sunday: 'Emergency Only'
      },
      services: ['Level 2 Installation', 'Electrical Upgrades', 'Permits', 'Maintenance'],
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=home%20EV%20charging%20station%20installation%20electrician%20service&image_size=landscape_16_9',
      verified: true,
      featured: false
    },
    {
      id: 6,
      name: 'EV Parts Warehouse',
      category: 'parts',
      type: 'Parts & Accessories Retailer',
      description: 'Largest selection of EV parts, accessories, and charging equipment. Online and in-store shopping.',
      address: '987 Component Ave, Phoenix, AZ 85001',
      city: 'Phoenix',
      state: 'AZ',
      phone: '(555) 567-8901',
      email: 'parts@evwarehouse.com',
      website: 'https://evwarehouse.com',
      rating: 4.5,
      reviews: 203,
      hours: {
        monday: '9:00 AM - 7:00 PM',
        tuesday: '9:00 AM - 7:00 PM',
        wednesday: '9:00 AM - 7:00 PM',
        thursday: '9:00 AM - 7:00 PM',
        friday: '9:00 AM - 7:00 PM',
        saturday: '9:00 AM - 6:00 PM',
        sunday: '10:00 AM - 5:00 PM'
      },
      services: ['OEM Parts', 'Aftermarket Accessories', 'Charging Cables', 'Installation Kits'],
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=EV%20parts%20warehouse%20automotive%20accessories%20store&image_size=landscape_16_9',
      verified: true,
      featured: false
    }
  ];

  const categories = [
    { id: 'all', name: 'All Categories', icon: Building, count: businesses.length },
    { id: 'dealership', name: 'Dealerships', icon: Car, count: businesses.filter(b => b.category === 'dealership').length },
    { id: 'service', name: 'Service Centers', icon: Wrench, count: businesses.filter(b => b.category === 'service').length },
    { id: 'charging', name: 'Charging Stations', icon: Zap, count: businesses.filter(b => b.category === 'charging').length },
    { id: 'installation', name: 'Installation Services', icon: Building, count: businesses.filter(b => b.category === 'installation').length },
    { id: 'parts', name: 'Parts & Accessories', icon: Building, count: businesses.filter(b => b.category === 'parts').length }
  ];

  const locations = [
    { id: 'all', name: 'All Locations' },
    { id: 'CA', name: 'California' },
    { id: 'TX', name: 'Texas' },
    { id: 'WA', name: 'Washington' },
    { id: 'CO', name: 'Colorado' },
    { id: 'AZ', name: 'Arizona' }
  ];

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         business.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         business.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || business.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || business.state === selectedLocation;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dealership': return Car;
      case 'service': return Wrench;
      case 'charging': return Zap;
      case 'installation': return Building;
      case 'parts': return Building;
      default: return Building;
    }
  };

  const isOpen = (hours: any) => {
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const todayHours = hours[day];
    
    if (todayHours === 'Closed') return false;
    if (todayHours === '24/7') return true;
    
    const [open, close] = todayHours.split(' - ');
    const openTime = parseTime(open);
    const closeTime = parseTime(close);
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const parseTime = (timeStr: string) => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    return (period === 'PM' && hours !== 12 ? hours + 12 : hours) * 60 + minutes;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Business Directory</h1>
          <p className="text-gray-600 dark:text-gray-300">Find EV dealerships, service centers, charging stations, and more</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map(category => {
                    const IconComponent = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${
                          selectedCategory === category.id
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{category.name}</span>
                          </div>
                          <span className="text-sm text-gray-400">({category.count})</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location Filter */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/directory/add" className="w-full btn-primary text-center block">
                    Add Your Business
                  </Link>
                  <Link href="/directory/map" className="w-full btn-secondary text-center block">
                    View Map
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and View Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search businesses, services, or locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {filteredBusinesses.length} of {businesses.length} businesses
              </p>
            </div>

            {/* Business Listings */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}>
              {filteredBusinesses.map((business) => {
                const IconComponent = getCategoryIcon(business.category);
                const businessIsOpen = isOpen(business.hours);
                
                return (
                  <div key={business.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                    {business.featured && (
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-1 text-sm font-medium">
                        Featured Business
                      </div>
                    )}
                    
                    <div className="relative">
                      <img
                        src={business.image}
                        alt={business.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            businessIsOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {businessIsOpen ? 'Open' : 'Closed'}
                          </span>
                          {business.verified && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="absolute top-4 right-4">
                        <button className="p-2 bg-white rounded-full shadow-sm hover:shadow-md">
                          <Heart className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">{business.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{business.type}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium text-gray-900">{business.rating}</span>
                          <span className="text-sm text-gray-600">({business.reviews})</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{business.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{business.address}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{business.phone}</span>
                        </div>
                      </div>
                      
                      {/* Services */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {business.services.slice(0, 3).map((service, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {service}
                            </span>
                          ))}
                          {business.services.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{business.services.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Charging Info */}
                      {business.chargingInfo && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-blue-900">Max Power:</span>
                              <span className="text-blue-700 ml-1">{business.chargingInfo.maxPower}</span>
                            </div>
                            <div>
                              <span className="font-medium text-blue-900">Pricing:</span>
                              <span className="text-blue-700 ml-1">{business.chargingInfo.pricing}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium text-blue-900">Status:</span>
                              <span className="text-green-700 ml-1">{business.chargingInfo.availability}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-blue-500">
                            <Phone className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-blue-500">
                            <Mail className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-blue-500">
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-blue-500">
                            <Navigation className="h-4 w-4" />
                          </button>
                        </div>
                        <Link href={`/directory/${business.id}`} className="btn-primary">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectoryPage;