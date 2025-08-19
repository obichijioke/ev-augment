import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

// Custom error interface
interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  const error: CustomError = new Error(
    "Missing Supabase environment variables"
  );
  error.statusCode = 500;
  error.code = "CONFIG_ERROR";
  throw error;
}

// Create Supabase client for general operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "X-Client-Info": "ev-community-backend",
      },
    },
  }
);

// Create admin client for service operations
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const error: CustomError = new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY environment variable"
  );
  error.statusCode = 500;
  error.code = "CONFIG_ERROR";
  throw error;
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
  }
);

// Helper function to handle Supabase errors
const handleSupabaseError = (
  error: any,
  operation: string = "Database operation"
): { status: number; message: string } => {
  console.error(`${operation} error:`, error);

  if (error.code === "PGRST116") {
    return {
      status: 404,
      message: "Resource not found",
    };
  }

  if (error.code === "23505") {
    return {
      status: 409,
      message: "Resource already exists",
    };
  }

  if (error.code === "23503") {
    return {
      status: 400,
      message: "Invalid reference - related resource not found",
    };
  }

  if (error.code === "42501") {
    return {
      status: 403,
      message: "Insufficient permissions",
    };
  }

  return {
    status: 500,
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Internal server error",
  };
};

// Helper function to validate UUID
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Helper function to build pagination for Supabase range queries
const buildPagination = (
  page: number = 1,
  limit: number = 20
): { from: number; to: number; page: number; limit: number } => {
  const pageNum = Math.max(1, typeof page === "string" ? parseInt(page) : page);
  const limitNum = Math.min(
    parseInt(process.env.MAX_PAGE_SIZE || "100"),
    Math.max(1, typeof limit === "string" ? parseInt(limit) : limit)
  );
  const offset = (pageNum - 1) * limitNum;

  return {
    from: offset,
    to: offset + limitNum - 1,
    page: pageNum,
    limit: limitNum,
  };
};

// Helper function to build full pagination metadata for API responses
const buildPaginationMetadata = (
  page: number = 1,
  limit: number = 20,
  total: number = 0
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} => {
  const pageNum = Math.max(1, typeof page === "string" ? parseInt(page) : page);
  const limitNum = Math.min(
    parseInt(process.env.MAX_PAGE_SIZE || "100"),
    Math.max(1, typeof limit === "string" ? parseInt(limit) : limit)
  );
  const totalPages = Math.ceil(total / limitNum);

  return {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages,
    hasNext: pageNum < totalPages,
    hasPrev: pageNum > 1,
  };
};

// Helper function to build search filters
const buildSearchFilter = (
  query: string,
  searchFields: string[] = []
): string | null => {
  if (!query || !searchFields.length) return null;

  return searchFields.map((field) => `${field}.ilike.%${query}%`).join(",");
};

// Helper function to get user from token
const getUserFromToken = async (
  token: string
): Promise<{ user?: User; error?: string }> => {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Verifying token with Supabase");
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    console.log("📊 Supabase response - User:", user ? "Found" : "Not found");
    console.log("📊 Supabase response - Error:", error);

    if (error || !user) {
      console.log(
        "❌ Token verification failed:",
        error?.message || "No user found"
      );
      return { error: "Invalid token" };
    }

    console.log("✅ Token verification successful for user:", user.id);
    return { user };
  } catch (error) {
    console.log("💥 Exception in getUserFromToken:", error);
    return { error: "Token verification failed" };
  }
};

// Helper function to upload file to Supabase Storage
const uploadFile = async (
  bucket: string,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ path: string; publicUrl: string; fullPath: string }> => {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);

    return {
      path: data.path,
      publicUrl,
      fullPath: data.fullPath,
    };
  } catch (error: any) {
    const uploadError: CustomError = new Error(
      `File upload failed: ${error.message}`
    );
    uploadError.statusCode = 500;
    throw uploadError;
  }
};

// Helper function to delete file from Supabase Storage
const deleteFile = async (
  bucket: string,
  fileName: string
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error: any) {
    const deleteError: CustomError = new Error(
      `File deletion failed: ${error.message}`
    );
    deleteError.statusCode = 500;
    throw deleteError;
  }
};

export {
  supabase,
  supabaseAdmin,
  handleSupabaseError,
  isValidUUID,
  buildPagination,
  buildPaginationMetadata,
  buildSearchFilter,
  getUserFromToken,
  uploadFile,
  deleteFile,
};

export default supabase;
