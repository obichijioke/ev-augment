'use client';

import { useState } from 'react';
import { Calendar, MessageCircle, Heart, Share2, Eye, TrendingUp, Zap, Car, Users, Award, Bell, Filter, ChevronDown, ExternalLink, Pin } from 'lucide-react';
import Link from 'next/link';

const WhatsNewPage = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('week');

  const updates = [
    {
      id: 1,
      type: 'announcement',
      title: 'New Tesla Model 3 Highland Now Available',
      content: 'Tesla has officially launched the refreshed Model 3 Highland with updated interior, improved range, and enhanced autopilot features. The new model features a 15% increase in efficiency and a completely redesigned cabin.',
      author: 'EV Community Team',
      timestamp: '2024-01-15T10:30:00Z',
      category: 'Vehicle Launch',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20Model%203%20Highland%202024%20refresh%20new%20design&image_size=landscape_16_9',
      likes: 234,
      comments: 45,
      views: 1567,
      pinned: true,
      tags: ['Tesla', 'Model 3', 'Highland', 'Launch']
    },
    {
      id: 2,
      type: 'forum',
      title: 'Winter Driving Tips: Maximizing EV Range in Cold Weather',
      content: 'Community member @EVExpert shares comprehensive tips for maintaining optimal range during winter months. Includes preconditioning strategies, tire recommendations, and heating efficiency tips.',
      author: 'EVExpert',
      timestamp: '2024-01-14T15:45:00Z',
      category: 'Tips & Tricks',
      forumCategory: 'General Discussion',
      likes: 156,
      comments: 32,
      views: 892,
      pinned: false,
      tags: ['Winter', 'Range', 'Tips', 'Efficiency']
    },
    {
      id: 3,
      type: 'marketplace',
      title: 'Featured Listing: 2023 BMW i4 M50 - Excellent Condition',
      content: 'Stunning BMW i4 M50 with only 8,000 miles. Includes M Sport package, premium audio, and full warranty. Located in Los Angeles, CA. Priced to sell at $58,500.',
      author: 'Sarah Johnson',
      timestamp: '2024-01-14T12:20:00Z',
      category: 'Marketplace',
      price: 58500,
      location: 'Los Angeles, CA',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=BMW%20i4%20M50%202023%20excellent%20condition%20marketplace&image_size=landscape_16_9',
      likes: 89,
      comments: 23,
      views: 445,
      pinned: false,
      tags: ['BMW', 'i4', 'M50', 'For Sale']
    },
    {
      id: 4,
      type: 'garage',
      title: 'Member Spotlight: Mike&apos;s Track-Ready Taycan Build',
      content: 'Community member Mike Chen showcases his modified Porsche Taycan Turbo S setup for track days. Features custom suspension, carbon fiber aero, and performance brake upgrades.',
      author: 'Mike Chen',
      timestamp: '2024-01-13T18:15:00Z',
      category: 'Garage Showcase',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Porsche%20Taycan%20Turbo%20S%20track%20modified%20showcase&image_size=landscape_16_9',
      likes: 312,
      comments: 67,
      views: 1234,
      pinned: false,
      tags: ['Porsche', 'Taycan', 'Track', 'Modified']
    },
    {
      id: 5,
      type: 'announcement',
      title: 'Platform Update: New Charging Station Map Feature',
      content: 'We\'ve launched an interactive charging station map with real-time availability, pricing, and user reviews. Find the best charging spots on your route with our new trip planner integration.',
      author: 'EV Community Team',
      timestamp: '2024-01-13T14:00:00Z',
      category: 'Platform Update',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=charging%20station%20map%20interface%20real%20time%20availability&image_size=landscape_16_9',
      likes: 178,
      comments: 34,
      views: 756,
      pinned: false,
      tags: ['Platform', 'Charging', 'Map', 'Update']
    },
    {
      id: 6,
      type: 'forum',
      title: 'Lucid Air Dream Range Test: 500+ Miles on Single Charge',
      content: 'Real-world range test results from our community member who achieved 516 miles on a single charge with the Lucid Air Dream. Detailed breakdown of driving conditions and efficiency tips included.',
      author: 'RangeTestPro',
      timestamp: '2024-01-12T20:30:00Z',
      category: 'Range Testing',
      forumCategory: 'Vehicle Reviews',
      likes: 267,
      comments: 89,
      views: 1890,
      pinned: false,
      tags: ['Lucid', 'Air', 'Range Test', 'Efficiency']
    },
    {
      id: 7,
      type: 'directory',
      title: 'New Business: ElectroCharge Opens 350kW Charging Hub',
      content: 'ElectroCharge has opened a new 350kW DC fast charging hub in downtown Seattle. Features 12 charging stalls, covered parking, and amenities including coffee shop and convenience store.',
      author: 'Directory Team',
      timestamp: '2024-01-12T16:45:00Z',
      category: 'Business Directory',
      location: 'Seattle, WA',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=350kW%20DC%20fast%20charging%20hub%20covered%20parking&image_size=landscape_16_9',
      likes: 134,
      comments: 28,
      views: 623,
      pinned: false,
      tags: ['Charging', 'Seattle', 'ElectroCharge', 'New Business']
    },
    {
      id: 8,
      type: 'achievement',
      title: 'Community Milestone: 10,000 Members Reached!',
      content: 'Our EV community has officially reached 10,000 members! Thank you to everyone who has contributed to making this the best place for electric vehicle enthusiasts. Special badges awarded to founding members.',
      author: 'EV Community Team',
      timestamp: '2024-01-11T12:00:00Z',
      category: 'Community Milestone',
      likes: 445,
      comments: 123,
      views: 2345,
      pinned: false,
      tags: ['Milestone', 'Community', '10K Members', 'Achievement']
    }
  ];

  const filters = [
    { id: 'all', name: 'All Updates', icon: Bell },
    { id: 'announcement', name: 'Announcements', icon: Pin },
    { id: 'forum', name: 'Forum Posts', icon: MessageCircle },
    { id: 'marketplace', name: 'Marketplace', icon: Car },
    { id: 'garage', name: 'Garage Showcase', icon: Award },
    { id: 'directory', name: 'Business Directory', icon: Users },
    { id: 'achievement', name: 'Achievements', icon: TrendingUp }
  ];

  const timeFilters = [
    { id: 'day', name: 'Today' },
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'all', name: 'All Time' }
  ];

  const filteredUpdates = updates.filter(update => {
    if (selectedFilter === 'all') return true;
    return update.type === selectedFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return Pin;
      case 'forum': return MessageCircle;
      case 'marketplace': return Car;
      case 'garage': return Award;
      case 'directory': return Users;
      case 'achievement': return TrendingUp;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return 'bg-blue-100 text-blue-800';
      case 'forum': return 'bg-green-100 text-green-800';
      case 'marketplace': return 'bg-purple-100 text-purple-800';
      case 'garage': return 'bg-orange-100 text-orange-800';
      case 'directory': return 'bg-indigo-100 text-indigo-800';
      case 'achievement': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">What&apos;s New</h1>
          <p className="text-gray-600">Stay updated with the latest from our EV community</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              {/* Filters */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Type</h3>
                <div className="space-y-2">
                  {filters.map(filter => {
                    const IconComponent = filter.icon;
                    const count = filter.id === 'all' ? updates.length : updates.filter(u => u.type === filter.id).length;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${
                          selectedFilter === filter.id
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{filter.name}</span>
                          </div>
                          <span className="text-sm text-gray-400">({count})</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Filter */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Period</h3>
                <div className="relative">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {timeFilters.map(filter => (
                      <option key={filter.id} value={filter.id}>{filter.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New Posts</span>
                    <span className="font-medium text-gray-900">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New Members</span>
                    <span className="font-medium text-gray-900">156</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New Listings</span>
                    <span className="font-medium text-gray-900">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New Businesses</span>
                    <span className="font-medium text-gray-900">3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {filteredUpdates.length} updates
                {selectedFilter !== 'all' && ` in ${filters.find(f => f.id === selectedFilter)?.name}`}
              </p>
            </div>

            {/* Updates Feed */}
            <div className="space-y-6">
              {filteredUpdates.map((update) => {
                const TypeIcon = getTypeIcon(update.type);
                return (
                  <div key={update.id} className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 ${
                    update.pinned ? 'ring-2 ring-blue-200' : ''
                  }`}>
                    {update.pinned && (
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-1 text-sm font-medium">
                        📌 Pinned Update
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(update.type)}`}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{update.title}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>by {update.author}</span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(update.type)}`}>
                                  {update.category}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatTimeAgo(update.timestamp)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {update.image && (
                            <div className="mb-4">
                              <img
                                src={update.image}
                                alt={update.title}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            </div>
                          )}
                          
                          <p className="text-gray-700 mb-4 line-clamp-3">{update.content}</p>
                          
                          {/* Special Info */}
                          {update.price && (
                            <div className="mb-4 p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-green-900">Price: ${update.price.toLocaleString()}</span>
                                <span className="text-sm text-green-700">{update.location}</span>
                              </div>
                            </div>
                          )}
                          
                          {update.forumCategory && (
                            <div className="mb-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Forum: {update.forumCategory}
                              </span>
                            </div>
                          )}
                          
                          {/* Tags */}
                          {update.tags && (
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-2">
                                {update.tags.map((tag, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Engagement Stats */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Heart className="h-4 w-4" />
                                <span>{update.likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="h-4 w-4" />
                                <span>{update.comments}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>{update.views}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200">
                                <Heart className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors duration-200">
                                <MessageCircle className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-green-500 transition-colors duration-200">
                                <Share2 className="h-4 w-4" />
                              </button>
                              <Link 
                                href={`/${update.type}${update.type === 'announcement' ? '' : `/${update.id}`}`} 
                                className="btn-primary text-sm"
                              >
                                View Details
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            <div className="mt-8 text-center">
              <button className="btn-secondary">
                Load More Updates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsNewPage;