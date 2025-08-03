import React from "react";
import { SpecField } from "../form";

interface PerformanceSpecsSectionProps {
  performanceSpecs: any;
  onSpecChange: (
    specType: "performanceSpecs",
    field: string,
    value: any
  ) => void;
}

const PerformanceSpecsSection: React.FC<PerformanceSpecsSectionProps> = ({
  performanceSpecs,
  onSpecChange,
}) => {
  const drivetrainOptions = [
    { value: "RWD", label: "Rear-Wheel Drive (RWD)" },
    { value: "FWD", label: "Front-Wheel Drive (FWD)" },
    { value: "AWD", label: "All-Wheel Drive (AWD)" },
    { value: "4WD", label: "Four-Wheel Drive (4WD)" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
        Performance Specifications
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpecField
          label="EPA Range (miles)"
          type="number"
          value={performanceSpecs?.range_epa}
          onChange={(value) =>
            onSpecChange("performanceSpecs", "range_epa", value)
          }
          min="0"
          placeholder="300"
        />

        <SpecField
          label="WLTP Range (miles)"
          type="number"
          value={performanceSpecs?.range_wltp}
          onChange={(value) =>
            onSpecChange("performanceSpecs", "range_wltp", value)
          }
          min="0"
          placeholder="320"
        />

        <SpecField
          label="Real World Range (miles)"
          type="number"
          value={performanceSpecs?.range_real_world}
          onChange={(value) =>
            onSpecChange("performanceSpecs", "range_real_world", value)
          }
          min="0"
          placeholder="280"
        />

        <SpecField
          label="0-60 mph (seconds)"
          type="number"
          value={performanceSpecs?.acceleration_0_60}
          onChange={(value) =>
            onSpecChange("performanceSpecs", "acceleration_0_60", value)
          }
          min="0"
          step="0.1"
          placeholder="5.3"
        />

        <SpecField
          label="Top Speed (mph)"
          type="number"
          value={performanceSpecs?.top_speed}
          onChange={(value) =>
            onSpecChange("performanceSpecs", "top_speed", value)
          }
          min="0"
          placeholder="140"
        />

        <SpecField
          label="Drivetrain"
          type="select"
          value={performanceSpecs?.drivetrain}
          onChange={(value) =>
            onSpecChange("performanceSpecs", "drivetrain", value)
          }
          options={drivetrainOptions}
        />

        <SpecField
          label="Motor Power (HP)"
          type="number"
          value={performanceSpecs?.motor_power_hp}
          onChange={(value) =>
            onSpecChange("performanceSpecs", "motor_power_hp", value)
          }
          min="0"
          placeholder="283"
        />

        <SpecField
          label="Motor Power (kW)"
          type="number"
          value={performanceSpecs?.motor_power_kw}
          onChange={(value) =>
            onSpecChange("performanceSpecs", "motor_power_kw", value)
          }
          min="0"
          placeholder="211"
        />

        <SpecField
          label="Motor Count"
          type="number"
          value={performanceSpecs?.motor_count}
          onChange={(value) =>
            onSpecChange("performanceSpecs", "motor_count", value)
          }
          min="1"
          max="4"
          placeholder="1"
        />
      </div>
    </div>
  );
};

export default PerformanceSpecsSection;
