"use client";

import React from "react";
import Link from "next/link";
import {
  Home,
  Search,
  ArrowLeft,
  Zap,
  Car,
  MessageSquare,
  ShoppingBag,
} from "lucide-react";

const NotFoundPage: React.FC = () => {
  const quickLinks = [
    {
      href: "/ev-listings",
      icon: Car,
      title: "Browse EVs",
      description: "Explore electric vehicles",
    },
    {
      href: "/marketplace",
      icon: ShoppingBag,
      title: "Marketplace",
      description: "Buy & sell EV accessories",
    },

    {
      href: "/charging",
      icon: Zap,
      title: "Charging Stations",
      description: "Find nearby charging",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative mx-auto w-64 h-64 mb-8">
            {/* Electric Car Silhouette */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-24 bg-blue-600 rounded-lg relative">
                {/* Car Body */}
                <div className="absolute top-0 left-8 right-8 h-12 bg-blue-700 rounded-t-lg"></div>
                {/* Windows */}
                <div className="absolute top-2 left-10 right-10 h-8 bg-blue-300 rounded-t-lg"></div>
                {/* Wheels */}
                <div className="absolute -bottom-2 left-4 w-8 h-8 bg-gray-800 rounded-full"></div>
                <div className="absolute -bottom-2 right-4 w-8 h-8 bg-gray-800 rounded-full"></div>
                {/* Lightning Bolt */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                  <Zap className="w-6 h-6 text-yellow-400 fill-current" />
                </div>
              </div>
            </div>

            {/* 404 Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-8xl font-bold text-blue-600 opacity-20 select-none">
                404
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Oops! Page Not Found
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Looks like this page took a wrong turn at the charging station.
          </p>
          <p className="text-lg text-gray-500">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Search Section */}
        <div className="mb-12">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for EVs, accessories, or topics..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    const query = (e.target as HTMLInputElement).value;
                    if (query.trim()) {
                      window.location.href = `/search?q=${encodeURIComponent(
                        query
                      )}`;
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Try searching for what you were looking for
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Or explore these popular sections:
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {link.title}
                    </h3>
                    <p className="text-sm text-gray-600">{link.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-xl p-8 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Still can't find what you're looking for?
          </h3>
          <p className="text-gray-600 mb-6">
            Our community is here to help! Get assistance from fellow EV
            enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/help"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Get Help
            </Link>
            <Link
              href="/help"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Visit Help Center
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Error Code: 404 | Page Not Found
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
