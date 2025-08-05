"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, MessageSquare, Plus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import ForumSearch from "./ForumSearch";

interface ForumLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  showCreateButton?: boolean;
  createHref?: string;
  createLabel?: string;
}

const ForumLayout: React.FC<ForumLayoutProps> = ({
  children,
  title,
  subtitle,
  showBackButton = false,
  backHref = "/forums",
  showCreateButton = false,
  createHref = "/forums/new",
  createLabel = "New Thread",
}) => {
  const { isAuthenticated } = useAuthStore();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                {showBackButton && (
                  <Link
                    href={backHref}
                    className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Link>
                )}

                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm text-gray-500">
                  <Link
                    href="/"
                    className="hover:text-gray-700 transition-colors"
                  >
                    <Home className="h-4 w-4" />
                  </Link>
                  <span>/</span>
                  <Link
                    href="/forums"
                    className="hover:text-gray-700 transition-colors"
                  >
                    Forums
                  </Link>
                </nav>
              </div>

              {showCreateButton && isAuthenticated && (
                <Link
                  href={createHref}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {createLabel}
                </Link>
              )}
              {showCreateButton && !isAuthenticated && (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Login to Create Thread
                </Link>
              )}
            </div>

            {/* Title Section */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="mt-2 text-lg text-gray-600">{subtitle}</p>
                )}
              </div>

              {/* Forum Icon */}
              <div className="hidden sm:block">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-md">
              <ForumSearch placeholder="Search forums..." />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
};

export default ForumLayout;
