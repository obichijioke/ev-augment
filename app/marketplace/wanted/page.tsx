'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, DollarSign, MapPin, Calendar, AlertCircle, Bell } from 'lucide-react';

interface WantedAdData {
  title: string;
  category: string;
  description: string;
  maxPrice: string;
  location: string;
  urgency: string;
  condition: string[];
  contactMethod: string;
  expiryDate: string;
  specifications: { [key: string]: string };
}

const WantedAdPage: React.FC = () => {
  const [formData, setWantedAdData] = useState<WantedAdData>({
    title: '',
    category: '',
    description: '',
    maxPrice: '',
    location: '',
    urgency: 'normal',
    condition: [],
    contactMethod: 'message',
    expiryDate: '',
    specifications: {}
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  const categories = [
    'Charging Equipment',
    'Accessories',
    'Parts & Components',
    'Tools & Maintenance',
    'Interior Accessories',
    'Exterior Accessories',
    'Electronics',
    'Books & Manuals',
    'Other'
  ];

  const conditions = [
    'New',
    'Like New',
    'Excellent',
    'Good',
    'Fair',
    'For Parts'
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low - I can wait', color: 'text-green-600' },
    { value: 'normal', label: 'Normal - Within a month', color: 'text-blue-600' },
    { value: 'high', label: 'High - Within a week', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent - ASAP', color: 'text-red-600' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setWantedAdData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleConditionChange = (condition: string) => {
    setWantedAdData(prev => ({
      ...prev,
      condition: prev.condition.includes(condition)
        ? prev.condition.filter(c => c !== condition)
        : [...prev.condition, condition]
    }));
  };

  const addSpecification = () => {
    if (newSpecKey && newSpecValue) {
      setWantedAdData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [newSpecKey]: newSpecValue
        }
      }));
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const removeSpecification = (key: string) => {
    setWantedAdData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return {
        ...prev,
        specifications: newSpecs
      };
    });
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length < 20) newErrors.description = 'Description must be at least 20 characters';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (formData.maxPrice && (isNaN(Number(formData.maxPrice)) || Number(formData.maxPrice) <= 0)) {
      newErrors.maxPrice = 'Please enter a valid price';
    }
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    
    const today = new Date();
    const expiry = new Date(formData.expiryDate);
    if (expiry <= today) {
      newErrors.expiryDate = 'Expiry date must be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real app, submit to API
      console.log('Wanted ad submitted:', formData);
      
      // Redirect to marketplace or show success message
      alert('Wanted ad posted successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  // Calculate maximum date (6 months from now)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/marketplace" className="flex items-center text-blue-600 hover:text-blue-700">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Marketplace
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Post a Wanted Ad</h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Search className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-1">Looking for something specific?</h3>
              <p className="text-sm text-blue-700">
                Post a wanted ad to let sellers know what you're looking for. You'll get notified when matching items are listed.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">What are you looking for?</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="e.g., Looking for Tesla Model 3 Charging Cable"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.category ? 'border-red-300' : 'border-gray-300'}`}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                </div>
                
                <div>
                  <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency
                  </label>
                  <select
                    id="urgency"
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {urgencyLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.description ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Describe exactly what you're looking for. Include specific models, features, or requirements."
                />
                <div className="flex justify-between mt-1">
                  {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                  <p className="text-sm text-gray-500">{formData.description.length} characters (minimum 20)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Acceptable Conditions */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Acceptable Conditions</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {conditions.map(condition => (
                <label key={condition} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.condition.includes(condition)}
                    onChange={() => handleConditionChange(condition)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                  />
                  <span className="text-sm">{condition}</span>
                </label>
              ))}
            </div>
            {formData.condition.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">Select all conditions you would accept</p>
            )}
          </div>

          {/* Budget */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Budget</h2>
            
            <div className="max-w-md">
              <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Price (USD) - Optional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="maxPrice"
                  name="maxPrice"
                  value={formData.maxPrice}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.maxPrice ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.maxPrice && <p className="mt-1 text-sm text-red-600">{errors.maxPrice}</p>}
              <p className="mt-1 text-sm text-gray-500">Leave blank if you're open to any price</p>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Specific Requirements (Optional)</h2>
            
            <div className="space-y-4">
              {Object.entries(formData.specifications).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={key}
                      readOnly
                      className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <input
                      type="text"
                      value={value}
                      readOnly
                      className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSpecification(key)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <div className="flex items-center space-x-3">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newSpecKey}
                    onChange={(e) => setNewSpecKey(e.target.value)}
                    placeholder="Requirement (e.g., Brand, Model)"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                    placeholder="Value (e.g., Tesla, Gen 2)"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={addSpecification}
                  disabled={!newSpecKey || !newSpecValue}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Location & Contact */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Location &amp; Contact</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Location *
                </label>
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.location ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="City, State"
                  />
                </div>
                {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
              </div>
              
              <div>
                <label htmlFor="contactMethod" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Contact Method
                </label>
                <select
                  id="contactMethod"
                  name="contactMethod"
                  value={formData.contactMethod}
                  onChange={handleInputChange}
                  className="max-w-md w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="message">Platform Messages</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="any">Any Method</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ad Duration */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Ad Duration</h2>
            
            <div className="max-w-md">
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                Ad Expires On *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  min={today}
                  max={maxDateString}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.expiryDate ? 'border-red-300' : 'border-gray-300'}`}
                />
              </div>
              {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>}
              <p className="mt-1 text-sm text-gray-500">Maximum 6 months from today</p>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <Bell className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">Automatic Notifications</h3>
                <p className="text-sm text-blue-700">
                  You'll receive notifications when items matching your criteria are listed. 
                  You can manage notification preferences in your account settings.
                </p>
              </div>
            </div>
          </div>

          {/* Terms Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 mb-1">Community Guidelines</h3>
                <p className="text-sm text-yellow-700">
                  Please ensure your wanted ad follows our community guidelines. 
                  Be specific about what you're looking for and maintain respectful communication with sellers.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/marketplace"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Posting...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Post Wanted Ad
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WantedAdPage;