const express = require('express');
const { supabaseAdmin } = require('../services/supabaseClient');
const { validate, directorySchemas, commonSchemas } = require('../middleware/validation');
const { asyncHandler, notFoundError, forbiddenError, validationError } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth, requireOwnership, requireModerator } = require('../middleware/auth');
const { buildPagination, isValidUUID } = require('../services/supabaseClient');

const router = express.Router();

// @route   GET /api/directory
// @desc    Get all directory listings
// @access  Public
router.get('/', optionalAuth, validate(commonSchemas.pagination, 'query'), asyncHandler(async (req, res) => {
  const { 
    page, 
    limit, 
    category, 
    subcategory, 
    city, 
    state, 
    country,
    lat, 
    lng, 
    radius,
    is_verified,
    sort, 
    sortBy, 
    q 
  } = req.query;
  const { from, to } = buildPagination(page, limit);

  let query = supabaseAdmin
    .from('directory_listings')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified),
      directory_reviews(rating, count)
    `, { count: 'exact' })
    .eq('is_active', true)
    .eq('status', 'approved')
    .range(from, to);

  // Apply filters
  if (category) {
    query = query.eq('category', category);
  }
  if (subcategory) {
    query = query.eq('subcategory', subcategory);
  }
  if (city) {
    query = query.ilike('city', `%${city}%`);
  }
  if (state) {
    query = query.ilike('state', `%${state}%`);
  }
  if (country) {
    query = query.ilike('country', `%${country}%`);
  }
  if (is_verified === 'true') {
    query = query.eq('is_verified', true);
  }
  if (q) {
    query = query.or(`business_name.ilike.%${q}%,description.ilike.%${q}%,services.ilike.%${q}%,address.ilike.%${q}%`);
  }

  // Geographic filtering (within radius)
  if (lat && lng && radius) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    
    if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(radiusKm)) {
      query = query.gte('latitude', latitude - (radiusKm / 111.32))
                   .lte('latitude', latitude + (radiusKm / 111.32))
                   .gte('longitude', longitude - (radiusKm / (111.32 * Math.cos(latitude * Math.PI / 180))))
                   .lte('longitude', longitude + (radiusKm / (111.32 * Math.cos(latitude * Math.PI / 180))));
    }
  }

  // Apply sorting
  const validSortFields = ['created_at', 'updated_at', 'business_name', 'rating', 'views'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'business_name';
  const sortOrder = sort === 'desc' ? { ascending: false } : { ascending: true };
  
  // Prioritize verified listings
  query = query.order('is_verified', { ascending: false });
  query = query.order(sortField, sortOrder);

  const { data: listings, error, count } = await query;

  if (error) {
    throw new Error('Failed to fetch directory listings');
  }

  // Calculate average rating for each listing
  const listingsWithRating = listings.map(listing => {
    const reviews = listing.directory_reviews || [];
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;
    
    return {
      ...listing,
      average_rating: averageRating,
      review_count: reviews.length,
      directory_reviews: undefined // Remove the raw reviews data
    };
  });

  res.json({
    success: true,
    data: {
      listings: listingsWithRating,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

// @route   POST /api/directory
// @desc    Create a new directory listing
// @access  Private
router.post('/', authenticateToken, validate(directorySchemas.create), asyncHandler(async (req, res) => {
  const listingData = {
    ...req.body,
    owner_id: req.user.id,
    status: 'pending', // Requires approval
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Check if user already has a listing with the same business name
  const { data: existingListing } = await supabaseAdmin
    .from('directory_listings')
    .select('id')
    .eq('owner_id', req.user.id)
    .eq('business_name', listingData.business_name)
    .single();

  if (existingListing) {
    throw validationError('You already have a listing with this business name');
  }

  const { data: listing, error } = await supabaseAdmin
    .from('directory_listings')
    .insert(listingData)
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `)
    .single();

  if (error) {
    throw new Error('Failed to create directory listing');
  }

  res.status(201).json({
    success: true,
    message: 'Directory listing created successfully and is pending approval',
    data: {
      listing
    }
  });
}));

