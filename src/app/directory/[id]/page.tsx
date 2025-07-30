'use client';

import React from 'react';
import { MapPin, Phone, Mail, Clock, Star, ExternalLink, Navigation, Car, Zap, Shield, Award } from 'lucide-react';
import Link from 'next/link';

interface DirectoryDetailsPageProps {
  params: Promise<{ id: string }>;
}

const DirectoryDetailsPage: React.FC<DirectoryDetailsPageProps> = ({ params }) => {
  const { id } = React.use(params);

  // Mock business data - in real app, this would come from API
  const business = {
    id: id,
    name: "EV Power Station",
    category: "Charging Station",
    rating: 4.8,
    reviewCount: 127,
    address: "123 Electric Avenue, Tech City, TC 12345",
    phone: "+1 (555) 123-4567",
    email: "info@evpowerstation.com",
    website: "https://evpowerstation.com",
    description: "Premier EV charging facility with fast DC charging, comfortable waiting area, and 24/7 service. We offer multiple charging standards including CCS, CHAdeMO, and Tesla Supercharger compatibility.",
    hours: {
      monday: "24 Hours",
      tuesday: "24 Hours",
      wednesday: "24 Hours",
      thursday: "24 Hours",
      friday: "24 Hours",
      saturday: "24 Hours",
      sunday: "24 Hours"
    },
    services: [
      "DC Fast Charging",
      "Level 2 AC Charging",
      "Tesla Supercharger",
      "Mobile App Integration",
      "Payment Processing",
      "Waiting Lounge",
      "WiFi Access",
      "Restrooms"
    ],
    chargingInfo: {
      totalStations: 12,
      dcFastChargers: 8,
      level2Chargers: 4,
      maxPower: "350kW",
      connectorTypes: ["CCS", "CHAdeMO", "Tesla"]
    },
    images: [
      "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20electric%20vehicle%20charging%20station%20with%20multiple%20charging%20ports%20and%20sleek%20design&image_size=landscape_16_9",
      "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=EV%20charging%20station%20interior%20waiting%20area%20with%20comfortable%20seating&image_size=landscape_4_3",
      "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=electric%20car%20plugged%20into%20fast%20charging%20station%20at%20night&image_size=square_hd"
    ],
    reviews: [
      {
        id: 1,
        author: "Sarah Johnson",
        rating: 5,
        date: "2024-01-15",
        comment: "Excellent charging station! Fast charging speeds and clean facilities. The waiting area is very comfortable."
      },
      {
        id: 2,
        author: "Mike Chen",
        rating: 4,
        date: "2024-01-10",
        comment: "Great location and reliable chargers. Only minor issue was one charger was out of service, but plenty of alternatives."
      },
      {
        id: 3,
        author: "Emily Davis",
        rating: 5,
        date: "2024-01-08",
        comment: "Best charging experience I've had! Staff is helpful and the mobile app integration works perfectly."
      }
    ]
  };

  const [selectedImage, setSelectedImage] = React.useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link href="/directory" className="hover:text-blue-600">Directory</Link>
            <span>/</span>
            <span className="text-gray-900">{business.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Business Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{business.name}</h1>
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {business.category}
                    </span>
                    <div className="flex items-center">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(business.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {business.rating} ({business.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 leading-relaxed">{business.description}</p>
            </div>

            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Photos</h2>
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img
                    src={business.images[selectedImage]}
                    alt={`${business.name} - Image ${selectedImage + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {business.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-video rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index
                          ? 'border-blue-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${business.name} - Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Services Offered</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {business.services.map((service, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-700">{service}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Charging Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-600" />
                Charging Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Stations:</span>
                    <span className="font-medium">{business.chargingInfo.totalStations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">DC Fast Chargers:</span>
                    <span className="font-medium">{business.chargingInfo.dcFastChargers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Level 2 Chargers:</span>
                    <span className="font-medium">{business.chargingInfo.level2Chargers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Power:</span>
                    <span className="font-medium">{business.chargingInfo.maxPower}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Connector Types</h3>
                  <div className="space-y-2">
                    {business.chargingInfo.connectorTypes.map((type, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Car className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700">{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Reviews</h2>
              <div className="space-y-6">
                {business.reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{review.author}</h3>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-500">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">{business.address}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${business.phone}`} className="text-sm text-blue-600 hover:text-blue-800">
                    {business.phone}
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${business.email}`} className="text-sm text-blue-600 hover:text-blue-800">
                    {business.email}
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                    Visit Website
                  </a>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Hours of Operation
              </h2>
              <div className="space-y-2">
                {Object.entries(business.hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="capitalize text-gray-600">{day}:</span>
                    <span className="font-medium text-gray-900">{hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center">
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </button>
                <button className="w-full bg-white text-blue-600 border border-blue-600 py-3 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </button>
                <button className="w-full bg-white text-gray-700 border border-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <Star className="w-4 h-4 mr-2" />
                  Write Review
                </button>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Interactive map would be here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectoryDetailsPage;