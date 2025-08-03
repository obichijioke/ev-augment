import React from "react";
import { SpecField } from "../form";

interface BatterySpecsSectionProps {
  batterySpecs: any;
  onSpecChange: (
    specType: "batterySpecs",
    field: string,
    value: any
  ) => void;
}

const BatterySpecsSection: React.FC<BatterySpecsSectionProps> = ({
  batterySpecs,
  onSpecChange,
}) => {
  const chargingPortOptions = [
    { value: "CCS", label: "CCS (Combined Charging System)" },
    { value: "Tesla Supercharger", label: "Tesla Supercharger" },
    { value: "CHAdeMO", label: "CHAdeMO" },
    { value: "Type 2", label: "Type 2 (Mennekes)" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
        Battery Specifications
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpecField
          label="Battery Capacity (kWh)"
          type="number"
          value={batterySpecs?.battery_capacity_kwh}
          onChange={(value) =>
            onSpecChange("batterySpecs", "battery_capacity_kwh", value)
          }
          min="0"
          step="0.1"
          placeholder="75.0"
        />

        <SpecField
          label="Usable Capacity (kWh)"
          type="number"
          value={batterySpecs?.battery_usable_kwh}
          onChange={(value) =>
            onSpecChange("batterySpecs", "battery_usable_kwh", value)
          }
          min="0"
          step="0.1"
          placeholder="72.6"
        />

        <SpecField
          label="Battery Type"
          type="text"
          value={batterySpecs?.battery_type}
          onChange={(value) =>
            onSpecChange("batterySpecs", "battery_type", value)
          }
          placeholder="Lithium-ion"
        />

        <SpecField
          label="DC Fast Charging (kW)"
          type="number"
          value={batterySpecs?.charging_speed_dc_max}
          onChange={(value) =>
            onSpecChange("batterySpecs", "charging_speed_dc_max", value)
          }
          min="0"
          placeholder="250"
        />

        <SpecField
          label="AC Charging (kW)"
          type="number"
          value={batterySpecs?.charging_speed_ac_max}
          onChange={(value) =>
            onSpecChange("batterySpecs", "charging_speed_ac_max", value)
          }
          min="0"
          step="0.1"
          placeholder="11.5"
        />

        <SpecField
          label="Charging Port Type"
          type="select"
          value={batterySpecs?.charging_port_type}
          onChange={(value) =>
            onSpecChange("batterySpecs", "charging_port_type", value)
          }
          options={chargingPortOptions}
        />

        <SpecField
          label="Battery Warranty (Years)"
          type="number"
          value={batterySpecs?.battery_warranty_years}
          onChange={(value) =>
            onSpecChange("batterySpecs", "battery_warranty_years", value)
          }
          min="0"
          placeholder="8"
        />

        <SpecField
          label="Battery Warranty (Miles)"
          type="number"
          value={batterySpecs?.battery_warranty_miles}
          onChange={(value) =>
            onSpecChange("batterySpecs", "battery_warranty_miles", value)
          }
          min="0"
          placeholder="100000"
        />
      </div>
    </div>
  );
};

export default BatterySpecsSection;
