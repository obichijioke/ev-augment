import express, { Router, Request, Response } from "express";
import multer from "multer";
import {
  supabaseAdmin,
  uploadFile,
  deleteFile,
} from "../services/supabaseClient";
import { validate, uploadSchemas } from "../middleware/validation";
import {
  asyncHandler,
  validationError,
  forbiddenError,
  notFoundError,
} from "../middleware/errorHandler";
import { authenticateToken } from "../middleware/auth";
import { AuthenticatedRequest } from "../types";
import { toString, toNumber } from "../utils/typeUtils";
import { ApiResponse } from "../types/database";
import path from "path";
import crypto from "crypto";

const router: Router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedMimes = {
    image: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    video: ["video/mp4", "video/webm", "video/ogg"],
  };

  const uploadType = req.body.upload_type || req.query.upload_type || "image";
  const allowedTypes = allowedMimes[uploadType] || allowedMimes.image;

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types for ${uploadType}: ${allowedTypes.join(", ")}`
      ),
      false
    );
  }
};

// Configure multer with size limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files per request
  },
});

// Helper function to generate unique filename
const generateFileName = (originalName, userId, uploadType) => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString("hex");
  return `${uploadType}/${userId}/${timestamp}-${random}${ext}`;
};

// Helper function to validate file ownership
const validateFileOwnership = async (
  filePath,
  userId,
  entityType,
  entityId
) => {
  // Check if user owns the entity they're uploading for
  let ownershipQuery;
  let ownerField;

  switch (entityType) {
    case "vehicle":
      ownershipQuery = supabaseAdmin
        .from("vehicles")
        .select("owner_id")
        .eq("id", entityId);
      ownerField = "owner_id";
      break;
    case "marketplace_listing":
      ownershipQuery = supabaseAdmin
        .from("marketplace_listings")
        .select("seller_id")
        .eq("id", entityId);
      ownerField = "seller_id";
      break;
    case "wanted_ad":
      ownershipQuery = supabaseAdmin
        .from("wanted_ads")
        .select("user_id")
        .eq("id", entityId);
      ownerField = "user_id";
      break;
    case "directory_listing":
      ownershipQuery = supabaseAdmin
        .from("directory_listings")
        .select("owner_id")
        .eq("id", entityId);
      ownerField = "owner_id";
      break;
    case "user_avatar":
      return entityId === userId; // User can only upload their own avatar
    default:
      return false;
  }

  if (ownershipQuery) {
    const { data, error } = await ownershipQuery.single();
    if (error || !data) return false;
    return data[ownerField] === userId;
  }

  return false;
};

// @route   POST /api/upload/single
// @desc    Upload a single file
// @access  Private
router.post(
  "/single",
  authenticateToken,
  upload.single("file"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw validationError("No file provided");
    }

    const {
      upload_type = "image",
      entity_type,
      entity_id,
      alt_text,
      caption,
    } = req.body;

    // Validate upload type
    const validUploadTypes = ["image", "document", "video"];
    if (!validUploadTypes.includes(upload_type)) {
      throw validationError("Invalid upload type");
    }

    // Validate entity ownership if entity_type and entity_id are provided
    if (entity_type && entity_id) {
      const hasOwnership = await validateFileOwnership(
        req.file.originalname,
        req.user.id,
        entity_type,
        entity_id
      );
      if (!hasOwnership) {
        throw forbiddenError(
          "You do not have permission to upload files for this entity"
        );
      }
    }

    try {
      // Generate unique filename
      const fileName = generateFileName(
        req.file.originalname,
        req.user.id,
        upload_type
      );

      // Upload to Supabase Storage
      const uploadResult = await uploadFile(
        "uploads", // bucket name
        fileName,
        req.file.buffer,
        req.file.mimetype
      );

      if (!uploadResult) {
        throw new Error("Upload failed");
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from("uploads")
        .getPublicUrl(fileName);

      // Save file record to database
      const fileRecord = {
        id: crypto.randomUUID(),
        user_id: req.user.id,
        filename: fileName,
        original_name: req.file.originalname,
        file_path: urlData.publicUrl,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        upload_type,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
        alt_text: alt_text || null,
        caption: caption || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: savedFile, error: dbError } = await supabaseAdmin
        .from("file_uploads")
        .insert(fileRecord)
        .select("*")
        .single();

      if (dbError) {
        // If database save fails, clean up the uploaded file
        await deleteFile("uploads", fileName);
        throw new Error(`Failed to save file record: ${dbError.message}`);
      }

      res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          file: savedFile,
        },
      });
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  })
);

// @route   POST /api/upload/multiple
// @desc    Upload multiple files
// @access  Private
router.post(
  "/multiple",
  authenticateToken,
  upload.array("files", 5),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.files || req.files.length === 0) {
      throw validationError("No files provided");
    }

    const { upload_type = "image", entity_type, entity_id } = req.body;

    // Validate upload type
    const validUploadTypes = ["image", "document", "video"];
    if (!validUploadTypes.includes(upload_type)) {
      throw validationError("Invalid upload type");
    }

    // Validate entity ownership if entity_type and entity_id are provided
    if (entity_type && entity_id) {
      const hasOwnership = await validateFileOwnership(
        "",
        req.user.id,
        entity_type,
        entity_id
      );
      if (!hasOwnership) {
        throw forbiddenError(
          "You do not have permission to upload files for this entity"
        );
      }
    }

    const uploadedFiles = [];
    const failedUploads = [];

    const files = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat();
    for (const file of files) {
      try {
        // Generate unique filename
        const fileName = generateFileName(
          file.originalname,
          req.user.id,
          upload_type
        );

        // Upload to Supabase Storage
        const uploadResult = await uploadFile(
          "uploads",
          fileName,
          file.buffer,
          file.mimetype
        );

        if (!uploadResult) {
          failedUploads.push({
            filename: file.originalname,
            error: "Upload failed",
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from("uploads")
          .getPublicUrl(fileName);

        // Save file record to database
        const fileRecord = {
          id: crypto.randomUUID(),
          user_id: req.user.id,
          filename: fileName,
          original_name: file.originalname,
          file_path: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.mimetype,
          upload_type,
          entity_type: entity_type || null,
          entity_id: entity_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: savedFile, error: dbError } = await supabaseAdmin
          .from("file_uploads")
          .insert(fileRecord)
          .select("*")
          .single();

        if (dbError) {
          // If database save fails, clean up the uploaded file
          await deleteFile("uploads", fileName);
          failedUploads.push({
            filename: file.originalname,
            error: `Database save failed: ${dbError.message}`,
          });
          continue;
        }

        uploadedFiles.push(savedFile);
      } catch (error) {
        failedUploads.push({
          filename: file.originalname,
          error: error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully${failedUploads.length > 0 ? `, ${failedUploads.length} failed` : ""}`,
      data: {
        uploaded_files: uploadedFiles,
        failed_uploads: failedUploads,
        total_uploaded: uploadedFiles.length,
        total_failed: failedUploads.length,
      },
    });
  })
);

