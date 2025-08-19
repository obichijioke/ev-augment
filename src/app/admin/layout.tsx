"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Car,
  MapPin,
  Settings,
  Shield,
  Menu,
  X,
  ChevronRight,
  Home,
  Bell,
  Search,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      current: pathname === "/admin",
    },
    {
      name: "User Management",
      href: "/admin/users",
      icon: Users,
      current: pathname.startsWith("/admin/users"),
    },
    {
      name: "Content Management",
      href: "/admin/content",
      icon: FileText,
      current: pathname.startsWith("/admin/content"),
      children: [
        { name: "Blog Posts", href: "/admin/content/blog" },
        { name: "Marketplace", href: "/admin/content/marketplace" },
        { name: "Directory", href: "/admin/content/directory" },
      ],
    },
    {
      name: "Forum Management",
      href: "/admin/forums",
      icon: MessageSquare,
      current: pathname.startsWith("/admin/forums"),
    },
    {
      name: "Vehicle Management",
      href: "/admin/vehicles",
      icon: Car,
      current: pathname.startsWith("/admin/vehicles"),
    },
    {
      name: "Charging Stations",
      href: "/admin/charging",
      icon: MapPin,
      current: pathname.startsWith("/admin/charging"),
    },
    {
      name: "System Management",
      href: "/admin/system",
      icon: Settings,
      current: pathname.startsWith("/admin/system"),
    },
    {
      name: "Moderation Queue",
      href: "/admin/moderation",
      icon: Shield,
      current: pathname.startsWith("/admin/moderation"),
    },
  ];

  const breadcrumbs = [
    { name: "Admin", href: "/admin" },
    ...pathname
      .split("/")
      .slice(2)
      .filter(Boolean)
      .map((segment, index, array) => ({
        name: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: `/admin/${array.slice(0, index + 1).join("/")}`,
      })),
  ];

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar */}
        <div
          className={`fixed inset-0 z-50 lg:hidden ${
            sidebarOpen ? "block" : "hidden"
          }`}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between px-4">
              <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      item.current
                        ? "bg-blue-100 text-blue-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Link href="/" className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-lg font-semibold text-gray-900">
                  Admin Panel
                </span>
              </Link>
            </div>
            <nav className="mt-8 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      item.current
                        ? "bg-blue-100 text-blue-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          {/* Top header */}
          <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-500 hover:text-gray-600 lg:hidden"
                >
                  <Menu className="h-6 w-6" />
                </button>
                
                {/* Breadcrumbs */}
                <nav className="hidden sm:flex ml-4 lg:ml-0" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    <li>
                      <Link href="/" className="text-gray-400 hover:text-gray-500">
                        <Home className="h-4 w-4" />
                      </Link>
                    </li>
                    {breadcrumbs.map((crumb, index) => (
                      <li key={crumb.href} className="flex items-center">
                        <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                        <Link
                          href={crumb.href}
                          className={`text-sm font-medium ${
                            index === breadcrumbs.length - 1
                              ? "text-gray-900"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {crumb.name}
                        </Link>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                <button className="text-gray-400 hover:text-gray-500">
                  <Search className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-gray-500">
                  <Bell className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{user?.email}</p>
                    <p className="text-gray-500">Administrator</p>
                  </div>
                  <button
                    onClick={logout}
                    className="text-gray-400 hover:text-gray-500"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
};

export default AdminLayout;