// @route   GET /api/directory/:id
// @desc    Get directory listing by ID
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid directory listing ID format');
  }

  const { data: listing, error } = await supabaseAdmin
    .from('directory_listings')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified, join_date)
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw notFoundError('Directory listing');
  }

  // Check if user can view this listing
  const isModerator = req.user && (req.user.role === 'moderator' || req.user.role === 'admin');
  const isOwner = req.user && req.user.id === listing.owner_id;
  
  if (listing.status !== 'approved' && !isModerator && !isOwner) {
    throw notFoundError('Directory listing');
  }

  if (!listing.is_active && !isModerator && !isOwner) {
    throw notFoundError('Directory listing');
  }

  // Increment view count (only for approved listings and if not the owner)
  if (listing.status === 'approved' && listing.is_active && (!req.user || req.user.id !== listing.owner_id)) {
    await supabaseAdmin
      .from('directory_listings')
      .update({ views: (listing.views || 0) + 1 })
      .eq('id', id);
    
    listing.views = (listing.views || 0) + 1;
  }

  // Get reviews for this listing
  const { data: reviews, error: reviewsError } = await supabaseAdmin
    .from('directory_reviews')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `)
    .eq('listing_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(10);

  if (reviewsError) {
    throw new Error('Failed to fetch listing reviews');
  }

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;

  // Get nearby listings (same category, within 25km)
  const { data: nearbyListings } = await supabaseAdmin
    .from('directory_listings')
    .select('id, business_name, address, latitude, longitude, category')
    .eq('category', listing.category)
    .eq('status', 'approved')
    .eq('is_active', true)
    .neq('id', id)
    .gte('latitude', listing.latitude - 0.225) // Rough 25km radius
    .lte('latitude', listing.latitude + 0.225)
    .gte('longitude', listing.longitude - 0.225)
    .lte('longitude', listing.longitude + 0.225)
    .limit(5);

  // Get owner's other listings
  const { data: ownerListings } = await supabaseAdmin
    .from('directory_listings')
    .select('id, business_name, category, city, state')
    .eq('owner_id', listing.owner_id)
    .eq('status', 'approved')
    .eq('is_active', true)
    .neq('id', id)
    .limit(3);

  res.json({
    success: true,
    data: {
      listing: {
        ...listing,
        average_rating: averageRating,
        review_count: reviews.length,
        reviews: reviews.slice(0, 5), // Only return first 5 reviews
        nearby_listings: nearbyListings || [],
        owner: {
          ...listing.users,
          other_listings: ownerListings || []
        }
      }
    }
  });
}));

// @route   PUT /api/directory/:id
// @desc    Update directory listing
// @access  Private (Owner only)
router.put('/:id', authenticateToken, requireOwnership('id', 'owner_id'), validate(directorySchemas.update), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid directory listing ID format');
  }

  // Check ownership
  const { data: existingListing, error: checkError } = await supabaseAdmin
    .from('directory_listings')
    .select('owner_id')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Directory listing');
  }

  if (existingListing.owner_id !== req.user.id) {
    throw forbiddenError('You can only update your own listings');
  }

  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  // If significant changes are made, require re-approval
  const significantFields = ['business_name', 'category', 'subcategory', 'address', 'phone', 'email'];
  const hasSignificantChanges = significantFields.some(field => updateData[field] !== undefined);
  
  if (hasSignificantChanges) {
    updateData.status = 'pending';
  }

  const { data: listing, error } = await supabaseAdmin
    .from('directory_listings')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `)
    .single();

  if (error) {
    throw new Error('Failed to update directory listing');
  }

  res.json({
    success: true,
    message: hasSignificantChanges 
      ? 'Directory listing updated successfully and is pending re-approval'
      : 'Directory listing updated successfully',
    data: {
      listing
    }
  });
}));

