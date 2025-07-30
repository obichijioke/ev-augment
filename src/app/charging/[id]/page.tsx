'use client';

import { useState, use } from 'react';
import { ArrowLeft, MapPin, Star, Clock, Phone, Globe, Navigation, Share2, Heart, Flag, Zap, Battery, Wifi, CreditCard, Shield, Calendar, TrendingUp, Users, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface ChargingStationDetailProps {
  params: Promise<{
    id: string;
  }>;
}

const ChargingStationDetail = ({ params }: ChargingStationDetailProps) => {
  const resolvedParams = use(params);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorited, setIsFavorited] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Mock station data - in real app, this would be fetched based on resolvedParams.id
  const station = {
    id: parseInt(resolvedParams.id),
    name: 'Tesla Supercharger - Downtown Plaza',
    network: 'Tesla',
    address: '123 Main Street, Downtown',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    distance: 0.8,
    rating: 4.8,
    reviews: 124,
    isOpen: true,
    hours: {
      monday: '24/7',
      tuesday: '24/7',
      wednesday: '24/7',
      thursday: '24/7',
      friday: '24/7',
      saturday: '24/7',
      sunday: '24/7'
    },
    phone: '(555) 123-4567',
    website: 'https://tesla.com/supercharger',
    images: [
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Supercharger%20station%20modern%20charging%20plaza%20electric%20vehicles&image_size=landscape_16_9',
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Supercharger%20charging%20stalls%20multiple%20cars%20charging&image_size=landscape_16_9',
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Supercharger%20amenities%20lounge%20area%20comfortable%20seating&image_size=landscape_16_9'
    ],
    connectors: [
      {
        type: 'Tesla Supercharger',
        count: 12,
        power: 250,
        available: 8,
        pricing: {
          rate: 0.28,
          unit: 'kWh',
          idleFee: 0.50,
          description: '$0.28/kWh, $0.50/min idle fee after 5 minutes'
        }
      }
    ],
    amenities: [
      { name: 'WiFi', icon: 'wifi', available: true },
      { name: 'Restrooms', icon: 'restroom', available: true },
      { name: 'Food & Dining', icon: 'food', available: true },
      { name: 'Shopping', icon: 'shopping', available: true },
      { name: 'Covered Parking', icon: 'parking', available: true },
      { name: '24/7 Security', icon: 'security', available: true }
    ],
    accessibility: {
      wheelchairAccessible: true,
      accessibleParking: 2,
      accessibleRestrooms: true
    },
    paymentMethods: ['Tesla Account', 'Credit Card', 'Mobile App'],
    lastUpdated: '2024-01-15T10:30:00Z',
    description: 'Conveniently located in the heart of downtown, this Tesla Supercharger station offers fast charging with premium amenities. Perfect for shopping trips or business meetings in the area.',
    operatedBy: 'Tesla, Inc.',
    stationId: 'SC-SF-DT-001'
  };

  const recentActivity = [
    {
      id: 1,
      type: 'status_update',
      message: 'All 12 stalls are now operational',
      timestamp: '2024-01-15T10:30:00Z',
      user: 'Station Manager'
    },
    {
      id: 2,
      type: 'maintenance',
      message: 'Routine maintenance completed on stalls 1-4',
      timestamp: '2024-01-14T16:00:00Z',
      user: 'Tesla Service'
    },
    {
      id: 3,
      type: 'pricing_update',
      message: 'Pricing updated to $0.28/kWh',
      timestamp: '2024-01-10T09:00:00Z',
      user: 'Tesla'
    }
  ];

  const userReviews = [
    {
      id: 1,
      user: 'ElectricDriver2023',
      rating: 5,
      date: '2024-01-12',
      comment: 'Excellent location with great amenities. Charging was fast and reliable. The covered parking is a nice touch!',
      helpful: 12,
      verified: true
    },
    {
      id: 2,
      user: 'TeslaOwner_SF',
      rating: 4,
      date: '2024-01-10',
      comment: 'Good charging speeds, but can get busy during peak hours. The shopping center nearby is convenient.',
      helpful: 8,
      verified: true
    },
    {
      id: 3,
      user: 'EVEnthusiast',
      rating: 5,
      date: '2024-01-08',
      comment: 'Clean, well-maintained station. Staff was helpful when I had questions. Highly recommend!',
      helpful: 15,
      verified: false
    }
  ];

  const chargingHistory = [
    { time: '00:00', available: 10, total: 12 },
    { time: '02:00', available: 11, total: 12 },
    { time: '04:00', available: 12, total: 12 },
    { time: '06:00', available: 9, total: 12 },
    { time: '08:00', available: 6, total: 12 },
    { time: '10:00', available: 4, total: 12 },
    { time: '12:00', available: 3, total: 12 },
    { time: '14:00', available: 5, total: 12 },
    { time: '16:00', available: 2, total: 12 },
    { time: '18:00', available: 1, total: 12 },
    { time: '20:00', available: 4, total: 12 },
    { time: '22:00', available: 7, total: 12 }
  ];

  const getNetworkColor = (network: string) => {
    switch (network) {
      case 'Tesla':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage >= 50) return 'text-green-600';
    if (percentage >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/charging" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900">{station.name}</h1>
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
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{station.address}, {station.city}, {station.state}</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-400" />
                    <span>{station.rating} ({station.reviews} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`p-2 rounded-lg border ${
                  isFavorited ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
              <button className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                <Share2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <Flag className="h-5 w-5" />
              </button>
              <button className="btn-primary">
                <Navigation className="h-4 w-4 mr-2" />
                Navigate
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={station.images[0]}
                  alt={station.name}
                  className="w-full h-64 object-cover"
                />
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {station.images.slice(1).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${station.name} view ${index + 2}`}
                      className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'reviews'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Reviews ({station.reviews})
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'activity'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Recent Activity
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Station</h3>
                      <p className="text-gray-600">{station.description}</p>
                    </div>

                    {/* Connectors */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Charging Connectors</h3>
                      <div className="space-y-4">
                        {station.connectors.map((connector, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <Zap className="h-6 w-6 text-blue-600" />
                                <div>
                                  <h4 className="font-medium text-gray-900">{connector.type}</h4>
                                  <p className="text-sm text-gray-600">Up to {connector.power}kW</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  getAvailabilityColor(connector.available, connector.count)
                                }`}>
                                  {connector.available}/{connector.count}
                                </div>
                                <div className="text-sm text-gray-500">available</div>
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <h5 className="font-medium text-gray-900 mb-1">Pricing</h5>
                              <p className="text-sm text-gray-600">{connector.pricing.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Amenities */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {station.amenities.map((amenity, index) => (
                          <div key={index} className={`flex items-center space-x-2 p-3 rounded-lg ${
                            amenity.available ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-500'
                          }`}>
                            {amenity.name === 'WiFi' && <Wifi className="h-4 w-4" />}
                            {amenity.name === 'Food & Dining' && <span>🍽️</span>}
                            {amenity.name === 'Shopping' && <span>🛍️</span>}
                            {amenity.name === 'Restrooms' && <span>🚻</span>}
                            {amenity.name === 'Covered Parking' && <span>🅿️</span>}
                            {amenity.name === '24/7 Security' && <Shield className="h-4 w-4" />}
                            <span className="text-sm font-medium">{amenity.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Methods</h3>
                      <div className="flex flex-wrap gap-2">
                        {station.paymentMethods.map((method, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            <CreditCard className="h-3 w-3 mr-1" />
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {userReviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {review.user.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{review.user}</span>
                                {review.verified && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Verified
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${
                                      i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`} />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{review.comment}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <button className="flex items-center space-x-1 hover:text-gray-700">
                            <span>👍</span>
                            <span>Helpful ({review.helpful})</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-gray-700">
                            <MessageSquare className="h-4 w-4" />
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-gray-900">{activity.message}</p>
                          <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                            <span>{activity.user}</span>
                            <span>•</span>
                            <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-medium ${
                    station.isOpen ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {station.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Distance</span>
                  <span className="font-medium text-gray-900">{station.distance} mi</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Stalls</span>
                  <span className="font-medium text-gray-900">{station.connectors[0].count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Available</span>
                  <span className={`font-medium ${
                    getAvailabilityColor(station.connectors[0].available, station.connectors[0].count)
                  }`}>
                    {station.connectors[0].available}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Max Power</span>
                  <span className="font-medium text-gray-900">{station.connectors[0].power}kW</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{station.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <a href={station.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    Visit Website
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{station.address}</span>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hours</h3>
              <div className="space-y-2">
                {Object.entries(station.hours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-gray-600 capitalize">{day}</span>
                    <span className="font-medium text-gray-900">{hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Availability</h3>
              <div className="space-y-2">
                {chargingHistory.map((data, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{data.time}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(data.available / data.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-900 w-8">{data.available}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Issue</h3>
            <p className="text-gray-600 mb-6">Help us improve by reporting any issues with this charging station.</p>
            <div className="space-y-3 mb-6">
              <label className="flex items-center">
                <input type="radio" name="issue" className="mr-2" />
                <span>Station is offline/not working</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="issue" className="mr-2" />
                <span>Incorrect information</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="issue" className="mr-2" />
                <span>Safety concern</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="issue" className="mr-2" />
                <span>Other</span>
              </label>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button className="btn-primary">
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargingStationDetail;