import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { validationError } from './errorHandler';

// Validation middleware factory
const validate = (schema: Joi.ObjectSchema, property: string = 'body'): ((req: AuthenticatedRequest, res: Response, next: NextFunction) => void) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message.replace(/"/g, ''))
        .join(', ');
      
      return next(validationError(errorMessage));
    }

    // Replace the original data with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Common validation schemas
const commonSchemas = {
  // UUID validation
  uuid: Joi.string().uuid().required(),
  
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string().default('created_at')
  }),
  
  // Search
  search: Joi.object({
    q: Joi.string().min(1).max(100),
    category: Joi.string().max(50),
    tags: Joi.array().items(Joi.string().max(30)),
    location: Joi.string().max(100)
  }),
  
  // File upload
  fileUpload: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().required(),
    size: Joi.number().max(10485760), // 10MB
    buffer: Joi.binary().required()
  })
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    full_name: Joi.string().min(2).max(100),
    terms_accepted: Joi.boolean().valid(true).required()
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  updateProfile: Joi.object({
    username: Joi.string().alphanum().min(3).max(30),
    full_name: Joi.string().min(2).max(100),
    bio: Joi.string().max(500),
    location: Joi.string().max(100),
    website: Joi.string().uri().max(255),
    phone: Joi.string().pattern(/^[+]?[1-9]?[0-9]{7,15}$/),
    privacy_settings: Joi.object(),
    notification_settings: Joi.object()
  }),
  
  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),
  
  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).max(128).required()
  })
};

// Vehicle validation schemas
const vehicleSchemas = {
  create: Joi.object({
    make: Joi.string().max(50).required(),
    model: Joi.string().max(50).required(),
    year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 2).required(),
    trim: Joi.string().max(50),
    color: Joi.string().max(30),
    vin: Joi.string().length(17).pattern(/^[A-HJ-NPR-Z0-9]+$/),
    nickname: Joi.string().max(50),
    purchase_date: Joi.date().max('now'),
    purchase_price: Joi.number().positive(),
    current_mileage: Joi.number().integer().min(0),
    battery_capacity: Joi.number().positive(),
    estimated_range: Joi.number().integer().positive(),
    charging_speed: Joi.string().max(20),
    modifications: Joi.array().items(Joi.string().max(100)),
    notes: Joi.string().max(1000),
    is_public: Joi.boolean().default(true)
  }),
  
  update: Joi.object({
    make: Joi.string().max(50),
    model: Joi.string().max(50),
    year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 2),
    trim: Joi.string().max(50),
    color: Joi.string().max(30),
    vin: Joi.string().length(17).pattern(/^[A-HJ-NPR-Z0-9]+$/),
    nickname: Joi.string().max(50),
    purchase_date: Joi.date().max('now'),
    purchase_price: Joi.number().positive(),
    current_mileage: Joi.number().integer().min(0),
    battery_capacity: Joi.number().positive(),
    estimated_range: Joi.number().integer().positive(),
    charging_speed: Joi.string().max(20),
    modifications: Joi.array().items(Joi.string().max(100)),
    notes: Joi.string().max(1000),
    is_public: Joi.boolean()
  })
};

// Marketplace validation schemas
const marketplaceSchemas = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().max(2000),
    category: Joi.string().max(50).required(),
    subcategory: Joi.string().max(50),
    price: Joi.number().positive(),
    condition: Joi.string().valid('new', 'like-new', 'good', 'fair', 'poor').required(),
    brand: Joi.string().max(50),
    model: Joi.string().max(50),
    year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 2),
    mileage: Joi.number().integer().min(0),
    location: Joi.string().max(100),
    specifications: Joi.object(),
    features: Joi.array().items(Joi.string().max(100)),
    is_negotiable: Joi.boolean().default(true)
  }),
  
  update: Joi.object({
    title: Joi.string().min(5).max(200),
    description: Joi.string().max(2000),
    category: Joi.string().max(50),
    subcategory: Joi.string().max(50),
    price: Joi.number().positive(),
    condition: Joi.string().valid('new', 'like-new', 'good', 'fair', 'poor'),
    brand: Joi.string().max(50),
    model: Joi.string().max(50),
    year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 2),
    mileage: Joi.number().integer().min(0),
    location: Joi.string().max(100),
    specifications: Joi.object(),
    features: Joi.array().items(Joi.string().max(100)),
    is_negotiable: Joi.boolean(),
    is_active: Joi.boolean()
  })
};

