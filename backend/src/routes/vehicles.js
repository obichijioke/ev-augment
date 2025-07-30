const express = require('express');
const { supabaseAdmin } = require('../services/supabaseClient');
const { validate, vehicleSchemas, commonSchemas } = require('../middleware/validation');
const { asyncHandler, notFoundError, forbiddenError, createError } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth, requireOwnership } = require('../middleware/auth');
const { buildPagination, isValidUUID } = require('../services/supabaseClient');

const router = express.Router();

// @route   GET /api/vehicles
// @desc    Get all public vehicles
// @access  Public
router.get('/', optionalAuth, validate(commonSchemas.pagination, 'query'), asyncHandler(async (req, res) => {
  const { page, limit, make, model, year, sort, sortBy } = req.query;
  const { from, to } = buildPagination(page, limit);

  let query = supabaseAdmin
    .from('vehicles')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `, { count: 'exact' })
    .eq('is_public', true)
    .range(from, to);

  // Apply filters
  if (make) {
    query = query.ilike('make', `%${make}%`);
  }
  if (model) {
    query = query.ilike('model', `%${model}%`);
  }
  if (year) {
    query = query.eq('year', year);
  }

  // Apply sorting
  const validSortFields = ['created_at', 'year', 'make', 'model', 'current_mileage'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const sortOrder = sort === 'asc' ? { ascending: true } : { ascending: false };
  
  query = query.order(sortField, sortOrder);

  const { data: vehicles, error, count } = await query;

  if (error) {
    throw createError('Failed to fetch vehicles', 500);
  }

  res.json({
    success: true,
    data: {
      vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

// @route   POST /api/vehicles
// @desc    Create a new vehicle
// @access  Private
router.post('/', authenticateToken, validate(vehicleSchemas.create), asyncHandler(async (req, res) => {
  const vehicleData = {
    ...req.body,
    owner_id: req.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Check if VIN already exists (if provided)
  if (vehicleData.vin) {
    const { data: existingVehicle } = await supabaseAdmin
      .from('vehicles')
      .select('id')
      .eq('vin', vehicleData.vin)
      .single();

    if (existingVehicle) {
      throw validationError('A vehicle with this VIN already exists');
    }
  }

  const { data: vehicle, error } = await supabaseAdmin
    .from('vehicles')
    .insert(vehicleData)
    .select(`
      *,
      users(username, full_name, avatar_url)
    `)
    .single();

  if (error) {
    throw createError('Failed to create vehicle', 500);
  }

  res.status(201).json({
    success: true,
    message: 'Vehicle created successfully',
    data: {
      vehicle
    }
  });
}));

// @route   GET /api/vehicles/:id
// @desc    Get vehicle by ID
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid vehicle ID format');
  }

  const { data: vehicle, error } = await supabaseAdmin
    .from('vehicles')
    .select(`
      *,
      users(username, full_name, avatar_url, is_verified)
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw notFoundError('Vehicle');
  }

  // Check if user can view this vehicle
  const isOwner = req.user && req.user.id === vehicle.owner_id;
  const isPublic = vehicle.is_public;

  if (!isPublic && !isOwner) {
    throw forbiddenError('This vehicle is private');
  }

  // Remove sensitive information for non-owners
  if (!isOwner) {
    delete vehicle.vin;
    delete vehicle.purchase_price;
    delete vehicle.purchase_date;
  }

  res.json({
    success: true,
    data: {
      vehicle
    }
  });
}));