// @route   GET /api/upload/files
// @desc    Get user's uploaded files
// @access  Private
router.get(
  "/files",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = 1,
      limit = 20,
      upload_type,
      entity_type,
      entity_id,
    } = req.query;

    const pageNum = toNumber(page, 1);
    const limitNum = toNumber(limit, 20);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabaseAdmin
      .from("file_uploads")
      .select("*", { count: "exact" })
      .eq("user_id", req.user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (upload_type) {
      query = query.eq("upload_type", upload_type);
    }
    if (entity_type) {
      query = query.eq("entity_type", entity_type);
    }
    if (entity_id) {
      query = query.eq("entity_id", entity_id);
    }

    const { data: files, error, count } = await query;

    if (error) {
      throw new Error("Failed to fetch files");
    }

    res.json({
      success: true,
      data: {
        files,
        pagination: {
          page: toNumber(page, 1),
          limit: toNumber(limit, 20),
          total: count,
          pages: Math.ceil(count / toNumber(limit, 20)),
        },
      },
    });
  })
);

// @route   GET /api/upload/files/:id
// @desc    Get file details by ID
// @access  Private (Owner only)
router.get(
  "/files/:id",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const { data: file, error } = await supabaseAdmin
      .from("file_uploads")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) {
      throw notFoundError("File");
    }

    // Check ownership
    if (file.user_id !== req.user.id) {
      throw forbiddenError("You can only access your own files");
    }

    res.json({
      success: true,
      data: {
        file,
      },
    });
  })
);

// @route   PUT /api/upload/files/:id
// @desc    Update file metadata
// @access  Private (Owner only)
router.put(
  "/files/:id",
  authenticateToken,
  validate(uploadSchemas.updateFile),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { alt_text, caption } = req.body;

    // Check if file exists and user owns it
    const { data: existingFile, error: checkError } = await supabaseAdmin
      .from("file_uploads")
      .select("user_id")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (checkError) {
      throw notFoundError("File");
    }

    if (existingFile.user_id !== req.user.id) {
      throw forbiddenError("You can only update your own files");
    }

    const { data: updatedFile, error } = await supabaseAdmin
      .from("file_uploads")
      .update({
        alt_text,
        caption,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error("Failed to update file");
    }

    res.json({
      success: true,
      message: "File updated successfully",
      data: {
        file: updatedFile,
      },
    });
  })
);

// @route   DELETE /api/upload/files/:id
// @desc    Delete file
// @access  Private (Owner only)
router.delete(
  "/files/:id",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check if file exists and user owns it
    const { data: file, error: checkError } = await supabaseAdmin
      .from("file_uploads")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (checkError) {
      throw notFoundError("File");
    }

    if (file.user_id !== req.user.id) {
      throw forbiddenError("You can only delete your own files");
    }

    try {
      // Delete from Supabase Storage
      const deleteResult = await deleteFile("uploads", file.filename);

      if (!deleteResult) {
        console.error("Failed to delete file from storage");
        // Continue with database deletion even if storage deletion fails
      }

      // Soft delete from database
      const { error: dbError } = await supabaseAdmin
        .from("file_uploads")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (dbError) {
        throw new Error("Failed to delete file record");
      }

      res.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  })
);

// @route   POST /api/upload/avatar
// @desc    Upload user avatar
// @access  Private
router.post(
  "/avatar",
  authenticateToken,
  upload.single("avatar"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw validationError("No avatar file provided");
    }

    // Validate file type (only images allowed for avatars)
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedMimes.includes(req.file.mimetype)) {
      throw validationError("Avatar must be a JPEG, PNG, or WebP image");
    }

    // Size limit for avatars (2MB)
    if (req.file.size > 2 * 1024 * 1024) {
      throw validationError("Avatar file size must be less than 2MB");
    }

    try {
      // Generate unique filename for avatar
      const fileName = generateFileName(
        req.file.originalname,
        req.user.id,
        "avatar"
      );

      // Upload to Supabase Storage
      const uploadResult = await uploadFile(
        "avatars", // separate bucket for avatars
        fileName,
        req.file.buffer,
        req.file.mimetype
      );

      if (!uploadResult) {
        throw new Error("Avatar upload failed");
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update user's avatar URL in the users table
      const { data: updatedUser, error: userUpdateError } = await supabaseAdmin
        .from("users")
        .update({
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.user.id)
        .select("id, username, full_name, avatar_url")
        .single();

      if (userUpdateError) {
        // If user update fails, clean up the uploaded file
        await deleteFile("avatars", fileName);
        throw new Error(
          `Failed to update user avatar: ${userUpdateError.message}`
        );
      }

      // Delete old avatar if it exists
      const userWithAvatar = req.user as any;
      if (
        userWithAvatar.avatar_url &&
        userWithAvatar.avatar_url.includes("avatars/")
      ) {
        const oldFileName = userWithAvatar.avatar_url.split("/").pop();
        if (oldFileName && oldFileName !== fileName) {
          await deleteFile("avatars", `avatar/${req.user.id}/${oldFileName}`);
        }
      }

      res.json({
        success: true,
        message: "Avatar updated successfully",
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      throw new Error(`Avatar upload failed: ${error.message}`);
    }
  })
);

// @route   DELETE /api/upload/avatar
// @desc    Remove user avatar
// @access  Private
router.delete(
  "/avatar",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Delete current avatar from storage if it exists
      const userWithAvatar = req.user as any;
      if (
        userWithAvatar.avatar_url &&
        userWithAvatar.avatar_url.includes("avatars/")
      ) {
        const fileName = userWithAvatar.avatar_url.split("/").pop();
        if (fileName) {
          await deleteFile("avatars", `avatar/${req.user.id}/${fileName}`);
        }
      }

      // Remove avatar URL from user record
      const { data: updatedUser, error: userUpdateError } = await supabaseAdmin
        .from("users")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.user.id)
        .select("id, username, full_name, avatar_url")
        .single();

      if (userUpdateError) {
        throw new Error(`Failed to remove avatar: ${userUpdateError.message}`);
      }

      res.json({
        success: true,
        message: "Avatar removed successfully",
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      throw new Error(`Failed to remove avatar: ${error.message}`);
    }
  })
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Maximum is 5 files per request.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field.",
      });
    }
  }

  if (error.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
});

export default router;
