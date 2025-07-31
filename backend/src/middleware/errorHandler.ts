import { Request, Response, NextFunction } from 'express';
import { handleSupabaseError } from '../services/supabaseClient';

// Custom error class for API errors
class APIError extends Error {
  public statusCode: number;
  public code: string | null;
  
  constructor(message: string, statusCode: number = 500, code: string | null = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'APIError';
  }
}

// Error handler middleware
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = new APIError(message, 400, 'INVALID_ID');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new APIError(message, 409, 'DUPLICATE_RESOURCE');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    error = new APIError(message, 400, 'VALIDATION_ERROR');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new APIError(message, 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new APIError(message, 401, 'TOKEN_EXPIRED');
  }

  // Joi validation errors
  if (err.isJoi) {
    const message = err.details.map(detail => detail.message).join(', ');
    error = new APIError(message, 400, 'VALIDATION_ERROR');
  }

  // Supabase errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('PG')) {
    const supabaseError = handleSupabaseError(err, 'Database operation');
    error = new APIError(supabaseError.message, supabaseError.status, err.code);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = new APIError(message, 413, 'FILE_TOO_LARGE');
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files';
    error = new APIError(message, 413, 'TOO_MANY_FILES');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = new APIError(message, 400, 'UNEXPECTED_FILE');
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = new APIError(message, 429, 'RATE_LIMIT_EXCEEDED');
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const code = error.code || 'INTERNAL_ERROR';

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message,
      code,
      statusCode
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    (errorResponse.error as any).stack = err.stack;
  }

  // Add request ID if available
  if ((req as any).id) {
    (errorResponse as any).requestId = (req as any).id;
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Create API error
const createError = (message: string, statusCode: number = 500, code: string | null = null): APIError => {
  return new APIError(message, statusCode, code);
};

// Validation error helper
const validationError = (message: string): APIError => {
  return new APIError(message, 400, 'VALIDATION_ERROR');
};

// Not found error helper
const notFoundError = (resource: string = 'Resource'): APIError => {
  return new APIError(`${resource} not found`, 404, 'NOT_FOUND');
};

// Unauthorized error helper
const unauthorizedError = (message: string = 'Unauthorized access'): APIError => {
  return new APIError(message, 401, 'UNAUTHORIZED');
};

// Forbidden error helper
const forbiddenError = (message: string = 'Access forbidden'): APIError => {
  return new APIError(message, 403, 'FORBIDDEN');
};

// Conflict error helper
const conflictError = (message: string = 'Resource conflict'): APIError => {
  return new APIError(message, 409, 'CONFLICT');
};

// Too many requests error helper
const tooManyRequestsError = (message: string = 'Too many requests'): APIError => {
  return new APIError(message, 429, 'TOO_MANY_REQUESTS');
};

// 404 Not Found handler middleware
const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new APIError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  next(error);
};

export {
  APIError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createError,
  validationError,
  notFoundError,
  unauthorizedError,
  forbiddenError,
  conflictError,
  tooManyRequestsError
};

export default errorHandler;