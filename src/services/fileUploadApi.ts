// =============================================================================
// File Upload API Service
// =============================================================================

// Base API configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    file: {
      id: string;
      filename: string;
      original_name: string;
      file_path: string;
      file_size: number;
      mime_type: string;
      upload_type: string;
      entity_type?: string;
      entity_id?: string;
      alt_text?: string;
      caption?: string;
      created_at: string;
    };
  };
}

export interface MultipleUploadResponse {
  success: boolean;
  message: string;
  data: {
    uploaded_files: UploadResponse["data"]["file"][];
    failed_uploads: Array<{
      filename: string;
      error: string;
    }>;
  };
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type UploadType = "image" | "document" | "video";
export type EntityType =
  | "forum_post"
  | "forum_reply"
  | "user_profile"
  | "blog_post";

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

export const FILE_CONSTRAINTS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  allowedImageTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
  allowedDocumentTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  allowedVideoTypes: ["video/mp4", "video/webm", "video/ogg"],
};

export function validateFile(
  file: File,
  uploadType: UploadType
): FileValidationResult {
  // Check file size
  if (file.size > FILE_CONSTRAINTS.maxFileSize) {
    return {
      isValid: false,
      error: `File size must be less than ${
        FILE_CONSTRAINTS.maxFileSize / (1024 * 1024)
      }MB`,
    };
  }

  // Check file type based on upload type
  let allowedTypes: string[] = [];
  switch (uploadType) {
    case "image":
      allowedTypes = FILE_CONSTRAINTS.allowedImageTypes;
      break;
    case "document":
      allowedTypes = FILE_CONSTRAINTS.allowedDocumentTypes;
      break;
    case "video":
      allowedTypes = FILE_CONSTRAINTS.allowedVideoTypes;
      break;
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed for ${uploadType} uploads`,
    };
  }

  return { isValid: true };
}

export function validateFiles(
  files: File[],
  uploadType: UploadType
): FileValidationResult {
  if (files.length > FILE_CONSTRAINTS.maxFiles) {
    return {
      isValid: false,
      error: `Maximum ${FILE_CONSTRAINTS.maxFiles} files allowed`,
    };
  }

  for (const file of files) {
    const validation = validateFile(file, uploadType);
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Get authentication token from localStorage
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (!authStorage) return null;

    const authData = JSON.parse(authStorage);
    return authData?.state?.session?.accessToken || null;
  } catch (error) {
    console.error("Error parsing auth token:", error);
    return null;
  }
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function makeUploadRequest(
  endpoint: string,
  formData: FormData,
  onProgress?: (progress: UploadProgress) => void
): Promise<Response> {
  const token = getAuthToken();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Handle progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          };
          onProgress(progress);
        }
      });
    }

    // Handle completion
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(
          new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
          })
        );
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    // Handle errors
    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed: Network error"));
    });

    // Handle abort
    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"));
    });

    // Open and send request
    xhr.open("POST", `${API_BASE_URL}/upload/${endpoint}`);
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    xhr.send(formData);
  });
}

export async function uploadSingleFile(
  file: File,
  options: {
    uploadType?: UploadType;
    entityType?: EntityType;
    entityId?: string;
    altText?: string;
    caption?: string;
    onProgress?: (progress: UploadProgress) => void;
  } = {}
): Promise<UploadResponse> {
  const {
    uploadType = "image",
    entityType,
    entityId,
    altText,
    caption,
    onProgress,
  } = options;

  // Validate file
  const validation = validateFile(file, uploadType);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Create form data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_type", uploadType);

  if (entityType) formData.append("entity_type", entityType);
  if (entityId) formData.append("entity_id", entityId);
  if (altText) formData.append("alt_text", altText);
  if (caption) formData.append("caption", caption);

  try {
    const response = await makeUploadRequest("single", formData, onProgress);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Upload failed");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      `Upload failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function uploadMultipleFiles(
  files: File[],
  options: {
    uploadType?: UploadType;
    entityType?: EntityType;
    entityId?: string;
    onProgress?: (progress: UploadProgress) => void;
  } = {}
): Promise<MultipleUploadResponse> {
  const { uploadType = "image", entityType, entityId, onProgress } = options;

  // Validate files
  const validation = validateFiles(files, uploadType);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Create form data
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });
  formData.append("upload_type", uploadType);

  if (entityType) formData.append("entity_type", entityType);
  if (entityId) formData.append("entity_id", entityId);

  try {
    const response = await makeUploadRequest("multiple", formData, onProgress);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Upload failed");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      `Upload failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function uploadAvatar(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> {
  // Validate avatar file
  if (!FILE_CONSTRAINTS.allowedImageTypes.includes(file.type)) {
    throw new Error("Avatar must be a JPEG, PNG, or WebP image");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Avatar file size must be less than 2MB");
  }

  // Create form data
  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const response = await makeUploadRequest("avatar", formData, onProgress);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Avatar upload failed");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      `Avatar upload failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function deleteFile(
  fileId: string
): Promise<{ success: boolean; message: string }> {
  const token = getAuthToken();

  try {
    const response = await fetch(`${API_BASE_URL}/upload/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Delete failed");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      `Delete failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎥";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return "📊";
  if (mimeType.includes("text")) return "📄";
  return "📎";
}

export function isImageFile(mimeType: string): boolean {
  return FILE_CONSTRAINTS.allowedImageTypes.includes(mimeType);
}

export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file.type)) {
      reject(new Error("File is not an image"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
}
