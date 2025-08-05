import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { supabase, supabaseAdmin } from "../services/supabaseClient";
import { authenticateToken } from "../middleware/auth";
import { validate, forumSchemas } from "../middleware/validation";
import { AuthenticatedRequest } from "../types";
import { createError, validationError } from "../middleware/errorHandler";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
        )
      );
    }
  },
});

// =====================================================
// IMAGE UPLOAD ENDPOINTS
// =====================================================

// POST /api/forum/images/upload - Upload image for thread or reply
router.post(
  "/upload",
  authenticateToken,
  upload.single("image"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) {
        return next(validationError("No image file provided"));
      }

      const { thread_id, reply_id, alt_text } = req.body;

      // Validate that exactly one of thread_id or reply_id is provided
      if (thread_id && reply_id) {
        return next(
          validationError("Cannot provide both thread_id and reply_id")
        );
      }

      if (!thread_id && !reply_id) {
        return next(
          validationError("Must provide either thread_id or reply_id")
        );
      }

      // If thread_id is provided, verify thread exists and user has access
      if (thread_id) {
        const { data: thread, error: threadError } = await supabaseAdmin
          .from("forum_threads")
          .select("id, is_locked")
          .eq("id", thread_id)
          .eq("is_deleted", false)
          .single();

        if (threadError || !thread) {
          return next(createError("Thread not found", 404));
        }

        if (thread.is_locked) {
          return next(
            createError("Cannot upload images to locked thread", 403)
          );
        }
      }

      // If reply_id is provided, verify reply exists and user has access
      if (reply_id) {
        const { data: reply, error: replyError } = await supabaseAdmin
          .from("forum_replies")
          .select("id, thread_id")
          .eq("id", reply_id)
          .eq("is_deleted", false)
          .single();

        if (replyError || !reply) {
          return next(createError("Reply not found", 404));
        }

        // Check if the thread is locked
        const { data: thread, error: threadError } = await supabaseAdmin
          .from("forum_threads")
          .select("is_locked")
          .eq("id", reply.thread_id)
          .single();

        if (threadError || !thread) {
          return next(createError("Associated thread not found", 404));
        }

        if (thread.is_locked) {
          return next(
            createError("Cannot upload images to replies in locked thread", 403)
          );
        }
      }

      // Generate unique filename
      const fileExtension = req.file.originalname.split(".").pop();
      const filename = `${uuidv4()}.${fileExtension}`;
      const storagePath = `forum-images/${filename}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } =
        await supabaseAdmin.storage
          .from("forum-images")
          .upload(storagePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false,
          });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return next(createError("Failed to upload image", 500));
      }

      // Get image dimensions (basic implementation)
      let width: number | undefined;
      let height: number | undefined;

      // For a more robust solution, you could use a library like 'sharp' to get dimensions
      // For now, we'll leave them undefined and let the frontend handle it

      // Save image metadata to database
      const imageData = {
        thread_id: thread_id || null,
        reply_id: reply_id || null,
        author_id: req.user!.id,
        filename,
        original_filename: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        storage_path: storagePath,
        alt_text: alt_text || null,
        width,
        height,
      };

      // Debug log to check the data being inserted
      console.log("Image data being inserted:", imageData);

      const { data: image, error: dbError } = await supabaseAdmin
        .from("forum_images")
        .insert([imageData])
        .select()
        .single();

      if (dbError) {
        // If database insert fails, clean up the uploaded file
        await supabaseAdmin.storage.from("forum-images").remove([storagePath]);

        console.error("Database insert error:", dbError);
        return next(createError("Failed to save image metadata", 500));
      }

      // Get public URL for the image
      const { data: urlData } = supabase.storage
        .from("forum-images")
        .getPublicUrl(storagePath);

      res.status(201).json({
        success: true,
        data: {
          ...image,
          public_url: urlData.publicUrl,
        },
        message: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Image upload error:", error);
      next(createError("Internal server error", 500));
    }
  }
);

// GET /api/forum/images/:id - Get image details
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: image, error } = await supabaseAdmin
      .from("forum_images")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !image) {
      return next(createError("Image not found", 404));
    }

    // Get public URL for the image
    const { data: urlData } = supabase.storage
      .from("forum-images")
      .getPublicUrl(image.storage_path);

    res.json({
      success: true,
      data: {
        ...image,
        public_url: urlData.publicUrl,
      },
      message: "Image retrieved successfully",
    });
  } catch (error) {
    next(createError("Internal server error", 500));
  }
});

// DELETE /api/forum/images/:id - Delete image (Author only)
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;

      // Get image details and verify ownership
      const { data: image, error: fetchError } = await supabaseAdmin
        .from("forum_images")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !image) {
        return next(createError("Image not found", 404));
      }

      // Check if user is the author or admin/moderator
      const { data: userProfile } = await supabaseAdmin
        .from("user_profiles")
        .select("role, forum_role")
        .eq("id", req.user!.id)
        .single();

      const isAuthor = image.author_id === req.user!.id;
      const isAdmin =
        userProfile &&
        (["admin", "moderator"].includes(userProfile.role) ||
          ["admin", "moderator"].includes(userProfile.forum_role));

      if (!isAuthor && !isAdmin) {
        return next(createError("Insufficient permissions", 403));
      }

      // Delete from storage
      const { error: storageError } = await supabaseAdmin.storage
        .from("forum-images")
        .remove([image.storage_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      const { error: dbError } = await supabaseAdmin
        .from("forum_images")
        .delete()
        .eq("id", id);

      if (dbError) {
        console.error("Database delete error:", dbError);
        return next(createError("Failed to delete image", 500));
      }

      res.json({
        success: true,
        message: "Image deleted successfully",
      });
    } catch (error) {
      next(createError("Internal server error", 500));
    }
  }
);

// GET /api/forum/images/thread/:threadId - Get all images for a thread
router.get("/thread/:threadId", async (req, res, next) => {
  try {
    const { threadId } = req.params;

    const { data: images, error } = await supabaseAdmin
      .from("forum_images")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) {
      return next(createError("Failed to fetch thread images", 500));
    }

    // Add public URLs to images
    const imagesWithUrls = images.map((image) => {
      const { data: urlData } = supabase.storage
        .from("forum-images")
        .getPublicUrl(image.storage_path);

      return {
        ...image,
        public_url: urlData.publicUrl,
      };
    });

    res.json({
      success: true,
      data: imagesWithUrls,
      message: "Thread images retrieved successfully",
    });
  } catch (error) {
    next(createError("Internal server error", 500));
  }
});

// GET /api/forum/images/reply/:replyId - Get all images for a reply
router.get("/reply/:replyId", async (req, res, next) => {
  try {
    const { replyId } = req.params;

    const { data: images, error } = await supabaseAdmin
      .from("forum_images")
      .select("*")
      .eq("reply_id", replyId)
      .order("created_at", { ascending: true });

    if (error) {
      return next(createError("Failed to fetch reply images", 500));
    }

    // Add public URLs to images
    const imagesWithUrls = images.map((image) => {
      const { data: urlData } = supabase.storage
        .from("forum-images")
        .getPublicUrl(image.storage_path);

      return {
        ...image,
        public_url: urlData.publicUrl,
      };
    });

    res.json({
      success: true,
      data: imagesWithUrls,
      message: "Reply images retrieved successfully",
    });
  } catch (error) {
    next(createError("Internal server error", 500));
  }
});

export default router;
