"use client";

import React from "react";
import { Car, Save, X, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { VehicleListing } from "@/types/vehicle";
import { useVehicleFormData } from "@/hooks/useVehicleFormData";
import { useVehicleForm } from "@/hooks/useVehicleForm";
import {
  BasicInformationSection,
  PricingAvailabilitySection,
  ImagesSection,
  PerformanceSpecsSection,
  BatterySpecsSection,
  DimensionSpecsSection,
  SafetySpecsSection,
  EnvironmentalSpecsSection,
  FeaturesSection,
} from "./sections";

interface VehicleManagementFormProps {
  vehicle?: VehicleListing;
  onSuccess?: (vehicle: VehicleListing) => void;
  onCancel?: () => void;
}

const VehicleManagementForm: React.FC<VehicleManagementFormProps> = ({
  vehicle,
  onSuccess,
  onCancel,
}) => {
  // Use custom hooks for data loading and form management
  const {
    manufacturers,
    models,
    availableFeatures,
    selectedManufacturer,
    isLoading: dataLoading,
    error: dataError,
    setSelectedManufacturer,
  } = useVehicleFormData();

  const {
    formData,
    errors,
    isSubmitting,
    submitMessage,
    handleInputChange,
    handleSpecChange,
    handleImageUrlAdd,
    handleImageUrlChange,
    handleImageUrlRemove,
    handleSubmit,
    setFormData,
  } = useVehicleForm({ vehicle, onSuccess });

  // Handle manufacturer change
  const handleManufacturerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const manufacturerId = e.target.value;
    setSelectedManufacturer(manufacturerId);
    setFormData((prev) => ({ ...prev, model_id: "" })); // Reset model selection
  };

  // Handle feature toggle
  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    const currentFeatures = formData.features || [];
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        features: [...currentFeatures, featureId],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        features: currentFeatures.filter((id) => id !== featureId),
      }));
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading form data...</span>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="w-8 h-8 text-red-600" />
        <span className="ml-2 text-red-600">{dataError}</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Car className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              {vehicle ? "Edit Vehicle Listing" : "Add New Vehicle Listing"}
            </h2>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Submit Message */}
      {submitMessage && (
        <div
          className={`mx-6 mt-4 p-4 rounded-lg flex items-center ${
            submitMessage.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {submitMessage.type === "success" ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          {submitMessage.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        <BasicInformationSection
          formData={formData}
          errors={errors}
          manufacturers={manufacturers}
          models={models}
          selectedManufacturer={selectedManufacturer}
          onInputChange={handleInputChange}
          onManufacturerChange={handleManufacturerChange}
        />

        <PricingAvailabilitySection
          formData={formData}
          errors={errors}
          onInputChange={handleInputChange}
        />

        <ImagesSection
          formData={formData}
          onInputChange={handleInputChange}
          onImageUrlAdd={handleImageUrlAdd}
          onImageUrlChange={handleImageUrlChange}
          onImageUrlRemove={handleImageUrlRemove}
        />

        <PerformanceSpecsSection
          performanceSpecs={formData.performanceSpecs}
          onSpecChange={handleSpecChange}
        />

        <BatterySpecsSection
          batterySpecs={formData.batterySpecs}
          onSpecChange={handleSpecChange}
        />

        <DimensionSpecsSection
          dimensionSpecs={formData.dimensionSpecs}
          onSpecChange={handleSpecChange}
        />

        <SafetySpecsSection
          safetySpecs={formData.safetySpecs}
          onSpecChange={handleSpecChange}
        />

        <EnvironmentalSpecsSection
          environmentalSpecs={formData.environmentalSpecs}
          onSpecChange={handleSpecChange}
        />

        <FeaturesSection
          availableFeatures={availableFeatures}
          selectedFeatures={formData.features || []}
          onFeatureToggle={handleFeatureToggle}
        />

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {vehicle ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {vehicle ? "Update Vehicle" : "Create Vehicle"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleManagementForm;
