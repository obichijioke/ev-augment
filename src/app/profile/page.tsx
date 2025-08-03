"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore, User, useUserProfile } from "@/store/authStore";
import { UserProfile } from "@/services/authService";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import {
  User as UserIcon,
  Settings,
  Car,
  Activity,
  Edit3,
  Camera,
  Save,
  X,
  MapPin,
  Calendar,
  Award,
  Shield,
  Mail,
  Phone,
  Globe,
} from "lucide-react";

const ProfilePage = () => {
  const {
    user,
    updateUser,
    updateUserInfo,
    uploadAvatar,
    removeAvatar,
    getProfile,
    updateProfile,
    isLoading,
    error,
  } = useAuthStore();
  const userProfile = useUserProfile();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>(user || {});
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>(
    userProfile || {}
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null
  );

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["profile", "garage", "activity", "settings"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Load user profile on component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!userProfile && user) {
        setIsLoadingProfile(true);
        try {
          await getProfile();
        } catch (error) {
          console.error("Failed to load profile:", error);
        } finally {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();
  }, [user, userProfile, getProfile]);

  // Update profile form when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setProfileForm(userProfile);
    }
  }, [userProfile]);

  if (!user) {
    return null;
  }

  const handleEditSubmit = async () => {
    try {
      // Prepare data for the backend API
      const updateData = {
        ...(editForm.username && { username: editForm.username }),
        ...(editForm.firstName &&
          editForm.lastName && {
            full_name: `${editForm.firstName} ${editForm.lastName}`,
          }),
        ...(editForm.bio !== undefined && { bio: editForm.bio }),
        ...(editForm.location !== undefined && { location: editForm.location }),
        ...(editForm.website !== undefined && { website: editForm.website }),
        ...(editForm.phone !== undefined && { phone: editForm.phone }),
        ...(editForm.is_business !== undefined && {
          is_business: editForm.is_business,
        }),
        ...(editForm.business_name !== undefined && {
          business_name: editForm.business_name,
        }),
        ...(editForm.business_type !== undefined && {
          business_type: editForm.business_type,
        }),
      };

      await updateUserInfo(updateData);
      setIsEditing(false);
      // Clean up avatar preview state
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error("Failed to update profile:", error);
      // Error will be displayed via the error state
    }
  };

  const handleEditCancel = () => {
    setEditForm(user);
    setIsEditing(false);
    // Clean up avatar preview state
    setSelectedAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleProfileUpdate = async (
    preferences: UserProfile["preferences"]
  ) => {
    try {
      await updateProfile({ preferences });
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAvatarFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedAvatarFile) return;

    try {
      await uploadAvatar(selectedAvatarFile);
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error("Failed to upload avatar:", error);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await removeAvatar();
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error("Failed to remove avatar:", error);
    }
  };

  const handleCancelAvatarChange = () => {
    setSelectedAvatarFile(null);
    setAvatarPreview(null);
  };

  const formatJoinedDate = (dateString: string | undefined | null): string => {
    if (!dateString) return "Recently";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Recently";

      // Format as "Month Year" (e.g., "January 2024")
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return "Recently";
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "garage", label: "My Garage", icon: Car },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={
                  user.avatar ||
                  "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20placeholder%2C%20clean%20simple%20design&image_size=square"
                }
                alt={`${user.firstName} ${user.lastName}`}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                {user.isVerified && (
                  <Shield
                    className="w-5 h-5 text-blue-600"
                    aria-label="Verified User"
                  />
                )}
              </div>
              <p className="text-gray-600">@{user.username}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                {user.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatJoinedDate(user.joinedDate)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4" />
                  <span>{user.reputation} reputation</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Bio */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">About</h3>
          <p className="text-gray-600">
            {user.bio || 'No bio available. Click "Edit Profile" to add one.'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Forum Posts</p>
              <p className="text-2xl font-bold text-gray-900">127</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">EV Reviews</p>
              <p className="text-2xl font-bold text-gray-900">23</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Car className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Helpful Votes</p>
              <p className="text-2xl font-bold text-gray-900">456</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGarageTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            My Electric Vehicles
          </h2>
          <Link
            href="/garage/add"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Vehicle
          </Link>
        </div>

        {user.evModels && user.evModels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user.evModels.map((model, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={`https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
                      model + " electric vehicle side view"
                    )}&image_size=landscape_4_3`}
                    alt={model}
                    className="w-20 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{model}</h3>
                    <p className="text-sm text-gray-600">Owned since 2023</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Primary
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No vehicles added yet
            </h3>
            <p className="text-gray-600 mb-4">
              Add your electric vehicles to share your experience with the
              community.
            </p>
            <Link
              href="/garage/add"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First EV
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Recent Activity
        </h2>

        <div className="space-y-4">
          {[
            {
              type: "post",
              title: "Posted in Tesla Model 3 Discussion",
              time: "2 hours ago",
            },
            {
              type: "review",
              title: "Reviewed Electrify America Charging Station",
              time: "1 day ago",
            },
            {
              type: "comment",
              title: 'Commented on "Best EV for Long Distance Travel"',
              time: "3 days ago",
            },
            {
              type: "like",
              title: 'Liked "Charging Infrastructure Updates"',
              time: "1 week ago",
            },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg"
            >
              <div className="bg-blue-100 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => {
    if (isLoadingProfile) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Account Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Account Information
          </h2>

          {userProfile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="text-sm text-gray-900">
                    {userProfile.username}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900">
                      {userProfile.email}
                    </span>
                    {userProfile.email_verified ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Unverified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <div className="text-sm text-gray-900 capitalize">
                    {userProfile.role}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Login Count
                  </label>
                  <div className="text-sm text-gray-900">
                    {userProfile.login_count}
                  </div>
                </div>
              </div>

              {userProfile.last_login_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Login
                  </label>
                  <div className="text-sm text-gray-900">
                    {new Date(userProfile.last_login_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Preferences</h2>

          {userProfile && (
            <div className="space-y-6">
              {/* Notification Preferences */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Notifications
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Email notifications</span>
                    <input
                      type="checkbox"
                      checked={
                        userProfile.preferences?.notifications?.email ?? true
                      }
                      onChange={(e) =>
                        handleProfileUpdate({
                          ...userProfile.preferences,
                          notifications: {
                            ...userProfile.preferences?.notifications,
                            email: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Push notifications</span>
                    <input
                      type="checkbox"
                      checked={
                        userProfile.preferences?.notifications?.push ?? true
                      }
                      onChange={(e) =>
                        handleProfileUpdate({
                          ...userProfile.preferences,
                          notifications: {
                            ...userProfile.preferences?.notifications,
                            push: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Marketing emails</span>
                    <input
                      type="checkbox"
                      checked={
                        userProfile.preferences?.notifications?.marketing ??
                        false
                      }
                      onChange={(e) =>
                        handleProfileUpdate({
                          ...userProfile.preferences,
                          notifications: {
                            ...userProfile.preferences?.notifications,
                            marketing: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Forum notifications</span>
                    <input
                      type="checkbox"
                      checked={
                        userProfile.preferences?.notifications?.forum ?? true
                      }
                      onChange={(e) =>
                        handleProfileUpdate({
                          ...userProfile.preferences,
                          notifications: {
                            ...userProfile.preferences?.notifications,
                            forum: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Privacy Settings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Privacy</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Show email address</span>
                    <input
                      type="checkbox"
                      checked={
                        userProfile.preferences?.privacy?.show_email ?? false
                      }
                      onChange={(e) =>
                        handleProfileUpdate({
                          ...userProfile.preferences,
                          privacy: {
                            ...userProfile.preferences?.privacy,
                            show_email: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Show location</span>
                    <input
                      type="checkbox"
                      checked={
                        userProfile.preferences?.privacy?.show_location ?? true
                      }
                      onChange={(e) =>
                        handleProfileUpdate({
                          ...userProfile.preferences,
                          privacy: {
                            ...userProfile.preferences?.privacy,
                            show_location: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Show phone number</span>
                    <input
                      type="checkbox"
                      checked={
                        userProfile.preferences?.privacy?.show_phone ?? false
                      }
                      onChange={(e) =>
                        handleProfileUpdate({
                          ...userProfile.preferences,
                          privacy: {
                            ...userProfile.preferences?.privacy,
                            show_phone: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Show online status</span>
                    <input
                      type="checkbox"
                      checked={
                        userProfile.preferences?.privacy?.show_online_status ??
                        true
                      }
                      onChange={(e) =>
                        handleProfileUpdate({
                          ...userProfile.preferences,
                          privacy: {
                            ...userProfile.preferences?.privacy,
                            show_online_status: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Theme Settings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Appearance</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <select
                      value={userProfile.preferences?.theme ?? "light"}
                      onChange={(e) =>
                        handleProfileUpdate({
                          ...userProfile.preferences,
                          theme: e.target.value as "light" | "dark" | "auto",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={userProfile.preferences?.language ?? "en"}
                      onChange={(e) =>
                        handleProfileUpdate({
                          ...userProfile.preferences,
                          language: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Display Settings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Display</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Posts per page
                    </label>
                    <select
                      value={
                        userProfile.preferences?.display?.posts_per_page ?? 20
                      }
                      onChange={(e) =>
                        handleProfileUpdate({
                          ...userProfile.preferences,
                          display: {
                            ...userProfile.preferences?.display,
                            posts_per_page: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date format
                    </label>
                    <select
                      value={
                        userProfile.preferences?.display?.date_format ??
                        "MM/DD/YYYY"
                      }
                      onChange={(e) =>
                        handleProfileUpdate({
                          ...userProfile.preferences,
                          display: {
                            ...userProfile.preferences?.display,
                            date_format: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time format
                    </label>
                    <select
                      value={
                        userProfile.preferences?.display?.time_format ?? "12h"
                      }
                      onChange={(e) =>
                        handleProfileUpdate({
                          ...userProfile.preferences,
                          display: {
                            ...userProfile.preferences?.display,
                            time_format: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="12h">12 Hour</option>
                      <option value="24h">24 Hour</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "profile" && renderProfileTab()}
          {activeTab === "garage" && renderGarageTab()}
          {activeTab === "activity" && renderActivityTab()}
          {activeTab === "settings" && renderSettingsTab()}
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Edit Profile
                </h2>
                <button
                  onClick={handleEditCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Avatar Upload Section */}
              <div className="mb-6 text-center border-b pb-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <img
                      src={
                        avatarPreview ||
                        user.avatar ||
                        "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20placeholder%2C%20clean%20simple%20design&image_size=square"
                      }
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                    />
                    {selectedAvatarFile && (
                      <div className="absolute -top-2 -right-2">
                        <div className="bg-blue-600 text-white rounded-full p-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {!selectedAvatarFile ? (
                      <div className="flex space-x-2">
                        <label
                          htmlFor="avatar-upload"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center space-x-2"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Change Avatar</span>
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                        />
                        {user.avatar && (
                          <button
                            onClick={handleAvatarRemove}
                            disabled={isLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAvatarUpload}
                          disabled={isLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>
                            {isLoading ? "Uploading..." : "Save Avatar"}
                          </span>
                        </button>
                        <button
                          onClick={handleCancelAvatarChange}
                          disabled={isLoading}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      JPEG, PNG, or WebP. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.firstName || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, firstName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.lastName || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, lastName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editForm.username || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your unique username"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editForm.location || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, location: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="City, State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={editForm.website || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, website: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bio: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Business Account Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <input
                      type="checkbox"
                      id="is_business"
                      checked={editForm.is_business || false}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          is_business: e.target.checked,
                          // Clear business fields if unchecking
                          ...(e.target.checked
                            ? {}
                            : {
                                business_name: "",
                                business_type: "",
                              }),
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="is_business"
                      className="text-sm font-medium text-gray-700"
                    >
                      This is a business account
                    </label>
                  </div>

                  {editForm.is_business && (
                    <div className="space-y-4 pl-7">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={editForm.business_name || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              business_name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Your business name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Type
                        </label>
                        <select
                          value={editForm.business_type || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              business_type: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select business type</option>
                          <option value="dealership">EV Dealership</option>
                          <option value="charging_network">
                            Charging Network
                          </option>
                          <option value="service_center">Service Center</option>
                          <option value="parts_supplier">Parts Supplier</option>
                          <option value="installer">Charger Installer</option>
                          <option value="fleet_management">
                            Fleet Management
                          </option>
                          <option value="manufacturer">Manufacturer</option>
                          <option value="consultant">EV Consultant</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleEditSubmit}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={handleEditCancel}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
