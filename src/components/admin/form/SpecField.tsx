import React from "react";

interface SpecFieldProps {
  label: string;
  type?: "text" | "number" | "select";
  value: string | number | undefined;
  onChange: (value: any) => void;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  options?: Array<{ value: string; label: string }>;
  className?: string;
}

const SpecField: React.FC<SpecFieldProps> = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  options,
  className = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newValue = e.target.value;
    if (type === "number") {
      onChange(newValue === "" ? undefined : Number(newValue));
    } else {
      onChange(newValue || undefined);
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {type === "select" && options ? (
        <select
          value={value || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

export default SpecField;