// Forum validation schemas
const forumSchemas = {
  createPost: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    content: Joi.string().min(10).max(10000).required(),
    category_id: Joi.string().uuid().required(),
    tags: Joi.array().items(Joi.string().max(30)).max(10)
  }),
  
  updatePost: Joi.object({
    title: Joi.string().min(5).max(200),
    content: Joi.string().min(10).max(10000),
    tags: Joi.array().items(Joi.string().max(30)).max(10)
  }),
  
  createReply: Joi.object({
    content: Joi.string().min(1).max(5000).required(),
    parent_reply_id: Joi.string().uuid()
  })
};

// Blog validation schemas
const blogSchemas = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    excerpt: Joi.string().max(300),
    content: Joi.string().min(50).required(),
    category: Joi.string().max(50),
    tags: Joi.array().items(Joi.string().max(30)).max(10),
    status: Joi.string().valid('draft', 'published').default('draft'),
    is_featured: Joi.boolean().default(false)
  }),
  
  update: Joi.object({
    title: Joi.string().min(5).max(200),
    excerpt: Joi.string().max(300),
    content: Joi.string().min(50),
    category: Joi.string().max(50),
    tags: Joi.array().items(Joi.string().max(30)).max(10),
    status: Joi.string().valid('draft', 'published'),
    is_featured: Joi.boolean()
  }),
  
  createComment: Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    parent_comment_id: Joi.string().uuid()
  }),
  
  updateComment: Joi.object({
    content: Joi.string().min(1).max(1000).required()
  })
};

// Review validation schemas
const reviewSchemas = {
  create: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    title: Joi.string().max(200),
    content: Joi.string().max(2000),
    pros: Joi.array().items(Joi.string().max(100)),
    cons: Joi.array().items(Joi.string().max(100))
  })
};

// Message validation schemas
const messageSchemas = {
  create: Joi.object({
    recipient_id: Joi.string().uuid().required(),
    subject: Joi.string().max(200),
    content: Joi.string().min(1).max(5000).required(),
    parent_message_id: Joi.string().uuid()
  })
};

// Wanted ads validation schemas
const wantedSchemas = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().max(2000),
    category: Joi.string().max(50).required(),
    subcategory: Joi.string().max(50),
    budget_min: Joi.number().positive(),
    budget_max: Joi.number().positive(),
    location: Joi.string().max(100),
    specifications: Joi.object(),
    features: Joi.array().items(Joi.string().max(100)),
    urgency: Joi.string().valid('low', 'medium', 'high').default('medium'),
    contact_method: Joi.string().valid('message', 'email', 'phone').default('message')
  }),
  
  update: Joi.object({
    title: Joi.string().min(5).max(200),
    description: Joi.string().max(2000),
    category: Joi.string().max(50),
    subcategory: Joi.string().max(50),
    budget_min: Joi.number().positive(),
    budget_max: Joi.number().positive(),
    location: Joi.string().max(100),
    specifications: Joi.object(),
    features: Joi.array().items(Joi.string().max(100)),
    urgency: Joi.string().valid('low', 'medium', 'high'),
    contact_method: Joi.string().valid('message', 'email', 'phone'),
    is_active: Joi.boolean()
  })
};

