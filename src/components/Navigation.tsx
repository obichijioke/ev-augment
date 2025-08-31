"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Search,
  Menu,
  X,
  User,
  Zap,
  ChevronDown,
  LogOut,
  Settings,
  Car,
  Activity,
  PenTool,
  Shield,
  FileText,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import {
  useCanCreateBlog,
  useCanAccessDraftManagement,
} from "@/hooks/useBlogPermissions";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout, userProfile } = useAuthStore();

  // Blog permissions
  const canCreateBlog = useCanCreateBlog();
  const canAccessDrafts = useCanAccessDraftManagement();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    console.log(userProfile);
  }, [userProfile]);

  const mainNavItems = [
    { name: "Home", href: "/" },
    { name: "EV Listings", href: "/ev-listings" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "Forums", href: "/forums" },
    { name: "What's New", href: "/whats-new" },
  ];

  const dropdownItems = [
    { name: "Community Garage", href: "/garage" },
    { name: "Directory", href: "/directory" },
    { name: "Blog", href: "/blog" },
    { name: "Charging Stations", href: "/charging" },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              EV Community
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link
              href="/"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/ev-listings"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              EV Listings
            </Link>
            <Link
              href="/marketplace"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Marketplace
            </Link>

            <Link
              href="/forums"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Forums
            </Link>
            <Link
              href="/whats-new"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              What's New
            </Link>

            {/* More Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center space-x-1"
              >
                <span>More</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  {dropdownItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search and User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <img
                    src={
                      user.avatar ||
                      "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20placeholder%2C%20clean%20simple%20design&image_size=square"
                    }
                    alt={user.firstName || user.username}
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                  />
                  <span className="text-sm font-medium">
                    {user.firstName || user.username}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.firstName || user.username}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        @{user.username}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Activity className="w-4 h-4 mr-3" />
                        Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        href="/garage/my-garage"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Car className="w-4 h-4 mr-3" />
                        My Garage
                      </Link>

                      {/* Admin Section */}
                      {userProfile?.role === "admin" && (
                        <>
                          <div className="border-t border-gray-100 my-1"></div>
                          <div className="px-4 py-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Admin
                            </p>
                          </div>
                          <Link
                            href="/admin/vehicles"
                            className="flex items-center px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors font-medium"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Shield className="w-4 h-4 mr-3" />
                            Vehicle Management
                          </Link>
                        </>
                      )}

                      <div className="border-t border-gray-100 my-1"></div>
                      {canCreateBlog && (
                        <Link
                          href="/blog/create"
                          className="flex items-center px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <PenTool className="w-4 h-4 mr-3" />
                          Write Article
                        </Link>
                      )}
                      {canAccessDrafts && (
                        <Link
                          href="/blog/drafts"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FileText className="w-4 h-4 mr-3" />
                          My Drafts
                        </Link>
                      )}
                      <Link
                        href="/profile?tab=settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                    </div>

                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-700">
              {/* Mobile Search and Theme Toggle */}
              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div className="flex justify-end">
                  <ThemeToggle />
                </div>
              </div>

              {/* Mobile Nav Items */}
              <Link
                href="/"
                className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/ev-listings"
                className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                EV Listings
              </Link>
              <Link
                href="/marketplace"
                className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Marketplace
              </Link>

              <Link
                href="/forums"
                className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Forums
              </Link>
              <Link
                href="/whats-new"
                className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                What's New
              </Link>

              {/* Mobile dropdown items */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                {dropdownItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Mobile User */}
              {isAuthenticated && user ? (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <div className="flex items-center px-3 py-2 mb-2">
                    <img
                      src={
                        user.avatar ||
                        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20placeholder%2C%20clean%20simple%20design&image_size=square"
                      }
                      alt={user.firstName || user.username}
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 mr-3"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.firstName || user.username}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Activity className="h-5 w-5 mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-5 w-5 mr-2" />
                    Profile
                  </Link>
                  <Link
                    href="/garage/my-garage"
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Car className="h-5 w-5 mr-2" />
                    My Garage
                  </Link>

                  {/* Admin Section - Mobile */}
                  {userProfile?.role === "admin" && (
                    <Link
                      href="/admin/vehicles"
                      className="flex items-center px-3 py-2 text-base font-medium text-purple-600 hover:bg-purple-50 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className="h-5 w-5 mr-2" />
                      Vehicle Management
                    </Link>
                  )}

                  {canCreateBlog && (
                    <Link
                      href="/blog/create"
                      className="flex items-center px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <PenTool className="h-5 w-5 mr-2" />
                      Write Article
                    </Link>
                  )}
                  {canAccessDrafts && (
                    <Link
                      href="/blog/drafts"
                      className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      My Drafts
                    </Link>
                  )}
                  <Link
                    href="/profile?tab=settings"
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md w-full text-left"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 space-y-2">
                  <Link
                    href="/auth/login"
                    className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block px-3 py-2 text-base font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