// @route   PUT /api/vehicles/:id
// @desc    Update vehicle
// @access  Private (Owner only)
router.put('/:id', authenticateToken, requireOwnership('id', 'owner_id'), validate(vehicleSchemas.update), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid vehicle ID format');
  }

  // Check ownership
  const { data: existingVehicle, error: checkError } = await supabaseAdmin
    .from('vehicles')
    .select('owner_id')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Vehicle');
  }

  if (existingVehicle.owner_id !== req.user.id) {
    throw forbiddenError('You can only update your own vehicles');
  }

  // Check VIN uniqueness if being updated
  if (req.body.vin) {
    const { data: vinCheck } = await supabaseAdmin
      .from('vehicles')
      .select('id')
      .eq('vin', req.body.vin)
      .neq('id', id)
      .single();

    if (vinCheck) {
      throw validationError('A vehicle with this VIN already exists');
    }
  }

  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  const { data: vehicle, error } = await supabaseAdmin
    .from('vehicles')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      users(username, full_name, avatar_url)
    `)
    .single();

  if (error) {
    throw createError('Failed to update vehicle', 500);
  }

  res.json({
    success: true,
    message: 'Vehicle updated successfully',
    data: {
      vehicle
    }
  });
}));

// @route   DELETE /api/vehicles/:id
// @desc    Delete vehicle
// @access  Private (Owner only)
router.delete('/:id', authenticateToken, requireOwnership('id', 'owner_id'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid vehicle ID format');
  }

  // Check ownership
  const { data: existingVehicle, error: checkError } = await supabaseAdmin
    .from('vehicles')
    .select('owner_id')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Vehicle');
  }

  if (existingVehicle.owner_id !== req.user.id) {
    throw forbiddenError('You can only delete your own vehicles');
  }

  const { error } = await supabaseAdmin
    .from('vehicles')
    .delete()
    .eq('id', id);

  if (error) {
    throw createError('Failed to delete vehicle', 500);
  }

  res.json({
    success: true,
    message: 'Vehicle deleted successfully'
  });
}));

// @route   POST /api/vehicles/:id/images
// @desc    Upload vehicle images
// @access  Private (Owner only)
router.post('/:id/images', authenticateToken, requireOwnership('id', 'owner_id'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid vehicle ID format');
  }

  // Check ownership
  const { data: existingVehicle, error: checkError } = await supabaseAdmin
    .from('vehicles')
    .select('owner_id, images')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Vehicle');
  }

  if (existingVehicle.owner_id !== req.user.id) {
    throw forbiddenError('You can only upload images to your own vehicles');
  }

  // This will be implemented with the upload middleware
  // For now, return a placeholder response
  res.json({
    success: true,
    message: 'Vehicle image upload endpoint - to be implemented with file upload middleware'
  });
}));

// @route   DELETE /api/vehicles/:id/images/:imageId
// @desc    Delete vehicle image
// @access  Private (Owner only)
router.delete('/:id/images/:imageId', authenticateToken, requireOwnership('id', 'owner_id'), asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  if (!isValidUUID(id)) {
    throw validationError('Invalid vehicle ID format');
  }

  // Check ownership
  const { data: existingVehicle, error: checkError } = await supabaseAdmin
    .from('vehicles')
    .select('owner_id, images')
    .eq('id', id)
    .single();

  if (checkError) {
    throw notFoundError('Vehicle');
  }

  if (existingVehicle.owner_id !== req.user.id) {
    throw forbiddenError('You can only delete images from your own vehicles');
  }

  // Remove image from array
  const currentImages = existingVehicle.images || [];
  const updatedImages = currentImages.filter(img => !img.includes(imageId));

  const { error: updateError } = await supabaseAdmin
    .from('vehicles')
    .update({ 
      images: updatedImages,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (updateError) {
    throw createError('Failed to remove image from vehicle', 500);
  }

  res.json({
    success: true,
    message: 'Vehicle image deleted successfully'
  });
}));

// @route   GET /api/vehicles/user/:userId
// @desc    Get vehicles by user ID
// @access  Public
router.get('/user/:userId', optionalAuth, validate(commonSchemas.pagination, 'query'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
  const { from, to } = buildPagination(page, limit);

  if (!isValidUUID(userId)) {
    throw validationError('Invalid user ID format');
  }

  const isOwner = req.user && req.user.id === userId;
  
  let query = supabaseAdmin
    .from('vehicles')
    .select(`
      *,
      users(username, full_name, avatar_url)
    `, { count: 'exact' })
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  // Only show public vehicles for non-owners
  if (!isOwner) {
    query = query.eq('is_public', true);
  }

  const { data: vehicles, error, count } = await query;

  if (error) {
    throw createError('Failed to fetch user vehicles', 500);
  }

  // Remove sensitive information for non-owners
  if (!isOwner) {
    vehicles.forEach(vehicle => {
      delete vehicle.vin;
      delete vehicle.purchase_price;
      delete vehicle.purchase_date;
    });
  }

  res.json({
    success: true,
    data: {
      vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

// @route   GET /api/vehicles/makes
// @desc    Get all vehicle makes
// @access  Public
router.get('/meta/makes', asyncHandler(async (req, res) => {
  const { data: makes, error } = await supabaseAdmin
    .from('vehicles')
    .select('make')
    .eq('is_public', true);

  if (error) {
    throw createError('Failed to fetch vehicle makes', 500);
  }

  // Get unique makes
  const uniqueMakes = [...new Set(makes.map(v => v.make))].sort();

  res.json({
    success: true,
    data: {
      makes: uniqueMakes
    }
  });
}));

// @route   GET /api/vehicles/models/:make
// @desc    Get models for a specific make
// @access  Public
router.get('/meta/models/:make', asyncHandler(async (req, res) => {
  const { make } = req.params;

  const { data: models, error } = await supabaseAdmin
    .from('vehicles')
    .select('model')
    .eq('make', make)
    .eq('is_public', true);

  if (error) {
    throw createError('Failed to fetch vehicle models', 500);
  }

  // Get unique models
  const uniqueModels = [...new Set(models.map(v => v.model))].sort();

  res.json({
    success: true,
    data: {
      models: uniqueModels
    }
  });
}));

module.exports = router;