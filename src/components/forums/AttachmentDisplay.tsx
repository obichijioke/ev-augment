'use client';

import { useState } from 'react';
import { Download, ExternalLink, Eye, X, ZoomIn, ZoomOut } from 'lucide-react';
import { ForumAttachment } from '@/types/forum';
import { formatFileSize, getFileIcon, isImageFile } from '@/services/fileUploadApi';

interface AttachmentDisplayProps {
  attachments: ForumAttachment[];
  showDownload?: boolean;
  showRemove?: boolean;
  onRemove?: (attachment: ForumAttachment) => void;
  className?: string;
}

interface ImageModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

const ImageModal = ({ src, alt, onClose }: ImageModalProps) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-colors"
          disabled={zoom <= 0.5}
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          onClick={handleResetZoom}
          className="px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white text-sm transition-colors"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-colors"
          disabled={zoom >= 3}
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Image */}
      <div
        className="relative overflow-hidden cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-none transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
          draggable={false}
        />
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
};

const AttachmentDisplay = ({
  attachments,
  showDownload = true,
  showRemove = false,
  onRemove,
  className = '',
}: AttachmentDisplayProps) => {
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);

  if (attachments.length === 0) return null;

  const handleDownload = async (attachment: ForumAttachment) => {
    try {
      const response = await fetch(attachment.file_path);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleImageClick = (attachment: ForumAttachment) => {
    if (isImageFile(attachment.mime_type)) {
      setSelectedImage({
        src: attachment.file_path,
        alt: attachment.alt_text || attachment.original_filename,
      });
    }
  };

  const renderAttachment = (attachment: ForumAttachment) => {
    const isImage = isImageFile(attachment.mime_type);

    return (
      <div
        key={attachment.id}
        className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Image Preview */}
        {isImage ? (
          <div
            className="aspect-video bg-gray-100 dark:bg-gray-700 cursor-pointer relative overflow-hidden"
            onClick={() => handleImageClick(attachment)}
          >
            <img
              src={attachment.file_path}
              alt={attachment.alt_text || attachment.original_filename}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors flex items-center justify-center">
              <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ) : (
          /* File Icon */
          <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <div className="text-4xl">
              {getFileIcon(attachment.mime_type)}
            </div>
          </div>
        )}

        {/* File Info */}
        <div className="p-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {attachment.original_filename}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatFileSize(attachment.file_size)}
          </p>
          {attachment.alt_text && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic">
              {attachment.alt_text}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {showDownload && (
            <button
              onClick={() => handleDownload(attachment)}
              className="p-1.5 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-colors"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => window.open(attachment.file_path, '_blank')}
            className="p-1.5 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </button>

          {showRemove && onRemove && (
            <button
              onClick={() => onRemove(attachment)}
              className="p-1.5 bg-red-500 bg-opacity-80 hover:bg-opacity-100 rounded-full text-white transition-colors"
              title="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`attachment-display ${className}`}>
        {/* Grid Layout for Multiple Attachments */}
        {attachments.length > 1 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {attachments.map(renderAttachment)}
          </div>
        ) : (
          /* Single Attachment Layout */
          <div className="max-w-md">
            {renderAttachment(attachments[0])}
          </div>
        )}

        {/* Attachment Count */}
        {attachments.length > 3 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {Math.min(3, attachments.length)} of {attachments.length} attachments
            </p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          src={selectedImage.src}
          alt={selectedImage.alt}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
};

export default AttachmentDisplay;
