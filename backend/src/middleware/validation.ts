import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { validationError } from "./errorHandler";

// Validation middleware factory
const validate = (
  schema: Joi.ObjectSchema,
  property: string = "body"
): ((req: AuthenticatedRequest, res: Response, next: NextFunction) => void) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      return next(validationError(errorMessage));
    }

    // Replace the original data with validated and sanitized data
    req[property] = value;
    next();
  };
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    full_name: Joi.string().min(2).max(100),
    terms_accepted: Joi.boolean().valid(true).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).max(128).required(),
  }),

  updateProfile: Joi.object({
    username: Joi.string().alphanum().min(3).max(30),
    full_name: Joi.string().min(2).max(100),
    bio: Joi.string().max(500),
    location: Joi.string().max(100),
    website: Joi.string().uri().max(255),
    phone: Joi.string().pattern(/^[+]?[1-9]?[0-9]{7,15}$/),
    is_business: Joi.boolean(),
  }),

  updateUserProfile: Joi.object({
    role: Joi.string().valid("user", "moderator", "admin"),
  }),
};

// Common validation schemas
const commonSchemas = {
  // UUID validation
  uuid: Joi.string().uuid().required(),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid("asc", "desc").default("desc"),
    sortBy: Joi.string().default("created_at"),
  }),

  // Search
  search: Joi.object({
    q: Joi.string().min(2).max(100).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    category: Joi.string().max(100),
    tag: Joi.string().max(50),
  }),
};

// Vehicle validation schemas
const vehicleSchemas = {
  create: Joi.object({
    make: Joi.string().required(),
    model: Joi.string().required(),
    year: Joi.number()
      .integer()
      .min(1900)
      .max(new Date().getFullYear() + 1)
      .required(),
    trim: Joi.string(),
    body_type: Joi.string(),
    drivetrain: Joi.string(),
    fuel_type: Joi.string(),
    transmission: Joi.string(),
    engine: Joi.string(),
    horsepower: Joi.number().integer().min(0),
    torque: Joi.number().integer().min(0),
    acceleration_0_60: Joi.number().min(0),
    top_speed: Joi.number().integer().min(0),
    range_miles: Joi.number().integer().min(0),
    mpg_city: Joi.number().min(0),
    mpg_highway: Joi.number().min(0),
    mpg_combined: Joi.number().min(0),
    battery_capacity: Joi.number().min(0),
    charging_speed: Joi.string(),
    seating_capacity: Joi.number().integer().min(1).max(20),
    cargo_space: Joi.number().min(0),
    ground_clearance: Joi.number().min(0),
    length: Joi.number().min(0),
    width: Joi.number().min(0),
    height: Joi.number().min(0),
    wheelbase: Joi.number().min(0),
    curb_weight: Joi.number().min(0),
    towing_capacity: Joi.number().integer().min(0),
    msrp: Joi.number().min(0),
    description: Joi.string().max(1000),
    features: Joi.array().items(Joi.string()),
    images: Joi.array().items(Joi.string().uri()),
    is_electric: Joi.boolean().default(false),
    is_hybrid: Joi.boolean().default(false),
    is_available: Joi.boolean().default(true),
  }),

  update: Joi.object({
    make: Joi.string(),
    model: Joi.string(),
    year: Joi.number()
      .integer()
      .min(1900)
      .max(new Date().getFullYear() + 1),
    trim: Joi.string(),
    body_type: Joi.string(),
    drivetrain: Joi.string(),
    fuel_type: Joi.string(),
    transmission: Joi.string(),
    engine: Joi.string(),
    horsepower: Joi.number().integer().min(0),
    torque: Joi.number().integer().min(0),
    acceleration_0_60: Joi.number().min(0),
    top_speed: Joi.number().integer().min(0),
    range_miles: Joi.number().integer().min(0),
    mpg_city: Joi.number().min(0),
    mpg_highway: Joi.number().min(0),
    mpg_combined: Joi.number().min(0),
    battery_capacity: Joi.number().min(0),
    charging_speed: Joi.string(),
    seating_capacity: Joi.number().integer().min(1).max(20),
    cargo_space: Joi.number().min(0),
    ground_clearance: Joi.number().min(0),
    length: Joi.number().min(0),
    width: Joi.number().min(0),
    height: Joi.number().min(0),
    wheelbase: Joi.number().min(0),
    curb_weight: Joi.number().min(0),
    towing_capacity: Joi.number().integer().min(0),
    msrp: Joi.number().min(0),
    description: Joi.string().max(1000),
    features: Joi.array().items(Joi.string()),
    images: Joi.array().items(Joi.string().uri()),
    is_electric: Joi.boolean(),
    is_hybrid: Joi.boolean(),
    is_available: Joi.boolean(),
  }),
};

// Upload validation schemas
const uploadSchemas = {
  fileUpload: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().required(),
    size: Joi.number().max(10485760), // 10MB
    buffer: Joi.binary().required(),
  }),
  updateFile: Joi.object({
    alt_text: Joi.string().max(255).allow(""),
    caption: Joi.string().max(500).allow(""),
    entity_id: Joi.string().uuid().allow(null),
  }),
};

