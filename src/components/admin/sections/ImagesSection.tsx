import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { FormField } from "../form";

interface ImagesSectionProps {
  formData: {
    primary_image_url?: string;
    image_urls?: string[];
  };
  onInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  onImageUrlAdd: () => void;
  onImageUrlChange: (index: number, value: string) => void;
  onImageUrlRemove: (index: number) => void;
}

const ImagesSection: React.FC<ImagesSectionProps> = ({
  formData,
  onInputChange,
  onImageUrlAdd,
  onImageUrlChange,
  onImageUrlRemove,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
        Images
      </h3>

      <FormField
        label="Primary Image URL"
        name="primary_image_url"
        type="url"
        value={formData.primary_image_url}
        onChange={onInputChange}
        placeholder="https://example.com/image.jpg"
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Additional Images
          </label>
          <button
            type="button"
            onClick={onImageUrlAdd}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Image
          </button>
        </div>

        <div className="space-y-2">
          {formData.image_urls?.map((url, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="url"
                value={url}
                onChange={(e) => onImageUrlChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
              <button
                type="button"
                onClick={() => onImageUrlRemove(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImagesSection;