// @route   DELETE /api/directory/:id
// @desc    Delete directory listing
// @access  Private (Owner only)
router.delete('/:id', authenticateToken, requireOwnership('id', 'owner_id'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid directory listing ID format');
  }

  // Check ownership
  const { data: existingListing, error: checkError } = await supabaseAdmin
    .from('directory_listings')
    .select('owner_id')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Directory listing');
  }

  if (existingListing.owner_id !== req.user.id) {
    throw forbiddenError('You can only delete your own listings');
  }

  // Soft delete by setting is_active to false
  const { error } = await supabaseAdmin
    .from('directory_listings')
    .update({ 
      is_active: false, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete directory listing');
  }

  res.json({
    success: true,
    message: 'Directory listing deleted successfully'
  });
}));

// @route   GET /api/directory/:id/reviews
// @desc    Get reviews for a directory listing
// @access  Public
router.get('/:id/reviews', validate(commonSchemas.pagination, 'query'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit } = req.query;
  const { from, to } = buildPagination(page, limit);

  if (!isValidUUID(id)) {
    throw validationError('Invalid directory listing ID format');
  }

  // Check if listing exists and is approved
  const { data: listing, error: listingError } = await supabaseAdmin
    .from('directory_listings')
    .select('id, business_name, status')
    .eq('id', id)
    .single();

  if (listingError) {
    throw notFoundError('Directory listing');
  }

  if (listing.status !== 'approved') {
    throw notFoundError('Directory listing');
  }

  const { data: reviews, error, count } = await supabaseAdmin
    .from('directory_reviews')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `, { count: 'exact' })
    .eq('listing_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error('Failed to fetch listing reviews');
  }

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

// @route   POST /api/directory/:id/reviews
// @desc    Create a review for a directory listing
// @access  Private
router.post('/:id/reviews', authenticateToken, validate(directorySchemas.createReview), asyncHandler(async (req, res) => {
  const { id: listingId } = req.params;

  if (!isValidUUID(listingId)) {
    throw validationError('Invalid directory listing ID format');
  }

  // Check if listing exists and is approved
  const { data: listing, error: listingError } = await supabaseAdmin
    .from('directory_listings')
    .select('id, owner_id, status')
    .eq('id', listingId)
    .single();

  if (listingError) {
    throw notFoundError('Directory listing');
  }

  if (listing.status !== 'approved') {
    throw forbiddenError('Cannot review unapproved listings');
  }

  if (listing.owner_id === req.user.id) {
    throw forbiddenError('You cannot review your own listing');
  }

  // Check if user has already reviewed this listing
  const { data: existingReview } = await supabaseAdmin
    .from('directory_reviews')
    .select('id')
    .eq('listing_id', listingId)
    .eq('reviewer_id', req.user.id)
    .single();

  if (existingReview) {
    throw validationError('You have already reviewed this listing');
  }

  const reviewData = {
    ...req.body,
    listing_id: listingId,
    reviewer_id: req.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: review, error } = await supabaseAdmin
    .from('directory_reviews')
    .insert(reviewData)
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `)
    .single();

  if (error) {
    throw new Error('Failed to create review');
  }

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: {
      review
    }
  });
}));