// Forum validation schemas
const forumSchemas = {
  // Category schemas
  createCategory: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500),
    icon: Joi.string().max(50),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
    slug: Joi.string().alphanum().min(2).max(100).required(),
    sort_order: Joi.number().integer().min(0).default(0),
  }),

  updateCategory: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().max(500),
    icon: Joi.string().max(50),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
    slug: Joi.string().alphanum().min(2).max(100),
    sort_order: Joi.number().integer().min(0),
    is_active: Joi.boolean(),
  }),

  // Thread schemas
  createThread: Joi.object({
    category_id: Joi.string().uuid().required(),
    title: Joi.string().min(5).max(200).required(),
    content: Joi.string().min(10).max(10000).required(),
    images: Joi.array().items(Joi.string().uuid()).max(5),
  }),

  updateThread: Joi.object({
    title: Joi.string().min(5).max(200),
    content: Joi.string().min(10).max(10000),
    is_pinned: Joi.boolean(),
    is_locked: Joi.boolean(),
  }),

  // Reply schemas
  createReply: Joi.object({
    thread_id: Joi.string().uuid().required(),
    parent_id: Joi.string().uuid(),
    content: Joi.string().min(1).max(5000).required(),
    images: Joi.array().items(Joi.string().uuid()).max(3),
  }),

  updateReply: Joi.object({
    content: Joi.string().min(1).max(5000),
  }),

  // Image upload schemas
  uploadImage: Joi.object({
    thread_id: Joi.string().uuid(),
    reply_id: Joi.string().uuid(),
    filename: Joi.string().required(),
    original_filename: Joi.string().required(),
    file_size: Joi.number().integer().min(1).max(5242880).required(), // 5MB max
    mime_type: Joi.string()
      .valid("image/jpeg", "image/png", "image/gif", "image/webp")
      .required(),
    storage_path: Joi.string().required(),
    alt_text: Joi.string().max(255),
    width: Joi.number().integer().min(1),
    height: Joi.number().integer().min(1),
  }).xor("thread_id", "reply_id"), // Must have either thread_id or reply_id, not both

  // Search and filter schemas
  searchThreads: Joi.object({
    q: Joi.string().min(1).max(100),
    category_id: Joi.string().uuid(),
    author_id: Joi.string().uuid(),
    sort: Joi.string()
      .valid("newest", "oldest", "most_replies", "most_views")
      .default("newest"),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
  }),

  // Moderation schemas
  moderateThread: Joi.object({
    action: Joi.string()
      .valid("pin", "unpin", "lock", "unlock", "delete", "restore")
      .required(),
    reason: Joi.string().max(500),
  }),

  moderateReply: Joi.object({
    action: Joi.string().valid("delete", "restore").required(),
    reason: Joi.string().max(500),
  }),
};

// Blog validation schemas
const blogSchemas = {
  // Blog post schemas
  create: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    slug: Joi.string()
      .min(5)
      .max(250)
      .pattern(/^[a-z0-9-]+$/),
    excerpt: Joi.string().max(500),
    content: Joi.string().min(10).max(50000).required(),
    featured_image: Joi.string().uri(),
    category: Joi.string().max(100),
    tags: Joi.array().items(Joi.string().max(50)).max(10),
    status: Joi.string()
      .valid("draft", "published", "archived")
      .default("draft"),
    is_featured: Joi.boolean().default(false),
    published_at: Joi.date().iso(),
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(200),
    slug: Joi.string()
      .min(5)
      .max(250)
      .pattern(/^[a-z0-9-]+$/),
    excerpt: Joi.string().max(500),
    content: Joi.string().min(10).max(50000),
    featured_image: Joi.string().uri(),
    category: Joi.string().max(100),
    tags: Joi.array().items(Joi.string().max(50)).max(10),
    status: Joi.string().valid("draft", "published", "archived"),
    is_featured: Joi.boolean(),
    published_at: Joi.date().iso(),
  }),

  // Blog comment schemas
  createComment: Joi.object({
    content: Joi.string().min(1).max(2000).required(),
    parent_id: Joi.string().uuid(),
  }),

  updateComment: Joi.object({
    content: Joi.string().min(1).max(2000).required(),
  }),
};

// Like validation schemas
const likeSchemas = {
  create: Joi.object({
    entity_type: Joi.string()
      .valid(
        "forum_post",
        "forum_reply",
        "blog_post",
        "blog_comment",
        "marketplace_listing",
        "wanted_ad",
        "vehicle"
      )
      .required(),
    entity_id: Joi.string().uuid().required(),
  }),
};

export {
  validate,
  userSchemas,
  commonSchemas,
  vehicleSchemas,
  uploadSchemas,
  forumSchemas,
  blogSchemas,
  likeSchemas,
};

export default validate;
