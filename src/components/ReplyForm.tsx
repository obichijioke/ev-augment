'use client';

'use client';

import { useState, useRef } from 'react';
import { Send, X, Paperclip } from 'lucide-react';
import FormattingToolbar from './forums/FormattingToolbar';
import AttachmentList from './forums/AttachmentList';
import ReplyPreview from './forums/ReplyPreview';

interface ReplyFormProps {
  onSubmit: (content: string, attachments?: File[]) => void;
  onCancel?: () => void;
  placeholder?: string;
  replyingTo?: {
    id: number;
    author: string;
    content: string;
  };
  isSubmitting?: boolean;
}

const ReplyForm = ({ 
  onSubmit, 
  onCancel, 
  placeholder = "Share your thoughts...", 
  replyingTo,
  isSubmitting = false 
}: ReplyFormProps) => {
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);





  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).filter(file => {
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });
    
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content, attachments.length > 0 ? attachments : undefined);
    setContent('');
    setAttachments([]);
    setIsPreview(false);
  };

  const renderPreview = (text: string) => {
    // Simple markdown preview (in a real app, use a proper markdown parser)
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-600">$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside">$1</ul>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Reply To Indicator */}
      {replyingTo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">
                Replying to {replyingTo.author}
              </p>
              <p className="text-sm text-blue-600 line-clamp-2">
                {replyingTo.content.substring(0, 100)}...
              </p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-blue-400 hover:text-blue-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {replyingTo ? 'Post Reply' : 'Join the Discussion'}
      </h3>

      <FormattingToolbar
        onFileUpload={() => fileInputRef.current?.click()}
        onPreviewToggle={() => setIsPreview(!isPreview)}
        isPreviewing={isPreview}
        onInsertMarkdown={(before, after) => {
          const textarea = textareaRef.current;
          if (!textarea) return;

          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const selectedText = content.substring(start, end);
          const newText = `${content.substring(0, start)}${before}${selectedText}${after}${content.substring(end)}`;
          
          setContent(newText);
          
          setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + before.length + selectedText.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
          }, 0);
        }}
      />

      {/* Content Area */}
      <div className="space-y-4">
        {isPreview ? (
          <ReplyPreview content={content} />
        ) : (
          <div
            className={`relative ${
              isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            } border-2 border-dashed rounded-lg transition-colors`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              rows={6}
              className="w-full px-3 py-3 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none bg-transparent"
            />
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 rounded-lg">
                <p className="text-blue-600 font-medium">Drop files here to attach</p>
              </div>
            )}
          </div>
        )}

        <AttachmentList attachments={attachments} onRemoveAttachment={removeAttachment} />

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            <span>Markdown supported • </span>
            <span>Max file size: 10MB</span>
          </div>
          <div className="flex items-center space-x-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplyForm;