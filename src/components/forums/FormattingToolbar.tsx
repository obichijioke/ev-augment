'use client';

import { Bold, Italic, Link as LinkIcon, Image, Code, Quote, List, ListOrdered, Eye, EyeOff, Paperclip } from 'lucide-react';

interface FormattingToolbarProps {
  onInsertMarkdown: (before: string, after?: string) => void;
  onTogglePreview: () => void;
  onFileUpload: () => void;
  isPreviewing: boolean;
}

const FormattingToolbar = ({ onInsertMarkdown, onTogglePreview, onFileUpload, isPreviewing }: FormattingToolbarProps) => {
  const formatButtons = [
    { icon: Bold, label: 'Bold', action: () => onInsertMarkdown('**', '**') },
    { icon: Italic, label: 'Italic', action: () => onInsertMarkdown('*', '*') },
    { icon: Code, label: 'Code', action: () => onInsertMarkdown('`', '`') },
    { icon: Quote, label: 'Quote', action: () => onInsertMarkdown('> ') },
    { icon: LinkIcon, label: 'Link', action: () => onInsertMarkdown('[', '](url)') },
    { icon: Image, label: 'Image', action: () => onInsertMarkdown('![alt](', ')') },
    { icon: List, label: 'Bullet List', action: () => onInsertMarkdown('- ') },
    { icon: ListOrdered, label: 'Numbered List', action: () => onInsertMarkdown('1. ') },
  ];

  return (
    <div className="flex items-center space-x-1 mb-3 p-2 bg-gray-50 rounded-lg border">
      {formatButtons.map((button, index) => (
        <button
          key={index}
          onClick={button.action}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors"
          title={button.label}
          type="button"
        >
          <button.icon className="h-4 w-4" />
        </button>
      ))}
      <div className="h-6 w-px bg-gray-300 mx-2" />
      <button
        onClick={onFileUpload}
        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors"
        title="Attach File"
        type="button"
      >
        <Paperclip className="h-4 w-4" />
      </button>
      <div className="flex-1" />
      <button
        onClick={onTogglePreview}
        className={`p-2 rounded transition-colors ${
          isPreviewing
            ? 'text-blue-600 bg-white'
            : 'text-gray-600 hover:text-blue-600 hover:bg-white'
        }`}
        title={isPreviewing ? 'Edit' : 'Preview'}
        type="button"
      >
        {isPreviewing ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

export default FormattingToolbar;