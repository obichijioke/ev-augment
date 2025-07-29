'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, Share2, Star, Zap, Battery, Gauge, Calendar, MapPin, Phone, Mail, ExternalLink, Plus, Minus } from 'lucide-react';

interface EVDetailsProps {
  params: Promise<{ id: string }>;
}

const EVDetailsPage: React.FC<EVDetailsProps> = ({ params }) => {
  const { id } = React.use(params);
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullSpecs, setShowFullSpecs] = useState(false);

  // Mock data - in real app, fetch based on id
  const vehicle = {
    id: id,
    make: 'Tesla',
    model: 'Model 3',
    year: 2024,
    trim: 'Long Range',
    price: 47240,
    msrp: 50240,
    savings: 3000,
    rating: 4.8,
    reviewCount: 1247,
    images: [
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20electric%20car%20front%20view%20modern%20sleek%20design%20blue%20color&image_size=landscape_16_9',
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20interior%20dashboard%20touchscreen%20modern%20minimalist&image_size=landscape_16_9',
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20side%20profile%20electric%20vehicle%20aerodynamic&image_size=landscape_16_9',
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20rear%20view%20taillights%20electric%20car&image_size=landscape_16_9'
    ],
    specs: {
      range: '358 miles',
      acceleration: '4.2 seconds (0-60 mph)',
      topSpeed: '145 mph',
      batteryCapacity: '75 kWh',
      chargingSpeed: '250 kW (DC fast)',
      efficiency: '4.1 mi/kWh',
      drivetrain: 'Dual Motor AWD',
      seating: '5 passengers',
      cargoSpace: '15 cu ft',
      warranty: '8 years / 120,000 miles'
    },
    features: [
      'Autopilot',
      'Premium Audio',
      'Glass Roof',
      'Heated Seats',
      'Supercharger Access',
      'Over-the-Air Updates',
      'Mobile Connector',
      'Premium Interior'
    ],
    description: 'The Tesla Model 3 Long Range offers an exceptional blend of performance, efficiency, and technology. With its sleek design and advanced autopilot capabilities, this electric sedan represents the future of sustainable transportation.',
    dealer: {
      name: 'Tesla Downtown',
      location: 'Seattle, WA',
      phone: '(555) 123-4567',
      email: 'sales@tesladowntown.com',
      rating: 4.6,
      certified: true
    },
    availability: 'In Stock',
    estimatedDelivery: '2-4 weeks'
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

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
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`p-2 rounded-full border ${isFavorited ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-600'} hover:bg-red-50 hover:text-red-600 transition-colors`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full border bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={vehicle.images[selectedImageIndex]}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {vehicle.availability}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex space-x-2 overflow-x-auto">
                  {vehicle.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'}`}
                    >
                      <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h1>
                  <p className="text-lg text-gray-600">{vehicle.trim}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center mb-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="ml-1 text-lg font-semibold">{vehicle.rating}</span>
                    <span className="ml-1 text-gray-600">({vehicle.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-6">{vehicle.description}</p>

              {/* Key Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Range</div>
                  <div className="font-semibold">{vehicle.specs.range}</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Gauge className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">0-60 mph</div>
                  <div className="font-semibold">{vehicle.specs.acceleration}</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Battery className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Battery</div>
                  <div className="font-semibold">{vehicle.specs.batteryCapacity}</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Charging</div>
                  <div className="font-semibold">{vehicle.specs.chargingSpeed}</div>
                </div>
              </div>

              {/* Full Specifications */}
              <div>
                <button
                  onClick={() => setShowFullSpecs(!showFullSpecs)}
                  className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-semibold">Full Specifications</span>
                  {showFullSpecs ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
                {showFullSpecs && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(vehicle.specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Key Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {vehicle.features.map((feature, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Pricing and Contact */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900">${vehicle.price.toLocaleString()}</div>
                {vehicle.savings > 0 && (
                  <div className="text-sm text-gray-600">
                    <span className="line-through">${vehicle.msrp.toLocaleString()}</span>
                    <span className="ml-2 text-green-600 font-medium">Save ${vehicle.savings.toLocaleString()}</span>
                  </div>
                )}
                <div className="text-sm text-gray-600 mt-1">Estimated delivery: {vehicle.estimatedDelivery}</div>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Request Test Drive
                </button>
                <button className="w-full border border-blue-600 text-blue-600 py-3 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                  Get Financing Quote
                </button>
                <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Calculate Payment
                </button>
              </div>
            </div>

            {/* Dealer Info */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Dealer Information</h3>
                {vehicle.dealer.certified && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    Certified
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="font-medium">{vehicle.dealer.name}</div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    {vehicle.dealer.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    {vehicle.dealer.rating} dealer rating
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <a href={`tel:${vehicle.dealer.phone}`} className="flex items-center text-blue-600 hover:text-blue-700">
                    <Phone className="w-4 h-4 mr-2" />
                    {vehicle.dealer.phone}
                  </a>
                  <a href={`mailto:${vehicle.dealer.email}`} className="flex items-center text-blue-600 hover:text-blue-700">
                    <Mail className="w-4 h-4 mr-2" />
                    {vehicle.dealer.email}
                  </a>
                </div>
                
                <button className="w-full mt-4 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  View Dealer Profile
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/ev-listings/compare" className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span>Compare with other EVs</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <Link href="/charging" className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span>Find charging stations</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <Link href="/forums" className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span>Owner discussions</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <Link href="/garage/add" className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span>Add to my garage</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EVDetailsPage;