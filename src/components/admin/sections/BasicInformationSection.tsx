import React from "react";
import { FormField, FormSelect, FormTextarea } from "../form";
import { VehicleManufacturer, VehicleModel } from "@/types/vehicle";

interface BasicInformationSectionProps {
  formData: {
    name: string;
    year: number;
    trim?: string;
    variant?: string;
    description?: string;
    model_id: string;
  };
  errors: { [key: string]: string };
  manufacturers: VehicleManufacturer[];
  models: VehicleModel[];
  selectedManufacturer: string;
  onInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  onManufacturerChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const BasicInformationSection: React.FC<BasicInformationSectionProps> = ({
  formData,
  errors,
  manufacturers,
  models,
  selectedManufacturer,
  onInputChange,
  onManufacturerChange,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
        Basic Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Vehicle Name"
          name="name"
          value={formData.name}
          onChange={onInputChange}
          error={errors.name}
          placeholder="e.g., Tesla Model 3 Long Range"
          required
        />

        <FormField
          label="Year"
          name="year"
          type="number"
          value={formData.year}
          onChange={onInputChange}
          error={errors.year}
          min="1990"
          max={new Date().getFullYear() + 5}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormSelect
          label="Manufacturer"
          name="manufacturer"
          value={selectedManufacturer}
          onChange={onManufacturerChange}
          options={manufacturers.map((manufacturer) => ({
            value: manufacturer.id,
            label: manufacturer.name,
          }))}
          placeholder="Select Manufacturer"
          required
        />

        <FormSelect
          label="Model"
          name="model_id"
          value={formData.model_id}
          onChange={onInputChange}
          options={models.map((model) => ({
            value: model.id,
            label: model.name,
          }))}
          error={errors.model_id}
          placeholder="Select Model"
          disabled={!selectedManufacturer}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Trim"
          name="trim"
          value={formData.trim}
          onChange={onInputChange}
          placeholder="e.g., Long Range, Performance"
        />

        <FormField
          label="Variant"
          name="variant"
          value={formData.variant}
          onChange={onInputChange}
          placeholder="e.g., AWD, RWD"
        />
      </div>

      <FormTextarea
        label="Description"
        name="description"
        value={formData.description}
        onChange={onInputChange}
        placeholder="Detailed description of the vehicle..."
        rows={4}
      />
    </div>
  );
};

export default BasicInformationSection;
