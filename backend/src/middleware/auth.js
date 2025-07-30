const jwt = require('jsonwebtoken');
const { getUserFromToken } = require('../services/supabaseClient');

// Middleware to authenticate JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    // Verify token with Supabase
    const { user, error } = await getUserFromToken(token);
    
    if (error || !user) {
      return res.status(403).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
    }

    // Attach user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({
      error: 'Authentication failed',
      message: 'Token verification failed'
    });
  }
};

// Middleware for optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
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
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate to access this resource'
      });
    }

    // Check if user has admin role in user_metadata
    const isAdmin = req.user.user_metadata?.role === 'admin' || 
                   req.user.app_metadata?.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      error: 'Authorization check failed',
      message: 'Unable to verify admin permissions'
    });
  }
};

// Middleware to check if user is moderator or admin
const requireModerator = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate to access this resource'
      });
    }

    const userRole = req.user.user_metadata?.role || req.user.app_metadata?.role;
    const isModerator = ['admin', 'moderator'].includes(userRole);

    if (!isModerator) {
      return res.status(403).json({
        error: 'Moderator access required',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  } catch (error) {
    console.error('Moderator check error:', error);
    return res.status(500).json({
      error: 'Authorization check failed',
      message: 'Unable to verify moderator permissions'
    });
  }
};

// Middleware to check resource ownership
const requireOwnership = (resourceIdParam = 'id', userIdField = 'user_id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate to access this resource'
        });
      }

      // Admin can access any resource
      const isAdmin = req.user.user_metadata?.role === 'admin' || 
                     req.user.app_metadata?.role === 'admin';
      
      if (isAdmin) {
        return next();
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
      return res.status(500).json({
        error: 'Authorization check failed',
        message: 'Unable to verify resource ownership'
      });
    }
  };
};

// Middleware to check if user account is verified
const requireVerified = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate to access this resource'
      });
    }

    if (!req.user.email_confirmed_at) {
      return res.status(403).json({
        error: 'Email verification required',
        message: 'Please verify your email address to access this resource'
      });
    }

    next();
  } catch (error) {
    console.error('Verification check error:', error);
    return res.status(500).json({
      error: 'Verification check failed',
      message: 'Unable to verify account status'
    });
  }
};

// Middleware to extract user info from token without requiring authentication
const extractUser = async (req, res, next) => {
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

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireModerator,
  requireOwnership,
  requireVerified,
  extractUser
};