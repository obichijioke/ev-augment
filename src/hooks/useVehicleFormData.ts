import { useState, useEffect } from "react";
import {
  getManufacturers,
  getModelsByManufacturer,
  getAvailableFeatures,
} from "@/services/adminVehicleApi";
import { VehicleManufacturer, VehicleModel } from "@/types/vehicle";

interface UseVehicleFormDataReturn {
  manufacturers: VehicleManufacturer[];
  models: VehicleModel[];
  availableFeatures: Array<{
    id: string;
    name: string;
    category: { id: string; name: string; slug: string };
  }>;
  selectedManufacturer: string;
  isLoading: boolean;
  error: string | null;
  setSelectedManufacturer: (manufacturerId: string) => void;
}

export const useVehicleFormData = (): UseVehicleFormDataReturn => {
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data (manufacturers and features)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [manufacturersRes, featuresRes] = await Promise.all([
          getManufacturers(),
          getAvailableFeatures(),
        ]);

        if (manufacturersRes.success) {
          setManufacturers(manufacturersRes.data);
        } else {
          throw new Error("Failed to load manufacturers");
        }

        if (featuresRes.success) {
          setAvailableFeatures(featuresRes.data);
        } else {
          throw new Error("Failed to load features");
        }
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError(err instanceof Error ? err.message : "Failed to load form data");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load models when manufacturer changes
  useEffect(() => {
    const loadModels = async () => {
      if (selectedManufacturer) {
        try {
          setError(null);
          const modelsRes = await getModelsByManufacturer(selectedManufacturer);
          if (modelsRes.success) {
            setModels(modelsRes.data);
          } else {
            throw new Error("Failed to load models");
          }
        } catch (err) {
          console.error("Error loading models:", err);
          setError(err instanceof Error ? err.message : "Failed to load models");
        }
      } else {
        setModels([]);
      }
    };

    loadModels();
  }, [selectedManufacturer]);

  return {
    manufacturers,
    models,
    availableFeatures,
    selectedManufacturer,
    isLoading,
    error,
    setSelectedManufacturer,
  };
};