// @route   GET /api/directory/categories
// @desc    Get all directory categories
// @access  Public
router.get('/meta/categories', asyncHandler(async (req, res) => {
  const { data: categories, error } = await supabaseAdmin
    .from('directory_listings')
    .select('category, subcategory')
    .eq('status', 'approved')
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

// @route   GET /api/directory/search
// @desc    Search directory listings
// @access  Public
router.get('/search', validate(commonSchemas.search, 'query'), asyncHandler(async (req, res) => {
  const { q, category, city, state, lat, lng, radius = 50, page = 1, limit = 20 } = req.query;
  const { from, to } = buildPagination(page, limit);

  if (!q || q.trim().length < 2) {
    throw validationError('Search query must be at least 2 characters long');
  }

  let query = supabaseAdmin
    .from('directory_listings')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified),
      directory_reviews(rating, count)
    `, { count: 'exact' })
    .eq('status', 'approved')
    .eq('is_active', true)
    .or(`business_name.ilike.%${q}%,description.ilike.%${q}%,services.ilike.%${q}%,address.ilike.%${q}%`)
    .order('is_verified', { ascending: false })
    .order('business_name', { ascending: true })
    .range(from, to);

  if (category) {
    query = query.eq('category', category);
  }
  if (city) {
    query = query.ilike('city', `%${city}%`);
  }
  if (state) {
    query = query.ilike('state', `%${state}%`);
  }

  // Geographic filtering if coordinates provided
  if (lat && lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    
    if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(radiusKm)) {
      query = query.gte('latitude', latitude - (radiusKm / 111.32))
                   .lte('latitude', latitude + (radiusKm / 111.32))
                   .gte('longitude', longitude - (radiusKm / (111.32 * Math.cos(latitude * Math.PI / 180))))
                   .lte('longitude', longitude + (radiusKm / (111.32 * Math.cos(latitude * Math.PI / 180))));
    }
  }

  const { data: listings, error, count } = await query;

  if (error) {
    throw new Error('Failed to search directory listings');
  }

  // Calculate average rating for each listing
  const listingsWithRating = listings.map(listing => {
    const reviews = listing.directory_reviews || [];
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;
    
    return {
      ...listing,
      average_rating: averageRating,
      review_count: reviews.length,
      directory_reviews: undefined
    };
  });

  res.json({
    success: true,
    data: {
      listings: listingsWithRating,
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

// @route   POST /api/directory/:id/approve
// @desc    Approve a directory listing
// @access  Private (Moderator only)
router.post('/:id/approve', authenticateToken, requireModerator, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_verified = false } = req.body;

  if (!isValidUUID(id)) {
    throw validationError('Invalid directory listing ID format');
  }

  const { data: listing, error } = await supabaseAdmin
    .from('directory_listings')
    .update({
      status: 'approved',
      is_verified: Boolean(is_verified),
      approved_at: new Date().toISOString(),
      approved_by: req.user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, business_name, status, is_verified')
    .single();

  if (error) {
    throw notFoundError('Directory listing');
  }

  res.json({
    success: true,
    message: `Directory listing approved successfully${listing.is_verified ? ' and verified' : ''}`,
    data: {
      listing
    }
  });
}));

// @route   POST /api/directory/:id/reject
// @desc    Reject a directory listing
// @access  Private (Moderator only)
router.post('/:id/reject', authenticateToken, requireModerator, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejection_reason } = req.body;

  if (!isValidUUID(id)) {
    throw validationError('Invalid directory listing ID format');
  }

  if (!rejection_reason) {
    throw validationError('Rejection reason is required');
  }

  const { data: listing, error } = await supabaseAdmin
    .from('directory_listings')
    .update({
      status: 'rejected',
      rejection_reason,
      rejected_at: new Date().toISOString(),
      rejected_by: req.user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, business_name, status')
    .single();

  if (error) {
    throw notFoundError('Directory listing');
  }

  res.json({
    success: true,
    message: 'Directory listing rejected successfully',
    data: {
      listing
    }
  });
}));

// @route   GET /api/directory/user/:userId
// @desc    Get user's directory listings
// @access  Public
router.get('/user/:userId', validate(commonSchemas.pagination, 'query'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page, limit, include_pending } = req.query;
  const { from, to } = buildPagination(page, limit);

  if (!isValidUUID(userId)) {
    throw validationError('Invalid user ID format');
  }

  let query = supabaseAdmin
    .from('directory_listings')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `, { count: 'exact' })
    .eq('owner_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  // Only include approved listings unless specifically requested
  if (include_pending !== 'true') {
    query = query.eq('status', 'approved');
  }

  const { data: listings, error, count } = await query;

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