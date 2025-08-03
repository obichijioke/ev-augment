'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, FileText, Film, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  uploadSingleFile, 
  uploadMultipleFiles, 
  UploadType, 
  EntityType, 
  UploadProgress,
  formatFileSize,
  getFileIcon,
  isImageFile,
  createImagePreview,
  FILE_CONSTRAINTS
} from '@/services/fileUploadApi';

interface FileUploadZoneProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  uploadType?: UploadType;
  entityType?: EntityType;
  entityId?: string;
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

interface UploadedFile {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  preview?: string;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  preview?: string;
  uploadedFile?: UploadedFile;
}

const FileUploadZone = ({
  onFilesUploaded,
  uploadType = 'image',
  entityType,
  entityId,
  maxFiles = FILE_CONSTRAINTS.maxFiles,
  multiple = true,
  disabled = false,
  className = '',
}: FileUploadZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [filesWithProgress, setFilesWithProgress] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    await handleFiles(droppedFiles);
  }, [disabled]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || disabled) return;
    
    const selectedFiles = Array.from(e.target.files);
    await handleFiles(selectedFiles);
    
    // Reset input
    e.target.value = '';
  }, [disabled]);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Check file count limit
    const currentFileCount = filesWithProgress.filter(f => f.status === 'completed').length;
    const newFileCount = currentFileCount + files.length;
    
    if (newFileCount > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Initialize files with progress
    const newFilesWithProgress: FileWithProgress[] = [];
    
    for (const file of files) {
      const fileWithProgress: FileWithProgress = {
        file,
        progress: 0,
        status: 'uploading',
      };

      // Create preview for images
      if (isImageFile(file.type)) {
        try {
          fileWithProgress.preview = await createImagePreview(file);
        } catch (error) {
          console.warn('Failed to create preview:', error);
        }
      }

      newFilesWithProgress.push(fileWithProgress);
    }

    setFilesWithProgress(prev => [...prev, ...newFilesWithProgress]);
    setIsUploading(true);

    // Upload files
    try {
      if (multiple && files.length > 1) {
        await uploadMultipleFilesWithProgress(files, newFilesWithProgress);
      } else {
        await uploadSingleFileWithProgress(files[0], newFilesWithProgress[0]);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadSingleFileWithProgress = async (file: File, fileWithProgress: FileWithProgress) => {
    try {
      const response = await uploadSingleFile(file, {
        uploadType,
        entityType,
        entityId,
        onProgress: (progress: UploadProgress) => {
          setFilesWithProgress(prev => 
            prev.map(f => 
              f.file === file 
                ? { ...f, progress: progress.percentage }
                : f
            )
          );
        },
      });

      const uploadedFile: UploadedFile = {
        id: response.data.file.id,
        filename: response.data.file.filename,
        original_name: response.data.file.original_name,
        file_path: response.data.file.file_path,
        file_size: response.data.file.file_size,
        mime_type: response.data.file.mime_type,
        preview: fileWithProgress.preview,
      };

      setFilesWithProgress(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, status: 'completed', uploadedFile }
            : f
        )
      );

      onFilesUploaded([uploadedFile]);
    } catch (error) {
      setFilesWithProgress(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : f
        )
      );
    }
  };

  const uploadMultipleFilesWithProgress = async (files: File[], filesWithProgress: FileWithProgress[]) => {
    try {
      const response = await uploadMultipleFiles(files, {
        uploadType,
        entityType,
        entityId,
        onProgress: (progress: UploadProgress) => {
          // For multiple files, we'll show overall progress
          setFilesWithProgress(prev => 
            prev.map(f => 
              files.includes(f.file) 
                ? { ...f, progress: progress.percentage }
                : f
            )
          );
        },
      });

      const uploadedFiles: UploadedFile[] = response.data.uploaded_files.map((file, index) => ({
        id: file.id,
        filename: file.filename,
        original_name: file.original_name,
        file_path: file.file_path,
        file_size: file.file_size,
        mime_type: file.mime_type,
        preview: filesWithProgress[index]?.preview,
      }));

      setFilesWithProgress(prev => 
        prev.map(f => {
          const uploadedFile = uploadedFiles.find(uf => uf.original_name === f.file.name);
          return files.includes(f.file) 
            ? { ...f, status: 'completed', uploadedFile }
            : f;
        })
      );

      onFilesUploaded(uploadedFiles);
    } catch (error) {
      setFilesWithProgress(prev => 
        prev.map(f => 
          files.includes(f.file) 
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : f
        )
      );
    }
  };

  const removeFile = (fileToRemove: FileWithProgress) => {
    setFilesWithProgress(prev => prev.filter(f => f !== fileToRemove));
  };

  const getUploadTypeIcon = () => {
    switch (uploadType) {
      case 'image': return <Image className="h-8 w-8" />;
      case 'video': return <Film className="h-8 w-8" />;
      case 'document': return <FileText className="h-8 w-8" />;
      default: return <Upload className="h-8 w-8" />;
    }
  };

  const getUploadTypeText = () => {
    switch (uploadType) {
      case 'image': return 'images';
      case 'video': return 'videos';
      case 'document': return 'documents';
      default: return 'files';
    }
  };

  return (
    <div className={`file-upload-zone ${className}`}>
      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : disabled
            ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={uploadType === 'image' ? 'image/*' : uploadType === 'video' ? 'video/*' : '*'}
          onChange={handleFileSelect}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className={`space-y-2 ${disabled ? 'opacity-50' : ''}`}>
          <div className="text-gray-400 dark:text-gray-500">
            {getUploadTypeIcon()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {isDragOver ? `Drop ${getUploadTypeText()} here` : `Upload ${getUploadTypeText()}`}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Drag and drop or click to select • Max {formatFileSize(FILE_CONSTRAINTS.maxFileSize)} per file
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {filesWithProgress.length > 0 && (
        <div className="mt-4 space-y-2">
          {filesWithProgress.map((fileWithProgress, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              {/* File Preview/Icon */}
              <div className="flex-shrink-0">
                {fileWithProgress.preview ? (
                  <img
                    src={fileWithProgress.preview}
                    alt={fileWithProgress.file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded text-lg">
                    {getFileIcon(fileWithProgress.file.type)}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {fileWithProgress.file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(fileWithProgress.file.size)}
                </p>
                
                {/* Progress Bar */}
                {fileWithProgress.status === 'uploading' && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${fileWithProgress.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {fileWithProgress.progress}% uploaded
                    </p>
                  </div>
                )}
                
                {/* Error Message */}
                {fileWithProgress.status === 'error' && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {fileWithProgress.error}
                  </p>
                )}
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {fileWithProgress.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
                {fileWithProgress.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                {fileWithProgress.status === 'uploading' && (
                  <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                )}
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeFile(fileWithProgress)}
                disabled={fileWithProgress.status === 'uploading'}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
