'use client';

import { useState } from 'react';
import { Search, Filter, Plus, MessageSquare, Users, Clock, TrendingUp, Pin } from 'lucide-react';
import Link from 'next/link';

const ForumsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  const categories = [
    {
      id: 'all',
      name: 'All Categories',
      icon: '🏠',
      threads: 3421,
      posts: 45892
    },
    {
      id: 'tesla',
      name: 'Tesla',
      icon: '⚡',
      threads: 1247,
      posts: 18934,
      logo: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20logo%20electric%20car%20brand%20symbol&image_size=square'
    },
    {
      id: 'bmw',
      name: 'BMW',
      icon: '🔷',
      threads: 456,
      posts: 7823,
      logo: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=BMW%20logo%20electric%20car%20brand%20symbol&image_size=square'
    },
    {
      id: 'nissan',
      name: 'Nissan',
      icon: '🔴',
      threads: 234,
      posts: 4567,
      logo: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Nissan%20logo%20electric%20car%20brand%20symbol&image_size=square'
    },
    {
      id: 'audi',
      name: 'Audi',
      icon: '⭕',
      threads: 189,
      posts: 3421,
      logo: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Audi%20logo%20electric%20car%20brand%20symbol&image_size=square'
    },
    {
      id: 'charging',
      name: 'Charging',
      icon: '🔌',
      threads: 567,
      posts: 8934
    },
    {
      id: 'maintenance',
      name: 'Maintenance',
      icon: '🔧',
      threads: 345,
      posts: 5678
    },
    {
      id: 'news',
      name: 'EV News',
      icon: '📰',
      threads: 234,
      posts: 4321
    }
  ];

  const threads = [
    {
      id: 1,
      title: 'Tesla FSD Beta vs Autopilot: Real World Comparison',
      author: 'TechReviewer',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20tech%20reviewer&image_size=square',
      category: 'Tesla',
      replies: 156,
      views: 2847,
      lastActivity: '2 hours ago',
      lastUser: 'EVExpert',
      isPinned: true,
      isHot: true,
      tags: ['FSD', 'Autopilot', 'Comparison']
    },
    {
      id: 2,
      title: 'Best Home Charging Solutions for Apartment Dwellers',
      author: 'ChargingGuru',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20charging%20expert&image_size=square',
      category: 'Charging',
      replies: 89,
      views: 1923,
      lastActivity: '4 hours ago',
      lastUser: 'ApartmentEV',
      isPinned: false,
      isHot: true,
      tags: ['Home Charging', 'Apartment', 'Level 2']
    },
    {
      id: 3,
      title: 'BMW i4 M50 Long Term Review - 6 Months Ownership',
      author: 'BMWOwner2024',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20BMW%20owner&image_size=square',
      category: 'BMW',
      replies: 67,
      views: 1456,
      lastActivity: '6 hours ago',
      lastUser: 'ElectricBMW',
      isPinned: false,
      isHot: false,
      tags: ['BMW i4', 'Review', 'Long Term']
    },
    {
      id: 4,
      title: 'Nissan Ariya vs Tesla Model Y - Which Should I Choose?',
      author: 'EVShopper',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20an%20EV%20shopper&image_size=square',
      category: 'General',
      replies: 134,
      views: 2156,
      lastActivity: '8 hours ago',
      lastUser: 'ComparisonExpert',
      isPinned: false,
      isHot: false,
      tags: ['Nissan Ariya', 'Tesla Model Y', 'Comparison']
    },
    {
      id: 5,
      title: 'Winter Driving Tips for New EV Owners',
      author: 'WinterDriver',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20winter%20driving%20expert&image_size=square',
      category: 'Maintenance',
      replies: 78,
      views: 1234,
      lastActivity: '12 hours ago',
      lastUser: 'ColdWeatherEV',
      isPinned: false,
      isHot: false,
      tags: ['Winter', 'Tips', 'New Owners']
    }
  ];

  const filteredThreads = threads.filter(thread => {
    const matchesCategory = selectedCategory === 'all' || thread.category.toLowerCase() === selectedCategory;
    const matchesSearch = thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         thread.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community Forums</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Connect with fellow EV enthusiasts, share experiences, and get answers to your questions.</p>
          </div>
          <Link href="/forums/new" className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Thread
          </Link>
        </div>

        {/* Category Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((category) => (
              category.id === 'all' ? (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{category.name}</h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <div>{category.threads} threads</div>
                      <div>{category.posts} posts</div>
                    </div>
                  </div>
                </button>
              ) : (
                <Link
                  key={category.id}
                  href={`/forums/category/${category.id}`}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 block ${
                    selectedCategory === category.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                  }`}
                >
                  <div className="text-center">
                    {category.logo ? (
                      <img src={category.logo} alt={category.name} className="w-8 h-8 mx-auto mb-2" />
                    ) : (
                      <div className="text-2xl mb-2">{category.icon}</div>
                    )}
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{category.name}</h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <div>{category.threads} threads</div>
                      <div>{category.posts} posts</div>
                    </div>
                  </div>
                </Link>
              )
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search threads, topics, or tags... (Press Enter for advanced search)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        window.location.href = `/forums/search?q=${encodeURIComponent(searchQuery.trim())}`;
                      }
                    }}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/forums/search${searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : ''}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Advanced Search
                  </Link>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="latest">Latest Activity</option>
                    <option value="popular">Most Popular</option>
                    <option value="replies">Most Replies</option>
                    <option value="views">Most Views</option>
                  </select>
                  <Link href="/forums/new" className="btn-primary flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>New Thread</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Thread List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedCategory === 'all' ? 'All Discussions' : `${categories.find(c => c.id === selectedCategory)?.name} Discussions`}
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({filteredThreads.length} threads)</span>
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredThreads.map((thread) => (
                  <div key={thread.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <div className="flex items-start space-x-4">
                      <img
                        src={thread.avatar}
                        alt={thread.author}
                        className="w-10 h-10 rounded-full"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          {thread.isPinned && (
                            <Pin className="h-4 w-4 text-green-600" />
                          )}
                          {thread.isHot && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                              🔥 Hot
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                            {thread.category}
                          </span>
                        </div>
                        
                        <Link href={`/forums/${thread.id}`} className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer mb-2 block">
                          {thread.title}
                        </Link>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {thread.tags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-4">
                            <span>by <Link href={`/users/${thread.author}`} className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">{thread.author}</Link></span>
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{thread.replies} replies</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{thread.views} views</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Last reply {thread.lastActivity} by <Link href={`/users/${thread.lastUser}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">{thread.lastUser}</Link></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Forum Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Forum Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Total Threads</span>
                    <span className="font-semibold text-gray-900 dark:text-white">3,421</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Total Posts</span>
                    <span className="font-semibold text-gray-900 dark:text-white">45,892</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Active Members</span>
                    <span className="font-semibold text-gray-900 dark:text-white">12,847</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Online Now</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">234</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="text-gray-900 dark:text-white font-medium">New reply in Tesla FSD Discussion</p>
                    <p className="text-gray-500 dark:text-gray-400">2 minutes ago</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-900 dark:text-white font-medium">New thread: Charging Network Update</p>
                    <p className="text-gray-500 dark:text-gray-400">15 minutes ago</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-900 dark:text-white font-medium">EVExpert joined the community</p>
                    <p className="text-gray-500 dark:text-gray-400">1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumsPage;