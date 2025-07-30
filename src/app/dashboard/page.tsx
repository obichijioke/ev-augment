'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Car,
  MessageSquare,
  MapPin,
  TrendingUp,
  Users,
  Calendar,
  Bell,
  Settings,
  Plus,
  ArrowRight,
  Star,
  Zap,
  Activity
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuthStore();

  if (!user) {
    return null;
  }

  const quickActions = [
    {
      title: 'New Forum Post',
      description: 'Share your thoughts with the community',
      icon: MessageSquare,
      href: '/forums/new',
      color: 'bg-blue-500'
    },
    {
      title: 'Add EV to Garage',
      description: 'Track your electric vehicle',
      icon: Car,
      href: '/garage/add',
      color: 'bg-green-500'
    },
    {
      title: 'Find Charging Stations',
      description: 'Locate nearby charging points',
      icon: MapPin,
      href: '/charging',
      color: 'bg-purple-500'
    },
    {
      title: 'Browse EV Listings',
      description: 'Explore electric vehicle models',
      icon: Zap,
      href: '/ev-listings',
      color: 'bg-yellow-500'
    }
  ];

  const recentActivity = [
    {
      type: 'forum',
      title: 'New reply to your post "Best charging apps"',
      time: '2 hours ago',
      unread: true
    },
    {
      type: 'system',
      title: 'Your EV review was featured in trending',
      time: '1 day ago',
      unread: true
    },
    {
      type: 'forum',
      title: 'Someone liked your comment on Tesla Model Y',
      time: '2 days ago',
      unread: false
    },
    {
      type: 'system',
      title: 'New charging station added near your location',
      time: '3 days ago',
      unread: false
    }
  ];

  const communityStats = [
    { label: 'Forum Posts', value: '127', change: '+12', trend: 'up' },
    { label: 'Reputation', value: user.reputation.toString(), change: '+45', trend: 'up' },
    { label: 'Reviews Written', value: '23', change: '+3', trend: 'up' },
    { label: 'Helpful Votes', value: '456', change: '+28', trend: 'up' }
  ];

  const trendingTopics = [
    { title: 'Tesla Model Y vs Ford Mustang Mach-E', replies: 89, views: '2.3k' },
    { title: 'Best Home Charging Solutions 2024', replies: 67, views: '1.8k' },
    { title: 'Road Trip Planning with EVs', replies: 45, views: '1.2k' },
    { title: 'Charging Network Expansion Updates', replies: 34, views: '987' }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {user.firstName}! 👋
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Ready to explore the world of electric vehicles?
                  </p>
                </div>
                <div className="hidden md:block">
                  <img
                    src={user.avatar || 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20placeholder%2C%20clean%20simple%20design&image_size=square'}
                    alt={user.firstName}
                    className="w-16 h-16 rounded-full border-4 border-white/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                  <Plus className="w-5 h-5 text-gray-400" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={index}
                        href={action.href}
                        className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {action.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Community Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Your Community Impact</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {communityStats.map((stat, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                        <div className={`flex items-center text-sm ${
                          stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className="w-3 h-3 mr-1" />
                          <span>{stat.change}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Topics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Trending Discussions</h2>
                  <Link
                    href="/forums"
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-4">
                  {trendingTopics.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                          {topic.title}
                        </h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{topic.replies} replies</span>
                          <span>{topic.views} views</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-600">Hot</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={user.avatar || 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20placeholder%2C%20clean%20simple%20design&image_size=square'}
                    alt={user.firstName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">@{user.username}</h3>
                    <p className="text-sm text-gray-600">Member since {new Date(user.joinedDate).getFullYear()}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Reputation</span>
                    <span className="font-medium text-gray-900">{user.reputation}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">EV Owner</span>
                    <span className={`font-medium ${
                      user.evOwner ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {user.evOwner ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Edit Profile</span>
                </Link>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                  <Bell className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.unread ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1">
                        <p className={`text-sm ${
                          activity.unread ? 'text-gray-900 font-medium' : 'text-gray-600'
                        }`}>
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
                  View All Notifications
                </button>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Community Overview</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Active Members</span>
                    </div>
                    <span className="font-medium text-gray-900">12.5k</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Forum Posts</span>
                    </div>
                    <span className="font-medium text-gray-900">45.2k</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-600">EVs Tracked</span>
                    </div>
                    <span className="font-medium text-gray-900">8.9k</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-gray-600">Charging Stations</span>
                    </div>
                    <span className="font-medium text-gray-900">15.7k</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default DashboardPage;