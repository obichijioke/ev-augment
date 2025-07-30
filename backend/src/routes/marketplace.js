const express = require('express');
const { supabaseAdmin } = require('../services/supabaseClient');
const { validate, marketplaceSchemas, commonSchemas } = require('../middleware/validation');
const { asyncHandler, notFoundError, forbiddenError, validationError } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth, requireOwnership } = require('../middleware/auth');
const { buildPagination, isValidUUID } = require('../services/supabaseClient');

const router = express.Router();

// @route   GET /api/marketplace
// @desc    Get all marketplace listings
// @access  Public
router.get('/', optionalAuth, validate(commonSchemas.pagination, 'query'), asyncHandler(async (req, res) => {
  const { page, limit, category, subcategory, condition, min_price, max_price, location, sort, sortBy, q } = req.query;
  const { from, to } = buildPagination(page, limit);

  let query = supabaseAdmin
    .from('marketplace_listings')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified, join_date)
    `, { count: 'exact' })
    .eq('is_active', true)
    .range(from, to);

  // Apply filters
  if (category) {
    query = query.eq('category', category);
  }
  if (subcategory) {
    query = query.eq('subcategory', subcategory);
  }
  if (condition) {
    query = query.eq('condition', condition);
  }
  if (min_price) {
    query = query.gte('price', parseFloat(min_price));
  }
  if (max_price) {
    query = query.lte('price', parseFloat(max_price));
  }
  if (location) {
    query = query.ilike('location', `%${location}%`);
  }
  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%`);
  }

  // Apply sorting
  const validSortFields = ['created_at', 'price', 'views', 'title'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const sortOrder = sort === 'asc' ? { ascending: true } : { ascending: false };
  
  query = query.order(sortField, sortOrder);

  const { data: listings, error, count } = await query;

  if (error) {
    throw new Error('Failed to fetch marketplace listings');
  }

  res.json({
    success: true,
    data: {
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

// @route   POST /api/marketplace
// @desc    Create a new marketplace listing
// @access  Private
router.post('/', authenticateToken, validate(marketplaceSchemas.create), asyncHandler(async (req, res) => {
  const listingData = {
    ...req.body,
    seller_id: req.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: listing, error } = await supabaseAdmin
    .from('marketplace_listings')
    .insert(listingData)
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `)
    .single();

  if (error) {
    throw new Error('Failed to create marketplace listing');
  }

  res.status(201).json({
    success: true,
    message: 'Marketplace listing created successfully',
    data: {
      listing
    }
  });
}));

// @route   GET /api/marketplace/:id
// @desc    Get marketplace listing by ID
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid listing ID format');
  }

  const { data: listing, error } = await supabaseAdmin
    .from('marketplace_listings')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified, join_date, location)
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw notFoundError('Marketplace listing');
  }

  // Increment view count (only if not the owner)
  if (!req.user || req.user.id !== listing.seller_id) {
    await supabaseAdmin
      .from('marketplace_listings')
      .update({ views: (listing.views || 0) + 1 })
      .eq('id', id);
    
    listing.views = (listing.views || 0) + 1;
  }

  // Get seller's other listings
  const { data: otherListings } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, title, price, images, created_at')
    .eq('seller_id', listing.seller_id)
    .eq('is_active', true)
    .neq('id', id)
    .limit(4)
    .order('created_at', { ascending: false });

  // Get seller's rating (average from reviews)
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('reviewee_type', 'user')
    .eq('reviewee_id', listing.seller_id);

  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;

  res.json({
    success: true,
    data: {
      listing: {
        ...listing,
        seller: {
          ...listing.users,
          rating: averageRating,
          review_count: reviews ? reviews.length : 0,
          other_listings: otherListings || []
        }
      }
    }
  });
}));

// @route   PUT /api/marketplace/:id
// @desc    Update marketplace listing
// @access  Private (Owner only)
router.put('/:id', authenticateToken, requireOwnership('id', 'seller_id'), validate(marketplaceSchemas.update), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid listing ID format');
  }

  // Check ownership
  const { data: existingListing, error: checkError } = await supabaseAdmin
    .from('marketplace_listings')
    .select('seller_id')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Marketplace listing');
  }

  if (existingListing.seller_id !== req.user.id) {
    throw forbiddenError('You can only update your own listings');
  }

  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  const { data: listing, error } = await supabaseAdmin
    .from('marketplace_listings')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `)
    .single();

  if (error) {
    throw new Error('Failed to update marketplace listing');
  }

  res.json({
    success: true,
    message: 'Marketplace listing updated successfully',
    data: {
      listing
    }
  });
}));

// @route   DELETE /api/marketplace/:id
// @desc    Delete marketplace listing
// @access  Private (Owner only)
router.delete('/:id', authenticateToken, requireOwnership('id', 'seller_id'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid listing ID format');
  }

  // Check ownership
  const { data: existingListing, error: checkError } = await supabaseAdmin
    .from('marketplace_listings')
    .select('seller_id')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Marketplace listing');
  }

  if (existingListing.seller_id !== req.user.id) {
    throw forbiddenError('You can only delete your own listings');
  }

  const { error } = await supabaseAdmin
    .from('marketplace_listings')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete marketplace listing');
  }

  res.json({
    success: true,
    message: 'Marketplace listing deleted successfully'
  });
}));

