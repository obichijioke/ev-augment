"use client";

import React, { useState, useEffect } from "react";
import {
  Car,
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  CreateVehicleListingRequest,
  UpdateVehicleListingRequest,
  createVehicleListing,
  updateVehicleListing,
  getManufacturers,
  getModelsByManufacturer,
  getAvailableFeatures,
} from "@/services/adminVehicleApi";
import {
  VehicleListing,
  VehicleManufacturer,
  VehicleModel,
} from "@/types/vehicle";

interface VehicleManagementFormProps {
  vehicle?: VehicleListing;
  onSuccess?: (vehicle: VehicleListing) => void;
  onCancel?: () => void;
}

interface FormErrors {
  [key: string]: string;
}

interface FormData extends CreateVehicleListingRequest {}

const VehicleManagementForm: React.FC<VehicleManagementFormProps> = ({
  vehicle,
  onSuccess,
  onCancel,
}) => {
  // Create initial form data
  const getInitialFormData = (): FormData => ({
    name: "",
    model_id: "",
    year: new Date().getFullYear(),
    trim: "",
    variant: "",
    description: "",
    msrp_base: 0,
    msrp_max: 0,
    availability_status: "available",
    primary_image_url: "",
    image_urls: [],
    is_featured: false,
    is_active: true,
    performanceSpecs: {},
    batterySpecs: {},
    dimensionSpecs: {},
    safetySpecs: {},
    environmentalSpecs: {},
    features: [],
  });

  const [formData, setFormData] = useState<FormData>(getInitialFormData());

  const [manufacturers, setManufacturers] = useState<VehicleManufacturer[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<
    Array<{
      id: string;
      name: string;
      category: { id: string; name: string; slug: string };
    }>
  >([]);

  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);

        // Load manufacturers and features
        const [manufacturersRes, featuresRes] = await Promise.all([
          getManufacturers(),
          getAvailableFeatures(),
        ]);

        if (manufacturersRes.success) {
          setManufacturers(manufacturersRes.data);
        }

        if (featuresRes.success) {
          setAvailableFeatures(featuresRes.data);
        }

        // Reset form data first
        if (!vehicle) {
          // If no vehicle (add mode), reset to initial state
          setFormData(getInitialFormData());
          setSelectedManufacturer("");
          setModels([]);
        } else {
          // If editing existing vehicle, populate form
          // Extract feature IDs from vehicle features
          const vehicleFeatureIds: string[] = [];
          if (vehicle.features) {
            Object.values(vehicle.features).forEach((categoryFeatures) => {
              categoryFeatures.forEach((vehicleFeature) => {
                if (vehicleFeature.feature?.id) {
                  vehicleFeatureIds.push(vehicleFeature.feature.id);
                }
              });
            });
          }

          setFormData({
            name: vehicle.name || "",
            model_id: vehicle.model_id || "",
            year: vehicle.year || new Date().getFullYear(),
            trim: vehicle.trim || "",
            variant: vehicle.variant || "",
            description: vehicle.description || "",
            msrp_base: vehicle.msrp_base || 0,
            msrp_max: vehicle.msrp_max || 0,
            availability_status:
              (vehicle.availability_status as any) || "available",
            primary_image_url: vehicle.primary_image_url || "",
            image_urls: vehicle.image_urls || [],
            is_featured: vehicle.is_featured || false,
            is_active:
              vehicle.is_active !== undefined ? vehicle.is_active : true,
            // Initialize specs objects with proper fallbacks
            performanceSpecs: vehicle.performanceSpecs?.[0] || {},
            batterySpecs: vehicle.batterySpecs?.[0] || {},
            dimensionSpecs: vehicle.dimensionSpecs?.[0] || {},
            safetySpecs: vehicle.safetySpecs?.[0] || {},
            environmentalSpecs: vehicle.environmentalSpecs?.[0] || {},
            features: vehicleFeatureIds, // Populate with actual feature IDs
          });

          // Set selected manufacturer and load models
          if (vehicle.model?.manufacturer?.id) {
            setSelectedManufacturer(vehicle.model.manufacturer.id);
            const modelsRes = await getModelsByManufacturer(
              vehicle.model.manufacturer.id
            );
            if (modelsRes.success) {
              setModels(modelsRes.data);
            }
          }
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        setSubmitMessage({
          type: "error",
          message: "Failed to load form data. Please refresh the page.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [vehicle]);

  // Load models when manufacturer changes
  useEffect(() => {
    const loadModels = async () => {
      if (selectedManufacturer) {
        try {
          const modelsRes = await getModelsByManufacturer(selectedManufacturer);
          if (modelsRes.success) {
            setModels(modelsRes.data);
          }
        } catch (error) {
          console.error("Error loading models:", error);
        }
      } else {
        setModels([]);
      }
    };

    loadModels();
  }, [selectedManufacturer]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? value === ""
            ? undefined
            : Number(value)
          : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSpecChange = (
    specType:
      | "performanceSpecs"
      | "batterySpecs"
      | "dimensionSpecs"
      | "safetySpecs"
      | "environmentalSpecs",
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [specType]: {
        ...prev[specType],
        [field]: value === "" ? undefined : value,
      },
    }));
  };

  const handleManufacturerChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const manufacturerId = e.target.value;
    setSelectedManufacturer(manufacturerId);
    setFormData((prev) => ({ ...prev, model_id: "" })); // Reset model selection
  };

  const handleImageUrlAdd = () => {
    setFormData((prev) => ({
      ...prev,
      image_urls: [...(prev.image_urls || []), ""],
    }));
  };

  const handleImageUrlChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      image_urls:
        prev.image_urls?.map((url, i) => (i === index ? value : url)) || [],
    }));
  };

  const handleImageUrlRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      image_urls: prev.image_urls?.filter((_, i) => i !== index) || [],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Vehicle name is required";
    }

    if (!formData.model_id) {
      newErrors.model_id = "Model selection is required";
    }

    if (
      !formData.year ||
      formData.year < 1990 ||
      formData.year > new Date().getFullYear() + 5
    ) {
      newErrors.year = "Please enter a valid year";
    }

    if (
      formData.msrp_base &&
      formData.msrp_max &&
      formData.msrp_base > formData.msrp_max
    ) {
      newErrors.msrp_max = "Maximum MSRP must be greater than base MSRP";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Clean up the form data - remove empty specs objects
      const cleanedData = { ...formData };

      // Remove empty specs (but keep features even if empty)
      Object.keys(cleanedData).forEach((key) => {
        if (key.endsWith("Specs") && cleanedData[key as keyof FormData]) {
          const specs = cleanedData[key as keyof FormData] as any;
          const hasValues = Object.values(specs).some(
            (value) => value !== undefined && value !== null && value !== ""
          );
          if (!hasValues) {
            delete cleanedData[key as keyof FormData];
          }
        }
      });

      // Ensure features array is always included (even if empty)
      if (!cleanedData.features) {
        cleanedData.features = [];
      }

      // Remove empty image URLs
      if (cleanedData.image_urls) {
        cleanedData.image_urls = cleanedData.image_urls.filter(
          (url) => url.trim() !== ""
        );
        if (cleanedData.image_urls.length === 0) {
          delete cleanedData.image_urls;
        }
      }

      let result;
      if (vehicle) {
        // Update existing vehicle
        result = await updateVehicleListing(vehicle.id, cleanedData);
      } else {
        // Create new vehicle
        result = await createVehicleListing(cleanedData);
      }

      setSubmitMessage({
        type: "success",
        message: vehicle
          ? "Vehicle updated successfully!"
          : "Vehicle created successfully!",
      });

      if (onSuccess && result.data.listing) {
        onSuccess(result.data.listing);
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setSubmitMessage({
        type: "error",
        message: error.message || "Failed to save vehicle. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading form data...</span>
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
        {/* Basic Information Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vehicle Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Vehicle Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="e.g., Tesla Model 3 Long Range"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Year */}
            <div>
              <label
                htmlFor="year"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Year *
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1990"
                max={new Date().getFullYear() + 5}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.year ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              />
              {errors.year && (
                <p className="mt-1 text-sm text-red-600">{errors.year}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manufacturer */}
            <div>
              <label
                htmlFor="manufacturer"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Manufacturer *
              </label>
              <select
                id="manufacturer"
                value={selectedManufacturer}
                onChange={handleManufacturerChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Manufacturer</option>
                {manufacturers.map((manufacturer) => (
                  <option key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <label
                htmlFor="model_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Model *
              </label>
              <select
                id="model_id"
                name="model_id"
                value={formData.model_id}
                onChange={handleInputChange}
                disabled={!selectedManufacturer}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.model_id
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                } ${
                  !selectedManufacturer ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              >
                <option value="">Select Model</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              {errors.model_id && (
                <p className="mt-1 text-sm text-red-600">{errors.model_id}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trim */}
            <div>
              <label
                htmlFor="trim"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Trim
              </label>
              <input
                type="text"
                id="trim"
                name="trim"
                value={formData.trim || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Long Range, Performance"
              />
            </div>

            {/* Variant */}
            <div>
              <label
                htmlFor="variant"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Variant
              </label>
              <input
                type="text"
                id="variant"
                name="variant"
                value={formData.variant || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., AWD, RWD"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed description of the vehicle..."
            />
          </div>
        </div>

        {/* Pricing Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Pricing & Availability
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Base MSRP */}
            <div>
              <label
                htmlFor="msrp_base"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Base MSRP ($)
              </label>
              <input
                type="number"
                id="msrp_base"
                name="msrp_base"
                value={formData.msrp_base || ""}
                onChange={handleInputChange}
                min="0"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="45000"
              />
            </div>

            {/* Max MSRP */}
            <div>
              <label
                htmlFor="msrp_max"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Maximum MSRP ($)
              </label>
              <input
                type="number"
                id="msrp_max"
                name="msrp_max"
                value={formData.msrp_max || ""}
                onChange={handleInputChange}
                min="0"
                step="100"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.msrp_max
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="65000"
              />
              {errors.msrp_max && (
                <p className="mt-1 text-sm text-red-600">{errors.msrp_max}</p>
              )}
            </div>

            {/* Availability Status */}
            <div>
              <label
                htmlFor="availability_status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Availability Status
              </label>
              <select
                id="availability_status"
                name="availability_status"
                value={formData.availability_status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="available">Available</option>
                <option value="coming_soon">Coming Soon</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
          </div>

          {/* Status Checkboxes */}
          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Featured Vehicle
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active Listing</span>
            </label>
          </div>
        </div>

        {/* Images Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Images
          </h3>

          {/* Primary Image */}
          <div>
            <label
              htmlFor="primary_image_url"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Primary Image URL
            </label>
            <input
              type="url"
              id="primary_image_url"
              name="primary_image_url"
              value={formData.primary_image_url || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Additional Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Additional Images
              </label>
              <button
                type="button"
                onClick={handleImageUrlAdd}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Image
              </button>
            </div>

            <div className="space-y-2">
              {formData.image_urls?.map((url, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) =>
                      handleImageUrlChange(index, e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageUrlRemove(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Specifications */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Performance Specifications
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                EPA Range (miles)
              </label>
              <input
                type="number"
                value={formData.performanceSpecs?.range_epa || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "performanceSpecs",
                    "range_epa",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WLTP Range (miles)
              </label>
              <input
                type="number"
                value={formData.performanceSpecs?.range_wltp || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "performanceSpecs",
                    "range_wltp",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="320"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Real World Range (miles)
              </label>
              <input
                type="number"
                value={formData.performanceSpecs?.range_real_world || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "performanceSpecs",
                    "range_real_world",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="280"
              />
            </div>

            {/* Acceleration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                0-60 mph (seconds)
              </label>
              <input
                type="number"
                value={formData.performanceSpecs?.acceleration_0_60 || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "performanceSpecs",
                    "acceleration_0_60",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="5.3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top Speed (mph)
              </label>
              <input
                type="number"
                value={formData.performanceSpecs?.top_speed || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "performanceSpecs",
                    "top_speed",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="140"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drivetrain
              </label>
              <select
                value={formData.performanceSpecs?.drivetrain || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "performanceSpecs",
                    "drivetrain",
                    e.target.value || undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Drivetrain</option>
                <option value="RWD">Rear-Wheel Drive (RWD)</option>
                <option value="FWD">Front-Wheel Drive (FWD)</option>
                <option value="AWD">All-Wheel Drive (AWD)</option>
                <option value="4WD">Four-Wheel Drive (4WD)</option>
              </select>
            </div>

            {/* Motor Power */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motor Power (HP)
              </label>
              <input
                type="number"
                value={formData.performanceSpecs?.motor_power_hp || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "performanceSpecs",
                    "motor_power_hp",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="283"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motor Power (kW)
              </label>
              <input
                type="number"
                value={formData.performanceSpecs?.motor_power_kw || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "performanceSpecs",
                    "motor_power_kw",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="211"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motor Count
              </label>
              <input
                type="number"
                value={formData.performanceSpecs?.motor_count || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "performanceSpecs",
                    "motor_count",
                    Number(e.target.value) || undefined
                  )
                }
                min="1"
                max="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1"
              />
            </div>
          </div>
        </div>

        {/* Battery Specifications */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Battery Specifications
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Battery Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Battery Capacity (kWh)
              </label>
              <input
                type="number"
                value={formData.batterySpecs?.battery_capacity_kwh || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "batterySpecs",
                    "battery_capacity_kwh",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="75.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usable Capacity (kWh)
              </label>
              <input
                type="number"
                value={formData.batterySpecs?.battery_usable_kwh || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "batterySpecs",
                    "battery_usable_kwh",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="72.6"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Battery Type
              </label>
              <input
                type="text"
                value={formData.batterySpecs?.battery_type || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "batterySpecs",
                    "battery_type",
                    e.target.value || undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Lithium-ion"
              />
            </div>

            {/* Charging Speeds */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DC Fast Charging (kW)
              </label>
              <input
                type="number"
                value={formData.batterySpecs?.charging_speed_dc_max || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "batterySpecs",
                    "charging_speed_dc_max",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="250"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AC Charging (kW)
              </label>
              <input
                type="number"
                value={formData.batterySpecs?.charging_speed_ac_max || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "batterySpecs",
                    "charging_speed_ac_max",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="11.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Charging Port Type
              </label>
              <select
                value={formData.batterySpecs?.charging_port_type || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "batterySpecs",
                    "charging_port_type",
                    e.target.value || undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Port Type</option>
                <option value="CCS">CCS (Combined Charging System)</option>
                <option value="Tesla Supercharger">Tesla Supercharger</option>
                <option value="CHAdeMO">CHAdeMO</option>
                <option value="Type 2">Type 2 (Mennekes)</option>
              </select>
            </div>

            {/* Warranty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Battery Warranty (Years)
              </label>
              <input
                type="number"
                value={formData.batterySpecs?.battery_warranty_years || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "batterySpecs",
                    "battery_warranty_years",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="8"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Battery Warranty (Miles)
              </label>
              <input
                type="number"
                value={formData.batterySpecs?.battery_warranty_miles || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "batterySpecs",
                    "battery_warranty_miles",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="100000"
              />
            </div>
          </div>
        </div>

        {/* Dimension Specifications */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Dimensions & Weight
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Exterior Dimensions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Length (inches)
              </label>
              <input
                type="number"
                value={formData.dimensionSpecs?.length_in || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "dimensionSpecs",
                    "length_in",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="184.8"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Width (inches)
              </label>
              <input
                type="number"
                value={formData.dimensionSpecs?.width_in || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "dimensionSpecs",
                    "width_in",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="72.8"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height (inches)
              </label>
              <input
                type="number"
                value={formData.dimensionSpecs?.height_in || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "dimensionSpecs",
                    "height_in",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="56.8"
              />
            </div>

            {/* Weight & Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Curb Weight (lbs)
              </label>
              <input
                type="number"
                value={formData.dimensionSpecs?.curb_weight_lbs || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "dimensionSpecs",
                    "curb_weight_lbs",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="4065"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seating Capacity
              </label>
              <input
                type="number"
                value={formData.dimensionSpecs?.seating_capacity || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "dimensionSpecs",
                    "seating_capacity",
                    Number(e.target.value) || undefined
                  )
                }
                min="1"
                max="8"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo Space (cu ft)
              </label>
              <input
                type="number"
                value={formData.dimensionSpecs?.cargo_space_cu_ft || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "dimensionSpecs",
                    "cargo_space_cu_ft",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="15.0"
              />
            </div>
          </div>
        </div>

        {/* Safety Specifications */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Safety Specifications
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* NHTSA Ratings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NHTSA Overall Rating (1-5 stars)
              </label>
              <input
                type="number"
                value={formData.safetySpecs?.nhtsa_overall_rating || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "safetySpecs",
                    "nhtsa_overall_rating",
                    Number(e.target.value) || undefined
                  )
                }
                min="1"
                max="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IIHS Overall Award
              </label>
              <select
                value={formData.safetySpecs?.iihs_overall_award || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "safetySpecs",
                    "iihs_overall_award",
                    e.target.value || undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Award</option>
                <option value="Top Safety Pick+">Top Safety Pick+</option>
                <option value="Top Safety Pick">Top Safety Pick</option>
                <option value="Good">Good</option>
                <option value="Acceptable">Acceptable</option>
                <option value="Marginal">Marginal</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Airbag Count
              </label>
              <input
                type="number"
                value={formData.safetySpecs?.airbag_count || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "safetySpecs",
                    "airbag_count",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="8"
              />
            </div>
          </div>

          {/* Safety Features */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Safety Features
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  key: "has_automatic_emergency_braking",
                  label: "Automatic Emergency Braking",
                },
                {
                  key: "has_blind_spot_monitoring",
                  label: "Blind Spot Monitoring",
                },
                { key: "has_lane_keep_assist", label: "Lane Keep Assist" },
                {
                  key: "has_adaptive_cruise_control",
                  label: "Adaptive Cruise Control",
                },
                {
                  key: "has_forward_collision_warning",
                  label: "Forward Collision Warning",
                },
                {
                  key: "has_rear_cross_traffic_alert",
                  label: "Rear Cross Traffic Alert",
                },
                {
                  key: "has_driver_attention_monitoring",
                  label: "Driver Attention Monitoring",
                },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      Boolean(
                        formData.safetySpecs?.[
                          key as keyof typeof formData.safetySpecs
                        ]
                      ) || false
                    }
                    onChange={(e) =>
                      handleSpecChange("safetySpecs", key, e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Environmental Specifications */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Environmental Specifications
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Emissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CO₂ Emissions (g/mi)
              </label>
              <input
                type="number"
                value={formData.environmentalSpecs?.co2_emissions_g_mi || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "environmentalSpecs",
                    "co2_emissions_g_mi",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MPGe Combined
              </label>
              <input
                type="number"
                value={formData.environmentalSpecs?.mpge_combined || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "environmentalSpecs",
                    "mpge_combined",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MPGe City
              </label>
              <input
                type="number"
                value={formData.environmentalSpecs?.mpge_city || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "environmentalSpecs",
                    "mpge_city",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="130"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MPGe Highway
              </label>
              <input
                type="number"
                value={formData.environmentalSpecs?.mpge_highway || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "environmentalSpecs",
                    "mpge_highway",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="110"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Fuel Cost ($)
              </label>
              <input
                type="number"
                value={formData.environmentalSpecs?.annual_fuel_cost || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "environmentalSpecs",
                    "annual_fuel_cost",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="650"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Green Score (0-10)
              </label>
              <input
                type="number"
                value={formData.environmentalSpecs?.green_score || ""}
                onChange={(e) =>
                  handleSpecChange(
                    "environmentalSpecs",
                    "green_score",
                    Number(e.target.value) || undefined
                  )
                }
                min="0"
                max="10"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="9.5"
              />
            </div>
          </div>
        </div>

        {/* Features Selection */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Features
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableFeatures.map((feature) => (
              <label key={feature.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.features?.includes(feature.id) || false}
                  onChange={(e) => {
                    const currentFeatures = formData.features || [];
                    if (e.target.checked) {
                      setFormData((prev) => ({
                        ...prev,
                        features: [...currentFeatures, feature.id],
                      }));
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        features: currentFeatures.filter(
                          (id) => id !== feature.id
                        ),
                      }));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {feature.name}
                  <span className="text-gray-500 ml-1">
                    ({feature.category.name})
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

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
