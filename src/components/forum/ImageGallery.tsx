"use client";

import React, { useState } from "react";
import { X, ZoomIn, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { ForumImage } from "@/types/forum";

interface ImageGalleryProps {
  images: ForumImage[];
  className?: string;
}

interface ImageModalProps {
  images: ForumImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious,
}) => {
  if (!isOpen || !images[currentIndex]) return null;

  const currentImage = images[currentIndex];

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = currentImage.url;
    link.download = currentImage.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") onPrevious();
    if (e.key === "ArrowRight") onNext();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Image */}
      <div
        className="max-w-full max-h-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.url}
          alt={currentImage.alt || currentImage.filename}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Image Info */}
      <div className="absolute bottom-4 left-4 right-4 text-white text-center">
        <div className="bg-black bg-opacity-50 rounded-lg p-3">
          <p className="font-medium">{currentImage.filename}</p>
          <div className="flex items-center justify-center space-x-4 mt-2 text-sm">
            <span>
              {currentIndex + 1} of {images.length}
            </span>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 hover:text-gray-300"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className = "",
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Single image layout
  if (images.length === 1) {
    return (
      <>
        <div className={`${className}`}>
          <div
            className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200"
            onClick={() => openModal(0)}
          >
            <img
              src={images[0].url}
              alt={images[0].alt || images[0].filename}
              className="w-full h-auto max-h-96 object-cover"
            />
            <div className="absolute inset-0 bg-[#00000054] bg-opacity-25 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {images[0].filename} ({formatFileSize(images[0].size)})
          </p>
        </div>

        <ImageModal
          images={images}
          currentIndex={currentImageIndex}
          isOpen={modalOpen}
          onClose={closeModal}
          onNext={nextImage}
          onPrevious={previousImage}
        />
      </>
    );
  }

  // Multiple images layout
  return (
    <>
      <div className={`${className}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 rounded-lg overflow-hidden">
          {images.slice(0, 5).map((image, index) => (
            <div
              key={image.id}
              className="relative group cursor-pointer aspect-square overflow-hidden border border-gray-200"
              onClick={() => openModal(index)}
            >
              <img
                src={image.url}
                alt={image.alt || image.filename}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Show count overlay for last image if there are more than 5 */}
              {index === 4 && images.length > 5 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">
                    +{images.length - 5}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-2">
          {images.length} image{images.length !== 1 ? "s" : ""} • Click to view
          full size
        </p>
      </div>

      <ImageModal
        images={images}
        currentIndex={currentImageIndex}
        isOpen={modalOpen}
        onClose={closeModal}
        onNext={nextImage}
        onPrevious={previousImage}
      />
    </>
  );
};

export default ImageGallery;