// Charging station validation schemas
const chargingStationSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000),
    network: Joi.string().max(100).required(),
    address: Joi.string().max(300).required(),
    city: Joi.string().max(100).required(),
    state: Joi.string().max(100).required(),
    country: Joi.string().max(100).required(),
    postal_code: Joi.string().max(20),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    connector_types: Joi.array().items(Joi.string().max(50)).min(1).required(),
    power_kw: Joi.number().positive().required(),
    power_level: Joi.string().valid('Level 1', 'Level 2', 'DC Fast').required(),
    num_ports: Joi.number().integer().positive().required(),
    pricing: Joi.object(),
    hours: Joi.object(),
    amenities: Joi.array().items(Joi.string().max(50)),
    access_type: Joi.string().valid('public', 'private', 'restricted').default('public'),
    status: Joi.string().valid('operational', 'maintenance', 'offline').default('operational'),
    phone: Joi.string().max(20),
    website: Joi.string().uri().max(255),
    notes: Joi.string().max(1000)
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(200),
    description: Joi.string().max(1000),
    network: Joi.string().max(100),
    address: Joi.string().max(300),
    city: Joi.string().max(100),
    state: Joi.string().max(100),
    country: Joi.string().max(100),
    postal_code: Joi.string().max(20),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    connector_types: Joi.array().items(Joi.string().max(50)).min(1),
    power_kw: Joi.number().positive(),
    power_level: Joi.string().valid('Level 1', 'Level 2', 'DC Fast'),
    num_ports: Joi.number().integer().positive(),
    pricing: Joi.object(),
    hours: Joi.object(),
    amenities: Joi.array().items(Joi.string().max(50)),
    access_type: Joi.string().valid('public', 'private', 'restricted'),
    status: Joi.string().valid('operational', 'maintenance', 'offline'),
    phone: Joi.string().max(20),
    website: Joi.string().uri().max(255),
    notes: Joi.string().max(1000),
    is_active: Joi.boolean()
  })
};

// Directory validation schemas
const directorySchemas = {
  create: Joi.object({
    business_name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(2000),
    category: Joi.string().max(50).required(),
    subcategory: Joi.string().max(50),
    services: Joi.array().items(Joi.string().max(100)),
    address: Joi.string().max(300).required(),
    city: Joi.string().max(100).required(),
    state: Joi.string().max(100).required(),
    country: Joi.string().max(100).required(),
    postal_code: Joi.string().max(20),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    phone: Joi.string().max(20),
    email: Joi.string().email().max(255),
    website: Joi.string().uri().max(255),
    hours: Joi.object(),
    social_media: Joi.object(),
    specialties: Joi.array().items(Joi.string().max(100)),
    certifications: Joi.array().items(Joi.string().max(100)),
    years_in_business: Joi.number().integer().min(0),
    employee_count: Joi.string().max(50),
    service_area: Joi.string().max(200)
  }),
  
  update: Joi.object({
    business_name: Joi.string().min(2).max(200),
    description: Joi.string().max(2000),
    category: Joi.string().max(50),
    subcategory: Joi.string().max(50),
    services: Joi.array().items(Joi.string().max(100)),
    address: Joi.string().max(300),
    city: Joi.string().max(100),
    state: Joi.string().max(100),
    country: Joi.string().max(100),
    postal_code: Joi.string().max(20),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    phone: Joi.string().max(20),
    email: Joi.string().email().max(255),
    website: Joi.string().uri().max(255),
    hours: Joi.object(),
    social_media: Joi.object(),
    specialties: Joi.array().items(Joi.string().max(100)),
    certifications: Joi.array().items(Joi.string().max(100)),
    years_in_business: Joi.number().integer().min(0),
    employee_count: Joi.string().max(50),
    service_area: Joi.string().max(200),
    is_active: Joi.boolean()
  })
};

// Like validation schemas
const likeSchemas = {
  create: Joi.object({
    entity_type: Joi.string().valid(
      'forum_post', 
      'forum_reply', 
      'blog_post', 
      'blog_comment', 
      'marketplace_listing', 
      'wanted_ad', 
      'vehicle'
    ).required(),
    entity_id: Joi.string().uuid().required()
  })
};

