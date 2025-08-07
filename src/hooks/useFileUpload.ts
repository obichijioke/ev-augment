// =============================================================================
// File Upload Hook
// =============================================================================

import { useState, useCallback } from "react";
import {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
  UploadType,
  EntityType,
  UploadProgress,
  UploadResponse,
  MultipleUploadResponse,
} from "@/services/fileUploadApi";
import { ForumAttachment } from "@/types/forum";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface UseFileUploadOptions {
  uploadType?: UploadType;
  entityType?: EntityType;
  entityId?: string;
  maxFiles?: number;
  onUploadComplete?: (files: UploadedFileData[]) => void;
  onUploadError?: (error: string) => void;
}

interface UploadedFileData {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  upload_type: string;
  alt_text?: string;
  caption?: string;
}

interface FileUploadState {
  files: UploadedFileData[];
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

interface UseFileUploadReturn {
  // State
  files: UploadedFileData[];
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;

  // Actions
  uploadFiles: (
    files: File[],
    options?: { altText?: string; caption?: string }
  ) => Promise<void>;
  uploadSingle: (
    file: File,
    options?: { altText?: string; caption?: string }
  ) => Promise<void>;
  removeFile: (fileId: string) => Promise<void>;
  clearFiles: () => void;
  clearError: () => void;

