import React from "react";

interface Feature {
  id: string;
  name: string;
  category: { id: string; name: string; slug: string };
}

interface FeaturesSectionProps {
  availableFeatures: Feature[];
  selectedFeatures: string[];
  onFeatureToggle: (featureId: string, checked: boolean) => void;
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  availableFeatures,
  selectedFeatures,
  onFeatureToggle,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
        Features
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableFeatures.map((feature) => {
          const isChecked = selectedFeatures.includes(feature.id);
          return (
            <label key={feature.id} className="flex items-center">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => onFeatureToggle(feature.id, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {feature.name}
                <span className="text-gray-500 ml-1">
                  ({feature.category.name})
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturesSection;
