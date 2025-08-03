import React from "react";
import { FormField, FormSelect, FormCheckbox } from "../form";

interface PricingAvailabilitySectionProps {
  formData: {
    msrp_base: number;
    msrp_max: number;
    availability_status: string;
    is_featured: boolean;
    is_active: boolean;
  };
  errors: { [key: string]: string };
  onInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
}

const PricingAvailabilitySection: React.FC<PricingAvailabilitySectionProps> = ({
  formData,
  errors,
  onInputChange,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
        Pricing & Availability
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          label="Base MSRP ($)"
          name="msrp_base"
          type="number"
          value={formData.msrp_base}
          onChange={onInputChange}
          min="0"
          step="100"
          placeholder="45000"
        />

        <FormField
          label="Maximum MSRP ($)"
          name="msrp_max"
          type="number"
          value={formData.msrp_max}
          onChange={onInputChange}
          error={errors.msrp_max}
          min="0"
          step="100"
          placeholder="65000"
        />

        <FormSelect
          label="Availability Status"
          name="availability_status"
          value={formData.availability_status}
          onChange={onInputChange}
          options={[
            { value: "available", label: "Available" },
            { value: "coming_soon", label: "Coming Soon" },
            { value: "discontinued", label: "Discontinued" },
          ]}
        />
      </div>

      <div className="flex items-center space-x-6">
        <FormCheckbox
          label="Featured Vehicle"
          name="is_featured"
          checked={formData.is_featured}
          onChange={onInputChange}
        />

        <FormCheckbox
          label="Active Listing"
          name="is_active"
          checked={formData.is_active}
          onChange={onInputChange}
        />
      </div>
    </div>
  );
};

export default PricingAvailabilitySection;
