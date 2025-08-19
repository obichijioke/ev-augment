"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  Building2,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Shield,
  Award,
} from "lucide-react";

interface DirectoryBusiness {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  business_hours?: any;
  services?: string[];
  certifications?: string[];
  images?: string[];
  is_verified?: boolean;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    username: string;
    full_name?: string;
  };
}

export default function DirectoryManagementPage() {
  const { session } = useAuthStore();
  const [businesses, setBusinesses] = useState<DirectoryBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

  useEffect(() => {
    fetchBusinesses();
  }, [searchQuery, categoryFilter, verificationFilter]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      let token = session?.accessToken;

      // Fallback: get token from localStorage if session is not yet hydrated
      if (!token && typeof window !== "undefined") {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          try {
            const authData = JSON.parse(authStorage);
            token = authData?.state?.session?.accessToken;
          } catch (e) {
            console.error("Error parsing auth storage:", e);
          }
        }
      }

      if (!token) {
        throw new Error("No authentication token available");
      }

      const params = new URLSearchParams({
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter !== "all" && { category: categoryFilter }),
        ...(verificationFilter !== "all" && { verified: verificationFilter }),
      });

      const response = await fetch(
        `${API_BASE_URL}/admin/directory?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch directory businesses");
      }

      const data = await response.json();
      setBusinesses(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationToggle = async (
    businessId: string,
    verified: boolean
  ) => {
    try {
      let token = session?.accessToken;

      if (!token && typeof window !== "undefined") {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          try {
            const authData = JSON.parse(authStorage);
            token = authData?.state?.session?.accessToken;
          } catch (e) {
            console.error("Error parsing auth storage:", e);
          }
        }
      }

      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/directory/${businessId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_verified: verified }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to ${verified ? "verify" : "unverify"} business`
        );
      }

      fetchBusinesses();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFeaturedToggle = async (
    businessId: string,
    featured: boolean
  ) => {
    try {
      let token = session?.accessToken;

      if (!token && typeof window !== "undefined") {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          try {
            const authData = JSON.parse(authStorage);
            token = authData?.state?.session?.accessToken;
          } catch (e) {
            console.error("Error parsing auth storage:", e);
          }
        }
      }

      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/directory/${businessId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_featured: featured }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to ${featured ? "feature" : "unfeature"} business`
        );
      }

      fetchBusinesses();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (businessId: string) => {
    if (!confirm("Are you sure you want to delete this business?")) return;

    try {
      let token = session?.accessToken;

      if (!token && typeof window !== "undefined") {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          try {
            const authData = JSON.parse(authStorage);
            token = authData?.state?.session?.accessToken;
          } catch (e) {
            console.error("Error parsing auth storage:", e);
          }
        }
      }

      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/directory/${businessId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete business");
      }

      fetchBusinesses();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">
          Loading directory businesses...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building2 className="w-6 h-6 mr-2" />
            Directory Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage business directory listings, verification, and features
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Business
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="dealership">Dealerships</option>
            <option value="service">Service Centers</option>
            <option value="charging">Charging Networks</option>
            <option value="parts">Parts & Accessories</option>
            <option value="insurance">Insurance</option>
            <option value="financing">Financing</option>
            <option value="other">Other</option>
          </select>
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Verification</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Businesses */}
      {businesses.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No businesses found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first business to the directory
          </p>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Add Business
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {businesses.map((business) => (
                  <tr key={business.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {business.images && business.images[0] && (
                          <img
                            src={business.images[0]}
                            alt={business.name}
                            className="h-10 w-10 rounded-lg object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {business.name}
                            {business.is_featured && (
                              <Star className="w-4 h-4 ml-2 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {business.description?.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {business.category}
                      </div>
                      {business.subcategory && (
                        <div className="text-sm text-gray-500">
                          {business.subcategory}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="w-4 h-4 mr-1" />
                        {business.city}, {business.state}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {business.phone && (
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="w-3 h-3 mr-1" />
                            {business.phone}
                          </div>
                        )}
                        {business.email && (
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="w-3 h-3 mr-1" />
                            {business.email}
                          </div>
                        )}
                        {business.website && (
                          <div className="flex items-center text-sm text-gray-900">
                            <Globe className="w-3 h-3 mr-1" />
                            Website
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {business.is_verified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Unverified
                          </span>
                        )}
                        {business.is_featured && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className={`${
                          business.is_verified
                            ? "text-gray-600 hover:text-gray-900"
                            : "text-green-600 hover:text-green-900"
                        }`}
                        onClick={() =>
                          handleVerificationToggle(
                            business.id,
                            !business.is_verified
                          )
                        }
                        title={business.is_verified ? "Unverify" : "Verify"}
                      >
                        {business.is_verified ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className={`${
                          business.is_featured
                            ? "text-gray-600 hover:text-gray-900"
                            : "text-yellow-600 hover:text-yellow-900"
                        }`}
                        onClick={() =>
                          handleFeaturedToggle(
                            business.id,
                            !business.is_featured
                          )
                        }
                        title={business.is_featured ? "Unfeature" : "Feature"}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDelete(business.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
