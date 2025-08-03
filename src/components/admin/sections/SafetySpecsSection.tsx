import React from "react";
import { SpecField, FormCheckbox } from "../form";

interface SafetySpecsSectionProps {
  safetySpecs: any;
  onSpecChange: (
    specType: "safetySpecs",
    field: string,
    value: any
  ) => void;
}

const SafetySpecsSection: React.FC<SafetySpecsSectionProps> = ({
  safetySpecs,
  onSpecChange,
}) => {
  const iihsAwardOptions = [
    { value: "Top Safety Pick+", label: "Top Safety Pick+" },
    { value: "Top Safety Pick", label: "Top Safety Pick" },
    { value: "Good", label: "Good" },
    { value: "Acceptable", label: "Acceptable" },
    { value: "Marginal", label: "Marginal" },
    { value: "Poor", label: "Poor" },
  ];

  const safetyFeatures = [
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
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
        Safety Specifications
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpecField
          label="NHTSA Overall Rating (1-5 stars)"
          type="number"
          value={safetySpecs?.nhtsa_overall_rating}
          onChange={(value) =>
            onSpecChange("safetySpecs", "nhtsa_overall_rating", value)
          }
          min="1"
          max="5"
          placeholder="5"
        />

        <SpecField
          label="IIHS Overall Award"
          type="select"
          value={safetySpecs?.iihs_overall_award}
          onChange={(value) =>
            onSpecChange("safetySpecs", "iihs_overall_award", value)
          }
          options={iihsAwardOptions}
        />

        <SpecField
          label="Airbag Count"
          type="number"
          value={safetySpecs?.airbag_count}
          onChange={(value) =>
            onSpecChange("safetySpecs", "airbag_count", value)
          }
          min="0"
          placeholder="8"
        />
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Safety Features
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safetyFeatures.map(({ key, label }) => (
            <FormCheckbox
              key={key}
              label={label}
              name={key}
              checked={Boolean(safetySpecs?.[key]) || false}
              onChange={(e) =>
                onSpecChange("safetySpecs", key, e.target.checked)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SafetySpecsSection;