// @route   POST /api/marketplace/:id/images
// @desc    Upload listing images
// @access  Private (Owner only)
router.post('/:id/images', authenticateToken, requireOwnership('id', 'seller_id'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid listing ID format');
  }

  // Check ownership
  const { data: existingListing, error: checkError } = await supabaseAdmin
    .from('marketplace_listings')
    .select('seller_id, images')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Marketplace listing');
  }

  if (existingListing.seller_id !== req.user.id) {
    throw forbiddenError('You can only upload images to your own listings');
  }

  // This will be implemented with the upload middleware
  res.json({
    success: true,
    message: 'Listing image upload endpoint - to be implemented with file upload middleware'
  });
}));

// @route   GET /api/marketplace/categories
// @desc    Get all marketplace categories
// @access  Public
router.get('/meta/categories', asyncHandler(async (req, res) => {
  const { data: categories, error } = await supabaseAdmin
    .from('marketplace_listings')
    .select('category, subcategory')
    .eq('is_active', true);

  if (error) {
    throw new Error('Failed to fetch categories');
  }

  // Group by category and subcategory
  const categoryMap = {};
  categories.forEach(item => {
    if (!categoryMap[item.category]) {
      categoryMap[item.category] = new Set();
    }
    if (item.subcategory) {
      categoryMap[item.category].add(item.subcategory);
    }
  });

  // Convert to array format
  const categoriesArray = Object.keys(categoryMap).map(category => ({
    name: category,
    subcategories: Array.from(categoryMap[category]).sort()
  })).sort((a, b) => a.name.localeCompare(b.name));

  res.json({
    success: true,
    data: {
      categories: categoriesArray
    }
  });
}));

// @route   GET /api/marketplace/search
// @desc    Search marketplace listings
// @access  Public
router.get('/search', validate(commonSchemas.search, 'query'), asyncHandler(async (req, res) => {
  const { q, category, location, page = 1, limit = 20 } = req.query;
  const { from, to } = buildPagination(page, limit);

  if (!q || q.trim().length < 2) {
    throw validationError('Search query must be at least 2 characters long');
  }

  let query = supabaseAdmin
    .from('marketplace_listings')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `, { count: 'exact' })
    .eq('is_active', true)
    .or(`title.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (category) {
    query = query.eq('category', category);
  }
  if (location) {
    query = query.ilike('location', `%${location}%`);
  }

  const { data: listings, error, count } = await query;

  if (error) {
    throw new Error('Failed to search marketplace listings');
  }

  res.json({
    success: true,
    data: {
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      },
      query: q
    }
  });
}));

// @route   POST /api/marketplace/:id/contact
// @desc    Contact seller about a listing
// @access  Private
router.post('/:id/contact', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message, contact_method } = req.body;

  if (!isValidUUID(id)) {
    throw validationError('Invalid listing ID format');
  }

  if (!message || message.trim().length < 10) {
    throw validationError('Message must be at least 10 characters long');
  }

  // Get listing and seller info
  const { data: listing, error } = await supabaseAdmin
    .from('marketplace_listings')
    .select(`
      id,
      title,
      seller_id,
      users(username, full_name, email)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    throw notFoundError('Marketplace listing');
  }

  if (listing.seller_id === req.user.id) {
    throw validationError('You cannot contact yourself about your own listing');
  }

  // Create message record
  const { error: messageError } = await supabaseAdmin
    .from('messages')
    .insert({
      sender_id: req.user.id,
      recipient_id: listing.seller_id,
      subject: `Inquiry about: ${listing.title}`,
      content: message,
      created_at: new Date().toISOString()
    });

  if (messageError) {
    throw new Error('Failed to send message');
  }

  res.json({
    success: true,
    message: 'Message sent to seller successfully'
  });
}));

// @route   GET /api/marketplace/user/:userId
// @desc    Get user's marketplace listings
// @access  Public
router.get('/user/:userId', validate(commonSchemas.pagination, 'query'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
  const { from, to } = buildPagination(page, limit);

  if (!isValidUUID(userId)) {
    throw validationError('Invalid user ID format');
  }

  const { data: listings, error, count } = await supabaseAdmin
    .from('marketplace_listings')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `, { count: 'exact' })
    .eq('seller_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error('Failed to fetch user listings');
  }

  res.json({
    success: true,
    data: {
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

module.exports = router;