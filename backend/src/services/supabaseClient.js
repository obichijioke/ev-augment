const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  const error = new Error('Missing Supabase environment variables');
  error.statusCode = 500;
  error.code = 'CONFIG_ERROR';
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
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'ev-community-backend'
      }
    }
  }
);

// Create admin client for service operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Helper function to handle Supabase errors
const handleSupabaseError = (error, operation = 'Database operation') => {
  console.error(`${operation} error:`, error);
  
  if (error.code === 'PGRST116') {
    return {
      status: 404,
      message: 'Resource not found'
    };
  }
  
  if (error.code === '23505') {
    return {
      status: 409,
      message: 'Resource already exists'
    };
  }
  
  if (error.code === '23503') {
    return {
      status: 400,
      message: 'Invalid reference - related resource not found'
    };
  }
  
  if (error.code === '42501') {
    return {
      status: 403,
      message: 'Insufficient permissions'
    };
  }
  
  return {
    status: 500,
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  };
};

// Helper function to validate UUID
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Helper function to build pagination
const buildPagination = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(parseInt(process.env.MAX_PAGE_SIZE) || 100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;
  
  return {
    from: offset,
    to: offset + limitNum - 1,
    page: pageNum,
    limit: limitNum
  };
};

// Helper function to build search filters
const buildSearchFilter = (query, searchFields = []) => {
  if (!query || !searchFields.length) return null;
  
  return searchFields.map(field => `${field}.ilike.%${query}%`).join(',');
};

// Helper function to get user from token
const getUserFromToken = async (token) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { error: 'Invalid token' };
    }
    
    return { user };
  } catch (error) {
    return { error: 'Token verification failed' };
  }
};

// Helper function to upload file to Supabase Storage
const uploadFile = async (bucket, fileName, fileBuffer, contentType) => {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return {
      path: data.path,
      publicUrl,
      fullPath: data.fullPath
    };
  } catch (error) {
    const uploadError = new Error(`File upload failed: ${error.message}`);
    uploadError.statusCode = 500;
    throw uploadError;
  }
};

// Helper function to delete file from Supabase Storage
const deleteFile = async (bucket, fileName) => {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([fileName]);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    const deleteError = new Error(`File deletion failed: ${error.message}`);
    deleteError.statusCode = 500;
    throw deleteError;
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  handleSupabaseError,
  isValidUUID,
  buildPagination,
  buildSearchFilter,
  getUserFromToken,
  uploadFile,
  deleteFile
};