// Upload validation schemas
const uploadSchemas = {
  updateFile: Joi.object({
    alt_text: Joi.string().max(255),
    caption: Joi.string().max(500),
    is_active: Joi.boolean()
  })
};

// Notification validation schemas
const notificationSchemas = {
  create: Joi.object({
    title: Joi.string().required().min(1).max(200),
    message: Joi.string().required().min(1).max(1000),
    type: Joi.string().valid('info', 'warning', 'success', 'error').default('info'),
    target_users: Joi.array().items(Joi.string().uuid()).optional(),
    target_roles: Joi.array().items(Joi.string()).optional(),
    send_email: Joi.boolean().default(false),
    send_push: Joi.boolean().default(true),
    scheduled_for: Joi.date().optional(),
    expires_at: Joi.date().optional()
  }),
  
  update: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    message: Joi.string().min(1).max(1000).optional(),
    type: Joi.string().valid('info', 'warning', 'success', 'error').optional(),
    is_read: Joi.boolean().optional(),
    expires_at: Joi.date().optional()
  }),
  
  updatePreferences: Joi.object({
    email: Joi.object({
      enabled: Joi.boolean().required(),
      frequency: Joi.string().valid('immediate', 'daily', 'weekly', 'never').default('immediate')
    }).optional(),
    push: Joi.object({
      enabled: Joi.boolean().required(),
      quietHours: Joi.object({
        enabled: Joi.boolean().default(false),
        start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      }).optional()
    }).optional(),
    inApp: Joi.object({
      enabled: Joi.boolean().required()
    }).optional(),
    types: Joi.object().pattern(
      Joi.string(),
      Joi.object({
        email: Joi.boolean().required(),
        push: Joi.boolean().required(),
        inApp: Joi.boolean().required()
      })
    ).optional()
  }),
  
  broadcast: Joi.object({
    title: Joi.string().required().min(1).max(200),
    message: Joi.string().required().min(1).max(1000),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    action_url: Joi.string().uri().optional(),
    user_filter: Joi.object({
      role: Joi.string().valid('user', 'moderator', 'admin').optional(),
      created_after: Joi.date().optional(),
      has_vehicles: Joi.boolean().optional()
    }).optional(),
    send_email: Joi.boolean().default(false),
    send_push: Joi.boolean().default(false)
  })
};

// Admin validation schemas
const adminSchemas = {
  updateUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    full_name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    role: Joi.string().valid('user', 'moderator', 'admin').optional(),
    is_active: Joi.boolean().optional(),
    is_verified: Joi.boolean().optional(),
    bio: Joi.string().max(500).optional(),
    location: Joi.string().max(100).optional()
  }),
  
  createUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    full_name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    role: Joi.string().valid('user', 'moderator', 'admin').default('user'),
    is_active: Joi.boolean().default(true),
    is_verified: Joi.boolean().default(false)
  }),
  
  updateSettings: Joi.object({
    site_name: Joi.string().max(100).optional(),
    site_description: Joi.string().max(500).optional(),
    maintenance_mode: Joi.boolean().optional(),
    registration_enabled: Joi.boolean().optional(),
    email_verification_required: Joi.boolean().optional()
  }),
  
  resolveReport: Joi.object({
    action: Joi.string().valid('dismiss', 'warn_user', 'suspend_user', 'delete_content').required(),
    admin_notes: Joi.string().max(1000).optional(),
    duration_days: Joi.number().integer().min(1).max(365).optional()
  }),
  
  rejectContent: Joi.object({
    reason: Joi.string().max(500).required(),
    admin_notes: Joi.string().max(1000).optional(),
    notify_user: Joi.boolean().default(true)
  })
};

export {
  validate,
  commonSchemas,
  userSchemas,
  vehicleSchemas,
  marketplaceSchemas,
  forumSchemas,
  blogSchemas,
  reviewSchemas,
  messageSchemas,
  wantedSchemas,
  chargingStationSchemas,
  directorySchemas,
  likeSchemas,
  uploadSchemas,
  notificationSchemas,
  adminSchemas
};

export default validate;