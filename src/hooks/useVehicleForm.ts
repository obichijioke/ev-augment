import { useState, useEffect } from "react";
import {
  CreateVehicleListingRequest,
  createVehicleListing,
  updateVehicleListing,
} from "@/services/adminVehicleApi";
import { VehicleListing } from "@/types/vehicle";

interface FormErrors {
  [key: string]: string;
}

interface FormData extends CreateVehicleListingRequest {}

interface UseVehicleFormProps {
  vehicle?: VehicleListing;
  onSuccess?: (vehicle: VehicleListing) => void;
}

interface UseVehicleFormReturn {
  formData: FormData;
  errors: FormErrors;
  isSubmitting: boolean;
  submitMessage: {
    type: "success" | "error";
    message: string;
  } | null;
  handleInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleSpecChange: (
    specType:
      | "performanceSpecs"
      | "batterySpecs"
      | "dimensionSpecs"
      | "safetySpecs"
      | "environmentalSpecs",
    field: string,
    value: any
  ) => void;
  handleImageUrlAdd: () => void;
  handleImageUrlChange: (index: number, value: string) => void;
  handleImageUrlRemove: (index: number) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  validateForm: () => boolean;
}

export const useVehicleForm = ({
  vehicle,
  onSuccess,
}: UseVehicleFormProps): UseVehicleFormReturn => {
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
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Populate form data when vehicle prop changes
  useEffect(() => {
    if (!vehicle) {
      setFormData(getInitialFormData());
    } else {
      // Extract feature IDs from vehicle features
      const vehicleFeatureIds: string[] = [];
      
      if (vehicle.features) {
        if (Array.isArray(vehicle.features)) {
          // New structure: array of vehicle_features
          vehicle.features.forEach((vehicleFeature) => {
            const featureId =
              vehicleFeature.feature?.id || vehicleFeature.feature_id;
            if (featureId) {
              vehicleFeatureIds.push(featureId);
            }
          });
        } else {
          // Old structure: object grouped by category
          Object.values(vehicle.features).forEach((categoryFeatures) => {
            categoryFeatures.forEach((vehicleFeature) => {
              const featureId =
                vehicleFeature.feature?.id || vehicleFeature.featureId;
              if (featureId) {
                vehicleFeatureIds.push(featureId);
              }
            });
          });
        }
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
        availability_status: (vehicle.availability_status as any) || "available",
        primary_image_url: vehicle.primary_image_url || "",
        image_urls: vehicle.image_urls || [],
        is_featured: vehicle.is_featured || false,
        is_active: vehicle.is_active !== undefined ? vehicle.is_active : true,
        performanceSpecs: vehicle.performanceSpecs?.[0] || {},
        batterySpecs: vehicle.batterySpecs?.[0] || {},
        dimensionSpecs: vehicle.dimensionSpecs?.[0] || {},
        safetySpecs: vehicle.safetySpecs?.[0] || {},
        environmentalSpecs: vehicle.environmentalSpecs?.[0] || {},
        features: vehicleFeatureIds,
      });
    }
  }, [vehicle]);

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

  return {
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
    validateForm,
  };
};
