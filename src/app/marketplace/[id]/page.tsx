'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, Share2, Star, MapPin, Clock, Eye, MessageCircle, Phone, Mail, Flag, Shield, Calendar } from 'lucide-react';

interface MarketplaceItemProps {
  params: Promise<{ id: string }>;
}

const MarketplaceItemPage: React.FC<MarketplaceItemProps> = ({ params }) => {
  const { id } = React.use(params);
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showContactInfo, setShowContactInfo] = useState(false);

  // Mock data - in real app, fetch based on id
  const item = {
    id: id,
    title: 'Tesla Model S Charging Cable - 240V',
    price: 450,
    condition: 'Like New',
    category: 'Charging Equipment',
    description: 'Original Tesla Mobile Connector for Model S. Includes 240V adapter and carrying case. Used only a few times, in excellent condition. Perfect for home charging setup.',
    images: [
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20charging%20cable%20mobile%20connector%20240V%20adapter%20black&image_size=landscape_4_3',
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20charging%20cable%20carrying%20case%20accessories&image_size=landscape_4_3',
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20charging%20connector%20plug%20close%20up%20detail&image_size=landscape_4_3'
    ],
    seller: {
      name: 'Mike Johnson',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20man%20avatar%20friendly%20smile%20business%20casual&image_size=square',
      rating: 4.9,
      reviewCount: 47,
      memberSince: '2022',
      location: 'Seattle, WA',
      phone: '(555) 123-4567',
      email: 'mike.johnson@email.com',
      verified: true,
      responseTime: '< 1 hour'
    },
    specifications: {
      'Brand': 'Tesla',
      'Model': 'Mobile Connector Gen 2',
      'Voltage': '240V',
      'Amperage': '32A',
      'Cable Length': '20 feet',
      'Connector Type': 'NEMA 14-50',
      'Compatibility': 'All Tesla Models',
      'Warranty': '1 year remaining'
    },
    postedDate: '2024-01-15',
    views: 234,
    watchers: 12,
    status: 'Available',
    shipping: {
      available: true,
      cost: 25,
      methods: ['Standard (5-7 days)', 'Express (2-3 days)']
    },
    meetup: {
      available: true,
      locations: ['Downtown Seattle', 'Bellevue', 'Redmond']
    }
  };

  const relatedItems = [
    {
      id: '2',
      title: 'Tesla Wall Connector',
      price: 520,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20wall%20connector%20home%20charging%20station%20white&image_size=square',
      condition: 'New'
    },
    {
      id: '3',
      title: 'J1772 to Tesla Adapter',
      price: 85,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=J1772%20Tesla%20charging%20adapter%20connector%20black&image_size=square',
      condition: 'Excellent'
    },
    {
      id: '4',
      title: 'Portable EV Charger',
      price: 320,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=portable%20EV%20charger%20Level%202%20EVSE%20compact&image_size=square',
      condition: 'Good'
    }
  ];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'like new': return 'bg-blue-100 text-blue-800';
      case 'excellent': return 'bg-purple-100 text-purple-800';
      case 'good': return 'bg-yellow-100 text-yellow-800';
      case 'fair': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/marketplace" className="flex items-center text-blue-600 hover:text-blue-700">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Marketplace
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
              <button className="p-2 rounded-full border bg-gray-50 border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                <Flag className="w-5 h-5" />
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
                  src={item.images[selectedImageIndex]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(item.condition)}`}>
                    {item.condition}
                  </span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {item.status}
                  </span>
                </div>
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {item.images.length}
                </div>
              </div>
              <div className="p-4">
                <div className="flex space-x-2 overflow-x-auto">
                  {item.images.map((image, index) => (
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

            {/* Item Details */}
            <div className="bg-white rounded-lg p-6">
              <div className="mb-6">
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{item.title}</h1>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">${item.price}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Posted {new Date(item.postedDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {item.views} views
                  </span>
                  <span className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    {item.watchers} watching
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{item.description}</p>
              </div>

              {/* Specifications */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(item.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">{key}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping & Pickup */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Delivery Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.shipping.available && (
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium mb-2">Shipping Available</h4>
                      <p className="text-sm text-gray-600 mb-2">Starting at ${item.shipping.cost}</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {item.shipping.methods.map((method, index) => (
                          <li key={index}>• {method}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {item.meetup.available && (
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium mb-2">Local Pickup</h4>
                      <p className="text-sm text-gray-600 mb-2">Meet in person - Free</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {item.meetup.locations.map((location, index) => (
                          <li key={index}>• {location}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Seller Info and Actions */}
          <div className="space-y-6">
            {/* Contact Actions */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="space-y-3">
                <button
                  onClick={() => setShowContactInfo(!showContactInfo)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 inline mr-2" />
                  Contact Seller
                </button>
                <button className="w-full border border-blue-600 text-blue-600 py-3 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                  Make an Offer
                </button>
                <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Ask a Question
                </button>
              </div>

              {showContactInfo && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <a href={`tel:${item.seller.phone}`} className="flex items-center text-blue-600 hover:text-blue-700">
                    <Phone className="w-4 h-4 mr-2" />
                    {item.seller.phone}
                  </a>
                  <a href={`mailto:${item.seller.email}`} className="flex items-center text-blue-600 hover:text-blue-700">
                    <Mail className="w-4 h-4 mr-2" />
                    {item.seller.email}
                  </a>
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Seller Information</h3>
              
              <div className="flex items-start space-x-3 mb-4">
                <img src={item.seller.avatar} alt={item.seller.name} className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium">{item.seller.name}</h4>
                    {item.seller.verified && (
                      <Shield className="w-4 h-4 text-green-600 ml-2" />
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span>{item.seller.rating} ({item.seller.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {item.seller.location}
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Member since {item.seller.memberSince}
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  Responds {item.seller.responseTime}
                </div>
              </div>
              
              <button className="w-full mt-4 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                View Seller Profile
              </button>
            </div>

            {/* Safety Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Safety Tips</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Meet in a public place</li>
                <li>• Inspect item before payment</li>
                <li>• Use secure payment methods</li>
                <li>• Trust your instincts</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related Items */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedItems.map((relatedItem) => (
              <Link key={relatedItem.id} href={`/marketplace/${relatedItem.id}`} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <img src={relatedItem.image} alt={relatedItem.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{relatedItem.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">${relatedItem.price}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getConditionColor(relatedItem.condition)}`}>
                      {relatedItem.condition}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceItemPage;