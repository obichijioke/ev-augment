'use client';

import { Paperclip, X } from 'lucide-react';

interface AttachmentListProps {
  attachments: File[];
  onRemoveAttachment: (index: number) => void;
}

const AttachmentList = ({ attachments, onRemoveAttachment }: AttachmentListProps) => {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {attachments.map((file, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
          <div className="flex items-center space-x-2">
            <Paperclip className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">{file.name}</span>
            <span className="text-sm text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
          </div>
          <button
            onClick={() => onRemoveAttachment(index)}
            className="text-gray-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AttachmentList;