  // Utilities
  getFileById: (fileId: string) => UploadedFileData | undefined;
  getTotalSize: () => number;
  getFileCount: () => number;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useFileUpload(
  options: UseFileUploadOptions = {}
): UseFileUploadReturn {
  const {
    uploadType = "image",
    entityType,
    entityId,
    maxFiles = 5,
    onUploadComplete,
    onUploadError,
  } = options;

  const [state, setState] = useState<FileUploadState>({
    files: [],
    isUploading: false,
    uploadProgress: 0,
    error: null,
  });

  // Upload multiple files
  const uploadFiles = useCallback(
    async (
      files: File[],
      uploadOptions: { altText?: string; caption?: string } = {}
    ) => {
      if (files.length === 0) return;

      // Check file count limit
      if (state.files.length + files.length > maxFiles) {
        const error = `Maximum ${maxFiles} files allowed`;
        setState((prev) => ({ ...prev, error }));
        onUploadError?.(error);
        return;
      }

      setState((prev) => ({
        ...prev,
        isUploading: true,
        error: null,
        uploadProgress: 0,
      }));

      try {
        const response: MultipleUploadResponse = await uploadMultipleFiles(
          files,
          {
            uploadType,
            entityType,
            entityId,
            onProgress: (progress: UploadProgress) => {
              setState((prev) => ({
                ...prev,
                uploadProgress: progress.percentage,
              }));
            },
          }
        );

        const uploadedFiles: UploadedFileData[] =
          response.data.uploaded_files.map((file) => ({
            id: file.id,
            filename: file.filename,
            original_name: file.original_name,
            file_path: file.file_path,
            file_size: file.file_size,
            mime_type: file.mime_type,
            upload_type: file.upload_type,
            alt_text: uploadOptions.altText || file.alt_text,
            caption: uploadOptions.caption || file.caption,
          }));

        setState((prev) => ({
          ...prev,
          files: [...prev.files, ...uploadedFiles],
          isUploading: false,
          uploadProgress: 100,
        }));

        onUploadComplete?.(uploadedFiles);

        // Handle failed uploads
        if (response.data.failed_uploads.length > 0) {
          const failedFiles = response.data.failed_uploads
            .map((f) => f.filename)
            .join(", ");
          const error = `Some files failed to upload: ${failedFiles}`;
          setState((prev) => ({ ...prev, error }));
          onUploadError?.(error);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        setState((prev) => ({
          ...prev,
          isUploading: false,
          uploadProgress: 0,
          error: errorMessage,
        }));
        onUploadError?.(errorMessage);
      }
    },
    [
      state.files.length,
      maxFiles,
      uploadType,
      entityType,
      entityId,
      onUploadComplete,
      onUploadError,
    ]
  );

  // Upload single file
  const uploadSingle = useCallback(
    async (
      file: File,
      uploadOptions: { altText?: string; caption?: string } = {}
    ) => {
      // Check file count limit
      if (state.files.length >= maxFiles) {
        const error = `Maximum ${maxFiles} files allowed`;
        setState((prev) => ({ ...prev, error }));
        onUploadError?.(error);
        return;
      }

      setState((prev) => ({
        ...prev,
        isUploading: true,
        error: null,
        uploadProgress: 0,
      }));

      try {
        const response: UploadResponse = await uploadSingleFile(file, {
          uploadType,
          entityType,
          entityId,
          altText: uploadOptions.altText,
          caption: uploadOptions.caption,
          onProgress: (progress: UploadProgress) => {
            setState((prev) => ({
              ...prev,
              uploadProgress: progress.percentage,
            }));
          },
        });

        const uploadedFile: UploadedFileData = {
          id: response.data.file.id,
          filename: response.data.file.filename,
          original_name: response.data.file.original_name,
          file_path: response.data.file.file_path,
          file_size: response.data.file.file_size,
          mime_type: response.data.file.mime_type,
          upload_type: response.data.file.upload_type,
          alt_text: response.data.file.alt_text,
          caption: response.data.file.caption,
        };

        setState((prev) => ({
          ...prev,
          files: [...prev.files, uploadedFile],
          isUploading: false,
          uploadProgress: 100,
        }));

        if (onUploadComplete) {
          onUploadComplete([uploadedFile]);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        setState((prev) => ({
          ...prev,
          isUploading: false,
          uploadProgress: 0,
          error: errorMessage,
        }));
        onUploadError?.(errorMessage);
      }
    },
    [
      state.files.length,
      maxFiles,
      uploadType,
      entityType,
      entityId,
      onUploadComplete,
      onUploadError,
    ]
  );

  // Remove file
  const removeFile = useCallback(
    async (fileId: string) => {
      try {
        await deleteFile(fileId);
        setState((prev) => ({
          ...prev,
          files: prev.files.filter((file) => file.id !== fileId),
          error: null,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to remove file";
        setState((prev) => ({ ...prev, error: errorMessage }));
        onUploadError?.(errorMessage);
      }
    },
    [onUploadError]
  );

  // Clear all files
  const clearFiles = useCallback(() => {
    setState((prev) => ({
      ...prev,
      files: [],
      error: null,
      uploadProgress: 0,
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Get file by ID
  const getFileById = useCallback(
    (fileId: string): UploadedFileData | undefined => {
      return state.files.find((file) => file.id === fileId);
    },
    [state.files]
  );

  // Get total size of all files
  const getTotalSize = useCallback((): number => {
    return state.files.reduce((total, file) => total + file.file_size, 0);
  }, [state.files]);

  // Get file count
  const getFileCount = useCallback((): number => {
    return state.files.length;
  }, [state.files.length]);

  return {
    // State
    files: state.files,
    isUploading: state.isUploading,
    uploadProgress: state.uploadProgress,
    error: state.error,

    // Actions
    uploadFiles,
    uploadSingle,
    removeFile,
    clearFiles,
    clearError,

    // Utilities
    getFileById,
    getTotalSize,
    getFileCount,
  };
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

// Hook for forum post attachments
export function useForumPostUpload(postId?: string) {
  return useFileUpload({
    uploadType: "image",
    entityType: "forum_post",
    entityId: postId,
    maxFiles: 5,
  });
}

// Hook for forum reply attachments
export function useForumReplyUpload(replyId?: string) {
  return useFileUpload({
    uploadType: "image",
    entityType: "forum_reply",
    entityId: replyId,
    maxFiles: 3,
  });
}

// Hook for avatar uploads
export function useAvatarUpload() {
  return useFileUpload({
    uploadType: "image",
    entityType: "user_profile",
    maxFiles: 1,
  });
}

// Hook for document uploads
export function useDocumentUpload(entityType: EntityType, entityId?: string) {
  return useFileUpload({
    uploadType: "document",
    entityType,
    entityId,
    maxFiles: 10,
  });
}

// Hook for blog post featured images
export function useBlogImageUpload(postId?: string) {
  return useFileUpload({
    uploadType: "image",
    entityType: "blog_post",
    entityId: postId,
    maxFiles: 1,
  });
}
