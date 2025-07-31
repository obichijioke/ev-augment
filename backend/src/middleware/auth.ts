import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { getUserFromToken } from '../services/supabaseClient';
import { AuthenticatedRequest } from '../types';

// Middleware to authenticate JWT tokens
const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
      return;
    }

    // Verify token with Supabase
    const { user, error } = await getUserFromToken(token);
    
    if (error || !user) {
      res.status(403).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
      return;
    }

    // Attach user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(403).json({
      error: 'Authentication failed',
      message: 'Token verification failed'
    });
    return;
  }
};

// Middleware for optional authentication (doesn't fail if no token)
const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { user, error } = await getUserFromToken(token);
      
      if (!error && user) {
        req.user = user;
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token verification fails
    next();
  }
};

// Middleware to check if user is admin
const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate to access this resource'
      });
      return;
    }

    // Check if user has admin role in user_metadata
    const isAdmin = req.user.user_metadata?.role === 'admin' || 
                   req.user.app_metadata?.role === 'admin';

    if (!isAdmin) {
      res.status(403).json({
        error: 'Admin access required',
        message: 'You do not have permission to access this resource'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      error: 'Authorization check failed',
      message: 'Unable to verify admin permissions'
    });
    return;
  }
};

// Middleware to check if user is moderator or admin
const requireModerator = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate to access this resource'
      });
      return;
    }

    const userRole = req.user.user_metadata?.role || req.user.app_metadata?.role;
    const isModerator = ['admin', 'moderator'].includes(userRole);

    if (!isModerator) {
      res.status(403).json({
        error: 'Moderator access required',
        message: 'You do not have permission to access this resource'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Moderator check error:', error);
    res.status(500).json({
      error: 'Authorization check failed',
      message: 'Unable to verify moderator permissions'
    });
    return;
  }
};

// Middleware to check resource ownership
const requireOwnership = (resourceIdParam: string = 'id', userIdField: string = 'user_id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate to access this resource'
        });
        return;
      }

      // Admin can access any resource
      const isAdmin = req.user.user_metadata?.role === 'admin' || 
                     req.user.app_metadata?.role === 'admin';
      
      if (isAdmin) {
        next();
        return;
      }

      // Check if resource belongs to user
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;

      // This will be implemented in specific controllers
      // For now, we'll attach the ownership check info to the request
      req.ownershipCheck = {
        resourceId,
        userId,
        userIdField
      };

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        error: 'Authorization check failed',
        message: 'Unable to verify resource ownership'
      });
      return;
    }
  };
};

// Middleware to check if user account is verified
const requireVerified = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate to access this resource'
      });
      return;
    }

    if (!req.user.email_confirmed_at) {
      res.status(403).json({
        error: 'Email verification required',
        message: 'Please verify your email address to access this resource'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Verification check error:', error);
    res.status(500).json({
      error: 'Verification check failed',
      message: 'Unable to verify account status'
    });
    return;
  }
};

// Middleware to extract user info from token without requiring authentication
const extractUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { user } = await getUserFromToken(token);
      if (user) {
        req.user = user;
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    // Continue without user info if extraction fails
    next();
  }
};

// Re-export types for backward compatibility
export type { AuthenticatedRequest } from '../types';

// Create an alias for OptionalAuthRequest
export interface OptionalAuthRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery> {}

export {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireModerator,
  requireOwnership,
  requireVerified,
  extractUser
};

export default authenticateToken;