'use client';

import { useState } from 'react';
import { Search, Filter, MapPin, Heart, MessageCircle, Phone, Mail, Calendar, Zap, Battery, Gauge, Users, Star, ChevronDown, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

const MarketplacePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 150000],
    mileage: [0, 100000],
    year: 'all',
    condition: 'all',
    location: 'all'
  });

  const listings = [
    {
      id: 1,
      title: '2023 Tesla Model S Plaid - Pristine Condition',
      price: 89900,
      originalPrice: 129990,
      category: 'vehicles',
      condition: 'Excellent',
      year: 2023,
      mileage: 8500,
      location: 'San Francisco, CA',
      seller: {
        name: 'John Smith',
        rating: 4.9,
        reviews: 23,
        verified: true,
        joinDate: '2021'
      },
      specs: {
        range: 396,
        acceleration: '1.99s',
        topSpeed: '200mph',
        chargingSpeed: '250kW'
      },
      features: ['Autopilot', 'Premium Interior', 'Carbon Fiber Spoiler', 'Track Mode'],
      images: ['https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%20S%20Plaid%202023%20luxury%20electric%20sedan%20pristine%20condition&image_size=landscape_16_9'],
      postedDate: '2024-01-15',
      views: 1234,
      likes: 45,
      description: 'Immaculate Tesla Model S Plaid with all premium features. Garage kept, non-smoking owner.'
    },
    {
      id: 2,
      title: 'BMW i4 M50 - Low Mileage, One Owner',
      price: 58500,
      originalPrice: 67300,
      category: 'vehicles',
      condition: 'Excellent',
      year: 2023,
      mileage: 12000,
      location: 'Los Angeles, CA',
      seller: {
        name: 'Sarah Johnson',
        rating: 4.8,
        reviews: 15,
        verified: true,
        joinDate: '2020'
      },
      specs: {
        range: 270,
        acceleration: '3.7s',
        topSpeed: '155mph',
        chargingSpeed: '200kW'
      },
      features: ['M Sport Package', 'Harman Kardon Audio', 'Heated Seats', 'Wireless Charging'],
      images: ['https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=BMW%20i4%20M50%202023%20electric%20sedan%20sporty%20blue%20color&image_size=landscape_16_9'],
      postedDate: '2024-01-12',
      views: 892,
      likes: 32,
      description: 'Beautiful BMW i4 M50 with M Sport package. Perfect for daily driving and weekend fun.'
    },
    {
      id: 3,
      title: 'Tesla Model 3 Performance - Track Ready',
      price: 45900,
      originalPrice: 55990,
      category: 'vehicles',
      condition: 'Very Good',
      year: 2022,
      mileage: 18500,
      location: 'Austin, TX',
      seller: {
        name: 'Mike Chen',
        rating: 4.7,
        reviews: 31,
        verified: true,
        joinDate: '2019'
      },
      specs: {
        range: 315,
        acceleration: '3.1s',
        topSpeed: '162mph',
        chargingSpeed: '250kW'
      },
      features: ['Performance Upgrade', 'Track Mode', 'Premium Connectivity', 'Enhanced Autopilot'],
      images: ['https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20Performance%202022%20red%20electric%20sedan%20sporty&image_size=landscape_16_9'],
      postedDate: '2024-01-10',
      views: 1567,
      likes: 78,
      description: 'Well-maintained Model 3 Performance with track package. Ready for spirited driving.'
    },
    {
      id: 4,
      title: 'CHAdeMO to CCS Adapter - Like New',
      price: 450,
      originalPrice: 599,
      category: 'accessories',
      condition: 'Like New',
      location: 'Seattle, WA',
      seller: {
        name: 'EV Parts Pro',
        rating: 4.9,
        reviews: 156,
        verified: true,
        joinDate: '2018'
      },
      images: ['https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=CHAdeMO%20to%20CCS%20charging%20adapter%20electric%20vehicle%20accessory&image_size=square'],
      postedDate: '2024-01-14',
      views: 234,
      likes: 12,
      description: 'Genuine CHAdeMO to CCS adapter, used only twice. Perfect for expanding charging options.'
    },
    {
      id: 5,
      title: 'Tesla Wall Connector Gen 3 - Unopened',
      price: 350,
      originalPrice: 425,
      category: 'charging',
      condition: 'New',
      location: 'Denver, CO',
      seller: {
        name: 'Green Energy Solutions',
        rating: 5.0,
        reviews: 89,
        verified: true,
        joinDate: '2020'
      },
      images: ['https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Wall%20Connector%20Gen%203%20home%20charging%20station&image_size=square'],
      postedDate: '2024-01-13',
      views: 445,
      likes: 23,
      description: 'Brand new Tesla Wall Connector, still in original packaging. Perfect for home installation.'
    },
    {
      id: 6,
      title: 'Audi e-tron GT - Prestige Package',
      price: 95000,
      originalPrice: 102400,
      category: 'vehicles',
      condition: 'Excellent',
      year: 2023,
      mileage: 6800,
      location: 'Miami, FL',
      seller: {
        name: 'Luxury Auto Dealer',
        rating: 4.8,
        reviews: 67,
        verified: true,
        joinDate: '2017'
      },
      specs: {
        range: 238,
        acceleration: '3.9s',
        topSpeed: '152mph',
        chargingSpeed: '270kW'
      },
      features: ['Prestige Package', 'Bang & Olufsen Audio', 'Air Suspension', 'Matrix LED Headlights'],
      images: ['https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Audi%20e-tron%20GT%202023%20luxury%20electric%20coupe%20silver%20color&image_size=landscape_16_9'],
      postedDate: '2024-01-08',
      views: 2134,
      likes: 89,
      description: 'Stunning Audi e-tron GT with full Prestige package. Showroom condition with low miles.'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Categories', count: listings.length },
    { id: 'vehicles', name: 'Vehicles', count: listings.filter(l => l.category === 'vehicles').length },
    { id: 'accessories', name: 'Accessories', count: listings.filter(l => l.category === 'accessories').length },
    { id: 'charging', name: 'Charging Equipment', count: listings.filter(l => l.category === 'charging').length },
    { id: 'parts', name: 'Parts & Components', count: 0 },
    { id: 'services', name: 'Services', count: 0 }
  ];

  const sortOptions = [
    { id: 'newest', name: 'Newest First' },
    { id: 'oldest', name: 'Oldest First' },
    { id: 'price-low', name: 'Price: Low to High' },
    { id: 'price-high', name: 'Price: High to Low' },
    { id: 'mileage-low', name: 'Mileage: Low to High' },
    { id: 'popular', name: 'Most Popular' }
  ];

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || listing.category === selectedCategory;
    const matchesPrice = listing.price >= filters.priceRange[0] && listing.price <= filters.priceRange[1];
    const matchesMileage = !listing.mileage || (listing.mileage >= filters.mileage[0] && listing.mileage <= filters.mileage[1]);
    const matchesYear = filters.year === 'all' || !listing.year || listing.year.toString() === filters.year;
    const matchesCondition = filters.condition === 'all' || listing.condition === filters.condition;
    
    return matchesSearch && matchesCategory && matchesPrice && matchesMileage && matchesYear && matchesCondition;
  });

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'New':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'Like New':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'Excellent':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      case 'Very Good':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'Good':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <ProtectedRoute>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">EV Marketplace</h1>
          <p className="text-gray-600">Buy and sell electric vehicles, accessories, and charging equipment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map(category => (
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
                        <span>{category.name}</span>
                        <span className="text-sm text-gray-400">({category.count})</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/marketplace/sell" className="w-full btn-primary text-center block">
                    Sell Your EV
                  </Link>
                  <Link href="/marketplace/wanted" className="w-full btn-secondary text-center block">
                    Post Wanted Ad
                  </Link>
                </div>
              </div>

              {/* Filters */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                </div>
                
                {showFilters && (
                  <div className="space-y-4">
                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price Range: ${filters.priceRange[0].toLocaleString()} - ${filters.priceRange[1].toLocaleString()}
                      </label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="150000"
                          step="5000"
                          value={filters.priceRange[0]}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            priceRange: [parseInt(e.target.value), prev.priceRange[1]] 
                          }))}
                          className="w-full"
                        />
                        <input
                          type="range"
                          min="0"
                          max="150000"
                          step="5000"
                          value={filters.priceRange[1]}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            priceRange: [prev.priceRange[0], parseInt(e.target.value)] 
                          }))}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Condition */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                      <select
                        value={filters.condition}
                        onChange={(e) => setFilters(prev => ({ ...prev, condition: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Conditions</option>
                        <option value="New">New</option>
                        <option value="Like New">Like New</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Very Good">Very Good</option>
                        <option value="Good">Good</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Sort */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search marketplace..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {sortOptions.map(option => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {filteredListings.length} of {listings.length} listings
              </p>
            </div>

            {/* Listings Grid */}
            <div className="space-y-6">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="md:flex">
                    {/* Image */}
                    <div className="md:w-1/3">
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-48 md:h-full object-cover"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="md:w-2/3 p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{listing.title}</h3>
                          <div className="flex items-center space-x-4 mb-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(listing.condition)}`}>
                              {listing.condition}
                            </span>
                            {listing.year && (
                              <span className="text-sm text-gray-600">{listing.year}</span>
                            )}
                            {listing.mileage && (
                              <span className="text-sm text-gray-600">{listing.mileage.toLocaleString()} miles</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">${listing.price.toLocaleString()}</div>
                          {listing.originalPrice && listing.originalPrice > listing.price && (
                            <div className="text-sm text-gray-500 line-through">${listing.originalPrice.toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{listing.description}</p>
                      
                      {/* Vehicle Specs */}
                      {listing.specs && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Battery className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-600">{listing.specs.range} mi</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Zap className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-gray-600">{listing.specs.acceleration}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Gauge className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-gray-600">{listing.specs.topSpeed}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Zap className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-600">{listing.specs.chargingSpeed}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Seller Info */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{listing.seller.name}</span>
                              {listing.seller.verified && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Verified</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span>{listing.seller.rating}</span>
                              <span>({listing.seller.reviews} reviews)</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          <span>{listing.location}</span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(listing.postedDate)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>{listing.views} views</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4" />
                            <span>{listing.likes}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200">
                            <Heart className="h-5 w-5" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors duration-200">
                            <MessageCircle className="h-5 w-5" />
                          </button>
                          <Link href={`/marketplace/${listing.id}`} className="btn-primary">
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
};

export default MarketplacePage;