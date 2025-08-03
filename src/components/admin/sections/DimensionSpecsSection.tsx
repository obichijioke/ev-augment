import React from "react";
import { SpecField } from "../form";

interface DimensionSpecsSectionProps {
  dimensionSpecs: any;
  onSpecChange: (
    specType: "dimensionSpecs",
    field: string,
    value: any
  ) => void;
}

const DimensionSpecsSection: React.FC<DimensionSpecsSectionProps> = ({
  dimensionSpecs,
  onSpecChange,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
        Dimensions & Weight
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpecField
          label="Length (inches)"
          type="number"
          value={dimensionSpecs?.length_in}
          onChange={(value) =>
            onSpecChange("dimensionSpecs", "length_in", value)
          }
          min="0"
          step="0.1"
          placeholder="184.8"
        />

        <SpecField
          label="Width (inches)"
          type="number"
          value={dimensionSpecs?.width_in}
          onChange={(value) =>
            onSpecChange("dimensionSpecs", "width_in", value)
          }
          min="0"
          step="0.1"
          placeholder="72.8"
        />

        <SpecField
          label="Height (inches)"
          type="number"
          value={dimensionSpecs?.height_in}
          onChange={(value) =>
            onSpecChange("dimensionSpecs", "height_in", value)
          }
          min="0"
          step="0.1"
          placeholder="56.8"
        />

        <SpecField
          label="Curb Weight (lbs)"
          type="number"
          value={dimensionSpecs?.curb_weight_lbs}
          onChange={(value) =>
            onSpecChange("dimensionSpecs", "curb_weight_lbs", value)
          }
          min="0"
          placeholder="4065"
        />

        <SpecField
          label="Seating Capacity"
          type="number"
          value={dimensionSpecs?.seating_capacity}
          onChange={(value) =>
            onSpecChange("dimensionSpecs", "seating_capacity", value)
          }
          min="1"
          max="8"
          placeholder="5"
        />

        <SpecField
          label="Cargo Space (cu ft)"
          type="number"
          value={dimensionSpecs?.cargo_space_cu_ft}
          onChange={(value) =>
            onSpecChange("dimensionSpecs", "cargo_space_cu_ft", value)
          }
          min="0"
          step="0.1"
          placeholder="15.0"
        />
      </div>
    </div>
  );
};

export default DimensionSpecsSection;
