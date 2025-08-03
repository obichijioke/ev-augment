import React from "react";
import { SpecField } from "../form";

interface EnvironmentalSpecsSectionProps {
  environmentalSpecs: any;
  onSpecChange: (
    specType: "environmentalSpecs",
    field: string,
    value: any
  ) => void;
}

const EnvironmentalSpecsSection: React.FC<EnvironmentalSpecsSectionProps> = ({
  environmentalSpecs,
  onSpecChange,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
        Environmental Specifications
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpecField
          label="CO₂ Emissions (g/mi)"
          type="number"
          value={environmentalSpecs?.co2_emissions_g_mi}
          onChange={(value) =>
            onSpecChange("environmentalSpecs", "co2_emissions_g_mi", value)
          }
          min="0"
          placeholder="0"
        />

        <SpecField
          label="MPGe Combined"
          type="number"
          value={environmentalSpecs?.mpge_combined}
          onChange={(value) =>
            onSpecChange("environmentalSpecs", "mpge_combined", value)
          }
          min="0"
          placeholder="120"
        />

        <SpecField
          label="MPGe City"
          type="number"
          value={environmentalSpecs?.mpge_city}
          onChange={(value) =>
            onSpecChange("environmentalSpecs", "mpge_city", value)
          }
          min="0"
          placeholder="130"
        />

        <SpecField
          label="MPGe Highway"
          type="number"
          value={environmentalSpecs?.mpge_highway}
          onChange={(value) =>
            onSpecChange("environmentalSpecs", "mpge_highway", value)
          }
          min="0"
          placeholder="110"
        />

        <SpecField
          label="Annual Fuel Cost ($)"
          type="number"
          value={environmentalSpecs?.annual_fuel_cost}
          onChange={(value) =>
            onSpecChange("environmentalSpecs", "annual_fuel_cost", value)
          }
          min="0"
          placeholder="650"
        />

        <SpecField
          label="Green Score (0-10)"
          type="number"
          value={environmentalSpecs?.green_score}
          onChange={(value) =>
            onSpecChange("environmentalSpecs", "green_score", value)
          }
          min="0"
          max="10"
          step="0.1"
          placeholder="9.5"
        />
      </div>
    </div>
  );
};

export default EnvironmentalSpecsSection;
